import type { Metadata } from 'next';
import { getUserByBotID } from '@/app/actions/user.actions';
import AuthProvider from '@/app/AuthProvider';
import { SUPER_USER_ROLE } from '@/constants';
import { getSession } from '@/lib/nextauth'
import { redirect } from 'next/navigation';
import React from 'react'

interface TargetUserTradesProps {
    children: React.ReactNode,
    params: Promise<{ botid: string }>
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ botid: string }>;
}): Promise<Metadata> {
    const { botid } = await params;
    return {
        title: `Trades - Bot ${botid}`,
        description: `Trade execution history and orders log for bot ${botid}.`,
    };
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

export default TargetUserTrades