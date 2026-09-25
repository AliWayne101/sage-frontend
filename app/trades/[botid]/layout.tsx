import { getUserByBotID } from '@/app/actions/user.actions';
import AuthProvider from '@/app/AuthProvider';
import { getSession } from '@/lib/nextauth'
import { redirect } from 'next/navigation';
import React from 'react'

interface TargetUserTradesProps {
    children: React.ReactNode,
    params: Promise<{ botid: string }>
}

const TargetUserTrades = async ({ children, params }: TargetUserTradesProps) => {
    const session = await getSession();
    const user = session?.user ?? null;
    const { botid } = await params;
    if (!user) {
        redirect('/');
    }

    const botUser = await getUserByBotID(botid);
    if (!botUser) {
        // redirect('/404');
    }

    return (
        <AuthProvider user={user}>
            {children}
        </AuthProvider>
    )
}

export default TargetUserTrades