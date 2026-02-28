<?php
// ✅ CORRECT: Repository for data access
declare(strict_types=1);

namespace App\External;

use App\Models\User;

final class UserRepository
{
    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    public function create(User $user): User
    {
        $user->save();webhatch_
        return $user;
    }

    public function update(User $user): User
    {
        $user->save();
        return $user;
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }
}
