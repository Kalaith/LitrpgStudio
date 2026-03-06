<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\Series;
use App\Models\Story;
use App\Support\CanonVaultManager;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class CanonVaultController
{
    public function __construct(
        private readonly CanonVaultManager $manager
    ) {}

    public function getEntries(Request $request, Response $response, array $args): Response
    {
        try {
            $series = Series::find($args['seriesId']);
            if (!$series) {
                return $this->json($response, [
                    'success' => false,
                    'error' => 'Series not found',
                ], 404);
            }

            $queryParams = $request->getQueryParams();
            $searchQuery = strtolower(trim((string)($queryParams['q'] ?? '')));
            $filterType = strtolower(trim((string)($queryParams['type'] ?? '')));
            $includeBacklinks = ($queryParams['include_backlinks'] ?? 'true') !== 'false';

            $entries = $this->manager->getVault($series)['entries'];
            if ($filterType !== '') {
                $entries = array_values(array_filter(
                    $entries,
                    static fn(array $entry): bool => strtolower((string)($entry['type'] ?? '')) === $filterType
                ));
            }

            if ($searchQuery !== '') {
                $entries = array_values(array_filter(
                    $entries,
                    static fn(array $entry): bool => self::entryMatchesQuery($entry, $searchQuery)
                ));
            }

            $result = [];
            foreach ($entries as $entry) {
                $result[] = $includeBacklinks
                    ? $this->appendBacklinks($series, $entry)
                    : $entry;
            }

            return $this->json($response, [
                'success' => true,
                'data' => [
                    'entries' => $result,
                    'count' => count($result),
                ],
            ]);
        } catch (\Throwable $e) {
            return $this->json($response, [
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function createEntry(Request $request, Response $response, array $args): Response
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

            if (trim((string)($payload['name'] ?? '')) === '') {
                return $this->json($response, [
                    'success' => false,
                    'error' => 'Entry name is required',
                ], 400);
            }

            $entry = $this->manager->createEntry($series, $payload);

            return $this->json($response, [
                'success' => true,
                'data' => $entry,
            ], 201);
        } catch (\Throwable $e) {
            return $this->json($response, [
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateEntry(Request $request, Response $response, array $args): Response
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

            $entry = $this->manager->updateEntry($series, $args['entryId'], $payload);
            if ($entry === null) {
                return $this->json($response, [
                    'success' => false,
                    'error' => 'Entry not found',
                ], 404);
            }

            return $this->json($response, [
                'success' => true,
                'data' => $entry,
            ]);
        } catch (\Throwable $e) {
            return $this->json($response, [
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function deleteEntry(Request $request, Response $response, array $args): Response
    {
        try {
            $series = Series::find($args['seriesId']);
            if (!$series) {
                return $this->json($response, [
                    'success' => false,
                    'error' => 'Series not found',
                ], 404);
            }

            $deleted = $this->manager->deleteEntry($series, $args['entryId']);
            if (!$deleted) {
                return $this->json($response, [
                    'success' => false,
                    'error' => 'Entry not found',
                ], 404);
            }

            return $this->json($response, [
                'success' => true,
                'message' => 'Entry deleted successfully',
            ]);
        } catch (\Throwable $e) {
            return $this->json($response, [
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getCustomEntryTypes(Request $request, Response $response, array $args): Response
    {
        try {
            $series = Series::find($args['seriesId']);
            if (!$series) {
                return $this->json($response, [
                    'success' => false,
                    'error' => 'Series not found',
                ], 404);
            }

            return $this->json($response, [
                'success' => true,
                'data' => $this->manager->getCustomEntryTypes($series),
            ]);
        } catch (\Throwable $e) {
            return $this->json($response, [
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function createCustomEntryType(Request $request, Response $response, array $args): Response
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

            if (trim((string)($payload['name'] ?? '')) === '') {
                return $this->json($response, [
                    'success' => false,
                    'error' => 'Custom entry type name is required',
                ], 400);
            }

            $customType = $this->manager->createCustomEntryType($series, $payload);

            return $this->json($response, [
                'success' => true,
                'data' => $customType,
            ], 201);
        } catch (\Throwable $e) {
            return $this->json($response, [
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * @param array<string, mixed> $entry
     * @return array<string, mixed>
     */
    private function appendBacklinks(Series $series, array $entry): array
    {
        $aliases = is_array($entry['aliases'] ?? null) ? $entry['aliases'] : [];
        $terms = array_values(array_filter(array_unique(array_merge(
            [(string)($entry['name'] ?? '')],
            array_map('strval', $aliases)
        ))));

        if (count($terms) === 0) {
            $entry['backlinks'] = [];
            $entry['mention_count'] = 0;
            return $entry;
        }

        $stories = Story::where('series_id', $series->id)
            ->with(['chapters' => static fn($query) => $query->orderBy('chapter_number')])
            ->get();

        $backlinks = [];
        foreach ($stories as $story) {
            foreach ($story->chapters as $chapter) {
                $content = (string)($chapter->content ?? '');
                if ($content === '') {
                    continue;
                }

                $matchesForChapter = 0;
                $bestSnippet = null;

                foreach ($terms as $term) {
                    if ($term === '') {
                        continue;
                    }

                    $count = preg_match_all('/\b' . preg_quote($term, '/') . '\b/i', $content);
                    if ($count === false || $count === 0) {
                        continue;
                    }

                    $matchesForChapter += $count;
                    if ($bestSnippet === null) {
                        $bestSnippet = $this->extractSnippet($content, $term);
                    }
                }

                if ($matchesForChapter > 0) {
                    $backlinks[] = [
                        'story_id' => $story->id,
                        'story_title' => $story->title,
                        'chapter_id' => $chapter->id,
                        'chapter_title' => $chapter->title,
                        'chapter_number' => (int)$chapter->chapter_number,
                        'matches' => $matchesForChapter,
                        'snippet' => $bestSnippet ?? '',
                    ];
                }
            }
        }

        usort($backlinks, static function (array $left, array $right): int {
            if ($left['matches'] === $right['matches']) {
                return $left['chapter_number'] <=> $right['chapter_number'];
            }
            return $right['matches'] <=> $left['matches'];
        });

        $entry['backlinks'] = array_slice($backlinks, 0, 25);
        $entry['mention_count'] = array_reduce(
            $backlinks,
            static fn(int $carry, array $link): int => $carry + (int)$link['matches'],
            0
        );

        return $entry;
    }

    /**
     * @param array<string, mixed> $entry
     */
    private static function entryMatchesQuery(array $entry, string $query): bool
    {
        $haystack = [
            strtolower((string)($entry['name'] ?? '')),
            strtolower((string)($entry['summary'] ?? '')),
            strtolower((string)($entry['custom_type_name'] ?? '')),
        ];

        $tags = is_array($entry['tags'] ?? null) ? $entry['tags'] : [];
        foreach ($tags as $tag) {
            $haystack[] = strtolower((string)$tag);
        }

        $aliases = is_array($entry['aliases'] ?? null) ? $entry['aliases'] : [];
        foreach ($aliases as $alias) {
            $haystack[] = strtolower((string)$alias);
        }

        foreach ($haystack as $value) {
            if ($value !== '' && str_contains($value, $query)) {
                return true;
            }
        }

        return false;
    }

    private function extractSnippet(string $content, string $term): string
    {
        $position = stripos($content, $term);
        if ($position === false) {
            return '';
        }

        $start = max(0, $position - 80);
        $length = min(strlen($content) - $start, 180);
        $snippet = substr($content, $start, $length);

        return trim((string)preg_replace('/\s+/', ' ', $snippet));
    }

    private function json(Response $response, array $body, int $status = 200): Response
    {
        $response->getBody()->write((string)json_encode($body));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
