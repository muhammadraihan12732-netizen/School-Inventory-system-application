import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './components/ui';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import Categories from './pages/Categories';
import Loans from './pages/Loans';
import Histories from './pages/Histories';
import Reports from './pages/Reports';

function Protected({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="p-10 text-sm text-slate-500">Memuat…</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function GuestOnly({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? <Navigate to="/" replace /> : children;
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <Routes>
                        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                        <Route element={<Protected><Layout /></Protected>}>
                            <Route index element={<Dashboard />} />
                            <Route path="items" element={<Items />} />
                            <Route path="categories" element={<Categories />} />
                            <Route path="loans" element={<Loans />} />
                            <Route path="histories" element={<Histories />} />
                            <Route path="reports" element={<Reports />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

createRoot(document.getElementById('root')).render(<App />);
