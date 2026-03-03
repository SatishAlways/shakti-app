'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function OTPPage() {
    const router = useRouter();

    const [captcha, setCaptcha] = useState<any>(null);
    const [sliderValue, setSliderValue] = useState(0);
    const [captchaToken, setCaptchaToken] = useState('');
    const [otp, setOtp] = useState('');

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const fetchCaptcha = async () => {
        try {
            setSliderValue(0);
            setCaptchaToken('');
            setError('');

            const res = await fetch(`/api/captcha/new?ts=${Date.now()}`, {
                cache: 'no-store'
            });

            const result = await res.json();

            if (result.code === 1000) {
                setCaptcha(result.data);
            } else {
                setError('Failed to load captcha');
            }
        } catch (err) {
            setError('Failed to load captcha');
        }
    };

    const verifyCaptcha = async () => {
        if (!captcha) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/captcha/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    captchaKey: captcha.captcha_key, // ✅ correct name
                    x: sliderValue,
                    y: captcha.display_y,     // ✅ correct Y
                    templateId: captcha.id
                }),
            });

            const data = await res.json();

            if (data.data.captchaToken) {
                setCaptchaToken(data.data.captchaToken);
                sendOTP(data.data.captchaToken);
            } else {
                setError('Captcha verification failed. Try again.');
                fetchCaptcha();
            }
        } catch (err) {
            setError('Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const sendOTP = async (token: string) => {
        const phone = sessionStorage.getItem('phone');

        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, reCaptcha: token, isSignup: false }),
            });

            const data = await res.json();

            if (data.code === 1000) {
                setStatus('OTP sent successfully!');
            } else {
                setError(data.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Error sending OTP');
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const phone = sessionStorage.getItem('phone');
        const password = sessionStorage.getItem('password');
        const challengeId = sessionStorage.getItem('challengeId');
        let deviceId = Cookies.get('deviceId');

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password, otp, challengeId, deviceId: deviceId, clientType: 'ANDROID' }),
            });

            const data = await res.json();

            if (data.data.token) {
                router.push('/dashboard');
            } else {
                setError(data.message || 'Invalid OTP');
            }
        } catch (err) {
            setError('OTP verification failed');
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

                {!captchaToken ? (
                    <div className="space-y-6">
                        <p className="text-sm text-center">
                            Solve the captcha to receive OTP
                        </p>

                        {captcha && (
                            <div
                                className="relative rounded overflow-hidden"
                                style={{
                                    width: captcha.master_width,
                                    height: captcha.master_height
                                }}
                            >
                                {/* Master Image */}
                                <img
                                    key={captcha.captcha_key}
                                    src={captcha.master_image_base64}
                                    alt="Captcha"
                                    className="absolute top-0 left-0"
                                    width={captcha.master_width}
                                    height={captcha.master_height}
                                />

                                {/* Slider Piece */}
                                <div
                                    className="absolute transition-all duration-75"
                                    style={{
                                        left: `${sliderValue}px`,
                                        top: `${captcha.display_y}px`
                                    }}
                                >
                                    <img
                                        key={captcha.captcha_key + '-thumb'}
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
                            Verify Captcha
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <input
                            type="text"
                            required
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full px-3 py-3 border rounded text-center text-xl text-black"
                            placeholder="000000"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 bg-indigo-600 text-white rounded"
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        <button
                            type="button"
                            onClick={fetchCaptcha}
                            className="w-full text-sm text-indigo-600"
                        >
                            Refresh Captcha
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}