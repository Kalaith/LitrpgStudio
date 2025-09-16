<?php
// LitRPG Studio Backend - Based on WebHatchery standards
require __DIR__ . '/../vendor/autoload.php';

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

// Error Middleware
$errorMiddleware = $app->addErrorMiddleware(
    $_ENV['APP_DEBUG'] === 'true',
    true,
    true
);

// Load routes
(require __DIR__ . '/../config/routes.php')($app);

$app->run();