"use client"
import { getUserByBotID } from '@/app/actions/user.actions';
import { IUserInfoRuntime } from '@/interfaces';
import Trades from '@/section/UserTrades';
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const BotTrades = () => {
    const params = useParams<{ botid: string }>();
    const botid = params.botid;
    const [targetUser, setTargetUser] = useState<IUserInfoRuntime | null>(null);

    useEffect(() => {
        if (!botid.trim()) return;
        const getUser = async () => {
            const _user = await getUserByBotID(botid);
            setTargetUser(_user)
        }
        getUser();
    }, [botid])

    return <Trades targetUser={targetUser} />
}

export default BotTrades