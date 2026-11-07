import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../lib/api';
import { Badge, Empty, PageHeader, Pagination, TableWrap, inputCls, tdCls, thCls, useToast } from '../components/ui';

const tone = { dibuat: 'green', diubah: 'yellow', dihapus: 'red', dipinjam: 'blue', dikembalikan: 'gray' };

export default function Histories() {
    const toast = useToast();
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [action, setAction] = useState('');
    const [page, setPage] = useState(1);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/histories', { params: { action: action || undefined, page } });
            setRows(data.data);
            setMeta(data);
        } catch (e) {
            toast.error(errMsg(e));
        } finally {
            setLoading(false);
        }
    }, [action, page]);

    useEffect(() => { setPage(1); }, [action]);
    useEffect(() => { load(); }, [load]);

    return (
        <>
            <PageHeader title="Riwayat barang" subtitle="Semua perubahan, peminjaman, dan pengembalian">
                <select className={inputCls} value={action} onChange={(e) => setAction(e.target.value)} aria-label="Filter aksi">
                    <option value="">Semua aksi</option>
                    {Object.keys(tone).map((a) => <option key={a} value={a}>{a[0].toUpperCase() + a.slice(1)}</option>)}
                </select>
            </PageHeader>
            <TableWrap>
                <table className="w-full">
                    <thead className="border-b border-slate-200 bg-slate-50">
                        <tr><th className={thCls}>Waktu</th><th className={thCls}>Barang</th><th className={thCls}>Aksi</th><th className={thCls}>Keterangan</th><th className={thCls}>Oleh</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((h) => (
                            <tr key={h.id}>
                                <td className={`${tdCls} whitespace-nowrap`}>{new Date(h.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                <td className={`${tdCls} font-medium`}>{h.item?.name}{h.item?.deleted_at && <span className="ml-1 text-xs text-slate-400">(dihapus)</span>}</td>
                                <td className={tdCls}><Badge tone={tone[h.action] || 'gray'}>{h.action}</Badge></td>
                                <td className={tdCls}>{h.description}</td>
                                <td className={tdCls}>{h.user?.name || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && rows.length === 0 && <Empty>Belum ada riwayat.</Empty>}
                {loading && <Empty>Memuat…</Empty>}
            </TableWrap>
            <Pagination meta={meta} onPage={setPage} />
        </>
    );
}
