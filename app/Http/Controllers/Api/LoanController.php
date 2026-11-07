<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\ItemHistory;
use App\Models\Loan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoanController extends Controller
{
    // GET /api/loans?status=dipinjam|dikembalikan|terlambat&search=
    public function index(Request $request)
    {
        $request->validate([
            'status' => 'nullable|in:dipinjam,dikembalikan,terlambat',
            'search' => 'nullable|string|max:100',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $loans = Loan::with(['item', 'user:id,name'])
            ->when($request->status === 'terlambat', fn ($q) => $q->overdue())
            ->when(in_array($request->status, ['dipinjam', 'dikembalikan']), fn ($q) => $q->where('status', $request->status))
            ->when($request->search, function ($q, $s) {
                $q->where(function ($q) use ($s) {
                    $q->where('borrower_name', 'like', "%{$s}%")
                      ->orWhereHas('item', fn ($i) => $i->where('name', 'like', "%{$s}%"));
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 10));

        return response()->json($loans);
    }

    // POST /api/loans  -> catat peminjaman
    public function store(Request $request)
    {
        $data = $request->validate([
            'item_id' => 'required|exists:items,id',
            'borrower_name' => 'required|string|max:100',
            'borrower_identity' => 'nullable|string|max:50',
            'quantity' => 'required|integer|min:1',
            'loan_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:loan_date',
            'notes' => 'nullable|string',
        ]);

        $loan = DB::transaction(function () use ($data, $request) {
            $item = Item::lockForUpdate()->findOrFail($data['item_id']);

            $borrowed = $item->loans()->where('status', 'dipinjam')->sum('quantity');
            $available = $item->quantity_good - $borrowed;

            if ($data['quantity'] > $available) {
                throw ValidationException::withMessages([
                    'quantity' => ["Stok tersedia hanya {$available} unit."],
                ]);
            }

            $loan = Loan::create($data + [
                'user_id' => $request->user()->id,
                'status' => 'dipinjam',
            ]);

            ItemHistory::record(
                $item,
                'dipinjam',
                "{$data['quantity']} unit dipinjam oleh {$data['borrower_name']}",
                null,
                ['loan_id' => $loan->id]
            );

            return $loan;
        });

        return response()->json($loan->load('item'), 201);
    }

    public function show(Loan $loan)
    {
        return $loan->load(['item', 'user:id,name']);
    }

    // POST /api/loans/{loan}/return  -> catat pengembalian
    public function returnLoan(Request $request, Loan $loan)
    {
        $data = $request->validate([
            'damaged_quantity' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
        ]);

        $damaged = $data['damaged_quantity'] ?? 0;

        $returnedLoan = DB::transaction(function () use ($loan, $damaged, $data) {
            // Lock loan first, then item. Re-read status inside the transaction
            // to prevent duplicate returns and double stock adjustments.
            $lockedLoan = Loan::lockForUpdate()->findOrFail($loan->id);

            if ($lockedLoan->status === 'dikembalikan') {
                throw ValidationException::withMessages([
                    'loan' => ['Peminjaman ini sudah dikembalikan.'],
                ]);
            }

            if ($damaged > $lockedLoan->quantity) {
                throw ValidationException::withMessages([
                    'damaged_quantity' => ['Jumlah rusak tidak boleh melebihi jumlah yang dipinjam.'],
                ]);
            }

            $item = Item::withTrashed()->lockForUpdate()->findOrFail($lockedLoan->item_id);

            if ($damaged > $item->quantity_good) {
                throw ValidationException::withMessages([
                    'damaged_quantity' => ['Jumlah kondisi baik pada data barang tidak mencukupi untuk perubahan kondisi ini.'],
                ]);
            }

            $lockedLoan->update([
                'status' => 'dikembalikan',
                'returned_at' => now(),
                'damaged_quantity' => $damaged,
                'notes' => $data['notes'] ?? $lockedLoan->notes,
            ]);

            // Barang yang kembali rusak pindah dari "baik" ke "rusak".
            if ($damaged > 0) {
                $item->quantity_good -= $damaged;
                $item->quantity_damaged += $damaged;
                $item->save();
            }

            ItemHistory::record(
                $item,
                'dikembalikan',
                "{$lockedLoan->quantity} unit dikembalikan oleh {$lockedLoan->borrower_name}" . ($damaged ? " ({$damaged} rusak)" : ''),
                null,
                ['loan_id' => $lockedLoan->id, 'damaged_quantity' => $damaged]
            );

            return $lockedLoan->fresh(['item']);
        });

        return $returnedLoan;
    }
}
