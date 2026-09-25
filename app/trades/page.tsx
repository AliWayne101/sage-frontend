"use client"
import React, { useEffect, useState } from 'react'
import { useAuth } from '../AuthProvider'
import { IUserInfoRuntime } from '@/interfaces';
import { getUserByBotID } from '../actions/user.actions';
import Trades from '@/section/UserTrades';

const TargetUserTrades = () => {
  const [targetUser, setTargetUser] = useState<IUserInfoRuntime | null>(null);
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const getUser = async () => {
      const _user = await getUserByBotID(user.uid);
      setTargetUser(_user)
    }
    getUser();
  }, [user])
  return <Trades targetUser={targetUser} />
}

export default TargetUserTrades