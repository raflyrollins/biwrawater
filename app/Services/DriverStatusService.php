<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\DriverStatus;
use App\Models\Driver;

class DriverStatusService
{
    /**
     * Ubah status driver antara tersedia dan istirahat.
     * Kembalikan pesan error bila perubahan tidak diizinkan, atau null bila berhasil.
     */
    public function change(Driver $driver, DriverStatus $newStatus): ?string
    {
        if ($driver->status->is(DriverStatus::OnDuty)) {
            return 'Driver sedang bertugas, status tidak dapat diubah.';
        }

        if ($newStatus->is(DriverStatus::OffDuty) && $driver->deliveries()->active()->exists()) {
            return 'Driver masih memiliki tugas aktif, selesaikan atau alihkan tugasnya terlebih dahulu.';
        }

        $driver->update([
            'status' => $newStatus,
        ]);

        return null;
    }
}
