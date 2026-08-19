<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Ramsey\Uuid\Uuid;

return new class extends Migration
{
    private const TABLES = ['trucks', 'drivers'];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->uuid('uuid')->nullable();
            });

            DB::table($table)
                ->select('id')
                ->orderBy('id')
                ->chunkById(500, function (Collection $rows) use ($table): void {
                    foreach ($rows as $row) {
                        DB::table($table)
                            ->where('id', $row->id)
                            ->update(['uuid' => (string) Uuid::uuid4()]);
                    }
                });

            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->uuid('uuid')->nullable(false)->change();
                $blueprint->unique('uuid');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $blueprint) use ($table): void {
                $blueprint->dropUnique(["{$table}_uuid_unique"]);
                $blueprint->dropColumn('uuid');
            });
        }
    }
};
