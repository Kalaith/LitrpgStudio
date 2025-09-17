<?php

declare(strict_types=1);

use Slim\App;
use App\Controllers\SeriesController;
use App\Controllers\BookController;
use App\Controllers\CharacterController;
use App\Controllers\StoryController;
use App\Controllers\ChapterController;
use App\Controllers\TimelineController;
use App\Controllers\WorldBuildingController;
use App\Controllers\ConsistencyController;
use App\Controllers\AnalyticsController;
use App\Controllers\ExportController;
use App\Controllers\Auth0Controller;
use App\Middleware\Auth0Middleware;

return function (App $app) {
    // API base path
    $app->group('/api/v1', function ($group) {

        // Series Management
        $group->get('/series', [SeriesController::class, 'getAll']);
        $group->post('/series', [SeriesController::class, 'create']);
        $group->get('/series/{id}', [SeriesController::class, 'getById']);
        $group->put('/series/{id}', [SeriesController::class, 'update']);
        $group->delete('/series/{id}', [SeriesController::class, 'delete']);
        $group->post('/series/{id}/export', [ExportController::class, 'exportSeries']);
        $group->post('/series/import', [SeriesController::class, 'import']);

        // Book Management
        $group->get('/series/{seriesId}/books', [BookController::class, 'getBySeriesId']);
        $group->post('/series/{seriesId}/books', [BookController::class, 'create']);
        $group->get('/books/{id}', [BookController::class, 'getById']);
        $group->put('/books/{id}', [BookController::class, 'update']);
        $group->delete('/books/{id}', [BookController::class, 'delete']);
        $group->put('/series/{seriesId}/books/reorder', [BookController::class, 'reorder']);

        // Character Management
        $group->get('/characters', [CharacterController::class, 'getAll']);
        $group->post('/characters', [CharacterController::class, 'create']);
        $group->get('/characters/{id}', [CharacterController::class, 'getById']);
        $group->put('/characters/{id}', [CharacterController::class, 'update']);
        $group->delete('/characters/{id}', [CharacterController::class, 'delete']);
        $group->post('/characters/{id}/level-up', [CharacterController::class, 'levelUp']);
        $group->post('/characters/{id}/skills', [CharacterController::class, 'addSkill']);
        $group->put('/characters/{characterId}/skills/{skillId}', [CharacterController::class, 'updateSkill']);
        $group->post('/characters/{id}/items', [CharacterController::class, 'addItem']);
        $group->delete('/characters/{characterId}/items/{itemId}', [CharacterController::class, 'removeItem']);
        $group->post('/characters/{characterId}/items/{itemId}/equip', [CharacterController::class, 'equipItem']);
        $group->post('/characters/{characterId}/items/{itemId}/unequip', [CharacterController::class, 'unequipItem']);

        // Series-Character Integration
        $group->post('/series/{seriesId}/characters/{characterId}', [SeriesController::class, 'addCharacterToSeries']);
        $group->delete('/series/{seriesId}/characters/{characterId}', [SeriesController::class, 'removeCharacterFromSeries']);
        $group->post('/series/{seriesId}/characters/{characterId}/appearances', [SeriesController::class, 'addCharacterAppearance']);
        $group->put('/series/{seriesId}/characters/{characterId}/development', [SeriesController::class, 'updateCharacterDevelopment']);

        // Story Management
        $group->get('/stories', [StoryController::class, 'getAll']);
        $group->post('/stories', [StoryController::class, 'create']);
        $group->get('/stories/{id}', [StoryController::class, 'getById']);
        $group->put('/stories/{id}', [StoryController::class, 'update']);
        $group->delete('/stories/{id}', [StoryController::class, 'delete']);
        $group->post('/stories/{id}/events', [StoryController::class, 'addEvent']);

        // Chapter Management
        $group->get('/stories/{storyId}/chapters', [ChapterController::class, 'getByStoryId']);
        $group->post('/stories/{storyId}/chapters', [ChapterController::class, 'create']);
        $group->get('/chapters/{id}', [ChapterController::class, 'getById']);
        $group->put('/chapters/{id}', [ChapterController::class, 'update']);
        $group->delete('/chapters/{id}', [ChapterController::class, 'delete']);
        $group->put('/stories/{storyId}/chapters/reorder', [ChapterController::class, 'reorder']);
        $group->post('/chapters/{id}/progression', [ChapterController::class, 'addCharacterProgression']);

        // Timeline Management
        $group->get('/series/{seriesId}/timeline', [TimelineController::class, 'getTimeline']);
        $group->post('/series/{seriesId}/timeline', [TimelineController::class, 'addEvent']);
        $group->put('/timeline/{eventId}', [TimelineController::class, 'updateEvent']);
        $group->delete('/timeline/{eventId}', [TimelineController::class, 'deleteEvent']);

        // World Building
        $group->get('/series/{seriesId}/world-rules', [WorldBuildingController::class, 'getWorldRules']);
        $group->post('/series/{seriesId}/world-rules', [WorldBuildingController::class, 'addWorldRule']);
        $group->put('/world-rules/{ruleId}', [WorldBuildingController::class, 'updateWorldRule']);
        $group->delete('/world-rules/{ruleId}', [WorldBuildingController::class, 'deleteWorldRule']);

        $group->get('/series/{seriesId}/magic-systems', [WorldBuildingController::class, 'getMagicSystems']);
        $group->post('/series/{seriesId}/magic-systems', [WorldBuildingController::class, 'addMagicSystem']);
        $group->put('/magic-systems/{systemId}', [WorldBuildingController::class, 'updateMagicSystem']);
        $group->delete('/magic-systems/{systemId}', [WorldBuildingController::class, 'deleteMagicSystem']);

        $group->get('/series/{seriesId}/locations', [WorldBuildingController::class, 'getLocations']);
        $group->post('/series/{seriesId}/locations', [WorldBuildingController::class, 'addLocation']);
        $group->put('/locations/{locationId}', [WorldBuildingController::class, 'updateLocation']);
        $group->delete('/locations/{locationId}', [WorldBuildingController::class, 'deleteLocation']);

        $group->get('/series/{seriesId}/factions', [WorldBuildingController::class, 'getFactions']);
        $group->post('/series/{seriesId}/factions', [WorldBuildingController::class, 'addFaction']);
        $group->put('/factions/{factionId}', [WorldBuildingController::class, 'updateFaction']);
        $group->delete('/factions/{factionId}', [WorldBuildingController::class, 'deleteFaction']);

        $group->get('/series/{seriesId}/terminology', [WorldBuildingController::class, 'getTerminology']);
        $group->post('/series/{seriesId}/terminology', [WorldBuildingController::class, 'addTerm']);
        $group->put('/terminology/{termId}', [WorldBuildingController::class, 'updateTerm']);
        $group->delete('/terminology/{termId}', [WorldBuildingController::class, 'deleteTerm']);

        // Consistency Checking
        $group->get('/series/{seriesId}/consistency-check', [ConsistencyController::class, 'checkConsistency']);
        $group->get('/series/{seriesId}/characters/{characterId}/progression-validation', [ConsistencyController::class, 'validateCharacterProgression']);

        // Analytics
        $group->get('/series/{seriesId}/analytics', [AnalyticsController::class, 'getSeriesAnalytics']);
        $group->post('/series/{seriesId}/analytics/generate', [AnalyticsController::class, 'generateAnalytics']);

        // Plot Threads and Character Arcs
        $group->get('/books/{bookId}/plot-threads', [BookController::class, 'getPlotThreads']);
        $group->post('/books/{bookId}/plot-threads', [BookController::class, 'addPlotThread']);
        $group->put('/plot-threads/{threadId}', [BookController::class, 'updatePlotThread']);
        $group->delete('/plot-threads/{threadId}', [BookController::class, 'deletePlotThread']);

        $group->get('/books/{bookId}/character-arcs', [BookController::class, 'getCharacterArcs']);
        $group->post('/books/{bookId}/character-arcs', [BookController::class, 'addCharacterArc']);
        $group->put('/character-arcs/{arcId}', [BookController::class, 'updateCharacterArc']);
        $group->delete('/character-arcs/{arcId}', [BookController::class, 'deleteCharacterArc']);

        // Writing Sessions
        $group->post('/writing-sessions/start', [StoryController::class, 'startWritingSession']);
        $group->post('/writing-sessions/end', [StoryController::class, 'endWritingSession']);
        $group->put('/writing-sessions/progress', [StoryController::class, 'updateSessionProgress']);

        // Templates
        $group->get('/templates/characters', [CharacterController::class, 'getTemplates']);
        $group->post('/templates/characters', [CharacterController::class, 'saveAsTemplate']);
        $group->post('/templates/characters/{templateId}/create', [CharacterController::class, 'createFromTemplate']);

        $group->get('/templates/stories', [StoryController::class, 'getTemplates']);
        $group->post('/templates/stories', [StoryController::class, 'saveAsTemplate']);
        $group->post('/templates/stories/{templateId}/create', [StoryController::class, 'createFromTemplate']);

        // Health check
        $group->get('/health', function ($request, $response) {
            $response->getBody()->write(json_encode([
                'status' => 'healthy',
                'service' => 'LitRPG Studio API',
                'version' => $_ENV['API_VERSION'] ?? 'v1',
                'timestamp' => date('c')
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        });

        // Database initialization endpoint
        $group->post('/init-database', function ($request, $response) {
            try {
                // Execute the init-db.php script
                ob_start();
                $result = include __DIR__ . '/../scripts/init-db.php';
                $output = ob_get_clean();

                $response->getBody()->write(json_encode([
                    'success' => true,
                    'message' => 'Database initialized successfully',
                    'output' => $output
                ]));
                return $response->withHeader('Content-Type', 'application/json');
            } catch (Exception $e) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
            }
        });
    });

    // Health check (direct access)
    $app->get('/health', function ($request, $response) {
        $response->getBody()->write(json_encode([
            'status' => 'healthy',
            'service' => 'LitRPG Studio API',
            'version' => $_ENV['API_VERSION'] ?? 'v1',
            'timestamp' => date('c')
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    });
};
