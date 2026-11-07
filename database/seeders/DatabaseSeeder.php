<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $adminEmail = (string) (config('inventory.seed_accounts.admin.email') ?: 'admin@sekolah.test');
        $petugasEmail = (string) (config('inventory.seed_accounts.petugas.email') ?: 'petugas@sekolah.test');

        if (strcasecmp($adminEmail, $petugasEmail) === 0) {
            throw new InvalidArgumentException('Email admin dan petugas harus berbeda. Periksa INVENTORY_ADMIN_EMAIL dan INVENTORY_PETUGAS_EMAIL.');
        }

        DB::transaction(function () use ($adminEmail, $petugasEmail): void {
            $this->ensureSeedUser(
                email: $adminEmail,
                name: 'Admin Sekolah',
                role: User::ROLE_ADMIN,
                password: (string) (config('inventory.seed_accounts.admin.password') ?: 'admin12345'),
            );

            $this->ensureSeedUser(
                email: $petugasEmail,
                name: 'Petugas Inventaris',
                role: User::ROLE_PETUGAS,
                password: (string) (config('inventory.seed_accounts.petugas.password') ?: 'petugas12345'),
            );

            $elektronik = Category::firstOrCreate(['name' => 'Elektronik']);
            $furnitur = Category::firstOrCreate(['name' => 'Furnitur']);
            Category::firstOrCreate(['name' => 'Alat Olahraga']);

            Item::firstOrCreate(['code' => 'BRG-001'], [
                'category_id' => $elektronik->id,
                'name' => 'Proyektor',
                'quantity_good' => 5,
                'quantity_damaged' => 1,
                'location' => 'Ruang Guru',
            ]);

            Item::firstOrCreate(['code' => 'BRG-002'], [
                'category_id' => $furnitur->id,
                'name' => 'Kursi Siswa',
                'quantity_good' => 40,
                'quantity_damaged' => 3,
                'location' => 'Gudang',
            ]);
        });
    }

    /**
     * Create demo users without resetting an existing user's password every
     * time `php artisan db:seed` is executed. Roles are reasserted deliberately.
     */
    private function ensureSeedUser(string $email, string $name, string $role, string $password): void
    {
        $user = User::firstOrNew(['email' => $email]);

        if (! $user->exists) {
            $user->password = $password; // User model's hashed cast hashes this value.
        }

        $user->name = $name;
        $user->role = $role;
        $user->save();
    }
}
