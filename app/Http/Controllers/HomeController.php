<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Service;
use App\Services\OperatingScheduleService;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Head\Facades\Head;
use Laravel\Head\Facades\Schema;

class HomeController extends Controller
{
    public function __construct(private readonly OperatingScheduleService $schedule) {}

    public function __invoke(): Response
    {
        Head::title('Jasa Isi Air Tangki Medan Marelan')
            ->description('Pesan air tangki bersih langsung sampai rumah di Medan Marelan. Pengiriman teratur, pembayaran aman, dan bukti serah terima setiap pengiriman.')
            ->canonical()
            ->og(title: 'Jasa Isi Air Tangki Medan Marelan')
            ->twitter(title: 'Jasa Isi Air Tangki Medan Marelan');

        Head::schema(
            Schema::organization()
                ->name(config('app.name'))
                ->url(route('home'))
                ->set('description', 'Jasa pengisian air tangki bersih untuk Medan Marelan dan sekitarnya.')
                ->set('areaServed', 'Medan Marelan, Medan, Sumatera Utara')
        );

        return Inertia::render('home', [
            'services' => Service::query()
                ->active()
                ->orderBy('sort_order')
                ->get(['id', 'name', 'description', 'price', 'volume_liters']),
            'schedule_status' => [
                'is_open' => $this->schedule->isOpenNow(),
                'message' => $this->schedule->closedMessage(),
            ],
        ]);
    }
}
