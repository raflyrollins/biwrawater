<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operating_hours', function (Blueprint $table): void {
            $table->id();
            $table->unsignedTinyInteger('day_of_week')->unique();
            $table->boolean('is_closed')->default(false);
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->timestamps();
        });

        Schema::create('holidays', function (Blueprint $table): void {
            $table->id();
            $table->uuid()->unique()->after('id');
            $table->date('date')->unique();
            $table->string('name', 100);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('holidays');
        Schema::dropIfExists('operating_hours');
    }
};
