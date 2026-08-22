<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\DayOfWeek;
use App\Models\Holiday;
use App\Models\OperatingHour;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class OperatingScheduleService
{
    /**
     * Jam operasional mingguan terurut Senin s.d. Minggu.
     *
     * @return Collection<int, OperatingHour>
     */
    public function weeklyHours(): Collection
    {
        $byDay = OperatingHour::query()
            ->get()
            ->keyBy(fn (OperatingHour $hour): int => $hour->day_of_week->value);

        return collect(DayOfWeek::mondayFirst())
            ->map(fn (DayOfWeek $day): ?OperatingHour => $byDay->get($day->value))
            ->filter()
            ->values();
    }

    /**
     * Daftar hari libur yang akan datang.
     *
     * @return Collection<int, Holiday>
     */
    public function upcomingHolidays(): Collection
    {
        return Holiday::query()
            ->where('date', '>=', $this->now()->toDateString())
            ->orderBy('date')
            ->get();
    }

    public function isHoliday(CarbonInterface $when): bool
    {
        return Holiday::query()
            ->where('date', $when->copy()->setTimezone($this->timezone())->toDateString())
            ->exists();
    }

    /**
     * Apakah toko buka pada momen tertentu (memperhitungkan hari libur).
     */
    public function isOpenAt(CarbonInterface $when): bool
    {
        $local = $when->copy()->setTimezone($this->timezone());

        if ($this->isHoliday($local)) {
            return false;
        }

        $hour = OperatingHour::query()
            ->where('day_of_week', $local->dayOfWeek)
            ->first();

        if ($hour === null || $hour->is_closed || $hour->opens_at === null || $hour->closes_at === null) {
            return false;
        }

        $time = $local->format('H:i:s');

        return $time >= $hour->opens_at && $time < $hour->closes_at;
    }

    public function isOpenNow(): bool
    {
        return $this->isOpenAt($this->now());
    }

    /**
     * Momen buka berikutnya, atau null bila tidak ditemukan dalam rentang pencarian.
     */
    public function nextOpening(?CarbonInterface $from = null): ?CarbonInterface
    {
        $from ??= $this->now();
        $cursor = $from->copy()->setTimezone($this->timezone())->startOfDay();
        $searchDays = (int) config('business.next_opening_search_days', 14);

        for ($i = 0; $i < $searchDays; $i++) {
            /** @var OperatingHour|null $hour */
            $hour = OperatingHour::query()
                ->where('day_of_week', $cursor->dayOfWeek)
                ->first();

            if ($hour !== null && ! $hour->is_closed && $hour->opens_at !== null && ! $this->isHoliday($cursor)) {
                $opens = $cursor->copy()->setTimeFromTimeString($hour->opens_at);

                if ($opens->greaterThan($from)) {
                    return $opens;
                }
            }

            $cursor->addDay();
        }

        return null;
    }

    /**
     * Pesan ramah untuk customer saat toko tutup.
     */
    public function closedMessage(): string
    {
        $next = $this->nextOpening();

        if ($next === null) {
            return 'Toko sedang tutup. Silakan coba lagi nanti.';
        }

        $day = $next->locale('id')->translatedFormat('l');
        $date = $next->translatedFormat('d F Y');
        $time = $next->format('H.i');

        return "Toko sedang tutup. Pemesanan dibuka kembali {$day}, {$date} pukul {$time}.";
    }

    private function now(): Carbon
    {
        return Carbon::now($this->timezone());
    }

    private function timezone(): string
    {
        return (string) config('business.timezone');
    }
}
