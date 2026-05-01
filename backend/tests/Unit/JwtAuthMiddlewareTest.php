<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Middleware\JwtAuthMiddleware;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface as Request;
use ReflectionMethod;
use Slim\Psr7\Factory\ServerRequestFactory;

final class JwtAuthMiddlewareTest extends TestCase
{
    protected function setUp(): void
    {
        $_ENV['JWT_SECRET'] = 'test-secret';
    }

    public function testDatabaseInitializerIsNotPublic(): void
    {
        $request = (new ServerRequestFactory())->createServerRequest('POST', '/api/v1/init-database');

        self::assertFalse($this->isPublicRequest($request));
    }

    public function testGuestSessionEndpointRemainsPublic(): void
    {
        $request = (new ServerRequestFactory())->createServerRequest('POST', '/api/v1/auth/guest-session');

        self::assertTrue($this->isPublicRequest($request));
    }

    private function isPublicRequest(Request $request): bool
    {
        $middleware = new JwtAuthMiddleware();
        $method = new ReflectionMethod($middleware, 'isPublicRequest');
        $method->setAccessible(true);

        return (bool) $method->invoke($middleware, $request);
    }
}
