"use client"
import UserDashboard from '@/section/UserDashboard';
import { useParams } from 'next/navigation';
import React from 'react'

const Inspect = () => {
    const params = useParams<{ botid: string }>();
    const botid = params.botid;
    return <UserDashboard BotID={botid} />
}

export default Inspect