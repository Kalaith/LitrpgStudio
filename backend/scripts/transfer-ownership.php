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

if ($argc < 3) {
    fwrite(STDERR, "Usage: php transfer-ownership.php <from_user_id|-> <to_user_id> [--include-unowned]\n");
    fwrite(STDERR, "Use '-' for from_user_id to transfer only unowned rows (requires --include-unowned).\n");
    exit(1);
}

$fromUserIdRaw = trim((string) $argv[1]);
$toUserId = trim((string) $argv[2]);
$includeUnowned = in_array('--include-unowned', $argv, true);
$fromUserId = $fromUserIdRaw === '-' ? '' : $fromUserIdRaw;

if ($toUserId === '') {
    fwrite(STDERR, "to_user_id must be non-empty.\n");
    exit(1);
}

if ($fromUserId === '' && !$includeUnowned) {
    fwrite(STDERR, "Provide from_user_id or pass --include-unowned.\n");
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

if ($fromUserId !== '' && str_starts_with($fromUserId, 'guest_')) {
    fwrite(STDERR, "Blocked: guest source transfer is not allowed in this script. Use /api/v1/auth/link-guest.\n");
    exit(1);
}

$tables = [
    'series',
    'books',
    'stories',
    'chapters',
    'characters',
    'character_templates',
    'story_templates',
];

echo "Transferring ownership\n";
echo " - from_user_id: " . ($fromUserId !== '' ? $fromUserId : '(none)') . "\n";
echo " - to_user_id: {$toUserId}\n";
echo " - include_unowned: " . ($includeUnowned ? 'true' : 'false') . "\n";

$totalMoved = 0;
foreach ($tables as $table) {
    $query = Capsule::table($table)->where(static function ($builder) use ($fromUserId, $includeUnowned): void {
        if ($fromUserId !== '') {
            $builder->where('owner_user_id', $fromUserId);
        }

        if ($includeUnowned) {
            if ($fromUserId !== '') {
                $builder->orWhereNull('owner_user_id')->orWhere('owner_user_id', '');
            } else {
                $builder->whereNull('owner_user_id')->orWhere('owner_user_id', '');
            }
        }
    });

    $moved = $query->update(['owner_user_id' => $toUserId]);
    $totalMoved += $moved;
    echo sprintf(" - %s: %d row(s) moved\n", $table, $moved);
}

echo "Done. Total moved rows: {$totalMoved}\n";
