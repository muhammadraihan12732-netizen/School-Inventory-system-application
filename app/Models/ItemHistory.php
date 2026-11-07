<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemHistory extends Model
{
    protected $fillable = ['item_id', 'user_id', 'action', 'description', 'old_data', 'new_data'];

    protected $casts = [
        'old_data' => 'array',
        'new_data' => 'array',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class)->withTrashed();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Helper untuk mencatat riwayat dengan satu baris
    public static function record(Item $item, string $action, ?string $description = null, ?array $old = null, ?array $new = null): self
    {
        return static::create([
            'item_id' => $item->id,
            'user_id' => auth()->id(),
            'action' => $action,
            'description' => $description,
            'old_data' => $old,
            'new_data' => $new,
        ]);
    }
}
