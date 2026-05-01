<?php

declare(strict_types=1);

namespace App\Tests\Feature;

use App\Controllers\DraftImportController;
use App\Support\DraftImportParser;
use PHPUnit\Framework\TestCase;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;

final class DraftImportControllerTest extends TestCase
{
    public function testPreviewModeReturnsChapterScanWithoutCreatingImport(): void
    {
        $request = (new ServerRequestFactory())
            ->createServerRequest('POST', '/api/v1/series/new/imports/draft')
            ->withParsedBody([
                'content' => "Chapter One\nOpening text has enough words here.\n\nChapter Two\nClosing text has enough words here.",
                'format' => 'markdown',
                'previewOnly' => true,
            ]);

        $response = (new DraftImportController(new DraftImportParser()))->importDraft(
            $request,
            (new ResponseFactory())->createResponse(),
            ['seriesId' => 'new']
        );

        self::assertSame(200, $response->getStatusCode());

        $payload = json_decode((string)$response->getBody(), true);
        self::assertTrue($payload['success']);
        self::assertTrue($payload['data']['requires_confirmation']);
        self::assertSame(2, $payload['data']['summary']['chapter_count']);
        self::assertSame('candidate-1', $payload['data']['chapters'][0]['id']);
    }

    public function testImportWithoutChapterConfirmationReturnsPreviewConflict(): void
    {
        $request = (new ServerRequestFactory())
            ->createServerRequest('POST', '/api/v1/series/new/imports/draft')
            ->withParsedBody([
                'content' => "Chapter One\nOpening text.",
                'format' => 'markdown',
            ]);

        $response = (new DraftImportController(new DraftImportParser()))->importDraft(
            $request,
            (new ResponseFactory())->createResponse(),
            ['seriesId' => 'new']
        );

        self::assertSame(409, $response->getStatusCode());

        $payload = json_decode((string)$response->getBody(), true);
        self::assertFalse($payload['success']);
        self::assertSame('Chapter scan confirmation is required before importing.', $payload['error']);
        self::assertSame(1, $payload['data']['summary']['chapter_count']);
    }
}
