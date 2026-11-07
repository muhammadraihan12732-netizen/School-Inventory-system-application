<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InventoryAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role): User
    {
        return User::create([
            'name' => ucfirst($role) . ' Test',
            'email' => $role . '-' . uniqid() . '@example.test',
            'password' => 'password-test-123',
            'role' => $role,
        ]);
    }

    private function makeItem(): Item
    {
        return Item::create([
            'code' => 'TEST-' . strtoupper(substr(uniqid(), -8)),
            'name' => 'Barang Uji',
            'quantity_good' => 10,
            'quantity_damaged' => 0,
        ]);
    }

    public function test_every_inventory_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/items')->assertUnauthorized();
        $this->getJson('/api/reports/summary')->assertUnauthorized();
        $this->getJson('/api/histories')->assertUnauthorized();
    }

    public function test_petugas_can_manage_items_but_cannot_delete_them(): void
    {
        $petugas = $this->makeUser(User::ROLE_PETUGAS);
        Sanctum::actingAs($petugas);

        $this->postJson('/api/items', [
            'code' => 'PETUGAS-001',
            'name' => 'Laptop Lab',
            'quantity_good' => 4,
            'quantity_damaged' => 1,
        ])->assertCreated();

        $item = $this->makeItem();

        $this->putJson('/api/items/' . $item->id, [
            'code' => $item->code,
            'name' => 'Barang Uji Diperbarui',
            'quantity_good' => 10,
            'quantity_damaged' => 0,
        ])->assertOk();

        $this->deleteJson('/api/items/' . $item->id)->assertForbidden();
        $this->assertDatabaseHas('items', ['id' => $item->id, 'deleted_at' => null]);
    }

    public function test_petugas_can_read_categories_but_cannot_change_them(): void
    {
        $petugas = $this->makeUser(User::ROLE_PETUGAS);
        Sanctum::actingAs($petugas);
        $category = Category::create(['name' => 'Kategori Uji']);

        $this->getJson('/api/categories')->assertOk();
        $this->postJson('/api/categories', ['name' => 'Kategori Baru'])->assertForbidden();
        $this->deleteJson('/api/categories/' . $category->id)->assertForbidden();
    }

    public function test_admin_can_delete_an_item(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN);
        Sanctum::actingAs($admin);
        $item = $this->makeItem();

        $this->deleteJson('/api/items/' . $item->id)->assertOk();
        $this->assertSoftDeleted('items', ['id' => $item->id]);
    }


    public function test_new_users_default_to_the_least_privileged_role(): void
    {
        $user = User::create([
            'name' => 'Default Role User',
            'email' => 'default-role@example.test',
            'password' => 'password-test-123',
        ]);

        $this->assertSame(User::ROLE_PETUGAS, $user->fresh()->role);
    }

    public function test_petugas_can_view_reports_and_histories(): void
    {
        Sanctum::actingAs($this->makeUser(User::ROLE_PETUGAS));

        $this->getJson('/api/reports/summary')->assertOk();
        $this->getJson('/api/reports/inventory')->assertOk();
        $this->getJson('/api/reports/loans')->assertOk();
        $this->getJson('/api/histories')->assertOk();
    }

    public function test_login_accepts_petugas_and_returns_only_safe_user_fields(): void
    {
        $user = $this->makeUser(User::ROLE_PETUGAS);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password-test-123',
        ])->assertOk();

        $response->assertJsonPath('user.role', User::ROLE_PETUGAS);
        $response->assertJsonMissingPath('user.password');
        $this->assertNotEmpty($response->json('token'));
    }

    public function test_accounts_with_unknown_roles_cannot_log_in(): void
    {
        $user = $this->makeUser('pengamat');

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password-test-123',
        ])->assertForbidden()->assertJsonMissingPath('token');
    }

    public function test_seeder_creates_both_roles_and_does_not_reset_existing_passwords(): void
    {
        $this->seed();

        $adminEmail = config('inventory.seed_accounts.admin.email') ?: 'admin@sekolah.test';
        $petugasEmail = config('inventory.seed_accounts.petugas.email') ?: 'petugas@sekolah.test';

        $this->assertDatabaseHas('users', [
            'email' => $adminEmail,
            'role' => User::ROLE_ADMIN,
        ]);
        $this->assertDatabaseHas('users', [
            'email' => $petugasEmail,
            'role' => User::ROLE_PETUGAS,
        ]);

        $admin = User::where('email', $adminEmail)->firstOrFail();
        $admin->password = 'password-yang-sudah-diganti';
        $admin->save();

        $this->seed();

        $admin->refresh();
        $this->assertTrue(Hash::check('password-yang-sudah-diganti', $admin->password));
    }
}
