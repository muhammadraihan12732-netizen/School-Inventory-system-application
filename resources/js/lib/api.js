import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401 && window.location.pathname !== '/login') {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Ambil pesan error pertama dari response Laravel
export function errMsg(e) {
    const d = e.response?.data;
    if (d?.errors) return Object.values(d.errors)[0][0];
    return d?.message || 'Terjadi kesalahan. Coba lagi.';
}

// { field: 'pesan' } untuk error validasi 422
export function fieldErrors(e) {
    const errs = e.response?.data?.errors || {};
    return Object.fromEntries(Object.entries(errs).map(([k, v]) => [k, v[0]]));
}

export const fmtDate = (v) =>
    v ? new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

export default api;
