<?php

use Illuminate\Support\Facades\Route;

// Semua URL non-API diserahkan ke React (React Router yang menangani halaman)
Route::view('/{any?}', 'app')->where('any', '^(?!api).*$');
