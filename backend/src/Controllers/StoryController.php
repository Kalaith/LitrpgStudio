<?php

declare(strict_types=1);

namespace LitRPGStudio\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use LitRPGStudio\Models\Story;
use LitRPGStudio\Models\StoryTemplate;
use Ramsey\Uuid\Uuid;

class StoryController
{
    public function getAll(Request $request, Response $response): Response
    {
        try {
            $stories = Story::with(['series', 'book', 'chapters'])->get();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $stories
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
            $story = Story::with(['series', 'book', 'chapters'])->find($args['id']);

            if (!$story) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Story not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $story
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

            $story = Story::create([
                'id' => Uuid::uuid4()->toString(),
                'series_id' => $data['series_id'] ?? null,
                'book_id' => $data['book_id'] ?? null,
                'title' => $data['title'] ?? '',
                'description' => $data['description'] ?? '',
                'genre' => $data['genre'] ?? '',
                'tags' => $data['tags'] ?? [],
                'status' => $data['status'] ?? 'draft',
                'word_count' => $data['word_count'] ?? 0,
                'target_word_count' => $data['target_word_count'] ?? null,
                'summary' => $data['summary'] ?? '',
                'outline' => $data['outline'] ?? '',
                'setting' => $data['setting'] ?? '',
                'themes' => $data['themes'] ?? '',
                'plot_points' => $data['plot_points'] ?? [],
                'character_roles' => $data['character_roles'] ?? [],
                'story_events' => $data['story_events'] ?? []
            ]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $story
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
            $story = Story::find($args['id']);

            if (!$story) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Story not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $story->update($data);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $story
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
            $story = Story::find($args['id']);

            if (!$story) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Story not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $story->delete();

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Story deleted successfully'
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
            $story = Story::find($args['id']);

            if (!$story) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Story not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $storyEvents = $story->story_events;

            $event = [
                'id' => Uuid::uuid4()->toString(),
                'title' => $data['title'] ?? '',
                'description' => $data['description'] ?? '',
                'type' => $data['type'] ?? 'plot',
                'chapter' => $data['chapter'] ?? null,
                'characters_involved' => $data['characters_involved'] ?? [],
                'consequences' => $data['consequences'] ?? [],
                'timestamp' => $data['timestamp'] ?? date('Y-m-d H:i:s')
            ];

            $storyEvents[] = $event;
            $story->story_events = $storyEvents;
            $story->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $story
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

    public function startWritingSession(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            $session = [
                'id' => Uuid::uuid4()->toString(),
                'story_id' => $data['story_id'] ?? '',
                'chapter_id' => $data['chapter_id'] ?? null,
                'start_time' => date('Y-m-d H:i:s'),
                'word_target' => $data['word_target'] ?? 500,
                'words_written' => 0,
                'status' => 'active'
            ];

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $session
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

    public function endWritingSession(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            $session = [
                'end_time' => date('Y-m-d H:i:s'),
                'words_written' => $data['words_written'] ?? 0,
                'status' => 'completed'
            ];

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $session
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

    public function updateSessionProgress(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            $session = [
                'words_written' => $data['words_written'] ?? 0,
                'last_update' => date('Y-m-d H:i:s')
            ];

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $session
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

    public function getTemplates(Request $request, Response $response): Response
    {
        try {
            $templates = StoryTemplate::where('is_public', true)->get();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $templates
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

    public function saveAsTemplate(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            $template = StoryTemplate::create([
                'story_id' => $data['story_id'] ?? null,
                'name' => $data['name'] ?? '',
                'description' => $data['description'] ?? '',
                'template_data' => $data['template_data'] ?? [],
                'is_public' => $data['is_public'] ?? false,
                'usage_count' => 0
            ]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $template
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

    public function createFromTemplate(Request $request, Response $response, array $args): Response
    {
        try {
            $template = StoryTemplate::find($args['templateId']);

            if (!$template) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Template not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $templateData = $template->template_data;
            $templateData['title'] = $data['title'] ?? $templateData['title'];
            $templateData['id'] = Uuid::uuid4()->toString();

            $story = Story::create($templateData);

            // Increment template usage
            $template->increment('usage_count');

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $story
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
}