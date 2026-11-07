<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\ItemHistoryController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Middleware\EnsureRole;
use Illuminate\Support\Facades\Route;

// Login publik, dibatasi untuk mengurangi percobaan password berulang.
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Semua endpoint di bawah wajib memakai token Sanctum dan role yang dikenal.
Route::middleware([
    'auth:sanctum',
    EnsureRole::class . ':admin,petugas',
])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Barang: admin dan petugas boleh membaca, menambah, serta mengubah.
    // Penghapusan hanya boleh dilakukan admin.
    Route::get('/items', [ItemController::class, 'index']);
    Route::post('/items', [ItemController::class, 'store']);
    Route::get('/items/{item}', [ItemController::class, 'show']);
    Route::put('/items/{item}', [ItemController::class, 'update']);
    Route::patch('/items/{item}', [ItemController::class, 'update']);
    Route::delete('/items/{item}', [ItemController::class, 'destroy'])
        ->middleware(EnsureRole::class . ':admin');

    // Kategori: semua staf dapat melihat; hanya admin dapat mengelola.
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);
    Route::post('/categories', [CategoryController::class, 'store'])
        ->middleware(EnsureRole::class . ':admin');
    Route::put('/categories/{category}', [CategoryController::class, 'update'])
        ->middleware(EnsureRole::class . ':admin');
    Route::patch('/categories/{category}', [CategoryController::class, 'update'])
        ->middleware(EnsureRole::class . ':admin');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])
        ->middleware(EnsureRole::class . ':admin');

    // Peminjaman dan pengembalian boleh diproses admin maupun petugas.
    Route::get('/loans', [LoanController::class, 'index']);
    Route::post('/loans', [LoanController::class, 'store']);
    Route::get('/loans/{loan}', [LoanController::class, 'show']);
    Route::post('/loans/{loan}/return', [LoanController::class, 'returnLoan']);

    // Riwayat dan laporan hanya tersedia untuk pengguna yang sudah login
    // dan memiliki role admin/petugas.
    Route::get('/histories', [ItemHistoryController::class, 'index']);

    Route::prefix('reports')->group(function () {
        Route::get('/summary', [ReportController::class, 'summary']);
        Route::get('/inventory', [ReportController::class, 'inventory']);
        Route::get('/loans', [ReportController::class, 'loans']);
    });
});
