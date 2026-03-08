import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(request: Request) {
    try {
        const token = cookies().get('auth_token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

const { upis, otp, tempKey } = await request.json();
console.log("CHECING UPI")
console.log(upis)

        let pinTicket: string | undefined;


        // STEP 1, verify otp


        const OtpVerify = await fetch(
            `${BACKEND_URL}/app/ct/app/collection/verifyOtp`,
            {
                method: 'POST',
                headers: {
                    Authorization: token,
                    token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tempKey,
                    otp: otp,
                }),
            }
        );


const OtpVerifyData = await OtpVerify.json();

console.log("RUNNING TILL HERE...");
console.log(OtpVerifyData);

if (OtpVerifyData.code !== 1000) {
    return NextResponse.json(OtpVerifyData, {
        status: 400,
    });
}

console.log("RUNNING, ADDING UPI.....");



        // -------------------------------
        // STEP 3: Submit UPI
        // -------------------------------
        const submitRes = await fetch(
            `${BACKEND_URL}/app/ct/app/collection/v2/submit`,
            {
                method: 'POST',
                headers: {
                    Authorization: token,
                    token,
                    'Content-Type': 'application/json',
                },
body: JSON.stringify({
    tempKey,
    upis
})
            }
        );

        const submitData = await submitRes.json();

        console.log(submitData)
        if (!submitRes.ok) {
            return NextResponse.json(submitData, {
                status: submitRes.status,
            });
        }

        return NextResponse.json(submitData);
    } catch (error) {
        console.error('Add UPI error:', error);

        return NextResponse.json(
            { code: 500, message: 'Failed to add UPI' },
            { status: 500 }
        );
    }
}