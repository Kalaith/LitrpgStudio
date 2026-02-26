<?php

declare(strict_types=1);

namespace App\Controllers;

use App\External\WritingSessionRepository;
use App\External\WritingGoalRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class WritingAnalyticsController
{
    public function __construct(
        private WritingSessionRepository $sessionRepo,
        private WritingGoalRepository $goalRepo
    ) {}

    private function jsonResponse(Response $response, $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }

    // ========================================================================
    // Writing Sessions
    // ========================================================================

    public function getSessions(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            $storyId = $params['story_id'] ?? null;
            $startDate = $params['start_date'] ?? null;
            $endDate = $params['end_date'] ?? null;
            $date = $params['date'] ?? null;

            if ($date) {
                $sessions = $this->sessionRepo->findByDate($date);
            } elseif ($startDate && $endDate) {
                $sessions = $this->sessionRepo->findByDateRange($startDate, $endDate);
            } elseif ($storyId) {
                $sessions = $this->sessionRepo->findByStoryId($storyId);
            } else {
                $sessions = $this->sessionRepo->findCompleted(100);
            }

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $sessions
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getActiveSession(Request $request, Response $response): Response
    {
        try {
            $session = $this->sessionRepo->findActive();

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $session
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function startSession(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            // End any active session first
            $activeSession = $this->sessionRepo->findActive();
            if ($activeSession) {
                $this->sessionRepo->update($activeSession['id'], [
                    'is_active' => false,
                    'end_time' => date('Y-m-d H:i:s')
                ]);
            }

            $sessionData = [
                'id' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'story_id' => $data['story_id'] ?? null,
                'chapter_id' => $data['chapter_id'] ?? null,
                'start_time' => date('Y-m-d H:i:s'),
                'word_target' => $data['word_target'] ?? 500,
                'initial_word_count' => $data['initial_word_count'] ?? 0,
                'final_word_count' => $data['initial_word_count'] ?? 0,
                'words_written' => 0,
                'duration' => 0,
                'date' => date('Y-m-d'),
                'is_active' => true,
            ];

            $session = $this->sessionRepo->create($sessionData);

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $session
            ], 201);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateSession(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $data = $request->getParsedBody();

            $session = $this->sessionRepo->update($id, $data);

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $session
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function endSession(Request $request, Response $response): Response
    {
        try {
            $activeSession = $this->sessionRepo->findActive();

            if (!$activeSession) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'error' => 'No active session found'
                ], 404);
            }

            $data = $request->getParsedBody();
            $endTime = date('Y-m-d H:i:s');
            $startTime = $activeSession['start_time'];

            $duration = (strtotime($endTime) - strtotime($startTime)) / 60; // minutes
            $finalWordCount = $data['final_word_count'] ?? $activeSession['final_word_count'];
            $wordsWritten = max(0, $finalWordCount - $activeSession['initial_word_count']);

            $session = $this->sessionRepo->update($activeSession['id'], [
                'end_time' => $endTime,
                'final_word_count' => $finalWordCount,
                'words_written' => $wordsWritten,
                'duration' => (int)$duration,
                'is_active' => false,
            ]);

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $session
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ========================================================================
    // Writing Goals
    // ========================================================================

    public function getGoals(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            $type = $params['type'] ?? null;
            $storyId = $params['story_id'] ?? null;
            $activeOnly = isset($params['active_only']) && $params['active_only'] === 'true';

            if ($storyId) {
                $goals = $this->goalRepo->findByStoryId($storyId);
            } elseif ($type) {
                $goals = $this->goalRepo->findByType($type);
            } elseif ($activeOnly) {
                $goals = $this->goalRepo->findActive();
            } else {
                $goals = $this->goalRepo->findAll();
            }

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $goals
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function createGoal(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            $goalData = [
                'id' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'type' => $data['type'],
                'target' => $data['target'],
                'current' => $data['current'] ?? 0,
                'start_date' => $data['start_date'] ?? date('Y-m-d'),
                'deadline' => $data['deadline'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'story_id' => $data['story_id'] ?? null,
                'book_id' => $data['book_id'] ?? null,
            ];

            $goal = $this->goalRepo->create($goalData);

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $goal
            ], 201);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateGoal(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $data = $request->getParsedBody();

            $goal = $this->goalRepo->update($id, $data);

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $goal
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteGoal(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $this->goalRepo->delete($id);

            return $this->jsonResponse($response, [
                'success' => true
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function markGoalComplete(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $goal = $this->goalRepo->markComplete($id);

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $goal
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ========================================================================
    // Analytics & Statistics
    // ========================================================================

    public function getDailyStats(Request $request, Response $response, array $args): Response
    {
        try {
            $date = $args['date'];
            $stats = $this->sessionRepo->getDailyStats($date);

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getAnalyticsSummary(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            $startDate = $params['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
            $endDate = $params['end_date'] ?? date('Y-m-d');

            $summary = [
                'total_words_written' => $this->sessionRepo->getTotalWordsWritten($startDate, $endDate),
                'average_session_duration' => $this->sessionRepo->getAverageSessionDuration($startDate, $endDate),
                'average_wpm' => $this->sessionRepo->getAverageWPM($startDate, $endDate),
                'sessions_by_hour' => $this->sessionRepo->getSessionsByHour(),
                'goal_achievement_rate' => $this->goalRepo->getAchievementRate($startDate, $endDate),
                'active_goals_by_type' => $this->goalRepo->getActiveGoalsByType(),
                'overdue_goals' => $this->goalRepo->findOverdue(),
            ];

            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $summary
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
