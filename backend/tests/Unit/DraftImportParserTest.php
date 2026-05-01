<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Support\DraftImportParser;
use PHPUnit\Framework\TestCase;

final class DraftImportParserTest extends TestCase
{
    public function testDetectsSpelledNumberChapterHeadings(): void
    {
        $chapters = (new DraftImportParser())->parse(
            "Chapter One: Arrival\nFirst chapter text has enough words here.\n\nChapter Two\nSecond chapter text has enough words here."
        );

        self::assertCount(2, $chapters);
        self::assertSame('Chapter One: Arrival', $chapters[0]['title']);
        self::assertSame('Chapter Two', $chapters[1]['title']);
    }

    public function testDetectsNumberedSceneHeadingsAsImportSections(): void
    {
        $chapters = (new DraftImportParser())->parse(
            "## Scene 1: The Plea\nFirst scene text has enough words here.\n\n## Scene 2: The Trail\nSecond scene text has enough words here."
        );

        self::assertCount(2, $chapters);
        self::assertSame('Scene 1: The Plea', $chapters[0]['title']);
        self::assertSame('Scene 2: The Trail', $chapters[1]['title']);
    }
}
