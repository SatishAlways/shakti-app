import { NextResponse } from "next/server";

export async function POST() {
    const res = NextResponse.json({
        message: "Logged out",
    });

    // remove auth cookie
    res.cookies.set("auth_token", "", {
        path: "/",
        expires: new Date(0),
    });

    return res;
}