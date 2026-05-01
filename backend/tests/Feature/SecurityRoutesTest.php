<?php

declare(strict_types=1);

namespace App\Tests\Feature;

use PHPUnit\Framework\TestCase;

final class SecurityRoutesTest extends TestCase
{
    public function testOperationalSetupRoutesAreNotExposedOverHttp(): void
    {
        $routesPath = dirname(__DIR__, 2) . '/config/routes.php';
        self::assertFileExists($routesPath);

        $routes = (string) file_get_contents($routesPath);

        self::assertStringNotContainsString("'/init-database'", $routes);
        self::assertStringNotContainsString("'/data/claim-unowned'", $routes);
        self::assertStringContainsString("'/admin/ownership/transfer'", $routes);
    }
}
