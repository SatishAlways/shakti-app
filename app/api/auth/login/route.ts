import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await fetch(`${BACKEND_URL}/app/user/login/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept-Encoding": "gzip",
                    "Connection": "Keep-Alive",
                    "user-agent":
                        "Mozilla/5.0 (Linux; Android 12; SM-A528B Build/V417IR; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.5481.154 Safari/537.36 uni-app Html5Plus/1.0",
                },
                body: JSON.stringify({
                    phone: body.phone,
                    password: body.password,
                    deviceId: body.deviceId,
                    clientType: "ANDROID",
                }),
            });

        const data = await response.json();
        const res = NextResponse.json(data);


        if (data.code === 1000) {
            res.cookies.set("auth_token", data.data.token, {
                httpOnly: true,
                path: "/",
                maxAge: data.data.expire,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            });
        }

        return res;
    } catch (error) {
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
