<?php

declare(strict_types=1);

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AnalyticsController
{
    public function getSeriesAnalytics(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [
                'totalWordCount' => 0,
                'averageBookLength' => 0,
                'completionRate' => 0,
                'characterCount' => 0,
                'locationCount' => 0,
                'plotThreadCount' => 0,
                'consistencyScore' => 85,
                'readabilityScore' => 75
            ],
            'message' => 'Analytics endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function generateAnalytics(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [
                'analytics_id' => 'placeholder',
                'generated_at' => date('c'),
                'status' => 'completed'
            ],
            'message' => 'Analytics generation endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }
}