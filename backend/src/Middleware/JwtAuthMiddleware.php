<?php

declare(strict_types=1);

namespace App\Middleware;

use Firebase\JWT\BeforeValidException;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\SignatureInvalidException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class JwtAuthMiddleware implements MiddlewareInterface
{
    private string $jwtSecret;

    public function __construct()
    {
        $this->jwtSecret = trim($_ENV['JWT_SECRET'] ?? '');
        if ($this->jwtSecret === '') {
            throw new \RuntimeException('JWT_SECRET must be set in environment variables');
        }
    }

    public function process(Request $request, RequestHandlerInterface $handler): Response
    {
        if ($this->isPublicRequest($request)) {
            return $handler->handle($request);
        }

        $authHeader = $request->getHeaderLine('Authorization');
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return $this->createUnauthorizedResponse('Authorization header missing or invalid');
        }

        $token = trim(substr($authHeader, 7));
        if ($token === '') {
            return $this->createUnauthorizedResponse('Bearer token is missing');
        }

        try {
            $claims = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));

            $user = $this->buildUserFromClaims($claims);
            if (!$user || empty($user['id'])) {
                return $this->createUnauthorizedResponse('User not found for token');
            }

            $request = $request
                ->withAttribute('jwt_claims', $claims)
                ->withAttribute('user', $user)
                ->withAttribute('user_id', (string) $user['id']);

            return $handler->handle($request);
        } catch (ExpiredException $e) {
            return $this->createUnauthorizedResponse('Token has expired');
        } catch (SignatureInvalidException $e) {
            return $this->createUnauthorizedResponse('Token signature is invalid');
        } catch (BeforeValidException $e) {
            return $this->createUnauthorizedResponse('Token is not valid yet');
        } catch (\Throwable $e) {
            error_log('JWT Middleware Error: ' . $e->getMessage());
            $isDebug = filter_var($_ENV['APP_DEBUG'] ?? 'false', FILTER_VALIDATE_BOOLEAN);
            $message = 'Token validation failed';
            if ($isDebug) {
                $message .= ': ' . $e->getMessage();
            }
            return $this->createUnauthorizedResponse($message);
        }
    }

    private function isPublicRequest(Request $request): bool
    {
        if (strtoupper($request->getMethod()) === 'OPTIONS') {
            return true;
        }

        $path = rtrim($request->getUri()->getPath(), '/');
        if ($path === '') {
            $path = '/';
        }

        $publicSuffixes = [
            '/health',
            '/api/v1/health',
            '/api/v1/init-database',
        ];

        foreach ($publicSuffixes as $suffix) {
            if ($path === $suffix || str_ends_with($path, $suffix)) {
                return true;
            }
        }

        return false;
    }

    private function buildUserFromClaims(object $claims): ?array
    {
        $subject = $this->extractClaimString($claims, 'sub');
        $frontpageUserId = $this->extractClaimString($claims, 'user_id');
        $email = $this->extractClaimString($claims, 'email') ?? '';
        $username = $this->extractClaimString($claims, 'username') ?? ($email ? explode('@', $email)[0] : 'user');
        $displayName = $this->extractClaimString($claims, 'display_name') ?? $username;
        $role = $this->normalizeRole($this->extractClaimString($claims, 'role'));
        $id = $frontpageUserId ?: $subject;

        if (!$id) {
            return null;
        }

        return [
            'id' => (string) $id,
            'email' => $email,
            'display_name' => $displayName,
            'username' => $username,
            'role' => $role,
            'is_verified' => true,
        ];
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

    private function normalizeRole(?string $role): string
    {
        if ($role === 'admin' || $role === 'dm' || $role === 'user') {
            return $role;
        }

        return 'user';
    }

    private function createUnauthorizedResponse(string $message): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'success' => false,
            'message' => $message,
            'error' => 'Authentication required',
        ]));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
    }
}
