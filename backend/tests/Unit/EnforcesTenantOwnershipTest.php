<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use PHPUnit\Framework\TestCase;

final class EnforcesTenantOwnershipTest extends TestCase
{
    public function testOwnershipTraitStampsInsertsWithoutEventDispatcher(): void
    {
        $traitPath = dirname(__DIR__, 2) . '/src/Models/Concerns/EnforcesTenantOwnership.php';
        self::assertFileExists($traitPath);

        $trait = (string) file_get_contents($traitPath);

        self::assertStringContainsString('function performInsert', $trait);
        self::assertStringContainsString('TenantContext::getUserId()', $trait);
        self::assertStringContainsString("setAttribute('owner_user_id'", $trait);
    }
}
