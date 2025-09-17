<?php
// ✅ CORRECT: Standardized Auth0Middleware
declare(strict_types=1);

namespace App\Middleware;

use App\Services\Auth0Service;
use App\Actions\Auth0\CreateOrUpdateUserAction;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class Auth0Middleware implements MiddlewareInterface
{
    public function __construct(
        private readonly Auth0Service $auth0Service,
        private readonly CreateOrUpdateUserAction $createOrUpdateUserAction
    ) {}

    public function process(Request $request, RequestHandlerInterface $handler): Response
    {
        // Get Authorization header
        $authHeader = $request->getHeaderLine('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return $this->createUnauthorizedResponse('Authorization header missing or invalid');
        }

        $token = substr($authHeader, 7); // Remove "Bearer " prefix

        try {
            // Validate the JWT token
            $payload = $this->auth0Service->validateToken($token);

            // Add Auth0 user info to request
            $request = $request->withAttribute('auth0_payload', $payload);

            // Get or create user in our database
            $user = $this->createOrUpdateUserAction->execute($payload);
            if ($user) {
                $request = $request->withAttribute('user', $user);
                $request = $request->withAttribute('user_id', $user->id);
            }

            return $handler->handle($request);

        } catch (\Exception $e) {
            error_log("Auth0 Middleware Error: " . $e->getMessage());
            return $this->createUnauthorizedResponse('Token validation failed');
        }
    }

    private function createUnauthorizedResponse(string $message = 'Unauthorized'): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'success' => false,
            'message' => $message,
            'error' => 'Authentication required'
        ]));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
    }
}