<?php

declare(strict_types=1);

namespace App\External;

use App\Models\Book;

final class BookRepository
{
    public function findById(string $id): ?Book
    {
        return Book::find($id);
    }

    public function findAll(): array
    {
        return Book::all()->toArray();
    }

    public function findBySeriesId(string $seriesId): array
    {
        return Book::where('series_id', $seriesId)->orderBy('book_number')->get()->toArray();
    }

    public function create(Book $book): Book
    {
        $book->save();
        return $book;
    }

    public function update(Book $book): Book
    {
        $book->save();
        return $book;
    }

    public function delete(string $id): bool
    {
        $book = $this->findById($id);
        if (!$book) {
            return false;
        }

        return $book->delete();
    }

    public function findWithRelations(string $id): ?Book
    {
        return Book::with(['series'])->find($id);
    }

    public function createFromArray(array $data): Book
    {
        return Book::create($data);
    }

    public function updateFromArray(string $id, array $data): ?Book
    {
        $book = $this->findById($id);
        if (!$book) {
            return null;
        }

        $book->update($data);
        return $book;
    }

    public function reorder(string $seriesId, array $bookIds): bool
    {
        foreach ($bookIds as $index => $bookId) {
            Book::where('id', $bookId)
                ->where('series_id', $seriesId)
                ->update(['book_number' => $index + 1]);
        }
        return true;
    }

    public function getPlotThreads(string $bookId): array
    {
        $book = $this->findById($bookId);
        if (!$book) {
            return [];
        }

        return $book->plot_threads ?? [];
    }

    public function getCharacterArcs(string $bookId): array
    {
        $book = $this->findById($bookId);
        if (!$book) {
            return [];
        }

        return $book->character_arcs ?? [];
    }
}