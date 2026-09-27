import { getUserByBotID } from '@/app/actions/user.actions';
import AuthProvider from '@/app/AuthProvider';
import { SUPER_USER_ROLE } from '@/constants';
import { getSession } from '@/lib/nextauth'
import { redirect } from 'next/navigation';
import React from 'react'

interface InspectUserLayoutProps {
    children: React.ReactNode,
    params: Promise<{ botid: string }>
}

const InspectUserLayout = async ({ children, params }: InspectUserLayoutProps) => {
    const session = await getSession();
    const user = session?.user ?? null;
    const { botid } = await params;
    if (!user) {
        redirect('/');
    }

    const botUser = await getUserByBotID(botid);
    if (!botUser) {
        redirect('/404');
    }

    if (user.accountType !== SUPER_USER_ROLE) {
        redirect('/dashboard');
    }

    return (
        <AuthProvider user={user}>
            {children}
        </AuthProvider>
    )
}

export default InspectUserLayout