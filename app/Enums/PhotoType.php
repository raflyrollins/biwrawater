<?php

namespace App\Enums;

use App\Enums\Concerns\HasState;

enum PhotoType: string
{
    use HasState;

    case Filling = 'filling';
    case CompletionTank = 'completion_tank';
    case CompletionPerson = 'completion_person';

    public function label(): string
    {
        return match ($this) {
            self::Filling => 'Foto Pengisian',
            self::CompletionTank => 'Foto Tangki',
            self::CompletionPerson => 'Foto Penerima',
        };
    }
}
