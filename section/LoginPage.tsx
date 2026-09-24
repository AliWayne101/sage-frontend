"use client"
import React, { useEffect, useState } from 'react'
import Footer from './Footer'
import { AlertCircle, Mail, Terminal, Lock, ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AUTH_ERROR_MESSAGES, AuthErrorCode } from '@/constants';

const LoginPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loginDetails, setLoginDetails] = useState({
        email: "",
        password: ""
    });

    const router = useRouter();
    const searchParams = useSearchParams();

    // Check for callback status messages in URL from Google OAuth
    useEffect(() => {
        const msgCode = searchParams.get('msg') || searchParams.get('error');
        if (msgCode && AUTH_ERROR_MESSAGES[msgCode as AuthErrorCode]) {
            const feedback = AUTH_ERROR_MESSAGES[msgCode as AuthErrorCode];
            setError(feedback);
        } else if (msgCode) {
            setError(msgCode);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const loginResponse = await signIn('credentials', {
                redirect: false,
                email: loginDetails.email,
                password: loginDetails.password
            })

            if (!loginResponse?.ok) {
                setIsLoading(false);
                setError(loginResponse?.error || "An unexpect error occured");
                return;
            }

            setError(null);
            router.push('/dashboard');
        } catch (err) {
            setIsLoading(false);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginDetails({
            ...loginDetails,
            [e.target.name]: e.target.value
        });
    }

    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col justify-between items-center relative overflow-hidden font-sans">
            {/* Background ambient elements */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex-1 flex flex-col items-center justify-center p-4 w-full">
                <div className="w-full max-w-md bg-[#121214] border border-[#27272a] rounded-xl shadow-2xl p-6 sm:p-8 relative z-10 space-y-6">
                    {/* Brand & Connection Status */}
                    <div className="text-center space-y-2">
                        <div className="w-12 h-12 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center mb-3">
                            <Terminal className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white font-mono">
                            Sage Trading Terminal
                        </h1>
                        <p className="text-xs text-zinc-400 font-mono">
                            Private Binance Futures Bot Control Node
                        </p>

                        <div className="pt-2 flex items-center justify-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-900/60 text-[11px] font-mono text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>Express Backend: Online</span>
                            </div>
                        </div>
                    </div>

                    {/* Error Notification */}
                    {error && (
                        <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-md text-rose-300 text-xs font-mono flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-mono text-zinc-400 block">Operator Email</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    required
                                    value={loginDetails.email}
                                    name="email"
                                    onChange={handleChange}
                                    placeholder="operator@sage.internal"
                                    className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded-md pl-9 pr-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-mono text-zinc-400 block">Terminal Passphrase</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={loginDetails.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded-md pl-9 pr-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="cursor-pointer w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold tracking-wide transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <span>Authenticating...</span>
                            ) : (
                                <>
                                    <span>Access Terminal</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-6 text-center text-xs font-mono text-zinc-600">
                    Personal & Family Private Deployment • Sage Automated Trading Systems
                </div>
            </div>

            <Footer />
        </div>
    )
}

export default LoginPage