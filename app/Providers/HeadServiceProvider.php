<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Head\Enums\OgType;
use Laravel\Head\Enums\TwitterCard;
use Laravel\Head\ErrorPages;
use Laravel\Head\Facades\Head;
use Laravel\Head\HeadBuilder;

class HeadServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Head::defaults(function (HeadBuilder $head): void {
            $head
                ->title(config('app.name'), suffix: ' - '.config('app.name'))
                ->description('Jasa pengisian air tangki bersih untuk Medan Marelan dan sekitarnya.')
                ->canonical()
                ->searchableByRobots()
                ->og(
                    siteName: config('app.name'),
                    type: OgType::Website,
                )
                ->twitter(card: TwitterCard::SummaryWithLargeImage);
        });

        Head::inertiaGlobals(function (HeadBuilder $head): void {
            $head
                ->viewport('width=device-width, initial-scale=1')
                ->colorScheme('light dark')
                ->icon('/favicon.svg', type: 'image/svg+xml')
                ->icon('/favicon.ico', sizes: 'any')
                ->appleTouchIcon('/apple-touch-icon.png');
        });

        Head::errors(function (ErrorPages $errors): void {
            $errors->status(404, fn (HeadBuilder $head) => $head
                ->title('Halaman Tidak Ditemukan')
                ->description('Halaman yang Anda cari tidak ditemukan.'));

            $errors->status(500, fn (HeadBuilder $head) => $head
                ->title('Terjadi Kesalahan')
                ->description('Terjadi kesalahan pada server. Silakan coba lagi.'));
        });
    }
}
