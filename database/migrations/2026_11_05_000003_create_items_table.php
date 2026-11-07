<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code')->unique();               // kode barang, mis. BRG-001
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('quantity_good')->default(0);     // jumlah kondisi baik
            $table->unsignedInteger('quantity_damaged')->default(0);  // jumlah kondisi rusak
            $table->string('location')->nullable();         // mis. Lab RPL, Gudang
            $table->date('purchase_date')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
