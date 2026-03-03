import Link from 'next/link';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                <h1 className="text-3xl font-bold mb-6 text-indigo-600">Shakti App</h1>
                <p className="mb-8 text-gray-600">Please login to continue to your dashboard.</p>
                <Link
                    href="/login"
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-indigo-700 transition"
                >
                    Go to Login
                </Link>
                {/* <                br>
                 */}
                <br />
                <br />
                <br />
                <br />
                <Link
                    href="/register"
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-indigo-700 transition"
                >
                    Go to Register
                </Link>
            </div>
        </main>
    );
}
