<?php

declare(strict_types=1);

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Series;
use Ramsey\Uuid\Uuid;

class TimelineController
{
    public function getTimeline(Request $request, Response $response, array $args): Response
    {
        try {
            $series = Series::find($args['seriesId']);

            if (!$series) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Series not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $timeline = $series->shared_elements['worldBuilding']['timeline'] ?? [];

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $timeline
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function addEvent(Request $request, Response $response, array $args): Response
    {
        try {
            $series = Series::find($args['seriesId']);

            if (!$series) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Series not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $sharedElements = $series->shared_elements;

            $event = [
                'id' => Uuid::uuid4()->toString(),
                'title' => $data['title'] ?? '',
                'description' => $data['description'] ?? '',
                'date' => $data['date'] ?? date('Y-m-d'),
                'type' => $data['type'] ?? 'event',
                'importance' => $data['importance'] ?? 'medium',
                'books_affected' => $data['books_affected'] ?? [],
                'characters_involved' => $data['characters_involved'] ?? []
            ];

            $sharedElements['worldBuilding']['timeline'][] = $event;
            $series->shared_elements = $sharedElements;
            $series->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $event
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function updateEvent(Request $request, Response $response, array $args): Response
    {
        try {
            // Find series containing this timeline event
            $series = Series::all()->first(function ($s) use ($args) {
                $timeline = $s->shared_elements['worldBuilding']['timeline'] ?? [];
                return collect($timeline)->contains('id', $args['eventId']);
            });

            if (!$series) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Timeline event not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $sharedElements = $series->shared_elements;

            foreach ($sharedElements['worldBuilding']['timeline'] as &$event) {
                if ($event['id'] === $args['eventId']) {
                    $event = array_merge($event, $data);
                    break;
                }
            }

            $series->shared_elements = $sharedElements;
            $series->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $series
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function deleteEvent(Request $request, Response $response, array $args): Response
    {
        try {
            // Find series containing this timeline event
            $series = Series::all()->first(function ($s) use ($args) {
                $timeline = $s->shared_elements['worldBuilding']['timeline'] ?? [];
                return collect($timeline)->contains('id', $args['eventId']);
            });

            if (!$series) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Timeline event not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $sharedElements = $series->shared_elements;
            $sharedElements['worldBuilding']['timeline'] = array_filter(
                $sharedElements['worldBuilding']['timeline'],
                fn($event) => $event['id'] !== $args['eventId']
            );

            $series->shared_elements = $sharedElements;
            $series->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Timeline event deleted successfully'
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}