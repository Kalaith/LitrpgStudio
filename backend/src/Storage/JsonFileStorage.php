<?php

namespace App\Storage;

class JsonFileStorage
{
    private $storagePath;

    public function __construct($storagePath = null)
    {
        $this->storagePath = $storagePath ?? __DIR__ . '/../../storage/';
    }

    public function read(string $collection): array
    {
        $filePath = $this->storagePath . $collection . '.json';

        if (!file_exists($filePath)) {
            return [];
        }

        $content = file_get_contents($filePath);
        return json_decode($content, true) ?? [];
    }

    public function write(string $collection, array $data): bool
    {
        $filePath = $this->storagePath . $collection . '.json';

        // Ensure directory exists
        $directory = dirname($filePath);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $content = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return file_put_contents($filePath, $content) !== false;
    }

    public function findById(string $collection, string $id): ?array
    {
        $items = $this->read($collection);
        foreach ($items as $item) {
            if ($item['id'] === $id) {
                return $item;
            }
        }
        return null;
    }

    public function create(string $collection, array $item): array
    {
        $items = $this->read($collection);

        // Generate ID if not provided
        if (!isset($item['id'])) {
            $item['id'] = uniqid($collection . '-');
        }

        // Add timestamps
        $now = date('Y-m-d H:i:s');
        $item['created_at'] = $now;
        $item['updated_at'] = $now;

        $items[] = $item;
        $this->write($collection, $items);

        return $item;
    }

    public function update(string $collection, string $id, array $updates): ?array
    {
        $items = $this->read($collection);

        foreach ($items as $index => $item) {
            if ($item['id'] === $id) {
                $items[$index] = array_merge($item, $updates);
                $items[$index]['updated_at'] = date('Y-m-d H:i:s');
                $this->write($collection, $items);
                return $items[$index];
            }
        }

        return null;
    }

    public function delete(string $collection, string $id): bool
    {
        $items = $this->read($collection);

        foreach ($items as $index => $item) {
            if ($item['id'] === $id) {
                unset($items[$index]);
                $this->write($collection, array_values($items));
                return true;
            }
        }

        return false;
    }

    public function filter(string $collection, callable $callback): array
    {
        $items = $this->read($collection);
        return array_filter($items, $callback);
    }
}