import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const response = await fetch(`${BACKEND_URL}/app/user/login/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "user-agent": "Mozilla/5.0 (Linux; Android 12)",
            },
            body: JSON.stringify({
                phone: body.phone,
                password: body.password,
                otp: body.otp,
                challengeId: body.challengeId,
                deviceId: body.deviceId,
                clientType: "ANDROID",
            }),
        });

        const data = await response.json();

        if (data.data.token) {
            cookies().set('auth_token', data.data.token, {
                httpOnly: false, // User requested storing in cookie, might need access from JS
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'OTP verification failed' }, { status: 500 });
    }
}
