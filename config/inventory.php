<?php

return [
    'seed_accounts' => [
        'admin' => [
            'email' => env('INVENTORY_ADMIN_EMAIL', 'admin@sekolah.test'),
            'password' => env('INVENTORY_ADMIN_PASSWORD', 'admin12345'),
        ],
        'petugas' => [
            'email' => env('INVENTORY_PETUGAS_EMAIL', 'petugas@sekolah.test'),
            'password' => env('INVENTORY_PETUGAS_PASSWORD', 'petugas12345'),
        ],
    ],
];
