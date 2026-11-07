<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The first version of this project used "admin" as the role default.
        // Downgrade existing accounts so legacy/default roles cannot retain
        // administrator privileges. Preserve only the explicitly configured
        // administrator email; DatabaseSeeder creates it if it does not exist.
        $adminEmail = (string) (config('inventory.seed_accounts.admin.email') ?: 'admin@sekolah.test');

        DB::table('users')->update(['role' => 'petugas']);
        DB::table('users')->where('email', $adminEmail)->update(['role' => 'admin']);

        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('petugas')->change();
        });
    }

    public function down(): void
    {
        // Intentionally keep the least-privilege default during rollback.
        // Reverting to an "admin" default would silently grant excessive access.
    }
};
