<?php

declare(strict_types=1);

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ConsistencyController
{
    public function checkConsistency(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
            'message' => 'Consistency checking endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function validateCharacterProgression(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [
                'valid' => true,
                'issues' => [],
                'suggestions' => [],
                'levelProgression' => []
            ],
            'message' => 'Character progression validation endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }
}