<?php

declare(strict_types=1);

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class WorldBuildingController
{
    public function getWorldRules(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function addWorldRule(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function updateWorldRule(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function deleteWorldRule(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getMagicSystems(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function addMagicSystem(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function updateMagicSystem(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function deleteMagicSystem(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getLocations(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function addLocation(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function updateLocation(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function deleteLocation(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getFactions(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function addFaction(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function updateFaction(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function deleteFaction(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getTerminology(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function addTerm(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function updateTerm(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => [],
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function deleteTerm(Request $request, Response $response, array $args): Response
    {
        $response->getBody()->write(json_encode([
            'success' => true,
            'message' => 'World building endpoints coming soon'
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }
}