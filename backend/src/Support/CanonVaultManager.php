<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Series;

final class CanonVaultManager
{
    private const VAULT_KEY = 'canon_vault';
    private const ENTRY_TYPES = ['character', 'location', 'faction', 'item', 'rule', 'system', 'custom'];
    private const FIELD_TYPES = ['text', 'number', 'select'];

    /**
     * @return array{entries: array<int, array<string, mixed>>, custom_entry_types: array<int, array<string, mixed>>}
     */
    public function getVault(Series $series): array
    {
        $sharedElements = $this->normalizeSharedElements($series->shared_elements ?? []);
        return $sharedElements[self::VAULT_KEY];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getEntriesByType(Series $series, string $type): array
    {
        return array_values(array_filter(
            $this->getVault($series)['entries'],
            static fn(array $entry): bool => ($entry['type'] ?? '') === $type
        ));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getCustomEntryTypes(Series $series): array
    {
        return $this->getVault($series)['custom_entry_types'];
    }

    /**
     * @return array<string, mixed>
     */
    public function createEntry(Series $series, array $payload): array
    {
        $sharedElements = $this->normalizeSharedElements($series->shared_elements ?? []);
        $vault = $sharedElements[self::VAULT_KEY];
        $entry = $this->normalizeEntryPayload($payload);
        $vault['entries'][] = $entry;
        $sharedElements[self::VAULT_KEY] = $vault;
        $this->persistSharedElements($series, $sharedElements);
        return $entry;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function updateEntry(Series $series, string $entryId, array $payload): ?array
    {
        $sharedElements = $this->normalizeSharedElements($series->shared_elements ?? []);
        $vault = $sharedElements[self::VAULT_KEY];
        $entryIndex = $this->findEntryIndex($vault['entries'], $entryId);
        if ($entryIndex < 0) {
            return null;
        }

        $existingEntry = $vault['entries'][$entryIndex];
        $updatedEntry = $this->normalizeEntryPayload($payload, $existingEntry);
        $vault['entries'][$entryIndex] = $updatedEntry;
        $sharedElements[self::VAULT_KEY] = $vault;
        $this->persistSharedElements($series, $sharedElements);
        return $updatedEntry;
    }

    public function deleteEntry(Series $series, string $entryId): bool
    {
        $sharedElements = $this->normalizeSharedElements($series->shared_elements ?? []);
        $vault = $sharedElements[self::VAULT_KEY];
        $entryIndex = $this->findEntryIndex($vault['entries'], $entryId);
        if ($entryIndex < 0) {
            return false;
        }

        array_splice($vault['entries'], $entryIndex, 1);
        $vault['entries'] = array_values(array_map(
            function (array $entry) use ($entryId): array {
                $relationships = is_array($entry['relationships'] ?? null) ? $entry['relationships'] : [];
                $entry['relationships'] = array_values(array_filter(
                    $relationships,
                    static fn(array $relationship): bool => ($relationship['target_entry_id'] ?? null) !== $entryId
                ));
                return $entry;
            },
            $vault['entries']
        ));

        $sharedElements[self::VAULT_KEY] = $vault;
        $this->persistSharedElements($series, $sharedElements);
        return true;
    }

    /**
     * @return array{entries: array<int, array<string, mixed>>, custom_entry_types: array<int, array<string, mixed>>}
     */
    public function replaceEntriesForType(Series $series, string $type, array $entries): array
    {
        $sharedElements = $this->normalizeSharedElements($series->shared_elements ?? []);
        $vault = $sharedElements[self::VAULT_KEY];

        $remainingEntries = array_values(array_filter(
            $vault['entries'],
            static fn(array $entry): bool => ($entry['type'] ?? '') !== $type
        ));

        foreach ($entries as $entryPayload) {
            $entryPayload['type'] = $type;
            $remainingEntries[] = $this->normalizeEntryPayload($entryPayload);
        }

        $vault['entries'] = $remainingEntries;
        $sharedElements[self::VAULT_KEY] = $vault;
        $this->persistSharedElements($series, $sharedElements);
        return $vault;
    }

    /**
     * @return array<string, mixed>
     */
    public function createCustomEntryType(Series $series, array $payload): array
    {
        $name = trim((string)($payload['name'] ?? ''));
        $description = trim((string)($payload['description'] ?? ''));
        $fieldDefinitions = is_array($payload['field_definitions'] ?? null)
            ? array_values($payload['field_definitions'])
            : [];

        $customType = [
            'id' => IdGenerator::generate(),
            'name' => $name,
            'description' => $description,
            'field_definitions' => $fieldDefinitions,
            'created_at' => date('c'),
            'updated_at' => date('c'),
        ];

        $sharedElements = $this->normalizeSharedElements($series->shared_elements ?? []);
        $vault = $sharedElements[self::VAULT_KEY];
        $vault['custom_entry_types'][] = $customType;
        $sharedElements[self::VAULT_KEY] = $vault;
        $this->persistSharedElements($series, $sharedElements);

        return $customType;
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<string, mixed>|null $existing
     * @return array<string, mixed>
     */
    private function normalizeEntryPayload(array $payload, ?array $existing = null): array
    {
        $entryType = strtolower(trim((string)($payload['type'] ?? $existing['type'] ?? 'custom')));
        if (!in_array($entryType, self::ENTRY_TYPES, true)) {
            $entryType = 'custom';
        }

        $name = trim((string)($payload['name'] ?? $existing['name'] ?? ''));
        $summary = trim((string)($payload['summary'] ?? $payload['description'] ?? $existing['summary'] ?? ''));
        $customTypeName = trim((string)($payload['custom_type_name'] ?? $payload['customTypeName'] ?? $existing['custom_type_name'] ?? ''));

        $rawTags = $payload['tags'] ?? $existing['tags'] ?? [];
        $tags = is_array($rawTags) ? array_values(array_unique(array_filter(array_map('strval', $rawTags)))) : [];

        $rawAliases = $payload['aliases'] ?? $existing['aliases'] ?? [];
        $aliases = is_array($rawAliases) ? array_values(array_unique(array_filter(array_map('strval', $rawAliases)))) : [];

        $rawCustomFields = $payload['custom_fields'] ?? $payload['customFields'] ?? $existing['custom_fields'] ?? [];
        $customFields = [];
        if (is_array($rawCustomFields)) {
            foreach ($rawCustomFields as $field) {
                if (!is_array($field)) {
                    continue;
                }

                $fieldName = trim((string)($field['name'] ?? ''));
                if ($fieldName === '') {
                    continue;
                }

                $fieldType = strtolower(trim((string)($field['type'] ?? 'text')));
                if (!in_array($fieldType, self::FIELD_TYPES, true)) {
                    $fieldType = 'text';
                }

                $options = $field['options'] ?? [];
                if (!is_array($options)) {
                    $options = [];
                }

                $customFields[] = [
                    'id' => (string)($field['id'] ?? IdGenerator::generate()),
                    'name' => $fieldName,
                    'type' => $fieldType,
                    'value' => $field['value'] ?? null,
                    'options' => array_values(array_map('strval', $options)),
                ];
            }
        }

        $rawRelationships = $payload['relationships'] ?? $existing['relationships'] ?? [];
        $relationships = [];
        if (is_array($rawRelationships)) {
            foreach ($rawRelationships as $relationship) {
                if (!is_array($relationship)) {
                    continue;
                }

                $targetEntryId = trim((string)($relationship['target_entry_id'] ?? $relationship['targetEntryId'] ?? ''));
                if ($targetEntryId === '') {
                    continue;
                }

                $relationshipType = trim((string)($relationship['type'] ?? $relationship['relationshipType'] ?? 'related_to'));

                $relationships[] = [
                    'id' => (string)($relationship['id'] ?? IdGenerator::generate()),
                    'target_entry_id' => $targetEntryId,
                    'type' => $relationshipType,
                    'notes' => trim((string)($relationship['notes'] ?? '')),
                ];
            }
        }

        $createdAt = (string)($existing['created_at'] ?? date('c'));

        return [
            'id' => (string)($payload['id'] ?? $existing['id'] ?? IdGenerator::generate()),
            'name' => $name,
            'type' => $entryType,
            'custom_type_name' => $customTypeName,
            'summary' => $summary,
            'tags' => $tags,
            'aliases' => $aliases,
            'custom_fields' => $customFields,
            'relationships' => $relationships,
            'created_at' => $createdAt,
            'updated_at' => date('c'),
        ];
    }

    /**
     * @param array<int, array<string, mixed>> $entries
     */
    private function findEntryIndex(array $entries, string $entryId): int
    {
        foreach ($entries as $index => $entry) {
            if (($entry['id'] ?? null) === $entryId) {
                return $index;
            }
        }

        return -1;
    }

    /**
     * @param array<string, mixed> $sharedElements
     * @return array<string, mixed>
     */
    private function normalizeSharedElements(array $sharedElements): array
    {
        if (!isset($sharedElements[self::VAULT_KEY]) || !is_array($sharedElements[self::VAULT_KEY])) {
            $sharedElements[self::VAULT_KEY] = [];
        }

        $vault = $sharedElements[self::VAULT_KEY];
        $sharedElements[self::VAULT_KEY] = [
            'entries' => array_values(is_array($vault['entries'] ?? null) ? $vault['entries'] : []),
            'custom_entry_types' => array_values(is_array($vault['custom_entry_types'] ?? null) ? $vault['custom_entry_types'] : []),
        ];

        return $sharedElements;
    }

    /**
     * @param array<string, mixed> $sharedElements
     */
    private function persistSharedElements(Series $series, array $sharedElements): void
    {
        $series->shared_elements = $sharedElements;
        $series->save();
    }
}
