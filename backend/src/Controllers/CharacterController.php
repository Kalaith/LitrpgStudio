<?php

declare(strict_types=1);

namespace LitRPGStudio\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use LitRPGStudio\Storage\JsonFileStorage;

class CharacterController
{
    private $storage;

    public function __construct()
    {
        $this->storage = new JsonFileStorage();
    }

    public function getAll(Request $request, Response $response): Response
    {
        try {
            $characters = $this->storage->read('characters');

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $characters
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
            $character = Character::with(['series'])->find($args['id']);

            if (!$character) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Character not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
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

            $character = Character::create([
                'id' => Uuid::uuid4()->toString(),
                'series_id' => $data['series_id'] ?? null,
                'name' => $data['name'] ?? '',
                'race' => $data['race'] ?? '',
                'class' => $data['class'] ?? '',
                'background' => $data['background'] ?? '',
                'personality' => $data['personality'] ?? '',
                'appearance' => $data['appearance'] ?? '',
                'stats' => $data['stats'] ?? [],
                'skills' => $data['skills'] ?? [],
                'inventory' => $data['inventory'] ?? [],
                'equipment' => $data['equipment'] ?? [],
                'status_effects' => $data['status_effects'] ?? [],
                'level_progression' => $data['level_progression'] ?? [],
                'relationships' => $data['relationships'] ?? [],
                'backstory' => $data['backstory'] ?? '',
                'motivations' => $data['motivations'] ?? '',
                'flaws' => $data['flaws'] ?? '',
                'story_references' => $data['story_references'] ?? [],
                'cross_references' => $data['cross_references'] ?? []
            ]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
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
            $character = Character::find($args['id']);

            if (!$character) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Character not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $character->update($data);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
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
            $character = Character::find($args['id']);

            if (!$character) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Character not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $character->delete();

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Character deleted successfully'
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

    public function levelUp(Request $request, Response $response, array $args): Response
    {
        try {
            $character = Character::find($args['id']);

            if (!$character) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Character not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $stats = $character->stats;
            $stats['level'] = ($stats['level'] ?? 1) + 1;

            // Calculate derived stats
            $stats['hitPoints'] = max(1, $stats['constitution'] * 10 + $stats['level'] * 5);
            $stats['manaPoints'] = max(0, $stats['intelligence'] * 5 + $stats['level'] * 3);

            $character->stats = $stats;
            $character->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
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

    public function addSkill(Request $request, Response $response, array $args): Response
    {
        try {
            $character = Character::find($args['id']);

            if (!$character) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Character not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $skills = $character->skills;

            $skill = [
                'id' => Uuid::uuid4()->toString(),
                'name' => $data['name'] ?? '',
                'level' => $data['level'] ?? 1,
                'experience' => $data['experience'] ?? 0,
                'description' => $data['description'] ?? '',
                'type' => $data['type'] ?? 'combat',
                'requirements' => $data['requirements'] ?? []
            ];

            $skills[] = $skill;
            $character->skills = $skills;
            $character->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
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

    public function updateSkill(Request $request, Response $response, array $args): Response
    {
        try {
            $character = Character::find($args['characterId']);

            if (!$character) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Character not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $skills = $character->skills;

            foreach ($skills as &$skill) {
                if ($skill['id'] === $args['skillId']) {
                    $skill = array_merge($skill, $data);
                    break;
                }
            }

            $character->skills = $skills;
            $character->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
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

    public function addItem(Request $request, Response $response, array $args): Response
    {
        try {
            $character = Character::find($args['id']);

            if (!$character) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Character not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $inventory = $character->inventory;

            $item = [
                'id' => Uuid::uuid4()->toString(),
                'name' => $data['name'] ?? '',
                'type' => $data['type'] ?? 'misc',
                'rarity' => $data['rarity'] ?? 'common',
                'value' => $data['value'] ?? 0,
                'weight' => $data['weight'] ?? 0,
                'description' => $data['description'] ?? '',
                'stats' => $data['stats'] ?? [],
                'effects' => $data['effects'] ?? [],
                'quantity' => $data['quantity'] ?? 1,
                'equipped' => false
            ];

            $inventory[] = $item;
            $character->inventory = $inventory;
            $character->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
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

    public function removeItem(Request $request, Response $response, array $args): Response
    {
        try {
            $character = Character::find($args['characterId']);

            if (!$character) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Character not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $inventory = $character->inventory;
            $inventory = array_filter($inventory, fn($item) => $item['id'] !== $args['itemId']);

            $character->inventory = array_values($inventory);
            $character->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
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

    public function equipItem(Request $request, Response $response, array $args): Response
    {
        try {
            $character = Character::find($args['characterId']);

            if (!$character) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Character not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $inventory = $character->inventory;
            $equipment = $character->equipment;

            foreach ($inventory as &$item) {
                if ($item['id'] === $args['itemId']) {
                    $item['equipped'] = true;
                    $equipment[$item['type']] = $item;
                    break;
                }
            }

            $character->inventory = $inventory;
            $character->equipment = $equipment;
            $character->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
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

    public function unequipItem(Request $request, Response $response, array $args): Response
    {
        try {
            $character = Character::find($args['characterId']);

            if (!$character) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Character not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $inventory = $character->inventory;
            $equipment = $character->equipment;

            foreach ($inventory as &$item) {
                if ($item['id'] === $args['itemId']) {
                    $item['equipped'] = false;
                    unset($equipment[$item['type']]);
                    break;
                }
            }

            $character->inventory = $inventory;
            $character->equipment = $equipment;
            $character->save();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
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
            $templates = CharacterTemplate::where('is_public', true)
                ->orWhere('character_id', $request->getQueryParams()['character_id'] ?? null)
                ->get();

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

            $template = CharacterTemplate::create([
                'character_id' => $data['character_id'] ?? null,
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
            $template = CharacterTemplate::find($args['templateId']);

            if (!$template) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Template not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $templateData = $template->template_data;
            $templateData['name'] = $data['name'] ?? $templateData['name'];
            $templateData['id'] = Uuid::uuid4()->toString();

            $character = Character::create($templateData);

            // Increment template usage
            $template->increment('usage_count');

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
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