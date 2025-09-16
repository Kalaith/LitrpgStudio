<?php

declare(strict_types=1);

namespace LitRPGStudio\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use LitRPGStudio\External\CharacterRepository;
use LitRPGStudio\Actions\Character\CreateCharacterAction;
use LitRPGStudio\Actions\Character\LevelUpCharacterAction;
use LitRPGStudio\Actions\Character\AddSkillToCharacterAction;
use LitRPGStudio\Actions\Character\AddItemToCharacterAction;
use LitRPGStudio\Actions\Character\ManageCharacterEquipmentAction;

final class CharacterController
{
    public function __construct(
        private readonly CharacterRepository $characterRepository,
        private readonly CreateCharacterAction $createCharacterAction,
        private readonly LevelUpCharacterAction $levelUpCharacterAction,
        private readonly AddSkillToCharacterAction $addSkillAction,
        private readonly AddItemToCharacterAction $addItemAction,
        private readonly ManageCharacterEquipmentAction $manageEquipmentAction
    ) {}

    public function getAll(Request $request, Response $response): Response
    {
        try {
            $characters = $this->characterRepository->findAll();

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
            $character = $this->characterRepository->findWithRelations($args['id']);

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
            $character = $this->createCharacterAction->execute($data);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
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
            $character = $this->characterRepository->updateFromArray($args['id'], $data);

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

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $success = $this->characterRepository->delete($args['id']);

            if (!$success) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Character not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

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
            $character = $this->levelUpCharacterAction->execute($args['id']);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
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
            $data = $request->getParsedBody();
            $character = $this->addSkillAction->execute($args['id'], $data);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
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
            $character = $this->characterRepository->findById($args['characterId']);

            if (!$character) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Character not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = $request->getParsedBody();
            $skills = $character->skills ?? [];

            foreach ($skills as &$skill) {
                if ($skill['id'] === $args['skillId']) {
                    $skill = array_merge($skill, $data);
                    break;
                }
            }

            $character->skills = $skills;
            $character = $this->characterRepository->update($character);

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
            $data = $request->getParsedBody();
            $character = $this->addItemAction->execute($args['id'], $data);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
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
            $character = $this->manageEquipmentAction->removeItem($args['characterId'], $args['itemId']);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
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
            $character = $this->manageEquipmentAction->equipItem($args['characterId'], $args['itemId']);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
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
            $character = $this->manageEquipmentAction->unequipItem($args['characterId'], $args['itemId']);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $character
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
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
            $templates = $this->characterRepository->findTemplates(
                $request->getQueryParams()['character_id'] ?? null
            );

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
            $template = $this->characterRepository->createTemplate($data);

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
            $data = $request->getParsedBody();
            $character = $this->characterRepository->createFromTemplate($args['templateId'], $data['name'] ?? '');

            if (!$character) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Template not found'
                ]));

                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

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