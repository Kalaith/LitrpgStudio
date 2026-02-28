<?php

declare(strict_types=1);

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class AuthController
{
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
