"use server"

import { SUPER_USER_ROLE } from "@/constants";
import { getSession } from "@/lib/nextauth"
import TradesModel, { ITrades } from "@/schema/trades";
import UserModel from "@/schema/users";

export const getRecentTrades = async (targetEmail: string, limit: number = 10): Promise<ITrades[] | null> => {
    const session = await getSession();
    if (!session) return null;

    const user = await UserModel.findOne({ Email: session.user.email }).lean();
    if (!user) return null;

    if (targetEmail !== session.user.email && session.user.accountType !== SUPER_USER_ROLE)
        return null;

    const trades = await TradesModel
        .find({ BotID: user.BotID, isFilled: true })
        .sort({ Timestamp: -1 })
        .limit(limit)
        .lean();

    return JSON.parse(JSON.stringify(trades));
}