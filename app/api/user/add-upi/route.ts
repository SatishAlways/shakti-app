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

        const { upi, phone, pin } = await request.json();

        let pinTicket: string | undefined;

        // -------------------------------
        // STEP 0: Check if PIN required
        // -------------------------------
        const checkPinRes = await fetch(
            `${BACKEND_URL}/app/user/info/checkSendOtp`,
            {
                method: 'GET',
                headers: {
                    Authorization: token,
                    token,
                    'Content-Type': 'application/json',
                },
            }
        );

        const checkPinData = await checkPinRes.json();

        if (!checkPinRes.ok) {
            return NextResponse.json(checkPinData, {
                status: checkPinRes.status,
            });
        }

        // -------------------------------
        // STEP 1: Verify PIN (if forced)
        // -------------------------------
        if (checkPinData?.data?.forcePin) {
            const verifyPinRes = await fetch(
                `${BACKEND_URL}/app/user/info/verifyPin`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: token,
                        token,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        pin: pin ?? phone.slice(0, 6),
                    }),
                }
            );

            const verifyPinData = await verifyPinRes.json();

            // 🚨 HARD STOP if PIN invalid
            if (!verifyPinRes.ok || verifyPinData.code !== 1000) {
                return NextResponse.json(verifyPinData, {
                    status: verifyPinRes.status || 400,
                });
            }

            pinTicket = verifyPinData?.data?.pinTicket;

            if (!pinTicket) {
                return NextResponse.json(
                    { code: 500, message: 'PIN ticket missing' },
                    { status: 500 }
                );
            }
        }

        // -------------------------------
        // STEP 2: Send OTP
        // -------------------------------
        const otpRes = await fetch(
            `${BACKEND_URL}/app/ct/app/collection/sendOtp`,
            {
                method: 'POST',
                headers: {
                    Authorization: token,
                    token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: '4',
                    account: phone,
                    pinTicket,
                }),
            }
        );

        const otpData = await otpRes.json();

        if (!otpRes.ok || otpData.code !== 1000) {
            return NextResponse.json(otpData, {
                status: otpRes.status || 400,
            });
        }

        const tempKey = otpData?.data?.tempKey;

        if (!tempKey) {
            return NextResponse.json(
                { code: 500, message: 'tempKey missing' },
                { status: 500 }
            );
        }

        // -------------------------------
        // STEP 3: Submit UPI
        // -------------------------------
        // const submitRes = await fetch(
        //     `${BACKEND_URL}/app/ct/app/collection/v2/submit`,
        //     {
        //         method: 'POST',
        //         headers: {
        //             Authorization: token,
        //             token,
        //             'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify({
        //             tempKey,
        //             upis: [upi],
        //         }),
        //     }
        // );

        // const submitData = await submitRes.json();

        // if (!submitRes.ok) {
        //     return NextResponse.json(submitData, {
        //         status: submitRes.status,
        //     });
        // }

        return NextResponse.json(otpData);
    } catch (error) {
        console.error('Add UPI error:', error);

        return NextResponse.json(
            { code: 500, message: 'Failed to add UPI' },
            { status: 500 }
        );
    }
}