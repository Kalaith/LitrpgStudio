<?php

declare(strict_types=1);

namespace App\Services;

use RuntimeException;

final class AiChatService
{
    private const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';
    private const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

    /**
     * @return array<string, mixed>
     */
    public function models(): array
    {
        $provider = $this->resolveProvider();
        $model = $this->modelForProvider($provider);

        return [
            'object' => 'list',
            'provider' => $provider,
            'data' => [[
                'id' => $model,
                'object' => 'model',
                'provider' => $provider,
            ]],
        ];
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function chat(array $payload): array
    {
        $provider = $this->resolveProvider();

        return match ($provider) {
            'gemini' => $this->chatWithGemini($payload),
            'openai' => $this->chatWithOpenAi($payload),
            'openai-compatible' => $this->chatWithOpenAiCompatible($payload),
            default => throw new RuntimeException("Unsupported AI provider: {$provider}"),
        };
    }

    private function resolveProvider(): string
    {
        $configured = strtolower(trim((string)($_ENV['AI_PROVIDER'] ?? '')));
        if ($configured !== '') {
            return match ($configured) {
                'gemini', 'google' => 'gemini',
                'openai' => 'openai',
                'openai-compatible', 'openai_compatible', 'lmstudio', 'local' => 'openai-compatible',
                default => throw new RuntimeException("Unsupported AI_PROVIDER value: {$configured}"),
            };
        }

        if ($this->env('GEMINI_API_KEY') !== '') {
            return 'gemini';
        }

        if ($this->env('OPENAI_API_KEY') !== '') {
            return 'openai';
        }

        if ($this->env('LLM_BASE_URL') !== '') {
            return 'openai-compatible';
        }

        throw new RuntimeException(
            'AI is not configured. Set GEMINI_API_KEY/GEMINI_MODEL, OPENAI_API_KEY/OPENAI_MODEL, or LLM_BASE_URL.'
        );
    }

    private function modelForProvider(string $provider): string
    {
        return match ($provider) {
            'gemini' => $this->env('GEMINI_MODEL') ?: self::DEFAULT_GEMINI_MODEL,
            'openai' => $this->env('OPENAI_MODEL') ?: $this->env('AI_MODEL') ?: self::DEFAULT_OPENAI_MODEL,
            'openai-compatible' => $this->env('LLM_MODEL') ?: $this->env('AI_MODEL') ?: 'local-model',
            default => 'unknown',
        };
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function chatWithGemini(array $payload): array
    {
        $apiKey = $this->requiredEnv('GEMINI_API_KEY');
        $model = $this->modelForProvider('gemini');
        $prompt = $this->messagesToPrompt($payload['messages'] ?? []);
        if ($prompt === '') {
            throw new RuntimeException('AI request is missing messages.');
        }

        $generationConfig = [
            'temperature' => $this->floatValue($payload['temperature'] ?? 0.2),
            'maxOutputTokens' => $this->intValue($payload['max_tokens'] ?? 2048),
        ];

        if ($this->expectsJson($payload, $prompt)) {
            $generationConfig['response_mime_type'] = 'application/json';
        }

        $result = $this->postJson(
            "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" .
                rawurlencode($apiKey),
            [
                'contents' => [[
                    'parts' => [[
                        'text' => $prompt,
                    ]],
                ]],
                'generationConfig' => $generationConfig,
            ],
            ['Content-Type: application/json', 'Accept: application/json'],
            120
        );

        $text = (string)($result['candidates'][0]['content']['parts'][0]['text'] ?? '');
        if ($text === '') {
            throw new RuntimeException('AI provider returned an empty response.');
        }

        return $this->chatCompletionResponse($model, $text, 'gemini');
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function chatWithOpenAi(array $payload): array
    {
        $apiKey = $this->requiredEnv('OPENAI_API_KEY');
        $baseUrl = rtrim($this->env('OPENAI_BASE_URL') ?: 'https://api.openai.com/v1', '/');
        $requestPayload = $this->normaliseOpenAiPayload($payload, $this->modelForProvider('openai'));

        return $this->postJson(
            "{$baseUrl}/chat/completions",
            $requestPayload,
            [
                'Content-Type: application/json',
                'Accept: application/json',
                "Authorization: Bearer {$apiKey}",
            ],
            120
        );
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function chatWithOpenAiCompatible(array $payload): array
    {
        $baseUrl = rtrim($this->requiredEnv('LLM_BASE_URL'), '/');
        $apiKey = $this->env('LLM_API_KEY');
        $headers = ['Content-Type: application/json', 'Accept: application/json'];
        if ($apiKey !== '') {
            $headers[] = "Authorization: Bearer {$apiKey}";
        }

        return $this->postJson(
            "{$baseUrl}/v1/chat/completions",
            $this->normaliseOpenAiPayload($payload, $this->modelForProvider('openai-compatible')),
            $headers,
            120
        );
    }

    /**
     * @param mixed $messages
     */
    private function messagesToPrompt(mixed $messages): string
    {
        if (!is_array($messages)) {
            return '';
        }

        $parts = [];
        foreach ($messages as $message) {
            if (!is_array($message)) {
                continue;
            }

            $role = trim((string)($message['role'] ?? 'user'));
            $content = $message['content'] ?? '';
            if (is_array($content)) {
                $content = implode("\n", array_map(
                    static fn(mixed $part): string => is_array($part)
                        ? (string)($part['text'] ?? '')
                        : (string)$part,
                    $content
                ));
            }

            $content = trim((string)$content);
            if ($content !== '') {
                $parts[] = strtoupper($role) . ":\n" . $content;
            }
        }

        return trim(implode("\n\n", $parts));
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function normaliseOpenAiPayload(array $payload, string $model): array
    {
        $payload['model'] = $this->requestedModel($payload, $model);
        return $payload;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function requestedModel(array $payload, string $fallback): string
    {
        $requested = trim((string)($payload['model'] ?? ''));
        return $requested !== '' && $requested !== 'local-model' ? $requested : $fallback;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function expectsJson(array $payload, string $prompt): bool
    {
        if (is_array($payload['response_format'] ?? null)) {
            return true;
        }

        return preg_match('/\bjson\b/i', $prompt) === 1;
    }

    /**
     * @param array<string, mixed> $payload
     * @param list<string> $headers
     * @return array<string, mixed>
     */
    private function postJson(string $url, array $payload, array $headers, int $timeout): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => $timeout,
        ]);

        if (($this->env('APP_ENV') ?: '') === 'development') {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        }

        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        $errno = curl_errno($ch);
        curl_close($ch);

        if ($response === false) {
            throw new RuntimeException("AI request failed (curl {$errno}): {$error}");
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            throw new RuntimeException(
                'AI provider returned HTTP ' . $httpCode . ': ' . substr((string)$response, 0, 500)
            );
        }

        $decoded = json_decode((string)$response, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('AI provider returned invalid JSON.');
        }

        return $decoded;
    }

    /**
     * @return array<string, mixed>
     */
    private function chatCompletionResponse(string $model, string $content, string $provider): array
    {
        return [
            'id' => $provider . '-' . bin2hex(random_bytes(8)),
            'object' => 'chat.completion',
            'created' => time(),
            'model' => $model,
            'provider' => $provider,
            'choices' => [[
                'index' => 0,
                'message' => [
                    'role' => 'assistant',
                    'content' => $content,
                ],
                'finish_reason' => 'stop',
            ]],
        ];
    }

    private function requiredEnv(string $name): string
    {
        $value = $this->env($name);
        if ($value === '') {
            throw new RuntimeException("Missing required environment variable: {$name}");
        }

        return $value;
    }

    private function env(string $name): string
    {
        return trim((string)($_ENV[$name] ?? getenv($name) ?: ''));
    }

    private function intValue(mixed $value): int
    {
        $intValue = (int)$value;
        return $intValue > 0 ? $intValue : 2048;
    }

    private function floatValue(mixed $value): float
    {
        return max(0.0, min(2.0, (float)$value));
    }
}
