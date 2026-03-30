<?php
declare(strict_types=1);

$autoloadCandidates = [
    __DIR__ . '/../../../../vendor/autoload.php',
    __DIR__ . '/../vendor/autoload.php',
];
foreach ($autoloadCandidates as $candidate) {
    if (file_exists($candidate)) { require $candidate; break; }
}

use Dotenv\Dotenv;
use Illuminate\Database\Capsule\Manager as Capsule;

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$capsule = new Capsule;
$capsule->addConnection([
    'driver'   => $_ENV['DB_DRIVER'] ?? 'mysql',
    'host'     => $_ENV['DB_HOST'] ?? '127.0.0.1',
    'port'     => $_ENV['DB_PORT'] ?? '3306',
    'database' => $_ENV['DB_DATABASE'] ?? '',
    'username' => $_ENV['DB_USERNAME'] ?? '',
    'password' => $_ENV['DB_PASSWORD'] ?? '',
    'charset'  => 'utf8mb4',
]);
$capsule->setAsGlobal();
$capsule->bootEloquent();

// Show users table if it exists locally
try {
    $users = Capsule::table('users')->select('id','email','username','created_at')->get();
    echo "=== users table ===\n";
    foreach ($users as $u) {
        echo " id={$u->id}  email={$u->email}  username={$u->username}\n";
    }
} catch (\Exception $e) {
    echo "No local users table: " . $e->getMessage() . "\n";
}

// Show who owns series right now (any non-empty owner)
$owners = Capsule::table('series')
    ->select('owner_user_id', Capsule::raw('COUNT(*) as cnt'))
    ->groupBy('owner_user_id')
    ->get();
echo "\n=== series owner_user_id distribution ===\n";
foreach ($owners as $o) {
    $id = $o->owner_user_id === '' || $o->owner_user_id === null ? '(empty/null)' : $o->owner_user_id;
    echo " owner_user_id={$id}  count={$o->cnt}\n";
}
