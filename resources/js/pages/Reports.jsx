import { useEffect, useState } from 'react';
import api, { errMsg, fmtDate } from '../lib/api';
import { Badge, Button, Empty, PageHeader, TableWrap, inputCls, tdCls, thCls, useToast } from '../components/ui';
import { downloadCsv } from '../lib/csv';

export default function Reports() {
    const [tab, setTab] = useState('inventory');

    return (
        <>
            <PageHeader title="Laporan" subtitle="Rekap data untuk dicetak atau diunduh">
                <div className="flex rounded-md border border-slate-300 bg-white p-0.5" role="tablist">
                    {[['inventory', 'Rekap barang'], ['loans', 'Rekap peminjaman']].map(([k, l]) => (
                        <button
                            key={k}
                            role="tab"
                            aria-selected={tab === k}
                            onClick={() => setTab(k)}
                            className={`cursor-pointer rounded px-3 py-1.5 text-sm font-medium ${tab === k ? 'bg-board-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </PageHeader>
            {tab === 'inventory' ? <InventoryReport /> : <LoanReport />}
        </>
    );
}

function InventoryReport() {
    const toast = useToast();
    const [rows, setRows] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState('');
    const [condition, setCondition] = useState('');

    useEffect(() => { api.get('/categories').then((r) => setCategories(r.data)); }, []);
    useEffect(() => {
        api.get('/reports/inventory', { params: { category_id: categoryId || undefined, condition: condition || undefined } })
            .then((r) => setRows(r.data))
            .catch((e) => toast.error(errMsg(e)));
    }, [categoryId, condition]);

    const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);

    const exportCsv = () =>
        downloadCsv('rekap-barang.csv',
            ['Kode', 'Nama', 'Kategori', 'Lokasi', 'Baik', 'Rusak', 'Dipinjam', 'Tersedia'],
            rows.map((r) => [r.code, r.name, r.category?.name, r.location, r.quantity_good, r.quantity_damaged, r.borrowed_quantity, r.available_quantity]));

    return (
        <>
            <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
                <select className={`${inputCls} max-w-48`} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Kategori">
                    <option value="">Semua kategori</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className={`${inputCls} max-w-48`} value={condition} onChange={(e) => setCondition(e.target.value)} aria-label="Kondisi">
                    <option value="">Semua kondisi</option>
                    <option value="baik">Ada yang baik</option>
                    <option value="rusak">Ada yang rusak</option>
                </select>
                <div className="ml-auto flex gap-2">
                    <Button variant="ghost" onClick={exportCsv} disabled={!rows.length}>Unduh CSV</Button>
                    <Button onClick={() => window.print()}>Cetak</Button>
                </div>
            </div>

            <h2 className="mb-3 hidden font-display text-xl font-bold print:block">Rekap Barang Inventaris Sekolah — {fmtDate(new Date())}</h2>
            <TableWrap>
                <table className="w-full">
                    <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                            <th className={thCls}>Kode</th><th className={thCls}>Nama</th><th className={thCls}>Kategori</th><th className={thCls}>Lokasi</th>
                            <th className={thCls}>Baik</th><th className={thCls}>Rusak</th><th className={thCls}>Dipinjam</th><th className={thCls}>Tersedia</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((r) => (
                            <tr key={r.id}>
                                <td className={`${tdCls} font-mono text-xs`}>{r.code}</td>
                                <td className={`${tdCls} font-medium`}>{r.name}</td>
                                <td className={tdCls}>{r.category?.name || '-'}</td>
                                <td className={tdCls}>{r.location || '-'}</td>
                                <td className={tdCls}>{r.quantity_good}</td>
                                <td className={tdCls}>{r.quantity_damaged}</td>
                                <td className={tdCls}>{r.borrowed_quantity}</td>
                                <td className={tdCls}>{r.available_quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                    {rows.length > 0 && (
                        <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                            <tr>
                                <td className={tdCls} colSpan="4">Total</td>
                                <td className={tdCls}>{sum('quantity_good')}</td>
                                <td className={tdCls}>{sum('quantity_damaged')}</td>
                                <td className={tdCls}>{sum('borrowed_quantity')}</td>
                                <td className={tdCls}>{sum('available_quantity')}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
                {rows.length === 0 && <Empty>Tidak ada data untuk filter ini.</Empty>}
            </TableWrap>
        </>
    );
}

function LoanReport() {
    const toast = useToast();
    const [report, setReport] = useState({ total: 0, total_units: 0, data: [] });
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        api.get('/reports/loans', { params: { from: from || undefined, to: to || undefined, status: status || undefined } })
            .then((r) => setReport(r.data))
            .catch((e) => toast.error(errMsg(e)));
    }, [from, to, status]);

    const exportCsv = () =>
        downloadCsv('rekap-peminjaman.csv',
            ['Barang', 'Jumlah', 'Peminjam', 'Kelas/NIS', 'Tgl pinjam', 'Jatuh tempo', 'Status', 'Dikembalikan', 'Rusak'],
            report.data.map((l) => [l.item?.name, l.quantity, l.borrower_name, l.borrower_identity, l.loan_date, l.due_date, l.status, l.returned_at ? l.returned_at.slice(0, 10) : '', l.damaged_quantity]));

    return (
        <>
            <div className="mb-4 flex flex-wrap items-end gap-3 print:hidden">
                <label className="text-sm"><span className="mb-1 block text-slate-600">Dari</span><input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
                <label className="text-sm"><span className="mb-1 block text-slate-600">Sampai</span><input type="date" className={inputCls} value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
                <label className="text-sm">
                    <span className="mb-1 block text-slate-600">Status</span>
                    <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="">Semua</option><option value="dipinjam">Dipinjam</option><option value="dikembalikan">Dikembalikan</option>
                    </select>
                </label>
                <div className="ml-auto flex gap-2">
                    <Button variant="ghost" onClick={exportCsv} disabled={!report.data.length}>Unduh CSV</Button>
                    <Button onClick={() => window.print()}>Cetak</Button>
                </div>
            </div>

            <h2 className="mb-3 hidden font-display text-xl font-bold print:block">Rekap Peminjaman Barang {from && `${fmtDate(from)} – ${to ? fmtDate(to) : 'sekarang'}`}</h2>
            <p className="mb-3 text-sm text-slate-600">{report.total} peminjaman · {report.total_units} unit</p>
            <TableWrap>
                <table className="w-full">
                    <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                            <th className={thCls}>Barang</th><th className={thCls}>Jumlah</th><th className={thCls}>Peminjam</th><th className={thCls}>Tgl pinjam</th>
                            <th className={thCls}>Jatuh tempo</th><th className={thCls}>Dikembalikan</th><th className={thCls}>Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {report.data.map((l) => (
                            <tr key={l.id}>
                                <td className={`${tdCls} font-medium`}>{l.item?.name}</td>
                                <td className={tdCls}>{l.quantity}</td>
                                <td className={tdCls}>{l.borrower_name}{l.borrower_identity && <span className="text-slate-500"> · {l.borrower_identity}</span>}</td>
                                <td className={tdCls}>{fmtDate(l.loan_date)}</td>
                                <td className={tdCls}>{fmtDate(l.due_date)}</td>
                                <td className={tdCls}>{l.returned_at ? fmtDate(l.returned_at) : '-'}</td>
                                <td className={tdCls}><Badge tone={l.status === 'dikembalikan' ? 'green' : l.is_overdue ? 'red' : 'blue'}>{l.status === 'dipinjam' && l.is_overdue ? 'terlambat' : l.status}</Badge></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {report.data.length === 0 && <Empty>Tidak ada peminjaman pada rentang ini.</Empty>}
            </TableWrap>
        </>
    );
}
