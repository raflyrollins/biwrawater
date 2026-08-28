<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\DB;

final class DatabaseSearch
{
    /**
     * Pencarian teks tidak peka huruf dengan full-text.
     *
     * - PostgreSQL: to_tsvector / to_tsquery dengan pencocokan awalan per kata,
     *   mis. "Marelan Raya" -> "marelan:* & raya:*".
     * - Driver lain (SQLite/MySQL): LOWER() + LIKE.
     *
     * Cocok untuk kolom teks (nama, kecamatan, kelurahan, city). Jangan dipakai
     * untuk identifier seperti nomor pesanan: tokenisasi PostgreSQL mengubah
     * "WO-2026-ABC" menjadi angka negatif ("-2026"); pakai containsCaseInsensitive().
     *
     * @param  literal-string  $column
     * @return array{0: literal-string, 1: array<int, string>} [syarat SQL, binding]
     */
    public static function contains(string $column, string $value): array
    {
        if (self::isPostgres()) {
            $tsquery = self::prefixTsquery($value);

            if ($tsquery === '') {
                return ['1 = 1', []];
            }

            return [
                "to_tsvector('simple', {$column}) @@ to_tsquery('simple', ?)",
                [$tsquery],
            ];
        }

        return [
            "LOWER({$column}) LIKE ?",
            ['%'.mb_strtolower($value).'%'],
        ];
    }

    /**
     * Pencarian tidak peka huruf ke beberapa kolom sekaligus (gabungan OR).
     *
     * @param  list<literal-string>  $columns
     * @return array{0: literal-string, 1: array<int, string>} [syarat SQL, binding]
     */
    public static function containsAny(array $columns, string $value): array
    {
        $sql = '';
        $bindings = [];

        foreach ($columns as $column) {
            [$fragment, $fragmentBindings] = self::contains($column, $value);

            if ($sql !== '') {
                $sql .= ' OR ';
            }

            $sql .= $fragment;
            $bindings = array_merge($bindings, $fragmentBindings);
        }

        return [$sql, $bindings];
    }

    /**
     * Pencocokan substring tidak peka huruf.
     *
     * - PostgreSQL: ILIKE.
     * - Driver lain: LOWER() + LIKE.
     *
     * Cocok untuk identifier seperti nomor pesanan atau kode.
     *
     * @param  literal-string  $column
     * @return array{0: literal-string, 1: array<int, string>} [syarat SQL, binding]
     */
    public static function containsCaseInsensitive(string $column, string $value): array
    {
        if (self::isPostgres()) {
            return [
                "{$column} ILIKE ?",
                ['%'.$value.'%'],
            ];
        }

        return [
            "LOWER({$column}) LIKE ?",
            ['%'.mb_strtolower($value).'%'],
        ];
    }

    private static function isPostgres(): bool
    {
        return DB::connection()->getDriverName() === 'pgsql';
    }

    /**
     * Ubah teks bebas menjadi tsquery pencocokan awalan per kata.
     */
    private static function prefixTsquery(string $value): string
    {
        $value = (string) preg_replace('/[&|!():*"?-]/', ' ', $value);

        $terms = preg_split('/\s+/', $value) ?: [];

        $terms = array_filter(
            $terms,
            static fn (string $term): bool => $term !== '',
        );

        $terms = array_map(
            static fn (string $term): string => $term.':*',
            array_values($terms),
        );

        return implode(' & ', $terms);
    }
}
