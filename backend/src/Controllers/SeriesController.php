<?php

declare(strict_types=1);

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Storage\JsonFileStorage;

class SeriesController
{
    private $storage;

    public function __construct()
    {
        $this->storage = new JsonFileStorage();
    }

    public function getAll(Request $request, Response $response): Response
    {
        try {
            $series = $this->storage->read('series');

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

    public function getById(Request $request, Response $response, array $args): Response
    {
        try {
            $series = $this->storage->findById('series', $args['id']);

            if (!$series) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Series not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

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

    public function create(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            $seriesData = [
                'title' => $data['title'] ?? '',
                'description' => $data['description'] ?? '',
                'genre' => $data['genre'] ?? '',
                'tags' => $data['tags'] ?? [],
                'status' => $data['status'] ?? 'planning',
                'target_books' => $data['target_books'] ?? null,
                'author_notes' => $data['author_notes'] ?? '',
                'shared_elements' => $data['shared_elements'] ?? []
            ];

            $series = $this->storage->create('series', $seriesData);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $series
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

    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $series = Series::find($args['id']);

            if (!$series) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Series not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $series->update($data);

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

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $deleted = $this->storage->delete('series', $args['id']);

            if (!$deleted) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Series not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Series deleted successfully'
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

    public function import(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            $seriesData = json_decode($data['data'] ?? '', true);

            if (!$seriesData) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Invalid series data'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $series = Series::create($seriesData);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $series
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

    public function addCharacterToSeries(Request $request, Response $response, array $args): Response
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

            $characterEntry = [
                'characterId' => $args['characterId'],
                'appearances' => $data['appearances'] ?? [],
                'developmentArc' => [],
                'relationships' => []
            ];

            $sharedElements['characters'][] = $characterEntry;
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

    public function removeCharacterFromSeries(Request $request, Response $response, array $args): Response
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

            $sharedElements = $series->shared_elements;
            $sharedElements['characters'] = array_filter(
                $sharedElements['characters'],
                fn($char) => $char['characterId'] !== $args['characterId']
            );

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

    public function addCharacterAppearance(Request $request, Response $response, array $args): Response
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

            foreach ($sharedElements['characters'] as &$character) {
                if ($character['characterId'] === $args['characterId']) {
                    $character['appearances'][] = $data;
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

    public function updateCharacterDevelopment(Request $request, Response $response, array $args): Response
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

            foreach ($sharedElements['characters'] as &$character) {
                if ($character['characterId'] === $args['characterId']) {
                    $character['developmentArc'] = array_filter(
                        $character['developmentArc'],
                        fn($dev) => $dev['bookNumber'] !== $data['bookNumber']
                    );
                    $character['developmentArc'][] = $data;
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
}