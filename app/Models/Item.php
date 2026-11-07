<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'category_id', 'code', 'name', 'description',
        'quantity_good', 'quantity_damaged', 'location', 'purchase_date',
    ];

    protected $casts = [
        'purchase_date' => 'date:Y-m-d',
    ];

    protected $appends = ['total_quantity', 'borrowed_quantity', 'available_quantity'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(ItemHistory::class)->latest();
    }

    public function getTotalQuantityAttribute(): int
    {
        return $this->quantity_good + $this->quantity_damaged;
    }

    // Jumlah yang sedang dipinjam. Pakai hasil withSum kalau ada (hindari N+1).
    public function getBorrowedQuantityAttribute(): int
    {
        return (int) ($this->attributes['active_loans_sum_quantity']
            ?? $this->loans()->where('status', 'dipinjam')->sum('quantity'));
    }

    // Stok yang bisa dipinjam = kondisi baik - yang sedang dipinjam
    public function getAvailableQuantityAttribute(): int
    {
        return max(0, $this->quantity_good - $this->borrowed_quantity);
    }

    // Scope pencarian: nama, kode, lokasi
    public function scopeSearch($query, ?string $keyword)
    {
        return $query->when($keyword, function ($q) use ($keyword) {
            $q->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                  ->orWhere('code', 'like', "%{$keyword}%")
                  ->orWhere('location', 'like', "%{$keyword}%");
            });
        });
    }
}
