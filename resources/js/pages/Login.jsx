import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { errMsg } from '../lib/api';
import { Button, Field, inputCls } from '../components/ui';

export default function Login() {
    const { login } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            await login(form.email, form.password);
        } catch (err) {
            setError(errMsg(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="grid min-h-screen lg:grid-cols-2">
            <div className="flex flex-col justify-between bg-board-900 p-8 text-chalk sm:p-12">
                <div className="h-1.5 w-16 bg-mark" />
                <div className="py-10">
                    <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
                        Inventaris<br />Sekolah
                    </h1>
                    <p className="mt-5 max-w-sm text-base text-chalk/75">
                        Catat barang, pantau kondisinya, dan kelola peminjaman di satu tempat.
                    </p>
                </div>
                <p className="text-sm text-chalk/50">Akses administrator dan petugas inventaris</p>
            </div>

            <div className="flex items-center justify-center p-8">
                <form onSubmit={submit} className="w-full max-w-sm space-y-4">
                    <h2 className="font-display text-2xl font-bold text-board-900">Masuk ke sistem inventaris</h2>
                    {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</div>}
                    <Field label="Email">
                        <input type="email" required autoFocus className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </Field>
                    <Field label="Password">
                        <input type="password" required className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    </Field>
                    <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Memproses…' : 'Masuk'}</Button>
                </form>
            </div>
        </div>
    );
}
