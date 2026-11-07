<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restrict a request to one or more explicitly allowed user roles.
 *
 * Usage in routes: EnsureRole::class . ':admin,petugas'
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        // Normally auth:sanctum returns 401 before this middleware runs.
        if (! $user) {
            return response()->json([
                'message' => 'Anda harus login untuk mengakses sumber daya ini.',
            ], 401);
        }

        $allowedRoles = array_values(array_filter(array_map('trim', $roles)));

        // Fail closed: a missing/empty role allow-list must never grant access.
        if ($allowedRoles === [] || ! in_array((string) $user->role, $allowedRoles, true)) {
            return response()->json([
                'message' => 'Akses ditolak. Role Anda tidak memiliki wewenang untuk tindakan ini.',
            ], 403);
        }

        return $next($request);
    }
}
