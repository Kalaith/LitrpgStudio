<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\ResearchCollection;
use App\Models\ResearchSource;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ResearchController
{
    public function getSources(Request $request, Response $response): Response
    {
        try {
            $sources = ResearchSource::orderBy('updated_at', 'desc')->get();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $sources,
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage(), 500);
        }
    }

    public function getCollections(Request $request, Response $response): Response
    {
        try {
            $collections = ResearchCollection::orderBy('name')->get();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $collections,
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage(), 500);
        }
    }

    private function errorResponse(Response $response, string $message, int $status): Response
    {
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => $message,
        ]));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}
