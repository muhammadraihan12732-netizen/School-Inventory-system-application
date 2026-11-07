<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Loan extends Model
{
    protected $fillable = [
        'item_id', 'user_id', 'borrower_name', 'borrower_identity',
        'quantity', 'loan_date', 'due_date', 'returned_at',
        'damaged_quantity', 'status', 'notes',
    ];

    protected $casts = [
        'loan_date' => 'date:Y-m-d',
        'due_date' => 'date:Y-m-d',
        'returned_at' => 'datetime',
    ];

    protected $appends = ['is_overdue'];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class)->withTrashed();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'dipinjam');
    }

    public function scopeOverdue($query)
    {
        return $query->active()->whereDate('due_date', '<', now()->toDateString());
    }

    public function getIsOverdueAttribute(): bool
    {
        return $this->status === 'dipinjam' && $this->due_date->lt(now()->startOfDay());
    }
}
