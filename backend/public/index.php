<?php
// LitRPG Studio Backend - Based on WebHatchery standards

declare(strict_types=1);

function failConfiguration(string $message): never
{
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Configuration Error',
        'message' => $message,
    ]);
    exit;
}

function requireEnv(string $name): string
{
    $value = $_ENV[$name] ?? null;
    if (!is_string($value) || trim($value) === '') {
        failConfiguration("Required environment variable {$name} is not set.");
    }

    return trim($value);
}

function buildLocalAppClassMap(string $srcPath): array
{
    $classMap = [];
    $iterator = new \RecursiveIteratorIterator(
        new \RecursiveDirectoryIterator($srcPath, \FilesystemIterator::SKIP_DOTS)
    );

    foreach ($iterator as $file) {
        /** @var \SplFileInfo $file */
        if ($file->getExtension() !== 'php') {
            continue;
        }

        $fullPath = $file->getPathname();
        $relativePath = substr($fullPath, strlen($srcPath) + 1);
        $className = 'App\\' . str_replace([DIRECTORY_SEPARATOR, '.php'], ['\\', ''], $relativePath);
        $classMap[$className] = $fullPath;
    }

    return $classMap;
}

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
    failConfiguration('Composer autoload.php not found for litrpg_studio backend.');
}
$loader = require $autoloader;
$globalAutoload = __DIR__ . '/../../../vendor/autoload.php';
$projectSrc = realpath(__DIR__ . '/../src') ?: (__DIR__ . '/../src');
if (is_object($loader)) {
    if (method_exists($loader, 'addPsr4')) {
        // Ensure local App\ classes are preferred over any global mapping.
        $loader->addPsr4('App\\', rtrim($projectSrc, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR, true);
    }

    if ($autoloader === $globalAutoload && method_exists($loader, 'addClassMap')) {
        // Override stale global classmap entries for App\ classes.
        $loader->addClassMap(buildLocalAppClassMap($projectSrc));
    }
}

use Slim\Factory\AppFactory;
use DI\Container;
use Dotenv\Dotenv;
use Illuminate\Database\Capsule\Manager as Capsule;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Validate required environment variables
$requiredEnvVars = [
    'DB_DRIVER',
    'DB_HOST',
    'DB_DATABASE',
    'DB_USERNAME',
    'API_VERSION',
    'API_BASE_PATH',
    'APP_DEBUG',
    'CORS_ALLOWED_ORIGINS',
    'CORS_ALLOWED_METHODS',
    'CORS_ALLOWED_HEADERS',
];
foreach ($requiredEnvVars as $var) {
    requireEnv($var);
}

$apiVersion = requireEnv('API_VERSION');
$apiBasePath = requireEnv('API_BASE_PATH');
$appDebug = requireEnv('APP_DEBUG') === 'true';
$corsAllowedOriginsRaw = requireEnv('CORS_ALLOWED_ORIGINS');
$corsAllowedMethods = requireEnv('CORS_ALLOWED_METHODS');
$corsAllowedHeaders = requireEnv('CORS_ALLOWED_HEADERS');
$allowedOrigins = array_values(array_filter(array_map('trim', explode(',', $corsAllowedOriginsRaw))));
if (count($allowedOrigins) === 0) {
    failConfiguration('CORS_ALLOWED_ORIGINS must contain at least one origin.');
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

$container->set(\App\Controllers\AppStateController::class, function() use ($container) {
    return new \App\Controllers\AppStateController();
});

$container->set(\App\Controllers\ItemController::class, function() use ($container) {
    return new \App\Controllers\ItemController();
});

$container->set(\App\Controllers\ResearchController::class, function() use ($container) {
    return new \App\Controllers\ResearchController();
});

AppFactory::setContainer($container);
$app = AppFactory::create();

if ($apiBasePath === '/') {
    $app->setBasePath('');
} else {
    $app->setBasePath(rtrim($apiBasePath, '/'));
}

// CORS Middleware
$app->add(function ($request, $handler) use ($allowedOrigins, $corsAllowedHeaders, $corsAllowedMethods) {
    $requestOrigin = trim($request->getHeaderLine('Origin'));
    if ($requestOrigin !== '' && !in_array($requestOrigin, $allowedOrigins, true)) {
        $response = new \Slim\Psr7\Response(403);
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => 'CORS Error',
            'message' => 'Origin is not allowed.',
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    $response = $handler->handle($request);

    if ($requestOrigin === '') {
        return $response;
    }

    return $response
        ->withHeader('Access-Control-Allow-Origin', $requestOrigin)
        ->withHeader('Access-Control-Allow-Headers', $corsAllowedHeaders)
        ->withHeader('Access-Control-Allow-Methods', $corsAllowedMethods)
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
    $appDebug,
    true,
    true
);

// Load routes
(require __DIR__ . '/../config/routes.php')($app);

$app->run();
