<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\ItemHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ItemController extends Controller
{
    // GET /api/items?search=&category_id=&condition=baik|rusak&per_page=10
    public function index(Request $request)
    {
        $request->validate([
            'search' => 'nullable|string|max:100',
            'category_id' => 'nullable|integer|exists:categories,id',
            'condition' => 'nullable|in:baik,rusak',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $items = Item::with('category')
            ->withSum(['loans as active_loans_sum_quantity' => fn ($q) => $q->where('status', 'dipinjam')], 'quantity')
            ->search($request->search)
            ->when($request->category_id, fn ($q, $v) => $q->where('category_id', $v))
            ->when($request->condition === 'baik', fn ($q) => $q->where('quantity_good', '>', 0))
            ->when($request->condition === 'rusak', fn ($q) => $q->where('quantity_damaged', '>', 0))
            ->latest()
            ->paginate($request->integer('per_page', 10));

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => 'nullable|exists:categories,id',
            'code' => 'required|string|max:50|unique:items,code',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'quantity_good' => 'required|integer|min:0',
            'quantity_damaged' => 'required|integer|min:0',
            'location' => 'nullable|string|max:100',
            'purchase_date' => 'nullable|date',
        ]);

        $item = DB::transaction(function () use ($data) {
            $created = Item::create($data);
            ItemHistory::record(
                $created,
                'dibuat',
                "Barang {$created->name} ditambahkan",
                null,
                $created->only(array_keys($data))
            );

            return $created->load('category');
        });

        return response()->json($item, 201);
    }

    public function show(Item $item)
    {
        return $item->load(['category', 'histories.user']);
    }

    public function update(Request $request, Item $item)
    {
        $data = $request->validate([
            'category_id' => 'nullable|exists:categories,id',
            'code' => 'required|string|max:50|unique:items,code,' . $item->id,
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'quantity_good' => 'required|integer|min:0',
            'quantity_damaged' => 'required|integer|min:0',
            'location' => 'nullable|string|max:100',
            'purchase_date' => 'nullable|date',
        ]);

        // Lock the row so inventory edits cannot race with a new loan.
        $updated = DB::transaction(function () use ($item, $data) {
            $lockedItem = Item::lockForUpdate()->findOrFail($item->id);
            $borrowed = $lockedItem->loans()->where('status', 'dipinjam')->sum('quantity');

            if ($data['quantity_good'] < $borrowed) {
                throw ValidationException::withMessages([
                    'quantity_good' => ["Sedang ada {$borrowed} unit yang dipinjam, jumlah baik tidak boleh kurang dari itu."],
                ]);
            }

            $lockedItem->fill($data);
            $changes = $lockedItem->getDirty();

            if ($changes) {
                $old = collect($changes)->mapWithKeys(
                    fn ($value, $key) => [$key => $lockedItem->getOriginal($key)]
                )->all();
                $lockedItem->save();
                ItemHistory::record(
                    $lockedItem,
                    'diubah',
                    "Data barang {$lockedItem->name} diubah",
                    $old,
                    $changes
                );
            }

            return $lockedItem->load('category');
        });

        return $updated;
    }

    public function destroy(Item $item)
    {
        DB::transaction(function () use ($item) {
            $lockedItem = Item::lockForUpdate()->findOrFail($item->id);

            if ($lockedItem->loans()->where('status', 'dipinjam')->exists()) {
                throw ValidationException::withMessages([
                    'item' => ['Barang masih dipinjam, tidak bisa dihapus.'],
                ]);
            }

            ItemHistory::record($lockedItem, 'dihapus', "Barang {$lockedItem->name} dihapus");
            $lockedItem->delete(); // soft delete, riwayat tetap tersimpan
        });

        return response()->json(['message' => 'Barang dihapus']);
    }
}
