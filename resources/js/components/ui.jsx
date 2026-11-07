import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const inputCls =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-board-700 focus:outline-none focus:ring-2 focus:ring-board-700/25';

export function Button({ variant = 'primary', className = '', ...props }) {
    const styles = {
        primary: 'bg-board-800 text-white hover:bg-board-900',
        accent: 'bg-mark text-board-950 hover:bg-mark-dark',
        ghost: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
        danger: 'bg-red-600 text-white hover:bg-red-700',
    }[variant];
    return (
        <button
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board-700 disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
            {...props}
        />
    );
}

export function Field({ label, error, hint, children }) {
    return (
        <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
            {children}
            {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
            {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
        </label>
    );
}

export function PageHeader({ title, subtitle, children }) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-board-900 sm:text-3xl">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2 print:hidden">{children}</div>
        </div>
    );
}

export function Modal({ title, onClose, children, wide = false }) {
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-board-950/60 p-4 sm:p-8"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-lg bg-white shadow-xl`}>
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2 className="font-display text-lg font-bold text-board-900">{title}</h2>
                    <button onClick={onClose} className="cursor-pointer rounded px-2 text-xl leading-none text-slate-500 hover:text-slate-900" aria-label="Tutup">
                        ×
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

export function ConfirmDialog({ title, message, confirmText = 'Hapus', onConfirm, onClose, busy }) {
    return (
        <Modal title={title} onClose={onClose}>
            <p className="text-sm text-slate-700">{message}</p>
            <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>Batal</Button>
                <Button variant="danger" onClick={onConfirm} disabled={busy}>{busy ? 'Memproses…' : confirmText}</Button>
            </div>
        </Modal>
    );
}

const tones = {
    green: 'bg-emerald-100 text-emerald-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-amber-100 text-amber-800',
    blue: 'bg-sky-100 text-sky-800',
    gray: 'bg-slate-100 text-slate-700',
};
export function Badge({ tone = 'gray', children }) {
    return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Pagination({ meta, onPage }) {
    if (!meta) return null;
    if (meta.last_page <= 1) return <p className="mt-3 text-sm text-slate-500">{meta.total} data</p>;
    return (
        <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>
                Halaman {meta.current_page} dari {meta.last_page} · {meta.total} data
            </span>
            <div className="flex gap-2">
                <Button variant="ghost" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>Sebelumnya</Button>
                <Button variant="ghost" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)}>Berikutnya</Button>
            </div>
        </div>
    );
}

export function Empty({ children }) {
    return <div className="px-4 py-10 text-center text-sm text-slate-500">{children}</div>;
}

export function TableWrap({ children }) {
    return <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white print:border-0">{children}</div>;
}
export const thCls = 'whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold text-slate-500';
export const tdCls = 'px-4 py-3 text-sm';

export function useDebounce(value, ms = 350) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}

// ---- Toast ----
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
    const [list, setList] = useState([]);
    const push = useCallback((type, text) => {
        const id = Math.random();
        setList((l) => [...l, { id, type, text }]);
        setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3500);
    }, []);
    const api = useMemo(() => ({ success: (t) => push('success', t), error: (t) => push('error', t) }), [push]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 print:hidden" aria-live="polite">
                {list.map((t) => (
                    <div key={t.id} className={`rounded-md px-4 py-2.5 text-sm font-medium shadow-lg ${t.type === 'error' ? 'bg-red-600 text-white' : 'bg-board-900 text-white'}`}>
                        {t.text}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
export const useToast = () => useContext(ToastContext);
