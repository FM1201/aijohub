import { useState, useEffect } from 'react';

// --- Konfigurasi API ---
// Menggunakan subdomain baru untuk backend sesuai panduan
const API_BASE_URL = 'http://api.aijostore.id:8080'; 

// --- Komponen-komponen UI Kecil ---
const SvgIcon = ({ path, className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const Spinner = ({ className = "h-5 w-5" }) => (
    <svg className={`animate-spin text-white ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// --- Komponen Utama ---

function LoginScreen({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Username atau password salah.' }));
                throw new Error(errorData.message || 'Gagal melakukan otentikasi.');
            }

            const data = await response.json();
            if (data.token) {
                onLogin(username, data.token);
            } else {
                throw new Error('Token tidak ditemukan pada respons.');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-700">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 m-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Aijo Hub</h1>
                    <p className="text-slate-500 mt-2">Selamat datang kembali!</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-sm font-medium text-slate-600 mb-1">Username</label>
                        <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition" />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1">Password</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition" />
                    </div>
                    {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}
                    <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300">
                        {isLoading ? <Spinner /> : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function App() {
    const [token, setToken] = useState(sessionStorage.getItem('aijoHubToken'));
    const [user, setUser] = useState(sessionStorage.getItem('aijoHubUser'));

    const handleLogin = (username, receivedToken) => {
        sessionStorage.setItem('aijoHubToken', receivedToken);
        sessionStorage.setItem('aijoHubUser', username);
        setToken(receivedToken);
        setUser(username);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('aijoHubToken');
        sessionStorage.removeItem('aijoHubUser');
        setToken(null);
        setUser(null);
    };

    if (!token) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return <Dashboard user={user} token={token} onLogout={handleLogout} />;
}

function Dashboard({ user, token, onLogout }) {
    const [displayedSuppliers, setDisplayedSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [editingSupplier, setEditingSupplier] = useState(null);

    const apiHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const fetchAllSuppliers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/supplier-kain`, { headers: apiHeaders });
            if (!response.ok) throw new Error('Gagal memuat data supplier.');
            const data = await response.json();
            setDisplayedSuppliers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllSuppliers();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const params = new URLSearchParams({
            nama: formData.get('nama') || '',
            alamat: formData.get('alamat') || '',
            telepon: formData.get('telepon') || ''
        });

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/supplier-kain/search?${params.toString()}`, { headers: apiHeaders });
            if (!response.ok) throw new Error('Gagal mencari data.');
            const data = await response.json();
            setDisplayedSuppliers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetSearch = () => {
        document.getElementById('search-form').reset();
        fetchAllSuppliers();
    };

    const handleSaveSupplier = async (supplierData) => {
        const isEditMode = modalMode === 'edit';
        const url = isEditMode ? `${API_BASE_URL}/api/supplier-kain/${supplierData.id}` : `${API_BASE_URL}/api/supplier-kain`;
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: apiHeaders,
                body: JSON.stringify(supplierData),
            });
            if (!response.ok) throw new Error(`Gagal ${isEditMode ? 'memperbarui' : 'menyimpan'} supplier.`);
            closeModal();
            fetchAllSuppliers();
        } catch (err) {
            alert(err.message);
        }
    };
    
    const openModal = (mode, supplier = null) => {
        setModalMode(mode);
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
    };

    return (
        <div className="flex h-screen bg-slate-100">
            <aside className="w-64 flex-shrink-0 bg-slate-800 text-slate-300 flex flex-col">
                <div className="h-16 flex items-center justify-center text-2xl font-bold text-white border-b border-slate-700">Aijo Hub</div>
                <nav className="flex-1 px-4 py-4 space-y-2">
                    <a href="#" className="sidebar-link flex items-center px-4 py-2.5 bg-slate-900 rounded-lg text-white">
                        <SvgIcon path="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        <span className="mx-4 font-semibold">Supplier Kain</span>
                    </a>
                </nav>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
                    <h1 className="text-xl font-semibold text-slate-800">Manajemen Supplier Kain</h1>
                    <div className="flex items-center">
                        <span className="mr-3 font-semibold text-slate-600">{user}</span>
                        <button onClick={onLogout} className="ml-4 text-slate-500 hover:text-red-500 transition-colors" title="Logout">
                            <SvgIcon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-700 mb-4 md:mb-0">Daftar Supplier</h2>
                            <button onClick={() => openModal('add')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-all shadow-md hover:shadow-lg">
                                <SvgIcon path="M12 4v16m8-8H4" className="h-5 w-5 mr-2" />
                                Tambah Supplier
                            </button>
                        </div>

                        <form id="search-form" onSubmit={handleSearch} onReset={handleResetSearch} className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label htmlFor="search-nama" className="block text-sm font-medium text-slate-600">Nama</label>
                                    <input type="text" id="search-nama" name="nama" placeholder="Cari nama..." className="mt-1 block w-full border-slate-300 rounded-md shadow-sm p-2 transition" />
                                </div>
                                <div>
                                     <label htmlFor="search-alamat" className="block text-sm font-medium text-slate-600">Alamat</label>
                                    <input type="text" id="search-alamat" name="alamat" placeholder="Cari alamat..." className="mt-1 block w-full border-slate-300 rounded-md shadow-sm p-2 transition" />
                                </div>
                                <div>
                                    <label htmlFor="search-telepon" className="block text-sm font-medium text-slate-600">Telepon</label>
                                    <input type="text" id="search-telepon" name="telepon" placeholder="Cari telepon..." className="mt-1 block w-full border-slate-300 rounded-md shadow-sm p-2 transition" />
                                </div>
                                <div className="flex space-x-2">
                                    <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center transition">
                                        <SvgIcon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </button>
                                     <button type="reset" className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-3 rounded-lg flex items-center justify-center transition">
                                        <SvgIcon path="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.13-6.36M20 15a9 9 0 01-14.13 6.36" />
                                    </button>
                                </div>
                             </div>
                        </form>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 rounded-l-lg">Nama</th>
                                        <th scope="col" className="px-6 py-3">Alamat</th>
                                        <th scope="col" className="px-6 py-3">Telepon</th>
                                        <th scope="col" className="px-6 py-3 text-center rounded-r-lg">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan="4" className="text-center p-8"><Spinner className="h-8 w-8 text-indigo-500 mx-auto" /></td></tr>
                                    ) : error ? (
                                        <tr><td colSpan="4" className="text-center p-6 text-red-500">{error}</td></tr>
                                    ) : displayedSuppliers.length > 0 ? (
                                        displayedSuppliers.map(s => (
                                            <tr key={s.id} className="bg-white border-b border-slate-200 hover:bg-slate-50 transition">
                                                <td className="px-6 py-4 font-semibold text-slate-900">{s.nama}</td>
                                                <td className="px-6 py-4 text-slate-600">{s.alamat}</td>
                                                <td className="px-6 py-4 text-slate-600">{s.telepon}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => openModal('edit', s)} className="text-indigo-600 hover:text-indigo-900 font-semibold">Edit</button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="4" className="text-center p-6 text-slate-500">Data supplier tidak ditemukan.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
            {isModalOpen && <SupplierModal mode={modalMode} supplier={editingSupplier} onClose={closeModal} onSave={handleSaveSupplier} />}
        </div>
    );
}

function SupplierModal({ mode, supplier, onClose, onSave }) {
    const [formData, setFormData] = useState({ id: '', nama: '', alamat: '', telepon: '', email: '', npwp: '' });

    useEffect(() => {
        if (mode === 'edit' && supplier) {
            setFormData(supplier);
        } else {
            setFormData({ id: '', nama: '', alamat: '', telepon: '', email: '', npwp: '' });
        }
    }, [mode, supplier]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="modal-content bg-white rounded-xl shadow-2xl w-full max-w-lg m-4">
                <div className="flex justify-between items-center p-5 border-b border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-800">{mode === 'add' ? 'Tambah Supplier Baru' : 'Update Data Supplier'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="nama" className="block text-sm font-medium text-slate-700">Nama</label>
                        <input type="text" name="nama" value={formData.nama} onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2" required />
                    </div>
                    <div>
                        <label htmlFor="alamat" className="block text-sm font-medium text-slate-700">Alamat</label>
                        <textarea name="alamat" value={formData.alamat} onChange={handleChange} rows="3" className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2" required></textarea>
                    </div>
                    <div>
                        <label htmlFor="telepon" className="block text-sm font-medium text-slate-700">Telepon</label>
                        <input type="tel" name="telepon" value={formData.telepon} onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2" required />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2" required />
                    </div>
                    <div>
                        <label htmlFor="npwp" className="block text-sm font-medium text-slate-700">NPWP</label>
                        <input type="text" name="npwp" value={formData.npwp} onChange={handleChange} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2" required />
                    </div>
                    <div className="flex justify-end pt-4 border-t border-slate-200 mt-6">
                        <button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg mr-2 transition">Batal</button>
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition">{mode === 'add' ? 'Simpan' : 'Update'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default App;
