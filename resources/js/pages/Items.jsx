import { useCallback, useEffect, useState } from 'react';
import api, { errMsg, fieldErrors } from '../lib/api';
import { Badge, Button, ConfirmDialog, Empty, Field, Modal, PageHeader, Pagination, TableWrap, inputCls, tdCls, thCls, useDebounce, useToast } from '../components/ui';
import { useAuth } from '../lib/auth';

const emptyForm = {
    code: '', name: '', category_id: '', description: '',
    quantity_good: 0, quantity_damaged: 0, location: '', purchase_date: '',
};

export default function Items() {
    const toast = useToast();
    const { user } = useAuth();
    const canDelete = user?.role === 'admin';
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const q = useDebounce(search);
    const [categoryId, setCategoryId] = useState('');
    const [condition, setCondition] = useState('');
    const [page, setPage] = useState(1);
    const [editing, setEditing] = useState(null); // null = tertutup, {} = baru
    const [toDelete, setToDelete] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/items', {
                params: { search: q || undefined, category_id: categoryId || undefined, condition: condition || undefined, page },
            });
            setRows(data.data);
            setMeta(data);
        } catch (e) {
            toast.error(errMsg(e));
        } finally {
            setLoading(false);
        }
    }, [q, categoryId, condition, page]);

    useEffect(() => { api.get('/categories').then((r) => setCategories(r.data)); }, []);
    useEffect(() => { setPage(1); }, [q, categoryId, condition]);
    useEffect(() => { load(); }, [load]);

    const remove = async () => {
        setBusy(true);
        try {
            await api.delete(`/items/${toDelete.id}`);
            toast.success('Barang dihapus');
            setToDelete(null);
            load();
        } catch (e) {
            toast.error(errMsg(e));
            setToDelete(null);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <PageHeader title="Barang" subtitle="Daftar semua barang inventaris sekolah">
                <Button variant="accent" onClick={() => setEditing({})}>Tambah barang</Button>
            </PageHeader>

            <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <input className={inputCls} placeholder="Cari nama, kode, atau lokasi" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Cari barang" />
                <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Filter kategori">
                    <option value="">Semua kategori</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className={inputCls} value={condition} onChange={(e) => setCondition(e.target.value)} aria-label="Filter kondisi">
                    <option value="">Semua kondisi</option>
                    <option value="baik">Ada yang baik</option>
                    <option value="rusak">Ada yang rusak</option>
                </select>
            </div>

            <TableWrap>
                <table className="w-full">
                    <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                            <th className={thCls}>Kode</th><th className={thCls}>Nama</th><th className={thCls}>Kategori</th>
                            <th className={thCls}>Lokasi</th><th className={thCls}>Baik</th><th className={thCls}>Rusak</th>
                            <th className={thCls}>Dipinjam</th><th className={thCls}>Tersedia</th><th className={thCls}></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((i) => (
                            <tr key={i.id} className="hover:bg-slate-50">
                                <td className={`${tdCls} font-mono text-xs`}>{i.code}</td>
                                <td className={`${tdCls} font-medium`}>{i.name}</td>
                                <td className={tdCls}>{i.category?.name || '-'}</td>
                                <td className={tdCls}>{i.location || '-'}</td>
                                <td className={tdCls}><Badge tone="green">{i.quantity_good}</Badge></td>
                                <td className={tdCls}>{i.quantity_damaged > 0 ? <Badge tone="red">{i.quantity_damaged}</Badge> : 0}</td>
                                <td className={tdCls}>{i.borrowed_quantity}</td>
                                <td className={`${tdCls} font-semibold`}>{i.available_quantity}</td>
                                <td className={`${tdCls} whitespace-nowrap text-right`}>
                                    <button className="cursor-pointer font-semibold text-board-700 hover:underline" onClick={() => setEditing(i)}>Edit</button>
                                    {canDelete && <button className="ml-4 cursor-pointer font-semibold text-red-600 hover:underline" onClick={() => setToDelete(i)}>Hapus</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && rows.length === 0 && <Empty>Belum ada barang yang cocok. Klik “Tambah barang” untuk mulai mencatat.</Empty>}
                {loading && <Empty>Memuat…</Empty>}
            </TableWrap>
            <Pagination meta={meta} onPage={setPage} />

            {editing && (
                <ItemForm
                    item={editing}
                    categories={categories}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); toast.success('Barang disimpan'); load(); }}
                />
            )}
            {toDelete && (
                <ConfirmDialog
                    title="Hapus barang"
                    message={`Hapus “${toDelete.name}”? Riwayatnya tetap tersimpan.`}
                    onConfirm={remove}
                    onClose={() => setToDelete(null)}
                    busy={busy}
                />
            )}
        </>
    );
}

function ItemForm({ item, categories, onClose, onSaved }) {
    const isEdit = !!item.id;
    const [f, setF] = useState(isEdit ? {
        code: item.code, name: item.name, category_id: item.category_id ?? '', description: item.description ?? '',
        quantity_good: item.quantity_good, quantity_damaged: item.quantity_damaged,
        location: item.location ?? '', purchase_date: item.purchase_date ?? '',
    } : emptyForm);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});
        const payload = {
            ...f,
            category_id: f.category_id || null,
            purchase_date: f.purchase_date || null,
            quantity_good: Number(f.quantity_good),
            quantity_damaged: Number(f.quantity_damaged),
        };
        try {
            if (isEdit) await api.put(`/items/${item.id}`, payload);
            else await api.post('/items', payload);
            onSaved();
        } catch (err) {
            setErrors(fieldErrors(err));
            if (!err.response?.data?.errors) alert(errMsg(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal title={isEdit ? 'Edit barang' : 'Tambah barang'} onClose={onClose} wide>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Kode barang" error={errors.code}><input className={inputCls} value={f.code} onChange={set('code')} placeholder="BRG-003" required /></Field>
                <Field label="Nama barang" error={errors.name}><input className={inputCls} value={f.name} onChange={set('name')} required /></Field>
                <Field label="Kategori" error={errors.category_id}>
                    <select className={inputCls} value={f.category_id} onChange={set('category_id')}>
                        <option value="">Tanpa kategori</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </Field>
                <Field label="Lokasi" error={errors.location}><input className={inputCls} value={f.location} onChange={set('location')} placeholder="Lab RPL, Gudang…" /></Field>
                <Field label="Jumlah kondisi baik" error={errors.quantity_good}><input type="number" min="0" className={inputCls} value={f.quantity_good} onChange={set('quantity_good')} required /></Field>
                <Field label="Jumlah kondisi rusak" error={errors.quantity_damaged}><input type="number" min="0" className={inputCls} value={f.quantity_damaged} onChange={set('quantity_damaged')} required /></Field>
                <Field label="Tanggal pembelian" error={errors.purchase_date}><input type="date" className={inputCls} value={f.purchase_date} onChange={set('purchase_date')} /></Field>
                <div className="sm:col-span-2">
                    <Field label="Keterangan" error={errors.description}><textarea rows="2" className={inputCls} value={f.description} onChange={set('description')} /></Field>
                </div>
                <div className="flex justify-end gap-2 sm:col-span-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
                    <Button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan barang'}</Button>
                </div>
            </form>
        </Modal>
    );
}
