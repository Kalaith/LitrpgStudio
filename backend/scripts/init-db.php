<?php

require __DIR__ . '/../vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;
use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Initialize database connection
$capsule = new Capsule;
$capsule->addConnection([
    'driver'    => $_ENV['DB_DRIVER'] ?? 'mysql',
    'host'      => $_ENV['DB_HOST'] ?? 'localhost',
    'port'      => $_ENV['DB_PORT'] ?? 3306,
    'database'  => $_ENV['DB_DATABASE'] ?? 'litrpg_studio',
    'username'  => $_ENV['DB_USERNAME'] ?? 'root',
    'password'  => $_ENV['DB_PASSWORD'] ?? '',
    'charset'   => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix'    => $_ENV['DB_PREFIX'] ?? '',
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();

echo "Initializing LitRPG Studio database...\n";

try {
    // First, try to create the database if it doesn't exist
    try {
        $tempCapsule = new Capsule;
        $tempCapsule->addConnection([
            'driver'    => $_ENV['DB_DRIVER'] ?? 'mysql',
            'host'      => $_ENV['DB_HOST'] ?? 'localhost',
            'port'      => $_ENV['DB_PORT'] ?? 3306,
            'username'  => $_ENV['DB_USERNAME'] ?? 'root',
            'password'  => $_ENV['DB_PASSWORD'] ?? '',
            'charset'   => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ]);
        $tempCapsule->setAsGlobal();
        $tempCapsule->bootEloquent();

        $dbName = $_ENV['DB_DATABASE'] ?? 'litrpg_studio';
        Capsule::statement("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        echo "✓ Database '$dbName' created or verified\n";
    } catch (Exception $e) {
        echo "⚠ Database creation skipped: " . $e->getMessage() . "\n";
    }

    // Reconnect to the specific database
    $capsule = new Capsule;
    $capsule->addConnection([
        'driver'    => $_ENV['DB_DRIVER'] ?? 'mysql',
        'host'      => $_ENV['DB_HOST'] ?? 'localhost',
        'port'      => $_ENV['DB_PORT'] ?? 3306,
        'database'  => $_ENV['DB_DATABASE'] ?? 'litrpg_studio',
        'username'  => $_ENV['DB_USERNAME'] ?? 'root',
        'password'  => $_ENV['DB_PASSWORD'] ?? '',
        'charset'   => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix'    => $_ENV['DB_PREFIX'] ?? '',
    ]);
    $capsule->setAsGlobal();
    $capsule->bootEloquent();

    // Read and execute schema
    $schema = file_get_contents(__DIR__ . '/../database/schema.sql');

    // Use PDO directly to handle the multi-statement execution
    $connection = Capsule::connection()->getPdo();

    echo "✓ Executing full schema...\n";
    $connection->exec($schema);
    echo "✓ Schema executed successfully!\n";

    echo "\n✅ Database initialized successfully!\n";

    // Insert sample data
    echo "\nInserting sample data...\n";

    // Sample series
    Capsule::table('series')->insert([
        'id' => 'series-sample-1',
        'title' => 'The Digital Realms',
        'description' => 'A LitRPG adventure in virtual worlds',
        'genre' => 'LitRPG',
        'tags' => json_encode(['fantasy', 'virtual reality', 'adventure']),
        'status' => 'active',
        'target_books' => 5,
        'author_notes' => 'Main series focusing on character progression',
        'shared_elements' => json_encode([
            'characters' => [],
            'worldBuilding' => [
                'timeline' => [],
                'worldRules' => [],
                'cultures' => [],
                'languages' => [],
                'religions' => [],
                'economics' => []
            ],
            'magicSystems' => [],
            'locations' => [],
            'factions' => [],
            'terminology' => []
        ]),
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s')
    ]);

    // Sample character
    Capsule::table('characters')->insert([
        'id' => 'char-sample-1',
        'series_id' => 'series-sample-1',
        'name' => 'Zara Nightblade',
        'race' => 'Elf',
        'class' => 'Rogue',
        'background' => 'Former thief turned adventurer',
        'personality' => 'Quick-witted, cautious, loyal to friends',
        'appearance' => 'Tall elf with silver hair and green eyes',
        'stats' => json_encode([
            'level' => 15,
            'experience' => 125000,
            'strength' => 14,
            'dexterity' => 20,
            'constitution' => 16,
            'intelligence' => 18,
            'wisdom' => 15,
            'charisma' => 17,
            'hitPoints' => 185,
            'manaPoints' => 140
        ]),
        'skills' => json_encode([
            [
                'id' => 'stealth-mastery',
                'name' => 'Stealth Mastery',
                'level' => 8,
                'experience' => 45000,
                'description' => 'Advanced stealth techniques',
                'type' => 'skill',
                'requirements' => ['Stealth 5', 'Dexterity 18']
            ],
            [
                'id' => 'dual-wielding',
                'name' => 'Dual Wielding',
                'level' => 6,
                'experience' => 28000,
                'description' => 'Fighting with two weapons',
                'type' => 'combat',
                'requirements' => ['Dexterity 16']
            ]
        ]),
        'inventory' => json_encode([]),
        'equipment' => json_encode([]),
        'status_effects' => json_encode([]),
        'level_progression' => json_encode([]),
        'relationships' => json_encode([]),
        'story_references' => json_encode([]),
        'cross_references' => json_encode([]),
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s')
    ]);

    echo "✅ Sample data inserted!\n\n";
    echo "🎉 Database setup complete! You can now test the API endpoints.\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}