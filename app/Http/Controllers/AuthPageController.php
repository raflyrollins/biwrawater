<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Laravel\Head\Facades\Head;

class AuthPageController extends Controller
{
    public function login(): Response
    {
        Head::title('Masuk')
            ->description('Masuk ke akun Biwrawater untuk memesan air tangki bersih di Medan Marelan.');

        return Inertia::render('auth/Auth', [
            'mode' => 'login',
        ]);
    }

    public function register(): Response
    {
        Head::title('Daftar')
            ->description('Buat akun Biwrawater untuk memesan air tangki bersih di Medan Marelan.');

        return Inertia::render('auth/Auth', [
            'mode' => 'register',
        ]);
    }
}
