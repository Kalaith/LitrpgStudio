<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\Book;
use App\Models\Chapter;
use App\Models\Series;
use App\Models\Story;
use App\Support\DraftImportParser;
use App\Support\IdGenerator;
use Illuminate\Database\Capsule\Manager as Capsule;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class DraftImportController
{
    public function __construct(
        private readonly DraftImportParser $parser
    ) {}

    public function importDraft(Request $request, Response $response, array $args): Response
    {
        try {
            $series = Series::find($args['seriesId']);
            if (!$series) {
                return $this->json($response, [
                    'success' => false,
                    'error' => 'Series not found',
                ], 404);
            }

            $payload = $request->getParsedBody();
            if (!is_array($payload)) {
                return $this->json($response, [
                    'success' => false,
                    'error' => 'Invalid payload',
                ], 400);
            }

            $content = trim((string)($payload['content'] ?? ''));
            if ($content === '') {
                return $this->json($response, [
                    'success' => false,
                    'error' => 'Draft content is required',
                ], 400);
            }

            $bookTitle = trim((string)($payload['bookTitle'] ?? ''));
            $storyTitle = trim((string)($payload['storyTitle'] ?? ''));
            $format = strtolower(trim((string)($payload['format'] ?? 'markdown')));
            if ($format === '') {
                $format = 'markdown';
            }

            $parsedChapters = $this->parser->parse($content);
            if (count($parsedChapters) === 0) {
                return $this->json($response, [
                    'success' => false,
                    'error' => 'No chapter content could be parsed',
                ], 400);
            }

            $result = Capsule::connection()->transaction(function () use ($series, $bookTitle, $storyTitle, $format, $parsedChapters): array {
                $nextBookNumber = (int)Book::where('series_id', $series->id)->max('book_number') + 1;
                $resolvedBookTitle = $bookTitle !== '' ? $bookTitle : sprintf('Imported Book %d', $nextBookNumber);
                $resolvedStoryTitle = $storyTitle !== '' ? $storyTitle : $resolvedBookTitle . ' Draft';

                $book = Book::create([
                    'id' => IdGenerator::generate(),
                    'series_id' => $series->id,
                    'title' => $resolvedBookTitle,
                    'description' => sprintf('Imported from %s source on %s', $format, date('Y-m-d')),
                    'book_number' => $nextBookNumber,
                    'status' => 'writing',
                    'target_word_count' => null,
                    'current_word_count' => 0,
                    'synopsis' => '',
                    'outline' => '',
                    'character_arcs' => [],
                    'plot_threads' => [],
                    'timeline_events' => [],
                ]);

                $story = Story::create([
                    'id' => IdGenerator::generate(),
                    'series_id' => $series->id,
                    'book_id' => $book->id,
                    'title' => $resolvedStoryTitle,
                    'description' => sprintf('Imported draft (%s)', $format),
                    'genre' => '',
                    'tags' => ['imported'],
                    'status' => 'draft',
                    'word_count' => 0,
                    'target_word_count' => null,
                    'summary' => '',
                    'outline' => '',
                    'setting' => '',
                    'themes' => '',
                    'plot_points' => [],
                    'character_roles' => [],
                    'story_events' => [],
                ]);

                $totalWordCount = 0;
                $totalSceneCount = 0;
                $createdChapters = [];

                foreach ($parsedChapters as $index => $parsedChapter) {
                    $chapterWordCount = (int)($parsedChapter['word_count'] ?? 0);
                    $chapterSceneCount = (int)($parsedChapter['scene_count'] ?? 1);
                    $totalWordCount += $chapterWordCount;
                    $totalSceneCount += $chapterSceneCount;

                    $chapter = Chapter::create([
                        'id' => IdGenerator::generate(),
                        'story_id' => $story->id,
                        'title' => (string)($parsedChapter['title'] ?? sprintf('Chapter %d', $index + 1)),
                        'chapter_number' => $index + 1,
                        'content' => (string)($parsedChapter['content'] ?? ''),
                        'word_count' => $chapterWordCount,
                        'status' => 'draft',
                        'summary' => '',
                        'notes' => sprintf('Imported with %d detected scene(s)', $chapterSceneCount),
                        'character_progression' => [],
                        'story_events' => [],
                    ]);

                    $createdChapters[] = [
                        'id' => $chapter->id,
                        'title' => $chapter->title,
                        'chapter_number' => (int)$chapter->chapter_number,
                        'word_count' => (int)$chapter->word_count,
                        'scene_count' => $chapterSceneCount,
                    ];
                }

                $story->word_count = $totalWordCount;
                $story->save();

                $book->current_word_count = $totalWordCount;
                $book->save();

                return [
                    'book' => [
                        'id' => $book->id,
                        'title' => $book->title,
                        'book_number' => (int)$book->book_number,
                    ],
                    'story' => [
                        'id' => $story->id,
                        'title' => $story->title,
                    ],
                    'chapters' => $createdChapters,
                    'summary' => [
                        'chapter_count' => count($createdChapters),
                        'scene_count' => $totalSceneCount,
                        'word_count' => $totalWordCount,
                        'format' => $format,
                    ],
                ];
            });

            return $this->json($response, [
                'success' => true,
                'data' => $result,
            ], 201);
        } catch (\Throwable $e) {
            return $this->json($response, [
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function json(Response $response, array $body, int $status = 200): Response
    {
        $response->getBody()->write((string)json_encode($body));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
