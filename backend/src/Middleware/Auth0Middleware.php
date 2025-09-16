<?php

declare(strict_types=1);

namespace LitRPGStudio\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Http\Server\MiddlewareInterface;
use LitRPGStudio\Services\Auth0Service;
use Slim\Psr7\Response as SlimResponse;

class Auth0Middleware implements MiddlewareInterface
{
    private Auth0Service $auth0Service;
    private array $requiredScopes;

    public function __construct(array $requiredScopes = [])
    {
        $this->auth0Service = new Auth0Service();
        $this->requiredScopes = $requiredScopes;
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        try {
            // Get Authorization header
            $authHeader = $request->getHeaderLine('Authorization');

            if (empty($authHeader)) {
                return $this->createErrorResponse('Authorization header missing', 401);
            }

            // Extract token from header
            $token = $this->auth0Service->extractTokenFromHeader($authHeader);

            // Validate token
            $tokenData = $this->auth0Service->validateToken($token);

            // Validate scopes if required
            if (!$this->auth0Service->validateScopes($tokenData, $this->requiredScopes)) {
                return $this->createErrorResponse('Insufficient permissions', 403);
            }

            // Add user data to request attributes
            $request = $request->withAttribute('user', $tokenData);
            $request = $request->withAttribute('user_id', $tokenData['sub'] ?? null);

            // Continue to next middleware/handler
            return $handler->handle($request);
        } catch (\Exception $e) {
            return $this->createErrorResponse('Authentication failed: ' . $e->getMessage(), 401);
        }
    }

    private function createErrorResponse(string $message, int $status): Response
    {
        $response = new SlimResponse();

        $body = json_encode([
            'success' => false,
            'error' => $message,
            'timestamp' => date('c')
        ]);

        $response->getBody()->write($body);

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}