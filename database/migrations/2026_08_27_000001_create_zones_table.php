<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zones', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->boolean('is_within_area')->default(true);
            $table->unsignedBigInteger('delivery_fee')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed default zone
        DB::table('zones')->insert([
            'name' => 'Zona Marelan',
            'slug' => 'marelan',
            'is_within_area' => true,
            'delivery_fee' => 0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('zones');
    }
};
