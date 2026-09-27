"use client"

import React from 'react'
import { useAuth } from '../AuthProvider'
import UserDashboard from '@/section/UserDashboard';

const Dashboard = () => {
    const { user } = useAuth();
    return <UserDashboard BotID={user?.uid || ""} />
}

export default Dashboard