<?php

declare(strict_types=1);

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Book;
use App\Models\Series;
use Ramsey\Uuid\Uuid;

class BookController
{
    public function getBySeriesId(Request $request, Response $response, array $args): Response
    {
        try {
            $books = Book::where('series_id', $args['seriesId'])
                ->orderBy('book_number')
                ->get();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $books
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
            $book = Book::with(['series', 'stories'])->find($args['id']);

            if (!$book) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Book not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $book
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

    public function create(Request $request, Response $response, array $args): Response
    {
        try {
            $data = $request->getParsedBody();

            // Get the series to determine the next book number
            $series = Series::find($args['seriesId']);
            if (!$series) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Series not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $nextBookNumber = Book::where('series_id', $args['seriesId'])->max('book_number') + 1;

            $book = Book::create([
                'id' => Uuid::uuid4()->toString(),
                'series_id' => $args['seriesId'],
                'title' => $data['title'] ?? '',
                'description' => $data['description'] ?? '',
                'book_number' => $data['book_number'] ?? $nextBookNumber,
                'status' => $data['status'] ?? 'planning',
                'target_word_count' => $data['target_word_count'] ?? null,
                'current_word_count' => $data['current_word_count'] ?? 0,
                'synopsis' => $data['synopsis'] ?? '',
                'outline' => $data['outline'] ?? '',
                'character_arcs' => $data['character_arcs'] ?? [],
                'plot_threads' => $data['plot_threads'] ?? [],
                'timeline_events' => $data['timeline_events'] ?? []
            ]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $book
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
            $book = Book::find($args['id']);

            if (!$book) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Book not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $book->update($data);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $book
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
            $book = Book::find($args['id']);

            if (!$book) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Book not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $book->delete();

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Book deleted successfully'
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

    public function reorder(Request $request, Response $response, array $args): Response
    {
        try {
            $data = $request->getParsedBody();
            $bookIds = $data['bookIds'] ?? [];

            foreach ($bookIds as $index => $bookId) {
                Book::where('id', $bookId)
                    ->where('series_id', $args['seriesId'])
                    ->update(['book_number' => $index + 1]);
            }

            $books = Book::where('series_id', $args['seriesId'])
                ->orderBy('book_number')
                ->get();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $books
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

    public function getPlotThreads(Request $request, Response $response, array $args): Response
    {
        try {
            $book = Book::find($args['bookId']);

            if (!$book) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Book not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $book->plot_threads
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

    public function addPlotThread(Request $request, Response $response, array $args): Response
    {
        try {
            $book = Book::find($args['bookId']);

            if (!$book) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Book not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $plotThreads = $book->plot_threads;

            $plotThread = [
                'id' => Uuid::uuid4()->toString(),
                'title' => $data['title'] ?? '',
                'description' => $data['description'] ?? '',
                'status' => $data['status'] ?? 'open',
                'priority' => $data['priority'] ?? 'medium',
                'characters' => $data['characters'] ?? [],
                'locations' => $data['locations'] ?? [],
                'events' => $data['events'] ?? []
            ];

            $plotThreads[] = $plotThread;
            $book->plot_threads = $plotThreads;
            $book->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $book
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

    public function updatePlotThread(Request $request, Response $response, array $args): Response
    {
        try {
            $book = Book::whereJsonContains('plot_threads', function ($query) use ($args) {
                $query->where('id', $args['threadId']);
            })->first();

            if (!$book) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Plot thread not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $plotThreads = $book->plot_threads;

            foreach ($plotThreads as &$thread) {
                if ($thread['id'] === $args['threadId']) {
                    $thread = array_merge($thread, $data);
                    break;
                }
            }

            $book->plot_threads = $plotThreads;
            $book->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $book
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

    public function deletePlotThread(Request $request, Response $response, array $args): Response
    {
        try {
            $book = Book::whereJsonContains('plot_threads', function ($query) use ($args) {
                $query->where('id', $args['threadId']);
            })->first();

            if (!$book) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Plot thread not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $plotThreads = array_filter(
                $book->plot_threads,
                fn($thread) => $thread['id'] !== $args['threadId']
            );

            $book->plot_threads = array_values($plotThreads);
            $book->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $book
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

    public function getCharacterArcs(Request $request, Response $response, array $args): Response
    {
        try {
            $book = Book::find($args['bookId']);

            if (!$book) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Book not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $book->character_arcs
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

    public function addCharacterArc(Request $request, Response $response, array $args): Response
    {
        try {
            $book = Book::find($args['bookId']);

            if (!$book) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Book not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $characterArcs = $book->character_arcs;

            $characterArc = [
                'id' => Uuid::uuid4()->toString(),
                'character_id' => $data['character_id'] ?? '',
                'title' => $data['title'] ?? '',
                'description' => $data['description'] ?? '',
                'start_state' => $data['start_state'] ?? '',
                'end_state' => $data['end_state'] ?? '',
                'key_events' => $data['key_events'] ?? [],
                'development_points' => $data['development_points'] ?? []
            ];

            $characterArcs[] = $characterArc;
            $book->character_arcs = $characterArcs;
            $book->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $book
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

    public function updateCharacterArc(Request $request, Response $response, array $args): Response
    {
        try {
            $book = Book::whereJsonContains('character_arcs', function ($query) use ($args) {
                $query->where('id', $args['arcId']);
            })->first();

            if (!$book) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Character arc not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $characterArcs = $book->character_arcs;

            foreach ($characterArcs as &$arc) {
                if ($arc['id'] === $args['arcId']) {
                    $arc = array_merge($arc, $data);
                    break;
                }
            }

            $book->character_arcs = $characterArcs;
            $book->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $book
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

    public function deleteCharacterArc(Request $request, Response $response, array $args): Response
    {
        try {
            $book = Book::whereJsonContains('character_arcs', function ($query) use ($args) {
                $query->where('id', $args['arcId']);
            })->first();

            if (!$book) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Character arc not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $characterArcs = array_filter(
                $book->character_arcs,
                fn($arc) => $arc['id'] !== $args['arcId']
            );

            $book->character_arcs = array_values($characterArcs);
            $book->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $book
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