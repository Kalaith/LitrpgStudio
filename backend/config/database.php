<?php

declare(strict_types=1);

use Illuminate\Database\Capsule\Manager as Capsule;

$capsule = new Capsule;

$driver = $_ENV['DB_DRIVER'] ?? 'mysql';

if ($driver === 'mysql') {
    $capsule->addConnection([
        'driver' => 'mysql',
        'host' => $_ENV['DB_HOST'] ?? 'localhost',
        'port' => $_ENV['DB_PORT'] ?? '3306',
        'database' => $_ENV['DB_DATABASE'] ?? 'prompt_gen',
        'username' => $_ENV['DB_USERNAME'] ?? 'root',
        'password' => $_ENV['DB_PASSWORD'] ?? '',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix' => $_ENV['DB_PREFIX'] ?? '',
    ]);
} else {
    $capsule->addConnection([
        'driver' => 'sqlite',
        'database' => $_ENV['DB_DATABASE'] ?? __DIR__ . '/../database/anime_prompt_gen.sqlite',
        'prefix' => $_ENV['DB_PREFIX'] ?? '',
    ]);
}

$capsule->setAsGlobal();
$capsule->bootEloquent();

return $capsule;
