import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const res = await fetch(
        `${process.env.BACKEND_API_URL}/app/captcha/new`,
        {
            method: "GET",
            cache: "no-store"
        }
    );

    const data = await res.json();
    return NextResponse.json(data);
}