<?php

declare(strict_types=1);

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Series;

class ExportController
{
    public function exportSeries(Request $request, Response $response, array $args): Response
    {
        try {
            $series = Series::with(['books', 'characters', 'stories.chapters', 'analytics'])
                ->find($args['id']);

            if (!$series) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Series not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $exportData = [
                'series' => $series->toArray(),
                'export_metadata' => [
                    'exported_at' => date('c'),
                    'version' => '1.0.0',
                    'format' => 'litrpg_studio_export'
                ]
            ];

            $filename = 'series_' . $series->id . '_' . date('Y-m-d_H-i-s') . '.json';

            $response->getBody()->write(json_encode($exportData, JSON_PRETTY_PRINT));

            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withHeader('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}