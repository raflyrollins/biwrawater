<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Promotion;
use App\Models\Service;
use App\Models\Zone;
use App\Services\OperatingScheduleService;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Head\Facades\Head;
use RuntimeException;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
        private readonly OperatingScheduleService $schedule,
    ) {}

    public function index(Request $request): Response
    {
        Head::title('Pesan Air Tangki')
            ->description('Pesan pengisian air tangki bersih untuk diantar ke rumah Anda.');

        return Inertia::render('checkout', [
            'services' => Service::query()
                ->active()
                ->orderBy('sort_order')
                ->get(),
            'addresses' => $request->user()->addresses()->latest()->get(),
            'zones' => Zone::query()->active()->orderBy('name')->get(),
            'promotions' => Promotion::query()->active()->orderByDesc('value')->get(),
            'promo_preview' => fn () => $request->session()->get('promo_preview'),
            'schedule_status' => fn () => [
                'is_open' => $this->schedule->isOpenNow(),
                'message' => $this->schedule->closedMessage(),
            ],
        ]);
    }

    public function validatePromo(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'promo_code' => ['required', 'string', 'max:100'],
        ]);

        $service = Service::query()
            ->active()
            ->whereKey((int) $validated['service_id'])
            ->first();

        if ($service === null) {
            return back()->withErrors([
                'promo_code' => 'Varian tangki tidak tersedia.',
            ]);
        }

        try {
            $preview = $this->orderService->previewPromoCode(
                $service->price,
                $validated['promo_code'],
            );
        } catch (RuntimeException $e) {
            return back()->withErrors(['promo_code' => $e->getMessage()]);
        }

        return back()->with('promo_preview', $preview);
    }

    public function store(Request $request): RedirectResponse
    {
        if (! $this->schedule->isOpenNow()) {
            return back()->with('error', $this->schedule->closedMessage());
        }

        $validated = $request->validate([
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'address_id' => ['nullable', 'integer', 'exists:addresses,id'],
            'zone_id' => ['required_without:address_id', 'nullable', 'integer', 'exists:zones,id'],
            'label' => ['nullable', 'required_without:address_id', 'string', 'max:50'],
            'recipient_name' => ['nullable', 'required_without:address_id', 'string', 'max:255'],
            'phone' => ['nullable', 'required_without:address_id', 'string', 'max:20', 'regex:/^\+?[0-9\s]+$/'],
            'street_address' => ['nullable', 'required_without:address_id', 'string', 'max:255'],
            'district' => ['nullable', 'required_without:address_id', 'string', 'max:255'],
            'subdistrict' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'required_without:address_id', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'notes' => ['nullable', 'string', 'max:255'],
            'promo_code' => ['nullable', 'string', 'max:100'],
            'customer_note' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();
        $service = Service::query()
            ->whereKey((int) $validated['service_id'])
            ->firstOrFail();

        if (! empty($validated['address_id'])) {
            $address = $user->addresses()
                ->whereKey((int) $validated['address_id'])
                ->firstOrFail();
        } else {
            $address = $user->addresses()->create([
                'label' => $validated['label'],
                'recipient_name' => $validated['recipient_name'],
                'phone' => $validated['phone'],
                'street_address' => $validated['street_address'],
                'district' => $validated['district'],
                'subdistrict' => $validated['subdistrict'] ?? null,
                'city' => $validated['city'],
                'postal_code' => $validated['postal_code'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'zone_id' => $validated['zone_id'] ?? null,
                'is_default' => ! $user->addresses()->exists(),
            ]);
        }

        try {
            $order = $this->orderService->create(
                $user,
                $service,
                $address,
                $validated['promo_code'] ?? null,
                $validated['customer_note'] ?? null,
                $validated['zone_id'] ?? null,
            );
        } catch (RuntimeException $e) {
            return back()
                ->withErrors(['promo_code' => $e->getMessage()])
                ->withInput();
        }

        return redirect()
            ->route('dashboard.orders.show', $order)
            ->with('success', 'Pesanan berhasil dibuat. Tunggu konfirmasi admin untuk melanjutkan pembayaran.');
    }
}
