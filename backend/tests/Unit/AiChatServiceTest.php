<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Services\AiChatService;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class AiChatServiceTest extends TestCase
{
    /**
     * @var array<string, string>
     */
    private array $previousEnv = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->previousEnv = $_ENV;
        $this->clearAiEnv();
    }

    protected function tearDown(): void
    {
        $_ENV = $this->previousEnv;
        parent::tearDown();
    }

    public function testModelsAutoDetectsGeminiConfiguration(): void
    {
        $_ENV['GEMINI_API_KEY'] = 'test-key';
        $_ENV['GEMINI_MODEL'] = 'gemini-test-model';

        $models = (new AiChatService())->models();

        self::assertSame('gemini', $models['provider']);
        self::assertSame('gemini-test-model', $models['data'][0]['id']);
    }

    public function testModelsExplainsMissingAiConfiguration(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('AI is not configured');

        (new AiChatService())->models();
    }

    private function clearAiEnv(): void
    {
        $keys = [
            'AI_PROVIDER',
            'AI_MODEL',
            'GEMINI_API_KEY',
            'GEMINI_MODEL',
            'OPENAI_API_KEY',
            'OPENAI_MODEL',
            'OPENAI_BASE_URL',
            'LLM_BASE_URL',
            'LLM_MODEL',
            'LLM_API_KEY',
        ];

        foreach ($keys as $key) {
            unset($_ENV[$key]);
            putenv($key);
        }
    }
}
