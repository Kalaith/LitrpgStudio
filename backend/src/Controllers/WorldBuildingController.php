<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\Series;
use App\Support\CanonVaultManager;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class WorldBuildingController
{
    public function __construct(
        private readonly CanonVaultManager $canonVaultManager
    ) {}

    public function getWorldRules(Request $request, Response $response, array $args): Response
    {
        return $this->listEntriesByType($response, $args['seriesId'], 'rule', static fn(array $entry): array => self::toWorldRule($entry));
    }

    public function addWorldRule(Request $request, Response $response, array $args): Response
    {
        return $this->createEntry(
            $request,
            $response,
            $args['seriesId'],
            'rule',
            static function (array $payload): array {
                return [
                    'name' => (string)($payload['name'] ?? ''),
                    'summary' => (string)($payload['description'] ?? $payload['summary'] ?? ''),
                    'type' => 'rule',
                    'tags' => is_array($payload['tags'] ?? null) ? $payload['tags'] : [],
                    'custom_fields' => [
                        ['name' => 'category', 'type' => 'text', 'value' => (string)($payload['category'] ?? 'social')],
                        ['name' => 'exceptions', 'type' => 'text', 'value' => json_encode($payload['exceptions'] ?? [])],
                        ['name' => 'references', 'type' => 'text', 'value' => json_encode($payload['references'] ?? [])],
                        ['name' => 'established_in_book', 'type' => 'number', 'value' => (int)($payload['establishedInBook'] ?? 1)],
                    ],
                ];
            },
            static fn(array $entry): array => self::toWorldRule($entry)
        );
    }

    public function updateWorldRule(Request $request, Response $response, array $args): Response
    {
        return $this->updateEntry($request, $response, $args['ruleId'], static fn(array $entry): array => self::toWorldRule($entry));
    }

    public function deleteWorldRule(Request $request, Response $response, array $args): Response
    {
        return $this->deleteEntry($response, $args['ruleId']);
    }

    public function getMagicSystems(Request $request, Response $response, array $args): Response
    {
        return $this->listEntriesByType($response, $args['seriesId'], 'system', static fn(array $entry): array => self::toMagicSystem($entry));
    }

    public function addMagicSystem(Request $request, Response $response, array $args): Response
    {
        return $this->createEntry(
            $request,
            $response,
            $args['seriesId'],
            'system',
            static function (array $payload): array {
                return [
                    'name' => (string)($payload['name'] ?? ''),
                    'summary' => (string)($payload['description'] ?? $payload['summary'] ?? ''),
                    'type' => 'system',
                    'custom_type_name' => 'magic_system',
                    'tags' => is_array($payload['tags'] ?? null) ? $payload['tags'] : [],
                    'custom_fields' => [
                        ['name' => 'system_type', 'type' => 'text', 'value' => (string)($payload['type'] ?? 'hybrid')],
                        ['name' => 'rules', 'type' => 'text', 'value' => json_encode($payload['rules'] ?? [])],
                        ['name' => 'limitations', 'type' => 'text', 'value' => json_encode($payload['limitations'] ?? [])],
                        ['name' => 'costs', 'type' => 'text', 'value' => json_encode($payload['costs'] ?? [])],
                        ['name' => 'practitioners', 'type' => 'text', 'value' => json_encode($payload['practitioners'] ?? [])],
                        ['name' => 'evolution', 'type' => 'text', 'value' => json_encode($payload['evolution'] ?? [])],
                    ],
                ];
            },
            static fn(array $entry): array => self::toMagicSystem($entry)
        );
    }

    public function updateMagicSystem(Request $request, Response $response, array $args): Response
    {
        return $this->updateEntry($request, $response, $args['systemId'], static fn(array $entry): array => self::toMagicSystem($entry));
    }

    public function deleteMagicSystem(Request $request, Response $response, array $args): Response
    {
        return $this->deleteEntry($response, $args['systemId']);
    }

    public function getLocations(Request $request, Response $response, array $args): Response
    {
        return $this->listEntriesByType($response, $args['seriesId'], 'location', static fn(array $entry): array => self::toLocation($entry));
    }

    public function addLocation(Request $request, Response $response, array $args): Response
    {
        return $this->createEntry(
            $request,
            $response,
            $args['seriesId'],
            'location',
            static function (array $payload): array {
                return [
                    'name' => (string)($payload['name'] ?? ''),
                    'summary' => (string)($payload['description'] ?? $payload['summary'] ?? ''),
                    'type' => 'location',
                    'tags' => is_array($payload['tags'] ?? null) ? $payload['tags'] : [],
                    'custom_fields' => [
                        ['name' => 'location_type', 'type' => 'text', 'value' => (string)($payload['type'] ?? 'landmark')],
                        ['name' => 'significance', 'type' => 'text', 'value' => (string)($payload['significance'] ?? '')],
                        ['name' => 'appearances', 'type' => 'text', 'value' => json_encode($payload['appearances'] ?? [])],
                        ['name' => 'changes', 'type' => 'text', 'value' => json_encode($payload['changes'] ?? [])],
                    ],
                ];
            },
            static fn(array $entry): array => self::toLocation($entry)
        );
    }

    public function updateLocation(Request $request, Response $response, array $args): Response
    {
        return $this->updateEntry($request, $response, $args['locationId'], static fn(array $entry): array => self::toLocation($entry));
    }

    public function deleteLocation(Request $request, Response $response, array $args): Response
    {
        return $this->deleteEntry($response, $args['locationId']);
    }

    public function getFactions(Request $request, Response $response, array $args): Response
    {
        return $this->listEntriesByType($response, $args['seriesId'], 'faction', static fn(array $entry): array => self::toFaction($entry));
    }

    public function addFaction(Request $request, Response $response, array $args): Response
    {
        return $this->createEntry(
            $request,
            $response,
            $args['seriesId'],
            'faction',
            static function (array $payload): array {
                return [
                    'name' => (string)($payload['name'] ?? ''),
                    'summary' => (string)($payload['description'] ?? $payload['summary'] ?? ''),
                    'type' => 'faction',
                    'tags' => is_array($payload['tags'] ?? null) ? $payload['tags'] : [],
                    'custom_fields' => [
                        ['name' => 'faction_type', 'type' => 'text', 'value' => (string)($payload['type'] ?? 'guild')],
                        ['name' => 'goals', 'type' => 'text', 'value' => json_encode($payload['goals'] ?? [])],
                        ['name' => 'evolution', 'type' => 'text', 'value' => json_encode($payload['evolution'] ?? [])],
                        ['name' => 'relationships', 'type' => 'text', 'value' => json_encode($payload['relationships'] ?? [])],
                    ],
                ];
            },
            static fn(array $entry): array => self::toFaction($entry)
        );
    }

    public function updateFaction(Request $request, Response $response, array $args): Response
    {
        return $this->updateEntry($request, $response, $args['factionId'], static fn(array $entry): array => self::toFaction($entry));
    }

    public function deleteFaction(Request $request, Response $response, array $args): Response
    {
        return $this->deleteEntry($response, $args['factionId']);
    }

    public function getTerminology(Request $request, Response $response, array $args): Response
    {
        return $this->listEntriesByType(
            $response,
            $args['seriesId'],
            'custom',
            static fn(array $entry): array => self::toTerm($entry),
            static fn(array $entry): bool => ($entry['custom_type_name'] ?? '') === 'terminology'
        );
    }

    public function addTerm(Request $request, Response $response, array $args): Response
    {
        return $this->createEntry(
            $request,
            $response,
            $args['seriesId'],
            'custom',
            static function (array $payload): array {
                return [
                    'name' => (string)($payload['term'] ?? $payload['name'] ?? ''),
                    'summary' => (string)($payload['definition'] ?? $payload['description'] ?? ''),
                    'type' => 'custom',
                    'custom_type_name' => 'terminology',
                    'tags' => is_array($payload['tags'] ?? null) ? $payload['tags'] : [],
                    'aliases' => is_array($payload['aliases'] ?? null) ? $payload['aliases'] : [],
                    'custom_fields' => [
                        ['name' => 'category', 'type' => 'text', 'value' => (string)($payload['category'] ?? 'world')],
                        ['name' => 'first_mentioned', 'type' => 'number', 'value' => (int)($payload['firstMentioned'] ?? 1)],
                        ['name' => 'importance', 'type' => 'text', 'value' => (string)($payload['importance'] ?? 'moderate')],
                        ['name' => 'usage', 'type' => 'text', 'value' => json_encode($payload['usage'] ?? [])],
                    ],
                ];
            },
            static fn(array $entry): array => self::toTerm($entry)
        );
    }

    public function updateTerm(Request $request, Response $response, array $args): Response
    {
        return $this->updateEntry($request, $response, $args['termId'], static fn(array $entry): array => self::toTerm($entry));
    }

    public function deleteTerm(Request $request, Response $response, array $args): Response
    {
        return $this->deleteEntry($response, $args['termId']);
    }

    /**
     * @param callable(array<string, mixed>): array<string, mixed> $map
     */
    private function createEntry(
        Request $request,
        Response $response,
        string $seriesId,
        string $type,
        callable $payloadMapper,
        callable $map
    ): Response {
        try {
            $series = Series::find($seriesId);
            if (!$series) {
                return $this->json($response, ['success' => false, 'error' => 'Series not found'], 404);
            }

            $payload = $request->getParsedBody();
            if (!is_array($payload)) {
                return $this->json($response, ['success' => false, 'error' => 'Invalid payload'], 400);
            }

            $normalized = $payloadMapper($payload);
            $normalized['type'] = $type;

            if (trim((string)($normalized['name'] ?? '')) === '') {
                return $this->json($response, ['success' => false, 'error' => 'Name is required'], 400);
            }

            $entry = $this->canonVaultManager->createEntry($series, $normalized);

            return $this->json($response, [
                'success' => true,
                'data' => $map($entry),
            ], 201);
        } catch (\Throwable $e) {
            return $this->json($response, ['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * @param callable(array<string, mixed>): array<string, mixed> $map
     */
    private function updateEntry(Request $request, Response $response, string $entryId, callable $map): Response
    {
        try {
            $series = $this->findSeriesByEntryId($entryId);
            if (!$series) {
                return $this->json($response, ['success' => false, 'error' => 'Entry not found'], 404);
            }

            $payload = $request->getParsedBody();
            if (!is_array($payload)) {
                return $this->json($response, ['success' => false, 'error' => 'Invalid payload'], 400);
            }

            $updated = $this->canonVaultManager->updateEntry($series, $entryId, $payload);
            if ($updated === null) {
                return $this->json($response, ['success' => false, 'error' => 'Entry not found'], 404);
            }

            return $this->json($response, [
                'success' => true,
                'data' => $map($updated),
            ]);
        } catch (\Throwable $e) {
            return $this->json($response, ['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    private function deleteEntry(Response $response, string $entryId): Response
    {
        try {
            $series = $this->findSeriesByEntryId($entryId);
            if (!$series) {
                return $this->json($response, ['success' => false, 'error' => 'Entry not found'], 404);
            }

            $deleted = $this->canonVaultManager->deleteEntry($series, $entryId);
            if (!$deleted) {
                return $this->json($response, ['success' => false, 'error' => 'Entry not found'], 404);
            }

            return $this->json($response, ['success' => true, 'message' => 'Entry deleted successfully']);
        } catch (\Throwable $e) {
            return $this->json($response, ['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * @param callable(array<string, mixed>): array<string, mixed> $map
     * @param null|callable(array<string, mixed>): bool $additionalFilter
     */
    private function listEntriesByType(
        Response $response,
        string $seriesId,
        string $type,
        callable $map,
        ?callable $additionalFilter = null
    ): Response {
        try {
            $series = Series::find($seriesId);
            if (!$series) {
                return $this->json($response, ['success' => false, 'error' => 'Series not found'], 404);
            }

            $entries = $this->canonVaultManager->getEntriesByType($series, $type);
            if ($additionalFilter !== null) {
                $entries = array_values(array_filter($entries, $additionalFilter));
            }

            return $this->json($response, [
                'success' => true,
                'data' => array_map($map, $entries),
            ]);
        } catch (\Throwable $e) {
            return $this->json($response, ['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    private function findSeriesByEntryId(string $entryId): ?Series
    {
        $seriesList = Series::all();
        foreach ($seriesList as $series) {
            $entries = $this->canonVaultManager->getVault($series)['entries'];
            foreach ($entries as $entry) {
                if (($entry['id'] ?? null) === $entryId) {
                    return $series;
                }
            }
        }

        return null;
    }

    /**
     * @param array<string, mixed> $entry
     * @return array<string, mixed>
     */
    private static function toWorldRule(array $entry): array
    {
        return [
            'id' => $entry['id'] ?? '',
            'name' => $entry['name'] ?? '',
            'description' => $entry['summary'] ?? '',
            'category' => self::readCustomFieldValue($entry, 'category', 'social'),
            'exceptions' => self::decodeJsonArray(self::readCustomFieldValue($entry, 'exceptions', '[]')),
            'references' => self::decodeJsonArray(self::readCustomFieldValue($entry, 'references', '[]')),
            'establishedInBook' => (int)self::readCustomFieldValue($entry, 'established_in_book', 1),
        ];
    }

    /**
     * @param array<string, mixed> $entry
     * @return array<string, mixed>
     */
    private static function toMagicSystem(array $entry): array
    {
        return [
            'id' => $entry['id'] ?? '',
            'name' => $entry['name'] ?? '',
            'description' => $entry['summary'] ?? '',
            'type' => self::readCustomFieldValue($entry, 'system_type', 'hybrid'),
            'rules' => self::decodeJsonArray(self::readCustomFieldValue($entry, 'rules', '[]')),
            'limitations' => self::decodeJsonArray(self::readCustomFieldValue($entry, 'limitations', '[]')),
            'costs' => self::decodeJsonArray(self::readCustomFieldValue($entry, 'costs', '[]')),
            'practitioners' => self::decodeJsonArray(self::readCustomFieldValue($entry, 'practitioners', '[]')),
            'evolution' => self::decodeJsonArray(self::readCustomFieldValue($entry, 'evolution', '[]')),
        ];
    }

    /**
     * @param array<string, mixed> $entry
     * @return array<string, mixed>
     */
    private static function toLocation(array $entry): array
    {
        return [
            'id' => $entry['id'] ?? '',
            'name' => $entry['name'] ?? '',
            'description' => $entry['summary'] ?? '',
            'type' => self::readCustomFieldValue($entry, 'location_type', 'landmark'),
            'significance' => self::readCustomFieldValue($entry, 'significance', ''),
            'appearances' => self::decodeJsonArray(self::readCustomFieldValue($entry, 'appearances', '[]')),
            'changes' => self::decodeJsonArray(self::readCustomFieldValue($entry, 'changes', '[]')),
        ];
    }

    /**
     * @param array<string, mixed> $entry
     * @return array<string, mixed>
     */
    private static function toFaction(array $entry): array
    {
        return [
            'id' => $entry['id'] ?? '',
            'name' => $entry['name'] ?? '',
            'description' => $entry['summary'] ?? '',
            'type' => self::readCustomFieldValue($entry, 'faction_type', 'guild'),
            'goals' => self::decodeJsonArray(self::readCustomFieldValue($entry, 'goals', '[]')),
            'evolution' => self::decodeJsonArray(self::readCustomFieldValue($entry, 'evolution', '[]')),
            'relationships' => self::decodeJsonArray(self::readCustomFieldValue($entry, 'relationships', '[]')),
        ];
    }

    /**
     * @param array<string, mixed> $entry
     * @return array<string, mixed>
     */
    private static function toTerm(array $entry): array
    {
        return [
            'id' => $entry['id'] ?? '',
            'term' => $entry['name'] ?? '',
            'definition' => $entry['summary'] ?? '',
            'category' => self::readCustomFieldValue($entry, 'category', 'world'),
            'firstMentioned' => (int)self::readCustomFieldValue($entry, 'first_mentioned', 1),
            'importance' => self::readCustomFieldValue($entry, 'importance', 'moderate'),
            'aliases' => is_array($entry['aliases'] ?? null) ? $entry['aliases'] : [],
            'usage' => self::decodeJsonArray(self::readCustomFieldValue($entry, 'usage', '[]')),
        ];
    }

    /**
     * @param array<string, mixed> $entry
     * @return mixed
     */
    private static function readCustomFieldValue(array $entry, string $name, mixed $fallback): mixed
    {
        $fields = is_array($entry['custom_fields'] ?? null) ? $entry['custom_fields'] : [];
        foreach ($fields as $field) {
            if (!is_array($field)) {
                continue;
            }

            if (($field['name'] ?? null) === $name) {
                return $field['value'] ?? $fallback;
            }
        }

        return $fallback;
    }

    /**
     * @return array<int, mixed>
     */
    private static function decodeJsonArray(mixed $raw): array
    {
        if (is_array($raw)) {
            return $raw;
        }

        if (!is_string($raw) || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function json(Response $response, array $body, int $status = 200): Response
    {
        $response->getBody()->write((string)json_encode($body));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
