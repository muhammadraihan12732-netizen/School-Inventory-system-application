<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Item;
use App\Models\Loan;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    // GET /api/reports/summary  -> ringkasan untuk dashboard
    public function summary()
    {
        $good = (int) Item::sum('quantity_good');
        $damaged = (int) Item::sum('quantity_damaged');

        return response()->json([
            'total_item_types' => Item::count(),
            'total_units' => $good + $damaged,
            'units_good' => $good,
            'units_damaged' => $damaged,
            'units_borrowed' => (int) Loan::active()->sum('quantity'),
            'active_loans' => Loan::active()->count(),
            'overdue_loans' => Loan::overdue()->count(),
            'by_category' => Category::withCount('items')
                ->withSum('items as units_good', 'quantity_good')
                ->withSum('items as units_damaged', 'quantity_damaged')
                ->get(['id', 'name']),
        ]);
    }

    // GET /api/reports/inventory?category_id=&condition=
    public function inventory(Request $request)
    {
        $request->validate([
            'category_id' => 'nullable|integer|exists:categories,id',
            'condition' => 'nullable|in:baik,rusak',
        ]);

        $items = Item::with('category')
            ->withSum(['loans as active_loans_sum_quantity' => fn ($q) => $q->where('status', 'dipinjam')], 'quantity')
            ->when($request->category_id, fn ($q, $v) => $q->where('category_id', $v))
            ->when($request->condition === 'baik', fn ($q) => $q->where('quantity_good', '>', 0))
            ->when($request->condition === 'rusak', fn ($q) => $q->where('quantity_damaged', '>', 0))
            ->orderBy('name')
            ->get();

        return response()->json($items);
    }

    // GET /api/reports/loans?from=2026-01-01&to=2026-12-31&status=
    public function loans(Request $request)
    {
        $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date|after_or_equal:from',
            'status' => 'nullable|in:dipinjam,dikembalikan',
        ]);

        $loans = Loan::with(['item', 'user:id,name'])
            ->when($request->from, fn ($q, $v) => $q->whereDate('loan_date', '>=', $v))
            ->when($request->to, fn ($q, $v) => $q->whereDate('loan_date', '<=', $v))
            ->when(in_array($request->status, ['dipinjam', 'dikembalikan']), fn ($q) => $q->where('status', $request->status))
            ->orderByDesc('loan_date')
            ->get();

        return response()->json([
            'total' => $loans->count(),
            'total_units' => $loans->sum('quantity'),
            'data' => $loans,
        ]);
    }
}
