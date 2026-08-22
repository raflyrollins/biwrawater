<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\DayOfWeek;
use App\Models\Holiday;
use App\Models\OperatingHour;
use App\Services\OperatingScheduleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Head\Facades\Head;
use Throwable;

class OperatingHourController extends Controller
{
    public function __construct(private readonly OperatingScheduleService $schedule) {}

    public function index(): Response
    {
        Head::title('Jam Operasional');

        return Inertia::render('dashboard/operating-hours/Index', [
            'days' => $this->schedule->weeklyHours()->map(
                fn (OperatingHour $hour): array => [
                    'day_of_week' => $hour->day_of_week->value,
                    'label' => $hour->day_of_week->label(),
                    'is_closed' => $hour->is_closed,
                    'opens_at' => $hour->opens_at !== null ? substr($hour->opens_at, 0, 5) : null,
                    'closes_at' => $hour->closes_at !== null ? substr($hour->closes_at, 0, 5) : null,
                ],
            )->values(),
            'holidays' => $this->schedule->upcomingHolidays()->map(
                fn (Holiday $holiday): array => [
                    'uuid' => $holiday->uuid,
                    'date' => $holiday->date->format('Y-m-d'),
                    'name' => $holiday->name,
                ],
            ),
            'today' => [
                'is_open' => $this->schedule->isOpenNow(),
                'message' => $this->schedule->isOpenNow() ? 'Toko sedang buka.' : $this->schedule->closedMessage(),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'days' => ['required', 'array', 'size:7'],
            'days.*.day_of_week' => ['required', 'integer', 'between:0,6', 'distinct'],
            'days.*.is_closed' => ['required', 'boolean'],
            'days.*.opens_at' => ['nullable', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'days.*.closes_at' => ['nullable', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
        ]);

        /** @var list<array{day_of_week: int, is_closed: bool, opens_at?: string|null, closes_at?: string|null}> $days */
        $days = $validated['days'];

        $this->assertTimesConsistent($days);

        foreach ($days as $day) {
            OperatingHour::query()
                ->where('day_of_week', $day['day_of_week'])
                ->update([
                    'is_closed' => $day['is_closed'],
                    'opens_at' => $day['is_closed'] ? null : $this->normalizeTime($day['opens_at'] ?? null),
                    'closes_at' => $day['is_closed'] ? null : $this->normalizeTime($day['closes_at'] ?? null),
                ]);
        }

        return back()->with('success', 'Jam operasional diperbarui.');
    }

    /**
     * @param  list<array{day_of_week: int, is_closed: bool, opens_at?: string|null, closes_at?: string|null}>  $days
     *
     * @throws ValidationException
     */
    private function assertTimesConsistent(array $days): void
    {
        $errors = [];

        foreach ($days as $index => $day) {
            if ($day['is_closed']) {
                continue;
            }

            $label = DayOfWeek::from($day['day_of_week'])->label();

            if (empty($day['opens_at']) || empty($day['closes_at'])) {
                $errors["days.{$index}.opens_at"] = "Jam buka dan jam tutup wajib diisi untuk hari {$label} yang buka.";

                continue;
            }

            try {
                $opens = Carbon::createFromFormat('H:i', (string) $day['opens_at']);
                $closes = Carbon::createFromFormat('H:i', (string) $day['closes_at']);
            } catch (Throwable) {
                $errors["days.{$index}.opens_at"] = 'Format jam tidak valid.';

                continue;
            }

            if (! $opens || ! $closes || $closes->lessThanOrEqualTo($opens)) {
                $errors["days.{$index}.closes_at"] = "Jam tutup harus setelah jam buka untuk hari {$label}.";
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function normalizeTime(?string $time): ?string
    {
        return $time !== null && $time !== '' ? $time.':00' : null;
    }
}
