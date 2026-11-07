<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // admin pencatat
            $table->string('borrower_name');
            $table->string('borrower_identity')->nullable();  // kelas / NIS / NIP
            $table->unsignedInteger('quantity');
            $table->date('loan_date');
            $table->date('due_date');
            $table->timestamp('returned_at')->nullable();
            $table->unsignedInteger('damaged_quantity')->default(0); // jumlah rusak saat dikembalikan
            $table->enum('status', ['dipinjam', 'dikembalikan'])->default('dipinjam');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
