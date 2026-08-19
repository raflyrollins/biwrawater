<?php

namespace App\Enums\Concerns;

/**
 * Perbandingan state antar kasus enum yang nyaman untuk dibaca.
 */
trait HasState
{
    public function is(self $status): bool
    {
        return $this === $status;
    }
}
