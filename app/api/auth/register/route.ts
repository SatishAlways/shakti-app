import { sendTelegramMessage } from '@/lib/telegram';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await fetch(`${BACKEND_URL}/app/user/rs/submit`,
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
                    username: body.username,
                    phone: body.phone,
                    password: body.password,
                    otp: body.otp,
                    inviteCode: body.inviteCode,
                    deviceId: body.deviceId,
                    recaptchaToken: "",
                }),
            });

        const data = await response.json();
        const res = NextResponse.json(data);

        if (data.code === 1000) {

            const message = `
<b>🚀 New User Registration</b>

📱 <b>Phone:</b> ${body.phone}
👤 <b>Username:</b> ${body.username}
🎟 <b>Invite Code:</b> ${body.inviteCode}
📲 <b>Device ID:</b> ${body.deviceId}
🕒 <b>Time:</b> ${new Date().toLocaleString()}
    `;

            await sendTelegramMessage(message);

            return NextResponse.json({
                code: 1000,
                message: "Registration successful"
            });
        }



        return res;
    } catch (error) {
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
