import { useEffect, useState } from 'react';
import api, { errMsg, fieldErrors } from '../lib/api';
import { Button, ConfirmDialog, Empty, Field, Modal, PageHeader, TableWrap, inputCls, tdCls, thCls, useToast } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function Categories() {
    const toast = useToast();
    const { user } = useAuth();
    const canManage = user?.role === 'admin';
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [toDelete, setToDelete] = useState(null);

    const load = () =>
        api.get('/categories').then((r) => setRows(r.data)).catch((e) => toast.error(errMsg(e))).finally(() => setLoading(false));
    useEffect(() => { load(); }, []);

    const remove = async () => {
        try {
            await api.delete(`/categories/${toDelete.id}`);
            toast.success('Kategori dihapus');
            load();
        } catch (e) {
            toast.error(errMsg(e));
        }
        setToDelete(null);
    };

    return (
        <>
            <PageHeader title="Kategori" subtitle="Kelompokkan barang agar mudah dicari">
                {canManage && <Button variant="accent" onClick={() => setEditing({})}>Tambah kategori</Button>}
            </PageHeader>
            <TableWrap>
                <table className="w-full">
                    <thead className="border-b border-slate-200 bg-slate-50">
                        <tr><th className={thCls}>Nama</th><th className={thCls}>Keterangan</th><th className={thCls}>Jumlah jenis barang</th><th className={thCls}></th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((c) => (
                            <tr key={c.id}>
                                <td className={`${tdCls} font-medium`}>{c.name}</td>
                                <td className={tdCls}>{c.description || '-'}</td>
                                <td className={tdCls}>{c.items_count}</td>
                                <td className={`${tdCls} whitespace-nowrap text-right`}>
                                    {canManage && (
                                        <>
                                            <button className="cursor-pointer font-semibold text-board-700 hover:underline" onClick={() => setEditing(c)}>Edit</button>
                                            <button className="ml-4 cursor-pointer font-semibold text-red-600 hover:underline" onClick={() => setToDelete(c)}>Hapus</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && rows.length === 0 && <Empty>{canManage ? 'Belum ada kategori. Tambahkan yang pertama.' : 'Belum ada kategori. Hubungi admin untuk menambah kategori.'}</Empty>}
            </TableWrap>

            {editing && <CategoryForm cat={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); toast.success('Kategori disimpan'); load(); }} />}
            {toDelete && (
                <ConfirmDialog title="Hapus kategori" message={`Hapus kategori “${toDelete.name}”? Barang di dalamnya akan menjadi tanpa kategori.`} onConfirm={remove} onClose={() => setToDelete(null)} />
            )}
        </>
    );
}

function CategoryForm({ cat, onClose, onSaved }) {
    const isEdit = !!cat.id;
    const [f, setF] = useState({ name: cat.name ?? '', description: cat.description ?? '' });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});
        try {
            if (isEdit) await api.put(`/categories/${cat.id}`, f);
            else await api.post('/categories', f);
            onSaved();
        } catch (err) {
            setErrors(fieldErrors(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal title={isEdit ? 'Edit kategori' : 'Tambah kategori'} onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                <Field label="Nama kategori" error={errors.name}><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required autoFocus /></Field>
                <Field label="Keterangan" error={errors.description}><textarea rows="2" className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
                    <Button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan kategori'}</Button>
                </div>
            </form>
        </Modal>
    );
}
