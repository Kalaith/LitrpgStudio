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
    throw new RuntimeException("Composer autoload.php not found for litrpg_studio migration script.");
}
$loader = require $autoloader;
if (is_object($loader) && method_exists($loader, 'addPsr4')) {
    $loader->addPsr4('App\\', __DIR__ . '/../src/');
}

use Illuminate\Database\Capsule\Manager as Capsule;
use Dotenv\Dotenv;
use App\Models\Series;
use App\Models\Character;
use App\Models\Book;
use App\Models\Story;
use App\Models\Chapter;

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

echo "Starting JSON to Database migration...\n";

function migrateJsonFile($filename, $modelClass) {
    $filePath = __DIR__ . '/../storage/' . $filename;

    if (!file_exists($filePath)) {
        echo "⚠ File not found: $filename\n";
        return;
    }

    $data = json_decode(file_get_contents($filePath), true);

    if (!$data) {
        echo "⚠ No data found in: $filename\n";
        return;
    }

    $migrated = 0;
    $skipped = 0;

    foreach ($data as $item) {
        try {
            // Check if item already exists in database
            $existing = $modelClass::find($item['id'] ?? null);

            if ($existing) {
                echo "⏭ Skipping existing {$modelClass}: {$item['id']}\n";
                $skipped++;
                continue;
            }

            // Create new record
            $modelClass::create($item);
            $title = $item['title'] ?? ($item['name'] ?? 'No title');
            echo "✓ Migrated {$modelClass}: {$item['id']} - {$title}\n";
            $migrated++;

        } catch (Exception $e) {
            echo "❌ Error migrating {$modelClass} {$item['id']}: " . $e->getMessage() . "\n";
        }
    }

    echo "📊 {$modelClass} Migration Summary: {$migrated} migrated, {$skipped} skipped\n\n";
}

try {
    // Migrate Series
    echo "🔄 Migrating Series...\n";
    migrateJsonFile('series.json', Series::class);

    // Migrate Characters
    echo "🔄 Migrating Characters...\n";
    migrateJsonFile('characters.json', Character::class);

    // Migrate Books
    echo "🔄 Migrating Books...\n";
    migrateJsonFile('books.json', Book::class);

    // Migrate Stories
    echo "🔄 Migrating Stories...\n";
    migrateJsonFile('stories.json', Story::class);

    // Migrate Chapters
    echo "🔄 Migrating Chapters...\n";
    migrateJsonFile('chapters.json', Chapter::class);

    echo "✅ Migration completed successfully!\n";

    // Show final counts
    echo "\n📊 Final Database Counts:\n";
    echo "Series: " . Series::count() . "\n";
    echo "Characters: " . Character::count() . "\n";
    echo "Books: " . Book::count() . "\n";
    echo "Stories: " . Story::count() . "\n";
    echo "Chapters: " . Chapter::count() . "\n";

} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
