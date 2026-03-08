'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
const router = useRouter();
const [profile, setProfile] = useState<any>(null);
const [wallets, setWallets] = useState<any[]>([]);
const [orders, setOrders] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [addingUpi, setAddingUpi] = useState(false);
const [upiOtp, setUpiOtp] = useState(false);
const [newUpi, setNewUpi] = useState('');
const [otp, setOtp] = useState('');
const [tempKey, setTempKey] = useState('');
const [error, setError] = useState('');
const [pin, setPin] = useState('');


useEffect(() => {
    fetchData();
}, []);

const fetchData = async () => {
    setLoading(true);
    try {
        const [profileRes, walletRes, ordersRes] = await Promise.all([
            fetch('/api/user/profile'),
            fetch('/api/user/getwallet'),
            fetch('/api/user/orders')
        ]);

        if (profileRes.status === 401) {
            router.push('/login');
            return;
        }

        const profileData = await profileRes.json();
        const walletData = await walletRes.json();
        const ordersData = await ordersRes.json();

        setProfile(profileData.data);
        setWallets(walletData.data || []);
        setOrders(ordersData.data.records || []);

    } catch (err) {
        setError('Failed to load dashboard data');
    } finally {
        setLoading(false);
    }
};

const handleAddUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const phone = sessionStorage.getItem('phone');

        const res = await fetch('/api/user/add-upi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ upi: newUpi, phone, pin }),
        });

        const data = await res.json();

        if (data.code === 1000 && data?.data?.tempKey) {
            setTempKey(data.data.tempKey);
            setAddingUpi(false);
            setUpiOtp(true);
        } else {
            setError(data.error || data.message || 'Failed to add UPI');
        }
    } catch (err) {
        setError('Error adding UPI');
    } finally {
        setLoading(false);
    }
};

const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const res = await fetch('/api/user/verify-upi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                otp,
                upi: newUpi,
                tempKey
            })
        });

        const data = await res.json();

        if (data.code === 1000) {
            setUpiOtp(false);
            setOtp('');
            setTempKey('');
            setNewUpi('');
            fetchData();
        } else {
            setError(data.message || 'OTP verification failed');
        }

    } catch (err) {
        setError('OTP verification error');
    } finally {
        setLoading(false);
    }
};

const handleLogout = async () => {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        sessionStorage.clear();
        router.push('/login');
    } catch (err) {
        router.push('/login');
    }
};

if (loading && !profile) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 bg-indigo-200 rounded-full mb-4"></div>
                <p className="text-gray-500">Loading your dashboard...</p>
            </div>
        </div>
    );
}

return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-8">

            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Welcome Back!</h1>
                    {profile && (
                        <p className="text-gray-500">{wallets[0]?.phone ? wallets[0].phone : 'Member'}</p>
                    )}
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm text-red-600 font-medium bg-red-50 hover:bg-red-100 rounded-lg transition"
                >
                    Logout
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                    {error}
                </div>
            )}

            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md">
                You PIN IS {sessionStorage.getItem('phone')?.slice(0, 6) ?? wallets[0].phone.slice(0, 6)}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Profile Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Money</p>
                        <p className="font-medium text-green-600">{profile?.integral || '0'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Withdraw</p>
                        <p className="font-medium text-green-700">{profile?.totalReceive || '0'}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">Payment History</h2>
                </div>

                <div className="space-y-4">
                    {orders.length > 0 ? (
                        orders.map((w, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                        <span className="text-indigo-600 font-bold block">{w.wallet?.name?.[0] || 'U'}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">Amount: {w.amount || '0'}</p>
                                        <p className="text-sm text-gray-500">Time: {w.createTime}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${w.status === 3 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {w.status === 3 ? 'Success' : w.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                            <p className="text-gray-400">No UPI wallets found. Click "Add UPI" to get started.</p>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter PIN
                </label>
                <input
                    type="text"
                    maxLength={6}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-black"
                    placeholder="Enter 6-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                    Default PIN is pre-filled. You can change it.
                </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">Your UPI Wallets</h2>
                    <button
                        onClick={() => setAddingUpi(true)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-md"
                    >
                        Add UPI
                    </button>
                </div>

                <div className="space-y-4">
                    {wallets.length > 0 ? (
                        wallets.map((w, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                        <span className="text-indigo-600 font-bold block">{w.wallet?.name?.[0] || 'U'}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{w.wallet?.name || 'UPI Wallet'}</p>
                                        <p className="text-sm text-gray-500">{w.address}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${w.status === 1
                                        ? 'bg-green-100 text-green-700'
                                        : w.status === 0
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {w.status === 1
                                            ? 'Active'
                                            : w.status === 0
                                                ? 'Failed'
                                                : w.status === 2
                                                    ? 'Disabled'
                                                    : 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                            <p className="text-gray-400">No UPI wallets found. Click "Add UPI" to get started.</p>
                        </div>
                    )}
                </div>

                {addingUpi && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white max-w-md w-full rounded-2xl p-8 shadow-2xl">
                            <h3 className="text-xl font-bold mb-4 text-gray-800">Add New UPI</h3>
                            <form onSubmit={handleAddUpi} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">UPI Address (VPA)</label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-black"
                                        placeholder="e.g. username@upi"
                                        value={newUpi}
                                        onChange={(e) => setNewUpi(e.target.value)}
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setAddingUpi(false)}
                                        className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !newUpi}
                                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
                                    >
                                        {loading ? 'Adding...' : 'Add UPI'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {upiOtp && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white max-w-md w-full rounded-2xl p-8 shadow-2xl">
                            <h3 className="text-xl font-bold mb-4 text-gray-800">Verify OTP</h3>
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <input
                                    type="text"
                                    maxLength={6}
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-black"
                                    placeholder="Enter OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition"
                                >
                                    Verify OTP
                                </button>
                            </form>
                        </div>
                    </div>
                )}

            </div>

        </div>
    </div>
);


}
