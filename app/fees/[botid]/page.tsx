"use client"
import FeesPage from '@/section/FeesPage';
import { useParams } from 'next/navigation';
import React from 'react'

const InspectFee = () => {
    const params = useParams<{ botid: string }>();
    const botid = params.botid;
    return <FeesPage BotID={botid} />
}

export default InspectFee