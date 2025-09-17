<?php
// ✅ CORRECT: Auth0 user creation/update action
declare(strict_types=1);

namespace App\Actions\Auth0;

use App\External\UserRepository;
use App\Models\User;

final class CreateOrUpdateUserAction
{
    public function __construct(
        private readonly UserRepository $userRepository
    ) {}

    public function execute(array $auth0Payload): User
    {
        $auth0Id = $auth0Payload['sub'] ?? '';

        if (empty($auth0Id)) {
            throw new \InvalidArgumentException('Auth0 user ID is required');
        }

        // Try to find existing user
        $user = $this->userRepository->findByAuth0Id($auth0Id);

        if (!$user) {
            // Create new user
            $user = new User();
            $user->auth0_id = $auth0Id;
            $user->email = $auth0Payload['email'] ?? '';
            $user->username = $auth0Payload['nickname'] ?? explode('@', $auth0Payload['email'] ?? 'user')[0];
            $user->first_name = $auth0Payload['given_name'] ?? '';
            $user->last_name = $auth0Payload['family_name'] ?? '';
            $user->is_active = true;
            $user->created_at = new \DateTime();
            $user->updated_at = new \DateTime();

            $user = $this->userRepository->create($user);

            // Add default role if role system exists
            if (method_exists($user, 'assignRole')) {
                $user->assignRole('user');
            }
        } else {
            // Update existing user with latest Auth0 data
            $user->email = $auth0Payload['email'] ?? $user->email;
            $user->username = $auth0Payload['nickname'] ?? $user->username;
            $user->first_name = $auth0Payload['given_name'] ?? $user->first_name;
            $user->last_name = $auth0Payload['family_name'] ?? $user->last_name;
            $user->updated_at = new \DateTime();

            $user = $this->userRepository->update($user);
        }

        return $user;
    }
}