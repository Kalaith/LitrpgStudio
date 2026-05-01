<?php

declare(strict_types=1);

namespace App\Controllers;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Database\Capsule\Manager as Capsule;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class AuthController
{
    public function linkGuestAccount(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        if (!is_array($user) || empty($user['id'])) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'User not authenticated',
                'error' => 'Authentication required',
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        $currentUserId = trim((string) ($user['id'] ?? ''));
        $currentRole = trim((string) ($user['role'] ?? 'user'));
        $isCurrentGuest = (bool) ($user['is_guest'] ?? false) || $currentRole === 'guest' || str_starts_with($currentUserId, 'guest_');

        // Hard safety rule: guest accounts must never link to admin accounts.
        if ($currentRole === 'admin') {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Guest linking is disabled for admin accounts',
                'error' => 'Guest and admin accounts cannot be linked',
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
        }

        if ($isCurrentGuest) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Linking requires a signed-in non-guest account',
                'error' => 'Guest destination is not allowed',
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $payload = $request->getParsedBody();
        if (!is_array($payload)) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Invalid payload',
                'error' => 'guest_user_id is required',
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $guestUserId = trim((string) ($payload['guest_user_id'] ?? ''));
        if ($guestUserId === '' || !str_starts_with($guestUserId, 'guest_')) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'guest_user_id must be a guest account id',
                'error' => 'Invalid guest_user_id',
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $guestToken = trim((string) ($payload['guest_token'] ?? ''));
        if ($guestToken === '') {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'guest_token is required',
                'error' => 'Guest ownership proof is required',
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $jwtSecret = trim((string) ($_ENV['JWT_SECRET'] ?? ''));
        if ($jwtSecret === '') {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Guest linking is unavailable',
                'error' => 'JWT secret is not configured',
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }

        try {
            $guestClaims = JWT::decode($guestToken, new Key($jwtSecret, 'HS256'));
        } catch (\Throwable $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Guest session could not be verified',
                'error' => 'Invalid guest token',
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $tokenGuestUserId = $this->extractClaimString($guestClaims, 'user_id') ?? $this->extractClaimString($guestClaims, 'sub');
        $tokenAuthType = $this->extractClaimString($guestClaims, 'auth_type') ?? '';
        $tokenRole = $this->extractClaimString($guestClaims, 'role') ?? '';
        $tokenIsGuest = $this->extractClaimBool($guestClaims, 'is_guest')
            || $tokenAuthType === 'guest'
            || $tokenRole === 'guest'
            || ($tokenGuestUserId !== null && str_starts_with($tokenGuestUserId, 'guest_'));

        if ($tokenGuestUserId !== $guestUserId || !$tokenIsGuest) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Guest session does not match the requested account link',
                'error' => 'Invalid guest ownership proof',
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        if ($guestUserId === $currentUserId) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'guest_user_id cannot match current user id',
                'error' => 'Invalid transfer request',
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
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
            $moved = Capsule::table($table)
                ->where('owner_user_id', $guestUserId)
                ->update(['owner_user_id' => $currentUserId]);
            $movedByTable[$table] = $moved;
            $totalMoved += $moved;
        }

        $response->getBody()->write(json_encode([
            'success' => true,
            'message' => 'Guest account data linked successfully',
            'data' => [
                'guest_user_id' => $guestUserId,
                'linked_to_user_id' => $currentUserId,
                'moved_rows_by_table' => $movedByTable,
                'total_moved_rows' => $totalMoved,
            ],
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function createGuestSession(Request $request, Response $response): Response
    {
        $jwtSecret = trim((string) ($_ENV['JWT_SECRET'] ?? ''));
        if ($jwtSecret === '') {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Guest session is unavailable',
                'error' => 'JWT secret is not configured',
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }

        $now = time();
        $guestId = 'guest_' . $this->generateId();
        $guestTag = substr(str_replace('-', '', $guestId), 0, 8);
        $username = 'guest_' . $guestTag;

        $claims = [
            'iss' => 'writers-studio',
            'aud' => 'writers-studio-app',
            'iat' => $now,
            'nbf' => $now - 5,
            'exp' => $now + (60 * 60 * 24 * 365),
            'jti' => $this->generateId(),
            'sub' => $guestId,
            'user_id' => $guestId,
            'username' => $username,
            'display_name' => 'Guest Writer',
            'email' => '',
            'role' => 'guest',
            'auth_type' => 'guest',
            'is_guest' => true,
        ];

        $token = JWT::encode($claims, $jwtSecret, 'HS256');
        $user = [
            'id' => $guestId,
            'email' => '',
            'display_name' => 'Guest Writer',
            'username' => $username,
            'role' => 'guest',
            'is_verified' => false,
            'is_guest' => true,
            'auth_type' => 'guest',
        ];

        $response->getBody()->write(json_encode([
            'success' => true,
            'message' => 'Guest session created',
            'data' => [
                'token' => $token,
                'user' => $user,
            ],
        ]));

        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }

    private function generateId(): string
    {
        return bin2hex(random_bytes(16));
    }

    private function extractClaimString(object $claims, string $key): ?string
    {
        if (!isset($claims->{$key})) {
            return null;
        }

        $value = $claims->{$key};
        if (is_string($value) || is_numeric($value)) {
            $value = trim((string) $value);
            return $value !== '' ? $value : null;
        }

        return null;
    }

    private function extractClaimBool(object $claims, string $key): bool
    {
        if (!isset($claims->{$key})) {
            return false;
        }

        $value = $claims->{$key};
        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            return in_array(strtolower(trim($value)), ['1', 'true', 'yes'], true);
        }

        if (is_numeric($value)) {
            return (int) $value === 1;
        }

        return false;
    }

    public function currentUser(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        if (!$user) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'User not authenticated',
                'error' => 'Authentication required',
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        $response->getBody()->write(json_encode([
            'success' => true,
            'message' => 'Success',
            'data' => $user,
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }
}
