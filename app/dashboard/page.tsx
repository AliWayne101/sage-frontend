"use client"

import React from 'react'
import { useAuth } from '../AuthProvider'
import UserDashboard from '@/section/UserDashboard';
import FullScreenLoading from '@/section/FullScreenLoading';

const Dashboard = () => {
    const { user } = useAuth();
    if (!user || !user.uid) {
        return <FullScreenLoading message="AUTHENTICATING SESSION..." />;
    }
    return <UserDashboard BotID={user.uid} />;
}

export default Dashboard