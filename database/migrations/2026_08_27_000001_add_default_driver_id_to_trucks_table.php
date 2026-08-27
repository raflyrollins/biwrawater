<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trucks', function (Blueprint $table): void {
            $table->foreignId('default_driver_id')->nullable()->constrained('drivers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('trucks', function (Blueprint $table): void {
            $table->dropForeign(['default_driver_id']);
            $table->dropColumn('default_driver_id');
        });
    }
};
