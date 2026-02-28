<?php
// LitRPG Studio Backend - Based on WebHatchery standards
$autoloadCandidates = [
    __DIR__ . '/../../../vendor/autoload.php',
    __DIR__ . '/../vendor/autoload.php',
];
$autoloader = null;
foreach ($autoloadCandidates as $candidate) {
    if (file_exists($candidate)) {
        $autoloader = $candidate;
        break;
    }
}
if (!$autoloader) {
    throw new RuntimeException("Composer autoload.php not found for litrpg_studio backend.");
}
$loader = require $autoloader;
if (is_object($loader) && method_exists($loader, 'addPsr4')) {
    $loader->addPsr4('App\\', __DIR__ . '/../src/');
}

use Slim\Factory\AppFactory;
use DI\Container;
use Dotenv\Dotenv;
use Illuminate\Database\Capsule\Manager as Capsule;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Validate required environment variables
$requiredEnvVars = ['DB_DRIVER', 'DB_HOST', 'DB_DATABASE', 'DB_USERNAME'];
foreach ($requiredEnvVars as $var) {
    if (!isset($_ENV[$var]) || empty($_ENV[$var])) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => "Configuration Error: Required environment variable {$var} is not set"
        ]);
        exit;
    }
}

// Initialize database connection
$capsule = new Capsule;
$capsule->addConnection([
    'driver'    => $_ENV['DB_DRIVER'],
    'host'      => $_ENV['DB_HOST'],
    'database'  => $_ENV['DB_DATABASE'],
    'username'  => $_ENV['DB_USERNAME'],
    'password'  => $_ENV['DB_PASSWORD'] ?? '',
    'charset'   => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix'    => $_ENV['DB_PREFIX'] ?? '',
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();

// Container setup
$container = new Container();

// Register Repositories
$container->set(\App\External\CharacterRepository::class, function() {
    return new \App\External\CharacterRepository();
});

$container->set(\App\External\BookRepository::class, function() {
    return new \App\External\BookRepository();
});

$container->set(\App\External\StoryRepository::class, function() {
    return new \App\External\StoryRepository();
});

$container->set(\App\External\ChapterRepository::class, function() {
    return new \App\External\ChapterRepository();
});

$container->set(\App\External\SeriesRepository::class, function() {
    return new \App\External\SeriesRepository();
});

// Register Character Actions
$container->set(\App\Actions\Character\CreateCharacterAction::class, function() use ($container) {
    return new \App\Actions\Character\CreateCharacterAction(
        $container->get(\App\External\CharacterRepository::class)
    );
});

$container->set(\App\Actions\Character\UpdateCharacterAction::class, function() use ($container) {
    return new \App\Actions\Character\UpdateCharacterAction(
        $container->get(\App\External\CharacterRepository::class)
    );
});

$container->set(\App\Actions\Character\LevelUpCharacterAction::class, function() use ($container) {
    return new \App\Actions\Character\LevelUpCharacterAction(
        $container->get(\App\External\CharacterRepository::class)
    );
});

$container->set(\App\Actions\Character\AddSkillToCharacterAction::class, function() use ($container) {
    return new \App\Actions\Character\AddSkillToCharacterAction(
        $container->get(\App\External\CharacterRepository::class)
    );
});

$container->set(\App\Actions\Character\UpdateCharacterSkillAction::class, function() use ($container) {
    return new \App\Actions\Character\UpdateCharacterSkillAction(
        $container->get(\App\External\CharacterRepository::class)
    );
});

$container->set(\App\Actions\Character\AddItemToCharacterAction::class, function() use ($container) {
    return new \App\Actions\Character\AddItemToCharacterAction(
        $container->get(\App\External\CharacterRepository::class)
    );
});

$container->set(\App\Actions\Character\ManageCharacterEquipmentAction::class, function() use ($container) {
    return new \App\Actions\Character\ManageCharacterEquipmentAction(
        $container->get(\App\External\CharacterRepository::class)
    );
});

// Register Controllers
$container->set(\App\Controllers\SeriesController::class, function() use ($container) {
    return new \App\Controllers\SeriesController(
        $container->get(\App\External\SeriesRepository::class)
    );
});

$container->set(\App\Controllers\BookController::class, function() use ($container) {
    return new \App\Controllers\BookController();
});

$container->set(\App\Controllers\CharacterController::class, function() use ($container) {
    return new \App\Controllers\CharacterController(
        $container->get(\App\External\CharacterRepository::class),
        $container->get(\App\Actions\Character\CreateCharacterAction::class),
        $container->get(\App\Actions\Character\UpdateCharacterAction::class),
        $container->get(\App\Actions\Character\LevelUpCharacterAction::class),
        $container->get(\App\Actions\Character\AddSkillToCharacterAction::class),
        $container->get(\App\Actions\Character\UpdateCharacterSkillAction::class),
        $container->get(\App\Actions\Character\AddItemToCharacterAction::class),
        $container->get(\App\Actions\Character\ManageCharacterEquipmentAction::class)
    );
});

$container->set(\App\Controllers\StoryController::class, function() use ($container) {
    return new \App\Controllers\StoryController();
});

$container->set(\App\Controllers\ChapterController::class, function() use ($container) {
    return new \App\Controllers\ChapterController();
});

$container->set(\App\Controllers\TimelineController::class, function() use ($container) {
    return new \App\Controllers\TimelineController();
});

$container->set(\App\Controllers\WorldBuildingController::class, function() use ($container) {
    return new \App\Controllers\WorldBuildingController();
});

$container->set(\App\Controllers\ConsistencyController::class, function() use ($container) {
    return new \App\Controllers\ConsistencyController();
});

$container->set(\App\Controllers\AnalyticsController::class, function() use ($container) {
    return new \App\Controllers\AnalyticsController();
});

$container->set(\App\Controllers\ExportController::class, function() use ($container) {
    return new \App\Controllers\ExportController();
});

AppFactory::setContainer($container);
$app = AppFactory::create();

// CORS Middleware
$app->add(function ($request, $handler) {
    $response = $handler->handle($request);
    $allowedOrigins = $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:5173,http://localhost:3000';
    $origins = explode(',', $allowedOrigins);
    $requestOrigin = $request->getHeaderLine('Origin');

    $allowOrigin = '*';
    if ($requestOrigin && in_array($requestOrigin, $origins)) {
        $allowOrigin = $requestOrigin;
    }

    return $response
        ->withHeader('Access-Control-Allow-Origin', $allowOrigin)
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Origin, Authorization, X-Requested-With')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->withHeader('Access-Control-Allow-Credentials', 'true');
});

// Handle preflight requests
$app->options('/{routes:.+}', function ($request, $response) {
    return $response;
});

// Other Middleware
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();
$app->add(new \App\Middleware\JwtAuthMiddleware());

// Error Middleware
$errorMiddleware = $app->addErrorMiddleware(
    $_ENV['APP_DEBUG'] === 'true',
    true,
    true
);

// Load routes
(require __DIR__ . '/../config/routes.php')($app);

$app->run();
