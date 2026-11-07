<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItemHistory;
use Illuminate\Http\Request;

class ItemHistoryController extends Controller
{
    // GET /api/histories?item_id=&action=&per_page=
    public function index(Request $request)
    {
        $request->validate([
            'item_id' => 'nullable|integer',
            'action' => 'nullable|in:dibuat,diubah,dihapus,dipinjam,dikembalikan',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $histories = ItemHistory::with(['item:id,code,name,deleted_at', 'user:id,name'])
            ->when($request->item_id, fn ($q, $v) => $q->where('item_id', $v))
            ->when($request->action, fn ($q, $v) => $q->where('action', $v))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return response()->json($histories);
    }
}
