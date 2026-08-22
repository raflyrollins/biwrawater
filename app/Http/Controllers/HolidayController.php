<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Holiday;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d', 'unique:holidays,date'],
            'name' => ['required', 'string', 'max:100'],
        ]);

        Holiday::create($validated);

        return back()->with('success', 'Hari libur ditambahkan.');
    }

    public function destroy(Holiday $holiday): RedirectResponse
    {
        $holiday->delete();

        return back()->with('success', 'Hari libur dihapus.');
    }
}
