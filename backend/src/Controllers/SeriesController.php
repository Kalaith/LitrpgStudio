<?php

declare(strict_types=1);

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\External\SeriesRepository;
use App\Models\Series;
use Ramsey\Uuid\Uuid;

class SeriesController
{
    public function __construct(
        private readonly SeriesRepository $seriesRepository
    ) {}

    public function getAll(Request $request, Response $response): Response
    {
        try {
            $series = $this->seriesRepository->findAll();

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
            $series = $this->seriesRepository->findWithRelations($args['id']);

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
                'id' => Uuid::uuid4()->toString(),
                'title' => $data['title'] ?? '',
                'description' => $data['description'] ?? '',
                'genre' => $data['genre'] ?? '',
                'tags' => $data['tags'] ?? [],
                'status' => $data['status'] ?? 'planning',
                'target_books' => $data['target_books'] ?? null,
                'author_notes' => $data['author_notes'] ?? '',
                'shared_elements' => $data['shared_elements'] ?? []
            ];

            $series = $this->seriesRepository->createFromArray($seriesData);

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
            $data = $request->getParsedBody();
            $series = $this->seriesRepository->updateFromArray($args['id'], $data);

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

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $deleted = $this->seriesRepository->delete($args['id']);

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

            // Ensure ID is set for import
            if (!isset($seriesData['id'])) {
                $seriesData['id'] = Uuid::uuid4()->toString();
            }

            $series = $this->seriesRepository->createFromArray($seriesData);

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
            $success = $this->seriesRepository->addCharacterToSeries($args['seriesId'], $args['characterId']);

            if (!$success) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Series not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $series = $this->seriesRepository->findById($args['seriesId']);

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
            $success = $this->seriesRepository->removeCharacterFromSeries($args['seriesId'], $args['characterId']);

            if (!$success) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Series not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $series = $this->seriesRepository->findById($args['seriesId']);

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
            $data = $request->getParsedBody();
            $success = $this->seriesRepository->addCharacterAppearance($args['seriesId'], $args['characterId'], $data);

            if (!$success) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Series not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $series = $this->seriesRepository->findById($args['seriesId']);

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
            $data = $request->getParsedBody();
            $success = $this->seriesRepository->updateCharacterDevelopment($args['seriesId'], $args['characterId'], $data);

            if (!$success) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Series not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $series = $this->seriesRepository->findById($args['seriesId']);

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