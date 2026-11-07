import { useCallback, useEffect, useState } from 'react';
import api, { errMsg, fieldErrors, fmtDate } from '../lib/api';
import { Badge, Button, Empty, Field, Modal, PageHeader, Pagination, TableWrap, inputCls, tdCls, thCls, useDebounce, useToast } from '../components/ui';

const tabs = [
    { key: '', label: 'Semua' },
    { key: 'dipinjam', label: 'Dipinjam' },
    { key: 'terlambat', label: 'Terlambat' },
    { key: 'dikembalikan', label: 'Dikembalikan' },
];

const today = () => new Date().toISOString().slice(0, 10);

export default function Loans() {
    const toast = useToast();
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const q = useDebounce(search);
    const [page, setPage] = useState(1);
    const [creating, setCreating] = useState(false);
    const [returning, setReturning] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/loans', { params: { status: status || undefined, search: q || undefined, page } });
            setRows(data.data);
            setMeta(data);
        } catch (e) {
            toast.error(errMsg(e));
        } finally {
            setLoading(false);
        }
    }, [status, q, page]);

    useEffect(() => { setPage(1); }, [status, q]);
    useEffect(() => { load(); }, [load]);

    return (
        <>
            <PageHeader title="Peminjaman" subtitle="Catat barang yang dipinjam dan dikembalikan">
                <Button variant="accent" onClick={() => setCreating(true)}>Catat peminjaman</Button>
            </PageHeader>

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex rounded-md border border-slate-300 bg-white p-0.5" role="tablist">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={status === t.key}
                            onClick={() => setStatus(t.key)}
                            className={`cursor-pointer rounded px-3 py-1.5 text-sm font-medium ${status === t.key ? 'bg-board-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <input className={`${inputCls} max-w-xs`} placeholder="Cari peminjam atau barang" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Cari peminjaman" />
            </div>

            <TableWrap>
                <table className="w-full">
                    <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                            <th className={thCls}>Barang</th><th className={thCls}>Jumlah</th><th className={thCls}>Peminjam</th>
                            <th className={thCls}>Tgl pinjam</th><th className={thCls}>Jatuh tempo</th><th className={thCls}>Status</th><th className={thCls}></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((l) => (
                            <tr key={l.id} className="hover:bg-slate-50">
                                <td className={`${tdCls} font-medium`}>{l.item?.name}</td>
                                <td className={tdCls}>{l.quantity}</td>
                                <td className={tdCls}>
                                    {l.borrower_name}
                                    {l.borrower_identity && <div className="text-xs text-slate-500">{l.borrower_identity}</div>}
                                </td>
                                <td className={tdCls}>{fmtDate(l.loan_date)}</td>
                                <td className={tdCls}>{fmtDate(l.due_date)}</td>
                                <td className={tdCls}>
                                    {l.status === 'dikembalikan' ? (
                                        <Badge tone="green">Dikembalikan{l.damaged_quantity > 0 ? ` (${l.damaged_quantity} rusak)` : ''}</Badge>
                                    ) : l.is_overdue ? (
                                        <Badge tone="red">Terlambat</Badge>
                                    ) : (
                                        <Badge tone="blue">Dipinjam</Badge>
                                    )}
                                </td>
                                <td className={`${tdCls} text-right`}>
                                    {l.status === 'dipinjam' && (
                                        <button className="cursor-pointer font-semibold text-board-700 hover:underline" onClick={() => setReturning(l)}>Kembalikan</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && rows.length === 0 && <Empty>Tidak ada data peminjaman.</Empty>}
                {loading && <Empty>Memuat…</Empty>}
            </TableWrap>
            <Pagination meta={meta} onPage={setPage} />

            {creating && <LoanForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); toast.success('Peminjaman dicatat'); load(); }} />}
            {returning && <ReturnForm loan={returning} onClose={() => setReturning(null)} onSaved={() => { setReturning(null); toast.success('Barang dikembalikan'); load(); }} />}
        </>
    );
}

function LoanForm({ onClose, onSaved }) {
    const [items, setItems] = useState([]);
    const [f, setF] = useState({ item_id: '', borrower_name: '', borrower_identity: '', quantity: 1, loan_date: today(), due_date: today(), notes: '' });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

    useEffect(() => {
        api.get('/items', { params: { per_page: 500 } }).then((r) => setItems(r.data.data.filter((i) => i.available_quantity > 0)));
    }, []);

    const selected = items.find((i) => String(i.id) === String(f.item_id));

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});
        try {
            await api.post('/loans', { ...f, quantity: Number(f.quantity), borrower_identity: f.borrower_identity || null, notes: f.notes || null });
            onSaved();
        } catch (err) {
            setErrors(fieldErrors(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal title="Catat peminjaman" onClose={onClose} wide>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Field label="Barang" error={errors.item_id}>
                        <select className={inputCls} value={f.item_id} onChange={set('item_id')} required>
                            <option value="">Pilih barang</option>
                            {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.code}) — tersedia {i.available_quantity}</option>)}
                        </select>
                    </Field>
                </div>
                <Field label="Nama peminjam" error={errors.borrower_name}><input className={inputCls} value={f.borrower_name} onChange={set('borrower_name')} required /></Field>
                <Field label="Kelas / NIS / NIP" error={errors.borrower_identity}><input className={inputCls} value={f.borrower_identity} onChange={set('borrower_identity')} placeholder="XI RPL 1" /></Field>
                <Field label="Jumlah" error={errors.quantity} hint={selected ? `Maksimal ${selected.available_quantity} unit` : undefined}>
                    <input type="number" min="1" max={selected?.available_quantity} className={inputCls} value={f.quantity} onChange={set('quantity')} required />
                </Field>
                <div className="hidden sm:block" />
                <Field label="Tanggal pinjam" error={errors.loan_date}><input type="date" className={inputCls} value={f.loan_date} onChange={set('loan_date')} required /></Field>
                <Field label="Jatuh tempo" error={errors.due_date}><input type="date" min={f.loan_date} className={inputCls} value={f.due_date} onChange={set('due_date')} required /></Field>
                <div className="sm:col-span-2">
                    <Field label="Catatan" error={errors.notes}><textarea rows="2" className={inputCls} value={f.notes} onChange={set('notes')} /></Field>
                </div>
                <div className="flex justify-end gap-2 sm:col-span-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
                    <Button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Catat peminjaman'}</Button>
                </div>
            </form>
        </Modal>
    );
}

function ReturnForm({ loan, onClose, onSaved }) {
    const [damaged, setDamaged] = useState(0);
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});
        try {
            await api.post(`/loans/${loan.id}/return`, { damaged_quantity: Number(damaged), notes: notes || null });
            onSaved();
        } catch (err) {
            setErrors(fieldErrors(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal title="Kembalikan barang" onClose={onClose}>
            <p className="mb-4 text-sm text-slate-700">
                {loan.quantity} unit <strong>{loan.item?.name}</strong> dari {loan.borrower_name}.
            </p>
            <form onSubmit={submit} className="space-y-4">
                <Field label="Berapa unit yang kembali dalam kondisi rusak?" error={errors.damaged_quantity || errors.loan} hint="Isi 0 jika semuanya masih baik.">
                    <input type="number" min="0" max={loan.quantity} className={inputCls} value={damaged} onChange={(e) => setDamaged(e.target.value)} />
                </Field>
                <Field label="Catatan"><textarea rows="2" className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
                    <Button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan pengembalian'}</Button>
                </div>
            </form>
        </Modal>
    );
}
