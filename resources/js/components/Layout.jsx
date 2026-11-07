import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const nav = [
    { to: '/', label: 'Dasbor', end: true },
    { to: '/items', label: 'Barang' },
    { to: '/categories', label: 'Kategori' },
    { to: '/loans', label: 'Peminjaman' },
    { to: '/histories', label: 'Riwayat' },
    { to: '/reports', label: 'Laporan' },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);

    return (
        <div className="min-h-screen">
            <div className="sticky top-0 z-30 flex items-center justify-between bg-board-900 px-4 py-3 text-chalk lg:hidden print:hidden">
                <span className="font-display text-lg font-bold">Inventaris Sekolah</span>
                <button onClick={() => setOpen(!open)} className="cursor-pointer rounded border border-chalk/30 px-3 py-1 text-sm" aria-expanded={open}>
                    Menu
                </button>
            </div>

            <aside className={`${open ? 'block' : 'hidden'} bg-board-900 text-chalk lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:w-60 print:hidden`}>
                <div className="flex h-full flex-col px-4 py-6">
                    <div className="mb-8 hidden px-2 lg:block">
                        <div className="font-display text-2xl font-extrabold leading-tight">Inventaris<br />Sekolah</div>
                    </div>
                    <nav className="flex flex-1 flex-col gap-1">
                        {nav.map((n) => (
                            <NavLink
                                key={n.to}
                                to={n.to}
                                end={n.end}
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    `rounded-md border-l-4 px-3 py-2 text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'border-mark bg-board-800 text-white'
                                            : 'border-transparent text-chalk/75 hover:bg-board-800/60 hover:text-white'
                                    }`
                                }
                            >
                                {n.label}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="mt-6 border-t border-chalk/15 px-2 pt-4 text-sm">
                        <div className="font-medium text-white">{user?.name}</div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-mark">{user?.role === 'admin' ? 'Administrator' : 'Petugas'}</div>
                        <div className="truncate text-xs text-chalk/60">{user?.email}</div>
                        <button onClick={logout} className="mt-3 cursor-pointer text-sm font-semibold text-mark hover:underline">
                            Keluar
                        </button>
                    </div>
                </div>
            </aside>

            <main className="px-4 py-6 sm:px-8 lg:ml-60 lg:py-8 print:ml-0 print:p-0">
                <Outlet />
            </main>
        </div>
    );
}
