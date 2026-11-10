import type { Metadata } from 'next';
import { getSession } from '@/lib/nextauth'
import { redirect } from 'next/navigation';
import React from 'react'
import AuthProvider from '../AuthProvider';
import { SUPER_USER_ROLE } from '@/constants';

export const metadata: Metadata = {
    title: 'Fleet Management',
    description: 'Full directory of deployed bots, execution parameters, and user account profiles.',
};

const FleetLayout = async ({ children }: { children: React.ReactNode }) => {
    const session = await getSession();
    const user = session?.user ?? null;
    if (!user) {
        redirect('/');
    } else {
        if (user.accountType !== SUPER_USER_ROLE)
            redirect('/');
    }

    return (
        <AuthProvider user={user}>
            {children}
        </AuthProvider>
    )
}

export default FleetLayout