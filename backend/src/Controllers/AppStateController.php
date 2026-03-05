<?php

declare(strict_types=1);

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class AppStateController
{
    private const MAX_STATE_BYTES = 8_388_608; // 8MB

    public function getState(Request $request, Response $response): Response
    {
        $userId = $this->getUserId($request);
        if ($userId === null) {
            return $this->json($response, [
                'success' => false,
                'error' => 'Authentication required',
            ], 401);
        }

        $path = $this->getStatePath($userId);
        if (!is_file($path)) {
            return $this->json($response, [
                'success' => true,
                'data' => [
                    'version' => 1,
                    'state' => new \stdClass(),
                    'updated_at' => null,
                ],
            ]);
        }

        $raw = file_get_contents($path);
        if ($raw === false) {
            return $this->json($response, [
                'success' => false,
                'error' => 'Failed to read app state',
            ], 500);
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return $this->json($response, [
                'success' => true,
                'data' => [
                    'version' => 1,
                    'state' => new \stdClass(),
                    'updated_at' => null,
                ],
            ]);
        }

        $state = $decoded['state'] ?? [];
        if (!is_array($state)) {
            $state = [];
        }

        return $this->json($response, [
            'success' => true,
            'data' => [
                'version' => (int)($decoded['version'] ?? 1),
                'state' => $state,
                'updated_at' => $decoded['updated_at'] ?? null,
            ],
        ]);
    }

    public function saveState(Request $request, Response $response): Response
    {
        $userId = $this->getUserId($request);
        if ($userId === null) {
            return $this->json($response, [
                'success' => false,
                'error' => 'Authentication required',
            ], 401);
        }

        $payload = $request->getParsedBody();
        if (!is_array($payload)) {
            return $this->json($response, [
                'success' => false,
                'error' => 'Invalid payload',
            ], 400);
        }

        $state = $payload['state'] ?? null;
        if (!is_array($state)) {
            return $this->json($response, [
                'success' => false,
                'error' => 'State must be an object',
            ], 400);
        }

        foreach ($state as $key => $value) {
            if (!is_string($key) || !is_string($value)) {
                return $this->json($response, [
                    'success' => false,
                    'error' => 'State keys and values must be strings',
                ], 400);
            }
        }

        $document = [
            'user_id' => $userId,
            'version' => (int)($payload['version'] ?? 1),
            'updated_at' => date('c'),
            'state' => $state,
        ];

        $encoded = json_encode($document, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if (!is_string($encoded)) {
            return $this->json($response, [
                'success' => false,
                'error' => 'Failed to encode state',
            ], 500);
        }

        if (strlen($encoded) > self::MAX_STATE_BYTES) {
            return $this->json($response, [
                'success' => false,
                'error' => 'State payload too large',
            ], 413);
        }

        $path = $this->getStatePath($userId);
        $directory = dirname($path);
        if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
            return $this->json($response, [
                'success' => false,
                'error' => 'Failed to initialize state storage',
            ], 500);
        }

        $result = file_put_contents($path, $encoded, LOCK_EX);
        if ($result === false) {
            return $this->json($response, [
                'success' => false,
                'error' => 'Failed to save app state',
            ], 500);
        }

        return $this->json($response, [
            'success' => true,
            'data' => [
                'version' => $document['version'],
                'updated_at' => $document['updated_at'],
            ],
        ]);
    }

    private function getStatePath(string $userId): string
    {
        $safeUserId = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $userId);
        return __DIR__ . '/../../storage/user_state/' . $safeUserId . '.json';
    }

    private function getUserId(Request $request): ?string
    {
        $userId = $request->getAttribute('user_id');
        if (!is_string($userId) || trim($userId) === '') {
            return null;
        }
        return $userId;
    }

    private function json(Response $response, array $body, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($body));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}

