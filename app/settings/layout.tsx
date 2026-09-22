import { getSession } from 'next-auth/react'
import React from 'react'
import AuthProvider from '../AuthProvider';
import { redirect } from 'next/navigation';

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