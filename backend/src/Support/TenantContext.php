<?php

declare(strict_types=1);

namespace App\Support;

final class TenantContext
{
    private static ?string $userId = null;

    public static function setUserId(?string $userId): void
    {
        $trimmed = is_string($userId) ? trim($userId) : '';
        self::$userId = $trimmed !== '' ? $trimmed : null;
    }

    public static function getUserId(): ?string
    {
        return self::$userId;
    }

    public static function clear(): void
    {
        self::$userId = null;
    }
}

