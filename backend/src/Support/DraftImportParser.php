<?php

declare(strict_types=1);

namespace App\Support;

final class DraftImportParser
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function parse(string $rawContent): array
    {
        $content = str_replace(["\r\n", "\r"], "\n", trim($rawContent));
        if ($content === '') {
            return [];
        }

        $lines = explode("\n", $content);
        $chapters = [];
        $current = null;

        foreach ($lines as $line) {
            if ($this->isChapterHeading($line)) {
                if ($current !== null) {
                    // If the current chapter has no meaningful content yet, it's a
                    // structural/binder heading (e.g. Scrivener compile). Absorb the
                    // new heading into the same chapter slot rather than creating an
                    // empty duplicate.
                    $bodyWords = str_word_count(strip_tags(trim(implode("\n", $current['lines']))));
                    if ($bodyWords < 5) {
                        $current['raw_heading'] = $line;
                        $current['lines'] = [];
                        continue;
                    }

                    $chapters[] = $this->finalizeChapter($current, count($chapters) + 1);
                }

                $current = [
                    'raw_heading' => $line,
                    'lines' => [],
                ];
                continue;
            }

            if ($current === null) {
                // Skip preamble lines that are structural (headings, blank lines) but
                // haven't matched a chapter heading — e.g. "# PART 1".
                $trimmed = trim($line);
                if ($trimmed === '' || str_starts_with($trimmed, '#')) {
                    continue;
                }

                $current = [
                    'raw_heading' => 'Prologue',
                    'lines' => [],
                ];
            }

            $current['lines'][] = $line;
        }

        if ($current !== null) {
            $chapters[] = $this->finalizeChapter($current, count($chapters) + 1);
        }

        if (count($chapters) === 0) {
            $chapters[] = $this->buildFallbackChapter($content);
        }

        return $chapters;
    }

    private function isChapterHeading(string $line): bool
    {
        $trimmed = trim($line);
        if ($trimmed === '') {
            return false;
        }

        $numberPattern = '(?:[0-9]+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten|'
            . 'eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|'
            . 'twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)';

        return (bool) preg_match(
            '/^(?:#{1,6}\s*)?(?:(?:chapter|ch\.?)\s+' . $numberPattern . '\b.*|(?:prologue|epilogue)\b.*)$/i',
            $trimmed
        ) || (bool) preg_match(
            '/^(?:#{1,6}\s*)?scene\s+' . $numberPattern . '\b.*$/i',
            $trimmed
        );
    }

    /**
     * @param array{raw_heading: string, lines: array<int, string>} $chapter
     * @return array<string, mixed>
     */
    private function finalizeChapter(array $chapter, int $chapterNumber): array
    {
        $title = $this->cleanChapterHeading($chapter['raw_heading'], $chapterNumber);
        $body = trim(implode("\n", $chapter['lines']));
        if ($body === '') {
            $body = $title;
        }

        $sceneCount = $this->countScenes($body);
        $wordCount = str_word_count(strip_tags($body));

        return [
            'title' => $title,
            'content' => $body,
            'scene_count' => $sceneCount,
            'word_count' => $wordCount,
        ];
    }

    private function cleanChapterHeading(string $heading, int $chapterNumber): string
    {
        $clean = trim(preg_replace('/^#{1,6}\s*/', '', trim($heading)) ?? '');
        if ($clean === '') {
            return 'Chapter ' . $chapterNumber;
        }

        if (preg_match('/^(?:scene|prologue|epilogue)\b/i', $clean)) {
            return $clean;
        }

        if (!preg_match('/^chapter\b/i', $clean)) {
            return 'Chapter ' . $chapterNumber . ': ' . $clean;
        }

        return $clean;
    }

    private function countScenes(string $chapterContent): int
    {
        $sceneBreakPattern = '/^\s*(?:\*{3,}|-{3,}|_{3,}|#{1,6}\s*scene\b.*|scene\s+\d+\b.*)\s*$/im';
        $segments = preg_split($sceneBreakPattern, $chapterContent);

        if (!is_array($segments)) {
            return 1;
        }

        $nonEmptySegments = array_values(array_filter(
            array_map(static fn(string $segment): string => trim($segment), $segments),
            static fn(string $segment): bool => $segment !== ''
        ));

        return max(1, count($nonEmptySegments));
    }

    /**
     * @return array<string, mixed>
     */
    private function buildFallbackChapter(string $content): array
    {
        $body = trim($content);
        return [
            'title' => 'Chapter 1',
            'content' => $body,
            'scene_count' => $this->countScenes($body),
            'word_count' => str_word_count(strip_tags($body)),
        ];
    }
}
