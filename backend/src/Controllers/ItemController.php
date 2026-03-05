<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\Item;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Ramsey\Uuid\Uuid;

class ItemController
{
    public function getAll(Request $request, Response $response): Response
    {
        try {
            $items = Item::orderBy('updated_at', 'desc')->get();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $items,
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage(), 500);
        }
    }

    public function getById(Request $request, Response $response, array $args): Response
    {
        try {
            $item = Item::find($args['id']);
            if (!$item) {
                return $this->errorResponse($response, 'Item not found', 404);
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $item,
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage(), 500);
        }
    }

    public function create(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            if (!is_array($data)) {
                return $this->errorResponse($response, 'Invalid request payload', 400);
            }

            $item = Item::create($this->buildItemPayload($data));

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $item,
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage(), 500);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $item = Item::find($args['id']);
            if (!$item) {
                return $this->errorResponse($response, 'Item not found', 404);
            }

            $data = $request->getParsedBody();
            if (!is_array($data)) {
                return $this->errorResponse($response, 'Invalid request payload', 400);
            }

            $updates = $this->buildItemPayload($data, false);
            unset($updates['id']);
            $item->update($updates);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $item->fresh(),
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage(), 500);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $item = Item::find($args['id']);
            if (!$item) {
                return $this->errorResponse($response, 'Item not found', 404);
            }

            $item->delete();

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Item deleted successfully',
            ]));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage(), 500);
        }
    }

    private function buildItemPayload(array $data, bool $includeDefaults = true): array
    {
        $payload = [
            'name' => $data['name'] ?? '',
            'description' => $data['description'] ?? '',
            'type' => $data['type'] ?? 'weapon',
            'sub_type' => $data['sub_type'] ?? ($data['subType'] ?? 'sword'),
            'rarity' => $data['rarity'] ?? 'common',
            'level' => (int) ($data['level'] ?? 1),
            'value' => (int) ($data['value'] ?? 0),
            'weight' => isset($data['weight']) ? (float) $data['weight'] : null,
            'durability' => $data['durability'] ?? null,
            'stats' => $data['stats'] ?? [],
            'effects' => $data['effects'] ?? [],
            'requirements' => $data['requirements'] ?? [],
            'set_bonus' => $data['set_bonus'] ?? ($data['setBonus'] ?? null),
            'enchantments' => $data['enchantments'] ?? [
                'slots' => 0,
                'used' => 0,
                'enchants' => [],
            ],
            'stackable' => (bool) ($data['stackable'] ?? false),
            'max_stack' => isset($data['max_stack'])
                ? (int) $data['max_stack']
                : (isset($data['maxStack']) ? (int) $data['maxStack'] : null),
            'sellable' => (bool) ($data['sellable'] ?? true),
            'tradeable' => (bool) ($data['tradeable'] ?? true),
            'icon' => $data['icon'] ?? null,
            'image' => $data['image'] ?? null,
            'lore' => $data['lore'] ?? null,
        ];

        if ($includeDefaults) {
            $payload['id'] = (string) ($data['id'] ?? Uuid::uuid4()->toString());
        } elseif (isset($data['id'])) {
            $payload['id'] = (string) $data['id'];
        }

        return $payload;
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
