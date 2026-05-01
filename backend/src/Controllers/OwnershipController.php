<?php

declare(strict_types=1);

namespace App\Controllers;

use Illuminate\Database\Capsule\Manager as Capsule;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class OwnershipController
{
    /**
     * Admin-only ownership transfer endpoint.
     *
     * Request body:
     * - from_user_id: string|null (optional if include_unowned=true)
     * - to_user_id: string (required)
     * - include_unowned: bool (optional, default false)
     */
    public function transfer(Request $request, Response $response): Response
    {
        if (!$this->isAdmin($request)) {
            return $this->json($response, [
                'success' => false,
                'error' => 'Forbidden',
                'message' => 'Admin access required',
            ], 403);
        }

        $payload = $request->getParsedBody();
        if (!is_array($payload)) {
            return $this->json($response, [
                'success' => false,
                'error' => 'Invalid payload',
            ], 400);
        }

        $fromUserId = trim((string) ($payload['from_user_id'] ?? ''));
        $toUserId = trim((string) ($payload['to_user_id'] ?? ''));
        $includeUnowned = $this->toBool($payload['include_unowned'] ?? false);

        if ($toUserId === '') {
            return $this->json($response, [
                'success' => false,
                'error' => 'to_user_id is required',
            ], 400);
        }

        if ($fromUserId === '' && !$includeUnowned) {
            return $this->json($response, [
                'success' => false,
                'error' => 'Provide from_user_id or set include_unowned=true',
            ], 400);
        }

        if ($fromUserId !== '' && $fromUserId === $toUserId && !$includeUnowned) {
            return $this->json($response, [
                'success' => false,
                'error' => 'from_user_id and to_user_id are the same',
            ], 400);
        }

        $guestSource = $fromUserId !== '' && str_starts_with($fromUserId, 'guest_');
        if ($guestSource) {
            return $this->json($response, [
                'success' => false,
                'error' => 'Guest source transfer is not allowed on this endpoint',
                'message' => 'Use /api/v1/auth/link-guest with a non-admin destination account',
            ], 400);
        }

        $tables = [
            'series',
            'books',
            'stories',
            'chapters',
            'characters',
            'character_templates',
            'story_templates',
        ];

        $movedByTable = [];
        $totalMoved = 0;

        foreach ($tables as $table) {
            $query = Capsule::table($table)->where(function ($builder) use ($fromUserId, $includeUnowned): void {
                if ($fromUserId !== '') {
                    $builder->where('owner_user_id', $fromUserId);
                }

                if ($includeUnowned) {
                    if ($fromUserId !== '') {
                        $builder->orWhereNull('owner_user_id')->orWhere('owner_user_id', '');
                    } else {
                        $builder->whereNull('owner_user_id')->orWhere('owner_user_id', '');
                    }
                }
            });

            $moved = $query->update(['owner_user_id' => $toUserId]);
            $movedByTable[$table] = $moved;
            $totalMoved += $moved;
        }

        return $this->json($response, [
            'success' => true,
            'data' => [
                'from_user_id' => $fromUserId !== '' ? $fromUserId : null,
                'to_user_id' => $toUserId,
                'include_unowned' => $includeUnowned,
                'moved_rows_by_table' => $movedByTable,
                'total_moved_rows' => $totalMoved,
            ],
        ]);
    }

    private function isAdmin(Request $request): bool
    {
        $user = $request->getAttribute('user');
        if (!is_array($user)) {
            return false;
        }

        return (($user['role'] ?? null) === 'admin');
    }

    private function toBool(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            return in_array(strtolower(trim($value)), ['1', 'true', 'yes', 'on'], true);
        }

        if (is_numeric($value)) {
            return (int) $value === 1;
        }

        return false;
    }

    private function json(Response $response, array $body, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($body));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
