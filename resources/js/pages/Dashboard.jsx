import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, fmtDate } from '../lib/api';
import { Badge, PageHeader, useToast } from '../components/ui';

export default function Dashboard() {
    const toast = useToast();
    const [s, setS] = useState(null);
    const [overdue, setOverdue] = useState([]);

    useEffect(() => {
        api.get('/reports/summary').then((r) => setS(r.data)).catch((e) => toast.error(errMsg(e)));
        api.get('/loans', { params: { status: 'terlambat', per_page: 5 } }).then((r) => setOverdue(r.data.data)).catch(() => {});
    }, []);

    if (!s) return <p className="text-sm text-slate-500">Memuat data…</p>;

    const stats = [
        { label: 'Jenis barang', value: s.total_item_types },
        { label: 'Total unit', value: s.total_units },
        { label: 'Kondisi baik', value: s.units_good, color: 'text-emerald-700' },
        { label: 'Kondisi rusak', value: s.units_damaged, color: 'text-red-600' },
        { label: 'Sedang dipinjam', value: s.units_borrowed },
        { label: 'Terlambat', value: s.overdue_loans, color: s.overdue_loans ? 'text-red-600' : '' },
    ];
    const max = Math.max(1, ...s.by_category.map((c) => (c.units_good || 0) + (c.units_damaged || 0)));

    return (
        <>
            <PageHeader title="Dasbor" subtitle="Ringkasan kondisi inventaris saat ini" />

            <dl className="grid grid-cols-2 divide-x divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-3 xl:grid-cols-6 xl:divide-y-0">
                {stats.map((x) => (
                    <div key={x.label} className="px-5 py-4">
                        <dt className="text-xs font-medium text-slate-500">{x.label}</dt>
                        <dd className={`mt-1 font-display text-3xl font-bold ${x.color || 'text-board-900'}`}>{x.value}</dd>
                    </div>
                ))}
            </dl>

            <div className="mt-8 grid gap-8 xl:grid-cols-2">
                <section>
                    <h2 className="mb-3 font-display text-lg font-bold text-board-900">Unit per kategori</h2>
                    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
                        {s.by_category.length === 0 && <p className="text-sm text-slate-500">Belum ada kategori.</p>}
                        {s.by_category.map((c) => {
                            const good = c.units_good || 0;
                            const bad = c.units_damaged || 0;
                            return (
                                <div key={c.id}>
                                    <div className="mb-1 flex justify-between text-sm">
                                        <span className="font-medium">{c.name}</span>
                                        <span className="text-slate-500">{good} baik · {bad} rusak</span>
                                    </div>
                                    <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                                        <div className="bg-board-700" style={{ width: `${(good / max) * 100}%` }} />
                                        <div className="bg-red-500" style={{ width: `${(bad / max) * 100}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section>
                    <div className="mb-3 flex items-baseline justify-between">
                        <h2 className="font-display text-lg font-bold text-board-900">Peminjaman terlambat</h2>
                        <Link to="/loans" className="text-sm font-semibold text-board-700 hover:underline">Lihat semua</Link>
                    </div>
                    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                        {overdue.length === 0 && <p className="p-5 text-sm text-slate-500">Tidak ada peminjaman yang terlambat.</p>}
                        {overdue.map((l) => (
                            <div key={l.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                                <div>
                                    <div className="font-medium">{l.item?.name} <span className="text-slate-500">× {l.quantity}</span></div>
                                    <div className="text-slate-500">{l.borrower_name}</div>
                                </div>
                                <Badge tone="red">Jatuh tempo {fmtDate(l.due_date)}</Badge>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}
