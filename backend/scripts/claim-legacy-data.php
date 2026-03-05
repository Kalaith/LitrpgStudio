<?php

declare(strict_types=1);

$autoloadCandidates = [
    __DIR__ . '/../../../../vendor/autoload.php',
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
    fwrite(STDERR, "Composer autoload.php not found.\n");
    exit(1);
}
require $autoloader;

use Dotenv\Dotenv;
use Illuminate\Database\Capsule\Manager as Capsule;

if ($argc < 2) {
    fwrite(STDERR, "Usage: php claim-legacy-data.php <owner_user_id>\n");
    exit(1);
}

$ownerUserId = trim((string) $argv[1]);
if ($ownerUserId === '') {
    fwrite(STDERR, "owner_user_id must be non-empty.\n");
    exit(1);
}

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$capsule = new Capsule;
$capsule->addConnection([
    'driver'    => $_ENV['DB_DRIVER'] ?? 'mysql',
    'host'      => $_ENV['DB_HOST'] ?? '127.0.0.1',
    'port'      => $_ENV['DB_PORT'] ?? '3306',
    'database'  => $_ENV['DB_DATABASE'] ?? '',
    'username'  => $_ENV['DB_USERNAME'] ?? '',
    'password'  => $_ENV['DB_PASSWORD'] ?? '',
    'charset'   => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix'    => $_ENV['DB_PREFIX'] ?? '',
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();

$tables = [
    'series',
    'books',
    'stories',
    'chapters',
    'characters',
    'character_templates',
    'story_templates',
];

echo "Claiming legacy rows for owner_user_id={$ownerUserId}\n";

foreach ($tables as $table) {
    $updated = Capsule::table($table)
        ->where(static function ($query): void {
            $query->whereNull('owner_user_id')->orWhere('owner_user_id', '');
        })
        ->update(['owner_user_id' => $ownerUserId]);

    echo sprintf(" - %s: %d row(s) claimed\n", $table, $updated);
}

echo "Done.\n";

