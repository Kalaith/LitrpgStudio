<?php

declare(strict_types=1);

namespace LitRPGStudio\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\JWK;
use GuzzleHttp\Client;

final class Auth0Service
{
    private string $domain;
    private string $audience;
    private array $jwksCache = [];
    private int $jwksCacheTime = 0;
    private int $jwksCacheDuration = 3600; // 1 hour

    public function __construct()
    {
        $this->domain = $_ENV['AUTH0_DOMAIN'] ?? '';
        $this->audience = $_ENV['AUTH0_AUDIENCE'] ?? '';

        if (empty($this->domain) || empty($this->audience)) {
            throw new \Exception('Auth0 configuration missing. Set AUTH0_DOMAIN and AUTH0_AUDIENCE environment variables.');
        }
    }

    public function validateToken(string $token): array
    {
        try {
            // Get JWKS
            $jwks = $this->getJwks();

            // Set leeway for clock skew
            JWT::$leeway = 60;

            // Decode and validate the token
            $decoded = JWT::decode($token, $jwks);

            // Convert to array
            $tokenData = json_decode(json_encode($decoded), true);

            // Validate audience
            if (!$this->validateAudience($tokenData)) {
                throw new \Exception('Invalid audience');
            }

            return $tokenData;
        } catch (\Exception $e) {
            throw new \Exception('Token validation failed: ' . $e->getMessage());
        }
    }

    private function getJwks(): array
    {
        // Check cache
        if (!empty($this->jwksCache) && (time() - $this->jwksCacheTime) < $this->jwksCacheDuration) {
            return $this->jwksCache;
        }

        // Fetch JWKS from Auth0
        $client = new Client([
            'timeout' => 30,
            'verify' => true
        ]);

        $url = "https://{$this->domain}/.well-known/jwks.json";

        try {
            $response = $client->get($url);
            $jwksData = json_decode($response->getBody()->getContents(), true);

            if (!isset($jwksData['keys'])) {
                throw new \Exception('Invalid JWKS response format');
            }

            // Convert JWKS to format expected by Firebase JWT
            $keys = [];
            foreach ($jwksData['keys'] as $key) {
                if (!isset($key['kid'], $key['kty'], $key['use']) ||
                    $key['kty'] !== 'RSA' ||
                    $key['use'] !== 'sig') {
                    continue;
                }

                $keys[$key['kid']] = new Key(
                    JWK::parseKey($key),
                    $key['alg'] ?? 'RS256'
                );
            }

            if (empty($keys)) {
                throw new \Exception('No valid signing keys found in JWKS');
            }

            // Cache the keys
            $this->jwksCache = $keys;
            $this->jwksCacheTime = time();

            return $keys;
        } catch (\Exception $e) {
            throw new \Exception('Failed to fetch JWKS: ' . $e->getMessage());
        }
    }

    private function validateAudience(array $tokenData): bool
    {
        if (!isset($tokenData['aud'])) {
            return false;
        }

        $audience = $tokenData['aud'];

        // Handle both string and array audiences
        if (is_string($audience)) {
            return $audience === $this->audience;
        }

        if (is_array($audience)) {
            return in_array($this->audience, $audience, true);
        }

        return false;
    }

    public function getUserInfo(string $accessToken): array
    {
        $client = new Client([
            'timeout' => 30,
            'verify' => true
        ]);

        $url = "https://{$this->domain}/userinfo";

        try {
            $response = $client->get($url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type' => 'application/json'
                ]
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            throw new \Exception('Failed to fetch user info: ' . $e->getMessage());
        }
    }

    public function extractTokenFromHeader(string $authHeader): string
    {
        if (!str_starts_with($authHeader, 'Bearer ')) {
            throw new \Exception('Invalid authorization header format');
        }

        $token = substr($authHeader, 7); // Remove "Bearer " prefix

        if (empty($token)) {
            throw new \Exception('No token provided');
        }

        return $token;
    }

    public function validateScopes(array $tokenData, array $requiredScopes): bool
    {
        if (empty($requiredScopes)) {
            return true;
        }

        $tokenScopes = isset($tokenData['scope']) ? explode(' ', $tokenData['scope']) : [];

        foreach ($requiredScopes as $scope) {
            if (!in_array($scope, $tokenScopes, true)) {
                return false;
            }
        }

        return true;
    }

    public function clearJwksCache(): void
    {
        $this->jwksCache = [];
        $this->jwksCacheTime = 0;
    }
}