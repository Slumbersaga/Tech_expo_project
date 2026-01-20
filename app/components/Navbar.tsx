import Link from 'next/link';
import { Zap } from 'lucide-react';

export function Navbar() {
    return (
        <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <Zap className="w-5 h-5 text-white" fill="currentColor" />
                        </div>
                        <span className="font-bold text-xl text-slate-900 tracking-tight">TechExpo</span>
                    </Link>

                    <div className="flex items-center gap-6">
                        <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                            Log in
                        </Link>
                        <Link
                            href="/signup"
                            className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
                        >
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
