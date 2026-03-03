import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(request: Request) {
    const token = cookies().get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { upi, phone } = await request.json();

        // STEP 1: POST /app/ct/app/collection/sendOtp
        const otpResponse = await fetch(`${BACKEND_URL}/app/ct/app/collection/sendOtp`, {
            method: 'POST',
            headers: {
                Authorization: token,
                token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "3",
                account: phone
            }),
        });
        const otpData = await otpResponse.json();

        if (otpData.code !== 1000) {
            return NextResponse.json(otpData);
        }

        const tempKey = otpData.data.tempKey;


        // STEP 2: POST /app/ct/app/collection/v2/submit
        // Assuming tempKey comes from somewhere or we just proceed
        const submitResponse = await fetch(`${BACKEND_URL}/app/ct/app/collection/v2/submit`, {
            method: 'POST',
            headers: {
                Authorization: token,
                token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                tempKey,
                upis: [upi]
            }),
        });

        const data = await submitResponse.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add UPI' }, { status: 500 });
    }
}
