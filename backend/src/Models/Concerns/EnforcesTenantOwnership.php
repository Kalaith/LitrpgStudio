<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Support\TenantContext;
use Illuminate\Database\Eloquent\Builder;

trait EnforcesTenantOwnership
{
    protected static function bootEnforcesTenantOwnership(): void
    {
        static::addGlobalScope('owner_user_scope', static function (Builder $builder): void {
            $userId = TenantContext::getUserId();
            if ($userId === null) {
                return;
            }

            $builder->where($builder->getModel()->getTable() . '.owner_user_id', $userId);
        });

        static::creating(static function ($model): void {
            $userId = TenantContext::getUserId();
            if ($userId === null) {
                return;
            }

            if (empty($model->owner_user_id)) {
                $model->owner_user_id = $userId;
            }
        });
    }
}

