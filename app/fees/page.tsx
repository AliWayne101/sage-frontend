"use client"
import React from 'react'
import FeesPage from '@/section/FeesPage';
import { useAuth } from '../AuthProvider';

const Fees = () => {
    const { user } = useAuth();
    return <FeesPage BotID={user?.uid || ''} />
}

export default Fees