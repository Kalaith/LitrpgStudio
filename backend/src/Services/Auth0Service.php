<?php
// ✅ CORRECT: Standardized Auth0Service
declare(strict_types=1);

namespace App\Services;

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

            // Set leeway for clock skew (5 minutes)
            JWT::$leeway = 300;

            // Decode and validate token
            $decoded = JWT::decode($token, JWK::parseKeySet($jwks));

            // Convert to array
            $payload = (array) $decoded;

            // Validate audience
            $tokenAudience = $payload['aud'] ?? [];
            if (is_string($tokenAudience)) {
                $tokenAudience = [$tokenAudience];
            }

            if (!in_array($this->audience, $tokenAudience, true)) {
                throw new \Exception('Invalid audience');
            }

            return $payload;

        } catch (\Exception $e) {
            throw new \Exception('Token validation failed: ' . $e->getMessage());
        }
    }

    private function getJwks(): array
    {
        // Use cached JWKS if still valid
        if ($this->jwksCache && (time() - $this->jwksCacheTime) < $this->jwksCacheDuration) {
            return $this->jwksCache;
        }

        $client = new Client();
        $response = $client->get("https://{$this->domain}/.well-known/jwks.json");

        $jwks = json_decode($response->getBody()->getContents(), true);

        if (!$jwks || !isset($jwks['keys'])) {
            throw new \Exception('Invalid JWKS response from Auth0');
        }

        // Cache the JWKS
        $this->jwksCache = $jwks;
        $this->jwksCacheTime = time();

        return $jwks;
    }
}