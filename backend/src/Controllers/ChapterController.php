<?php

declare(strict_types=1);

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Chapter;
use Ramsey\Uuid\Uuid;

class ChapterController
{
    public function getByStoryId(Request $request, Response $response, array $args): Response
    {
        try {
            $chapters = Chapter::where('story_id', $args['storyId'])
                ->orderBy('chapter_number')
                ->get();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $chapters
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getById(Request $request, Response $response, array $args): Response
    {
        try {
            $chapter = Chapter::with(['story'])->find($args['id']);

            if (!$chapter) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Chapter not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $chapter
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function create(Request $request, Response $response, array $args): Response
    {
        try {
            $data = $request->getParsedBody();

            $nextChapterNumber = Chapter::where('story_id', $args['storyId'])->max('chapter_number') + 1;

            $chapter = Chapter::create([
                'id' => Uuid::uuid4()->toString(),
                'story_id' => $args['storyId'],
                'title' => $data['title'] ?? '',
                'chapter_number' => $data['chapter_number'] ?? $nextChapterNumber,
                'content' => $data['content'] ?? '',
                'word_count' => $data['word_count'] ?? 0,
                'status' => $data['status'] ?? 'draft',
                'summary' => $data['summary'] ?? '',
                'notes' => $data['notes'] ?? '',
                'character_progression' => $data['character_progression'] ?? [],
                'story_events' => $data['story_events'] ?? []
            ]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $chapter
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $chapter = Chapter::find($args['id']);

            if (!$chapter) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Chapter not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $chapter->update($data);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $chapter
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $chapter = Chapter::find($args['id']);

            if (!$chapter) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Chapter not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $chapter->delete();

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Chapter deleted successfully'
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function reorder(Request $request, Response $response, array $args): Response
    {
        try {
            $data = $request->getParsedBody();
            $chapterIds = $data['chapterIds'] ?? [];

            foreach ($chapterIds as $index => $chapterId) {
                Chapter::where('id', $chapterId)
                    ->where('story_id', $args['storyId'])
                    ->update(['chapter_number' => $index + 1]);
            }

            $chapters = Chapter::where('story_id', $args['storyId'])
                ->orderBy('chapter_number')
                ->get();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $chapters
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function addCharacterProgression(Request $request, Response $response, array $args): Response
    {
        try {
            $chapter = Chapter::find($args['id']);

            if (!$chapter) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Chapter not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $progression = $chapter->character_progression;

            $progressionEvent = [
                'id' => Uuid::uuid4()->toString(),
                'character_id' => $data['character_id'] ?? '',
                'type' => $data['type'] ?? 'level_up',
                'description' => $data['description'] ?? '',
                'stat_changes' => $data['stat_changes'] ?? [],
                'new_skills' => $data['new_skills'] ?? [],
                'items_gained' => $data['items_gained'] ?? [],
                'timestamp' => $data['timestamp'] ?? date('Y-m-d H:i:s')
            ];

            $progression[] = $progressionEvent;
            $chapter->character_progression = $progression;
            $chapter->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $chapter
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}