<?php

use App\Enums\DayOfWeek;
use App\Models\Address;
use App\Models\Holiday;
use App\Models\OperatingHour;
use App\Models\Service;
use App\Models\User;
use App\Services\OperatingScheduleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

function seedWeeklySchedule(): void
{
    foreach (DayOfWeek::cases() as $day) {
        $closed = $day === DayOfWeek::Sunday;
        OperatingHour::query()->updateOrCreate(
            ['day_of_week' => $day->value],
            [
                'is_closed' => $closed,
                'opens_at' => $closed ? null : '08:00:00',
                'closes_at' => $closed ? null : '17:00:00',
            ],
        );
    }
}

function adminUser(): User
{
    return User::factory()->admin()->create();
}

function customerUser(): User
{
    return User::factory()->create();
}

beforeEach(fn () => seedWeeklySchedule());

afterEach(fn () => Carbon::setTestNow());

test('admin dapat membuka halaman jam operasional', function (): void {
    $this->actingAs(adminUser())
        ->get(route('dashboard.operating-hours.index'))
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('dashboard/operating-hours/Index')
                ->has('days', 7)
                ->has('holidays', 0)
                ->has('today'),
        );
});

test('pelanggan tidak dapat mengakses halaman jam operasional', function (): void {
    $this->actingAs(customerUser())
        ->get(route('dashboard.operating-hours.index'))
        ->assertForbidden();
});

test('jam operasional dapat diperbarui', function (): void {
    $this->actingAs(adminUser())
        ->put(route('dashboard.operating-hours.update'), [
            'days' => [
                ['day_of_week' => 0, 'is_closed' => true, 'opens_at' => null, 'closes_at' => null],
                ['day_of_week' => 1, 'is_closed' => false, 'opens_at' => '09:00', 'closes_at' => '18:00'],
                ['day_of_week' => 2, 'is_closed' => false, 'opens_at' => '08:00', 'closes_at' => '17:00'],
                ['day_of_week' => 3, 'is_closed' => false, 'opens_at' => '08:00', 'closes_at' => '17:00'],
                ['day_of_week' => 4, 'is_closed' => false, 'opens_at' => '08:00', 'closes_at' => '17:00'],
                ['day_of_week' => 5, 'is_closed' => false, 'opens_at' => '08:00', 'closes_at' => '17:00'],
                ['day_of_week' => 6, 'is_closed' => false, 'opens_at' => '08:00', 'closes_at' => '17:00'],
            ],
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(OperatingHour::where('day_of_week', 1)->first()?->opens_at)->toBe('09:00:00')
        ->and(OperatingHour::where('day_of_week', 1)->first()?->closes_at)->toBe('18:00:00');
});

test('jam tutup sebelum jam buka ditolak', function (): void {
    $this->actingAs(adminUser())
        ->put(route('dashboard.operating-hours.update'), [
            'days' => [
                ['day_of_week' => 0, 'is_closed' => true, 'opens_at' => null, 'closes_at' => null],
                ['day_of_week' => 1, 'is_closed' => false, 'opens_at' => '17:00', 'closes_at' => '08:00'],
                ['day_of_week' => 2, 'is_closed' => false, 'opens_at' => '08:00', 'closes_at' => '17:00'],
                ['day_of_week' => 3, 'is_closed' => false, 'opens_at' => '08:00', 'closes_at' => '17:00'],
                ['day_of_week' => 4, 'is_closed' => false, 'opens_at' => '08:00', 'closes_at' => '17:00'],
                ['day_of_week' => 5, 'is_closed' => false, 'opens_at' => '08:00', 'closes_at' => '17:00'],
                ['day_of_week' => 6, 'is_closed' => false, 'opens_at' => '08:00', 'closes_at' => '17:00'],
            ],
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('days.1.closes_at');

    expect(OperatingHour::where('day_of_week', 1)->first()?->opens_at)->toBe('08:00:00');
});

test('toko buka pada jam kerja hari biasa', function (): void {
    seedWeeklySchedule();
    Carbon::setTestNow(Carbon::parse('2026-08-26 10:00:00', 'Asia/Jakarta')); // Rabu 10:00 WIB

    $service = new OperatingScheduleService;

    expect($service->isOpenNow())->toBeTrue()
        ->and($service->isOpenAt(Carbon::parse('2026-08-26 07:59:00', 'Asia/Jakarta')))->toBeFalse()
        ->and($service->isOpenAt(Carbon::parse('2026-08-26 08:00:00', 'Asia/Jakarta')))->toBeTrue()
        ->and($service->isOpenAt(Carbon::parse('2026-08-26 16:59:00', 'Asia/Jakarta')))->toBeTrue()
        ->and($service->isOpenAt(Carbon::parse('2026-08-26 17:00:00', 'Asia/Jakarta')))->toBeFalse();
});

test('toko tutup pada hari Minggu dan tanggal libur', function (): void {
    seedWeeklySchedule();
    Carbon::setTestNow(Carbon::parse('2026-08-23 10:00:00', 'Asia/Jakarta')); // Minggu

    $service = new OperatingScheduleService;
    expect($service->isOpenNow())->toBeFalse();

    // libur pada hari kerja
    Holiday::factory()->create(['date' => '2026-08-26', 'name' => 'Libur Nasional']);
    Carbon::setTestNow(Carbon::parse('2026-08-26 10:00:00', 'Asia/Jakarta')); // Rabu tapi libur
    expect($service->isOpenNow())->toBeFalse();

    $next = $service->nextOpening();
    expect($next)->not->toBeNull()
        ->and($next->dayOfWeekIso)->toBe(4); // Kamis = ISO 4
});

test('checkout ditolak saat toko tutup (di luar jam buka)', function (): void {
    seedWeeklySchedule();
    Carbon::setTestNow(Carbon::parse('2026-08-26 18:30:00', 'Asia/Jakarta')); // Rabu 18:30

    $user = customerUser();
    $service = Service::factory()->create(['price' => 200000]);
    $address = Address::factory()->for($user)->create();

    $this->actingAs($user)
        ->post(route('checkout.store'), [
            'service_id' => $service->id,
            'address_id' => $address->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('error', fn (string $msg) => str_contains($msg, 'Toko sedang tutup'));

    expect($user->orders)->toHaveCount(0);
});

test('checkout ditolak saat toko tutup (tanggal libur)', function (): void {
    seedWeeklySchedule();
    Holiday::factory()->create(['date' => '2026-08-26', 'name' => 'Libur Nasional']);
    Carbon::setTestNow(Carbon::parse('2026-08-26 10:00:00', 'Asia/Jakarta'));

    $user = customerUser();
    $service = Service::factory()->create(['price' => 200000]);
    $address = Address::factory()->for($user)->create();

    $this->actingAs($user)
        ->post(route('checkout.store'), [
            'service_id' => $service->id,
            'address_id' => $address->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('error', fn (string $msg) => str_contains($msg, 'Toko sedang tutup'));

    expect($user->orders)->toHaveCount(0);
});

test('checkout diterima saat toko buka', function (): void {
    seedWeeklySchedule();
    Carbon::setTestNow(Carbon::parse('2026-08-26 10:00:00', 'Asia/Jakarta'));

    $user = customerUser();
    $service = Service::factory()->create(['price' => 200000]);
    $address = Address::factory()->for($user)->create();

    $this->actingAs($user)
        ->post(route('checkout.store'), [
            'service_id' => $service->id,
            'address_id' => $address->id,
        ])
        ->assertRedirect();

    expect($user->orders)->toHaveCount(1);
});
