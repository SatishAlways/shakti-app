'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function OTPPage() {
    const router = useRouter();

    const [captcha, setCaptcha] = useState<any>(null);
    const [sliderValue, setSliderValue] = useState(0);
    const [captchaToken, setCaptchaToken] = useState('');

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('satish8421'); // default password
    const [referCode, setReferCode] = useState('1FJE0B');   // default refer code
    const [otp, setOtp] = useState('');

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let deviceId = Cookies.get('deviceId');

        if (!deviceId) {
            deviceId = crypto.randomUUID();
            Cookies.set('deviceId', deviceId, {
                expires: 365, // 1 year
                sameSite: 'Lax',
            });
        }
    }, []);

    useEffect(() => {
        fetchCaptcha();
    }, []);

    // =========================
    // Fetch Captcha
    // =========================
    const fetchCaptcha = async () => {
        try {
            setSliderValue(0);
            setCaptchaToken('');
            setError('');
            setStatus('');

            const res = await fetch(`/api/captcha/new?ts=${Date.now()}`, {
                cache: 'no-store'
            });

            const result = await res.json();

            if (result.code === 1000) {
                setCaptcha(result.data);
            } else {
                setError('Failed to load captcha');
            }
        } catch {
            setError('Failed to load captcha');
        }
    };

    // =========================
    // Verify Captcha
    // =========================
    const verifyCaptcha = async () => {
        if (!captcha) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/captcha/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    captchaKey: captcha.captcha_key,
                    x: sliderValue,
                    y: captcha.display_y,
                    templateId: captcha.id
                }),
            });

            const data = await res.json();

            if (data?.data?.captchaToken) {
                setCaptchaToken(data.data.captchaToken);
                setStatus('Captcha verified successfully!');
            } else {
                setError('Captcha verification failed. Try again.');
                fetchCaptcha();
            }
        } catch {
            setError('Verification failed');
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // Send OTP
    // =========================
    const sendOTP = async () => {
        if (!phone) {
            setError('Phone number is required');
            return;
        }

        setLoading(true);
        setError('');
        setStatus('');

        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    reCaptcha: captchaToken,
                    isSignup: true
                }),
            });

            const data = await res.json();

            if (data.code === 1000) {
                setStatus('OTP sent successfully!');
            } else {
                setError(data.message || 'Failed to send OTP');
            }
        } catch {
            setError('Error sending OTP');
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // Register (Verify OTP)
    // =========================
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phone) {
            setError('Phone number is required');
            return;
        }

        if (!otp) {
            setError('OTP is required');
            return;
        }

        setLoading(true);
        setError('');
        let deviceId = Cookies.get('deviceId');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: "user" + phone.slice(0, 5),
                    phone,
                    password,
                    otp,
                    inviteCode: referCode,
                    deviceId
                }),
            });

            const data = await res.json();

            if (data.code === 1000) {
                router.push('/login');
                // console.log(data);
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch {
            setError('Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const sliderMax =
        captcha ? captcha.master_width - captcha.thumb_width : 300;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-center mb-8">
                    Security Verification
                </h2>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm">
                        {error}
                    </div>
                )}

                {status && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 mb-4 text-sm">
                        {status}
                    </div>
                )}

                {/* ================= CAPTCHA STEP ================= */}
                {!captchaToken ? (
                    <div className="space-y-6">
                        <p className="text-sm text-center">
                            Solve the captcha to continue
                        </p>

                        {captcha && (
                            <div
                                className="relative rounded overflow-hidden"
                                style={{
                                    width: captcha.master_width,
                                    height: captcha.master_height
                                }}
                            >
                                <img
                                    src={captcha.master_image_base64}
                                    alt="Captcha"
                                    className="absolute top-0 left-0"
                                    width={captcha.master_width}
                                    height={captcha.master_height}
                                />

                                <div
                                    className="absolute transition-all duration-75"
                                    style={{
                                        left: `${sliderValue}px`,
                                        top: `${captcha.display_y}px`
                                    }}
                                >
                                    <img
                                        src={captcha.thumb_image_base64}
                                        alt="Slider"
                                        width={captcha.thumb_width}
                                        height={captcha.thumb_height}
                                    />
                                </div>
                            </div>
                        )}

                        <input
                            type="range"
                            min="0"
                            max={sliderMax}
                            value={sliderValue}
                            onChange={(e) =>
                                setSliderValue(parseInt(e.target.value))
                            }
                            className="w-full"
                        />

                        <button
                            onClick={verifyCaptcha}
                            disabled={loading}
                            className="w-full py-2 bg-indigo-600 text-white rounded"
                        >
                            {loading ? 'Verifying...' : 'Verify Captcha'}
                        </button>


                        <button
                            type="button"
                            onClick={fetchCaptcha}
                            className="w-full text-sm text-indigo-600"
                        >
                            Refresh Captcha
                        </button>
                    </div>
                ) : (
                    /* ================= REGISTRATION STEP ================= */
                    <div className="space-y-6">

                        <div className="">
                            <p className="text-black">Phone Number:</p>

                            <input
                                type="text"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-3 py-3 border rounded text-black"
                                placeholder="Enter Phone Number"
                            />
                        </div>
                        <div className="">

                            <p className="text-black">Password:</p>
                            <input
                                type="text"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-3 border rounded text-black"
                            />
                        </div>

                        <div className="">
                            <p className="text-black">Refer Code:</p>

                            <input
                                type="text"
                                value={referCode}
                                onChange={(e) => setReferCode(e.target.value)}
                                className="w-full px-3 py-3 border rounded text-black"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={sendOTP}
                            disabled={loading}
                            className="w-full py-2 bg-indigo-600 text-white rounded"
                        >
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>

                        <form onSubmit={handleRegister} className="space-y-4">
                            <input
                                type="text"
                                required
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full px-3 py-3 border rounded text-center text-xl text-black"
                                placeholder="Enter OTP"
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2 bg-green-600 text-white rounded"
                            >
                                {loading ? 'Registering...' : 'Verify & Register'}
                            </button>
                        </form>

                    </div>
                )}
            </div>
        </div>
    );
}