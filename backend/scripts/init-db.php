<?php

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
    throw new RuntimeException("Composer autoload.php not found for litrpg_studio init script.");
}
require $autoloader;

use Illuminate\Database\Capsule\Manager as Capsule;
use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

function failConfiguration(string $message): never
{
    fwrite(STDERR, "Configuration Error: {$message}\n");
    exit(1);
}

function requireEnv(string $name, bool $allowEmpty = false): string
{
    if (!array_key_exists($name, $_ENV)) {
        failConfiguration("Required environment variable {$name} is not set.");
    }

    $value = $_ENV[$name];
    if (!is_string($value)) {
        failConfiguration("Environment variable {$name} must be a string.");
    }

    if (!$allowEmpty && trim($value) === '') {
        failConfiguration("Required environment variable {$name} is empty.");
    }

    return $allowEmpty ? $value : trim($value);
}

$dbDriver = requireEnv('DB_DRIVER');
$dbHost = requireEnv('DB_HOST');
$dbPort = requireEnv('DB_PORT');
$dbName = requireEnv('DB_DATABASE');
$dbUsername = requireEnv('DB_USERNAME');
$dbPassword = requireEnv('DB_PASSWORD', true);
$dbPrefix = requireEnv('DB_PREFIX', true);

echo "Initializing LitRPG Studio database...\n";

try {
    // For MySQL, create database first using a server-level connection.
    if ($dbDriver === 'mysql') {
        try {
            $bootstrapCapsule = new Capsule;
            $bootstrapCapsule->addConnection([
                'driver'    => $dbDriver,
                'host'      => $dbHost,
                'port'      => $dbPort,
                'database'  => 'information_schema',
                'username'  => $dbUsername,
                'password'  => $dbPassword,
                'charset'   => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
            ]);
            $bootstrapCapsule->setAsGlobal();
            $bootstrapCapsule->bootEloquent();

            Capsule::statement("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            echo "Database '$dbName' created or verified\n";
        } catch (Exception $e) {
            echo "Database creation skipped: " . $e->getMessage() . "\n";
        }
    } else {
        echo "Database auto-create skipped for driver '$dbDriver'\n";
    }

    // Connect to the configured application database.
    $capsule = new Capsule;
    $capsule->addConnection([
        'driver'    => $dbDriver,
        'host'      => $dbHost,
        'port'      => $dbPort,
        'database'  => $dbName,
        'username'  => $dbUsername,
        'password'  => $dbPassword,
        'charset'   => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix'    => $dbPrefix,
    ]);
    $capsule->setAsGlobal();
    $capsule->bootEloquent();

    // Read and execute schema
    $schema = file_get_contents(__DIR__ . '/../database/schema.sql');
    if (!is_string($schema) || trim($schema) === '') {
        throw new RuntimeException('Schema file is missing or empty.');
    }

    // Use PDO directly and run statements one-by-one so reruns can ignore duplicate indexes.
    $connection = Capsule::connection()->getPdo();
    $statements = preg_split('/;\s*(?:\r?\n|$)/', $schema) ?: [];

    echo "Executing full schema...\n";
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if ($statement === '') {
            continue;
        }

        try {
            $connection->exec($statement);
        } catch (\PDOException $e) {
            $message = $e->getMessage();
            $isDuplicateIndex = str_contains($message, '1061 Duplicate key name');
            if ($isDuplicateIndex) {
                continue;
            }

            throw $e;
        }
    }
    echo "Schema executed successfully!\n";

    echo "\nDatabase initialized successfully.\n";

    // Insert sample data
    echo "\nInserting sample data...\n";

    // Sample series
    Capsule::table('series')->updateOrInsert(
        ['id' => 'series-sample-1'],
        [
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
        ]
    );

    // Sample character
    Capsule::table('characters')->updateOrInsert(
        ['id' => 'char-sample-1'],
        [
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
        ]
    );

    // Sample items
    Capsule::table('items')->updateOrInsert(
        ['id' => 'item-iron-sword'],
        [
            'name' => 'Iron Sword',
            'description' => 'A sturdy iron blade, reliable in combat.',
            'type' => 'weapon',
            'sub_type' => 'sword',
            'rarity' => 'common',
            'level' => 5,
            'value' => 50,
            'weight' => 3.5,
            'durability' => json_encode(['current' => 100, 'max' => 100]),
            'stats' => json_encode([
                ['name' => 'Attack', 'value' => 25, 'type' => 'flat'],
                ['name' => 'Critical Rate', 'value' => 5, 'type' => 'percentage']
            ]),
            'effects' => json_encode([]),
            'requirements' => json_encode(['level' => 5]),
            'set_bonus' => null,
            'enchantments' => json_encode(['slots' => 1, 'used' => 0, 'enchants' => []]),
            'stackable' => 0,
            'max_stack' => null,
            'sellable' => 1,
            'tradeable' => 1,
            'icon' => 'sword',
            'image' => null,
            'lore' => 'Forged by the village blacksmith with care and precision.',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]
    );

    Capsule::table('items')->updateOrInsert(
        ['id' => 'item-health-potion'],
        [
            'name' => 'Health Potion',
            'description' => 'Restores 100 HP when consumed.',
            'type' => 'consumable',
            'sub_type' => 'potion',
            'rarity' => 'common',
            'level' => 1,
            'value' => 25,
            'weight' => 0.5,
            'durability' => null,
            'stats' => json_encode([]),
            'effects' => json_encode([
                [
                    'id' => 'heal',
                    'name' => 'Instant Heal',
                    'description' => 'Restores 100 HP immediately',
                    'type' => 'active'
                ]
            ]),
            'requirements' => json_encode([]),
            'set_bonus' => null,
            'enchantments' => json_encode(['slots' => 0, 'used' => 0, 'enchants' => []]),
            'stackable' => 1,
            'max_stack' => 50,
            'sellable' => 1,
            'tradeable' => 1,
            'icon' => 'potion',
            'image' => null,
            'lore' => null,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]
    );

    Capsule::table('items')->updateOrInsert(
        ['id' => 'item-dragonscale-armor'],
        [
            'name' => 'Dragonscale Armor',
            'description' => 'Armor crafted from ancient dragon scales.',
            'type' => 'armor',
            'sub_type' => 'chest',
            'rarity' => 'legendary',
            'level' => 50,
            'value' => 5000,
            'weight' => 15,
            'durability' => json_encode(['current' => 500, 'max' => 500]),
            'stats' => json_encode([
                ['name' => 'Defense', 'value' => 120, 'type' => 'flat'],
                ['name' => 'Fire Resistance', 'value' => 75, 'type' => 'percentage'],
                ['name' => 'Magic Defense', 'value' => 80, 'type' => 'flat']
            ]),
            'effects' => json_encode([
                [
                    'id' => 'dragon-might',
                    'name' => "Dragon's Might",
                    'description' => 'Increases all stats by 10% when health is below 25%',
                    'type' => 'passive'
                ]
            ]),
            'requirements' => json_encode(['level' => 50, 'stats' => ['strength' => 40]]),
            'set_bonus' => json_encode([
                'setName' => 'Dragonslayer Set',
                'pieces' => 5,
                'bonuses' => [
                    '2' => ['Fire immunity for 5 seconds after taking fire damage'],
                    '4' => ['+50% experience from dragon-type enemies'],
                    '5' => ['Grants the ability to breathe fire once per day']
                ]
            ]),
            'enchantments' => json_encode([
                'slots' => 3,
                'used' => 1,
                'enchants' => [
                    ['name' => 'Fortification', 'effect' => '+20 Defense', 'power' => 2]
                ]
            ]),
            'stackable' => 0,
            'max_stack' => null,
            'sellable' => 1,
            'tradeable' => 1,
            'icon' => 'shield',
            'image' => null,
            'lore' => 'Forged from the scales of Pyraxis, the Crimson Terror.',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]
    );

    // Sample research collections
    Capsule::table('research_collections')->updateOrInsert(
        ['id' => 'worldbuilding'],
        [
            'name' => 'World Building',
            'description' => 'Resources for creating fictional worlds',
            'category' => 'worldbuilding',
            'sources' => json_encode(['source-medieval-combat']),
            'tags' => json_encode(['world', 'setting', 'environment']),
            'color' => '#3B82F6',
            'icon' => 'world',
            'visibility' => 'private',
            'collaborators' => json_encode([]),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]
    );

    Capsule::table('research_collections')->updateOrInsert(
        ['id' => 'magic_systems'],
        [
            'name' => 'Magic Systems',
            'description' => 'Research on magical systems and their implementation',
            'category' => 'magic_systems',
            'sources' => json_encode(['source-magic-design']),
            'tags' => json_encode(['magic', 'rules', 'mechanics']),
            'color' => '#8B5CF6',
            'icon' => 'sparkles',
            'visibility' => 'private',
            'collaborators' => json_encode([]),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]
    );

    // Sample research sources
    Capsule::table('research_sources')->updateOrInsert(
        ['id' => 'source-medieval-combat'],
        [
            'title' => 'Medieval Combat Techniques',
            'type' => 'book',
            'content' => json_encode([
                'summary' => 'Comprehensive guide to historical medieval combat techniques and weapons.',
                'keyPoints' => ['Sword fighting techniques', 'Armor types', 'Battle formations'],
                'excerpts' => [],
                'media' => [],
                'structure' => ['headings' => [], 'sections' => [], 'references' => [], 'figures' => [], 'tables' => []],
                'readingTime' => 45,
                'wordCount' => 15000,
                'language' => 'en',
                'quality' => [
                    'credibility' => 9,
                    'accuracy' => 8,
                    'relevance' => 10,
                    'completeness' => 8,
                    'freshness' => 6,
                    'overallScore' => 8.2,
                    'issues' => []
                ]
            ]),
            'metadata' => json_encode([
                'author' => ['John Smith'],
                'publishDate' => '2020-01-15T00:00:00Z',
                'pages' => ['start' => 1, 'end' => 300, 'total' => 300],
                'accessDate' => date('c'),
                'format' => 'PDF'
            ]),
            'annotations' => json_encode([]),
            'links' => json_encode([]),
            'citations' => json_encode([]),
            'attachments' => json_encode([]),
            'tags' => json_encode(['combat', 'medieval', 'weapons']),
            'collections' => json_encode(['worldbuilding']),
            'favorited' => 1,
            'archived' => 0,
            'last_accessed' => date('Y-m-d H:i:s'),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]
    );

    Capsule::table('research_sources')->updateOrInsert(
        ['id' => 'source-magic-design'],
        [
            'title' => 'Magic System Design Principles',
            'type' => 'article',
            'content' => json_encode([
                'summary' => 'Analysis of effective magic system design in fantasy literature.',
                'keyPoints' => ['Consistency rules', 'Cost mechanics', 'Power scaling'],
                'excerpts' => [],
                'media' => [],
                'structure' => ['headings' => [], 'sections' => [], 'references' => [], 'figures' => [], 'tables' => []],
                'readingTime' => 15,
                'wordCount' => 5000,
                'language' => 'en',
                'quality' => [
                    'credibility' => 8,
                    'accuracy' => 9,
                    'relevance' => 10,
                    'completeness' => 7,
                    'freshness' => 9,
                    'overallScore' => 8.6,
                    'issues' => []
                ]
            ]),
            'metadata' => json_encode([
                'author' => ['Jane Doe'],
                'publishDate' => '2023-06-20T00:00:00Z',
                'url' => 'https://example.com/magic-systems',
                'accessDate' => date('c'),
                'format' => 'HTML'
            ]),
            'annotations' => json_encode([]),
            'links' => json_encode([]),
            'citations' => json_encode([]),
            'attachments' => json_encode([]),
            'tags' => json_encode(['magic', 'design', 'fantasy']),
            'collections' => json_encode(['magic_systems']),
            'favorited' => 0,
            'archived' => 0,
            'last_accessed' => date('Y-m-d H:i:s'),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]
    );

    echo "Sample data inserted.\n\n";
    echo "Database setup complete. You can now test the API endpoints.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
