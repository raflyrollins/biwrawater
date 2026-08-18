<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Inertia\Middleware;
use Symfony\Component\HttpFoundation\Response;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        View::share('appearance', $request->cookie('appearance', 'system'));

        return parent::handle($request, $next);
    }

    /**
     * Determine the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'appearance' => $request->cookie('appearance', 'system'),
            'auth' => [
                'user' => $request->user(),
            ],
        ];
    }
}
