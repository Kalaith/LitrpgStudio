<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Controllers\AuthController;
use PHPUnit\Framework\TestCase;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;

final class AuthControllerTest extends TestCase
{
    protected function setUp(): void
    {
        $_ENV['JWT_SECRET'] = 'test-secret';
    }

    public function testLinkGuestRequiresGuestTokenProof(): void
    {
        $request = (new ServerRequestFactory())
            ->createServerRequest('POST', '/api/v1/auth/link-guest')
            ->withAttribute('user', [
                'id' => 'user_123',
                'role' => 'user',
                'is_guest' => false,
            ])
            ->withParsedBody([
                'guest_user_id' => 'guest_abc123',
            ]);

        $response = (new AuthController())->linkGuestAccount(
            $request,
            (new ResponseFactory())->createResponse()
        );

        self::assertSame(400, $response->getStatusCode());
        self::assertStringContainsString('guest_token is required', (string) $response->getBody());
    }

    public function testLinkGuestRejectsInvalidGuestTokenProof(): void
    {
        $request = (new ServerRequestFactory())
            ->createServerRequest('POST', '/api/v1/auth/link-guest')
            ->withAttribute('user', [
                'id' => 'user_123',
                'role' => 'user',
                'is_guest' => false,
            ])
            ->withParsedBody([
                'guest_user_id' => 'guest_abc123',
                'guest_token' => 'not-a-valid-token',
            ]);

        $response = (new AuthController())->linkGuestAccount(
            $request,
            (new ResponseFactory())->createResponse()
        );

        self::assertSame(400, $response->getStatusCode());
        self::assertStringContainsString('Invalid guest token', (string) $response->getBody());
    }
}
