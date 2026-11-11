import type { Metadata } from 'next';
import { getSession } from '@/lib/nextauth'
import { redirect } from 'next/navigation';
import React from 'react'
import AuthProvider from '../AuthProvider';

export const metadata: Metadata = {
    title: 'Settings',
    description: 'Manage Binance API keys, leverage parameters, risk controls, and execution environment.',
};

const SettingsLayout = async ({ children }: { children: React.ReactNode }) => {
    const session = await getSession();
    const user = session?.user ?? null;
    if (!user) {
        redirect('/');
    }
    return (
        <AuthProvider user={user}>
            {children}
        </AuthProvider>
    )
}

export default SettingsLayout