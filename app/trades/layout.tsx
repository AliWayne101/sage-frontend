import type { Metadata } from 'next';
import { getSession } from '@/lib/nextauth'
import { redirect } from 'next/navigation';
import React from 'react'
import AuthProvider from '../AuthProvider';

export const metadata: Metadata = {
    title: 'Trades',
    description: 'Detailed trade executions, order fills, PnL breakdown, and performance logs.',
};

const TradesLayout = async ({ children }: { children: React.ReactNode }) => {
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

export default TradesLayout