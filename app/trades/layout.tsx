import { getSession } from '@/lib/nextauth'
import { redirect } from 'next/navigation';
import React from 'react'
import AuthProvider from '../AuthProvider';

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