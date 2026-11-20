"use server"

import { SUPER_USER_ROLE } from "@/constants";
import { Exchange, TradeAnalytics, TradesStatsResults } from "@/interfaces";
import { connectDB } from "@/lib/mongoose";
import { getSession } from "@/lib/nextauth"
import { ConstructAnalytics } from "@/utils";
import TradesModel, { ITrades } from "@/schema/trades";
import UserModel from "@/schema/users";

export const getRecentTrades = async (targetEmail: string, limit: number = 10): Promise<ITrades[] | null> => {
    await connectDB();
    const session = await getSession();
    if (!session) return null;

    const user = await UserModel.findOne({ Email: targetEmail }).lean();
    if (!user) return null;

    if (targetEmail !== session.user.email && session.user.accountType !== SUPER_USER_ROLE)
        return null;

    let tradeExchange: Exchange = Exchange.SANDBOX;
    if (!user.Sandbox) tradeExchange = user.Demo ? Exchange.DEMO : Exchange.LIVE;

    const trades = await TradesModel
        .find({ BotID: user.BotID, isFilled: true, Exchange: tradeExchange })
        .sort({ Timestamp: -1 })
        .limit(limit)
        .lean();

    return JSON.parse(JSON.stringify(trades));
}

export const generateDailyTradeAnalytics = async (
    targetEmail: string,
    days: number = 7
): Promise<TradeAnalytics> => {
    await connectDB();
    const session = await getSession();
    if (!session)
        return {
            cumulativePnlData: [],
            breakdownData: {
                chartData: [],
                totalFees: 0,
                totalNetPnl: 0
            }
        };

    const user = await UserModel.findOne({ Email: targetEmail }).lean();
    if (!user)
        return {
            cumulativePnlData: [],
            breakdownData: {
                chartData: [],
                totalFees: 0,
                totalNetPnl: 0
            }
        };

    if (targetEmail !== session.user.email && session.user.accountType !== SUPER_USER_ROLE)
        return {
            cumulativePnlData: [],
            breakdownData: {
                chartData: [],
                totalFees: 0,
                totalNetPnl: 0
            }
        };

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    let tradeExchange: Exchange = Exchange.SANDBOX;
    if (!user.Sandbox) tradeExchange = user.Demo ? Exchange.DEMO : Exchange.LIVE;

    const trades = await TradesModel.find({
        BotID: user.BotID,
        isFilled: true,
        Exchange: tradeExchange,
        Timestamp: { $gte: startDate }
    }).sort({ Timestamp: 1 }).lean();

    const analytics = ConstructAnalytics(trades, days);
    return analytics;
};

export const getUserTrades = async (botID: string, targetDates: { fromDate: string, toDate: string }): Promise<ITrades[]> => {
    await connectDB();
    if (!botID.trim()) return [];

    const session = await getSession();
    if (!session) return [];

    const user = await UserModel.findOne({ BotID: botID }).lean();
    if (!user) return [];

    if (botID !== session.user.uid && session.user.accountType !== SUPER_USER_ROLE)
        return [];

    let tradeExchange: Exchange = Exchange.SANDBOX;
    if (!user.Sandbox) tradeExchange = user.Demo ? Exchange.DEMO : Exchange.LIVE;

    let query: any = {
        BotID: botID,
        isFilled: true,
        Exchange: tradeExchange
    };

    const _timestamp: Record<string, number> = {};
    if (targetDates?.fromDate?.trim()) {
        const startTimestamp = new Date(`${targetDates.fromDate.trim().slice(0, 10)}T00:00:00.000+05:00`).getTime();
        if (!isNaN(startTimestamp)) {
            _timestamp.$gte = startTimestamp;
        }
    }

    if (targetDates?.toDate?.trim()) {
        const endTimestamp = new Date(`${targetDates.toDate.trim().slice(0, 10)}T23:59:59.999+05:00`).getTime();
        if (!isNaN(endTimestamp)) {
            _timestamp.$lte = endTimestamp;
        }
    }

    if (Object.keys(_timestamp).length > 0) {
        query.Timestamp = _timestamp;
    }

    const trades = await TradesModel.find(query).sort({ Timestamp: -1 }).lean();
    return JSON.parse(JSON.stringify(trades))
}

interface RealizedProfitAggregateResult {
    _id: null;
    totalRealizedProfit: number;
}

export async function getOverallRealizedProfit(): Promise<number> {
    await connectDB();
    const session = await getSession();
    if (!session) return 0;
    if (session.user.accountType !== SUPER_USER_ROLE) return 0;

    const [result] = await TradesModel.aggregate<RealizedProfitAggregateResult>([
        {
            $match: { Exchange: Exchange.LIVE, isFilled: true }
        },
        {
            $group: {
                _id: null,
                totalRealizedProfit: { $sum: "$realizedProfit" }
            }
        }
    ]);

    return result?.totalRealizedProfit ?? 0;
}

export async function getBotStats(botId: string): Promise<TradesStatsResults> {
    await connectDB();
    const session = await getSession();
    if (!session || session.user.accountType !== SUPER_USER_ROLE)
        return {
            _id: null,
            totalRealizedProfit: 0,
            count: 0,
            avgProfitPerc: 0
        }

    const [result] = await TradesModel.aggregate([
        {
            $match: {
                BotID: botId,
                Exchange: Exchange.LIVE,
                isFilled: true
            }
        },
        {
            $group: {
                _id: null,
                totalRealizedProfit: { $sum: "$realizedProfit" },
                totalNotional: { $sum: "$notional" },
                count: { $sum: 1 }
            }
        }
    ]);

    if (!result) {
        return {
            _id: null,
            totalRealizedProfit: 0,
            count: 0,
            avgProfitPerc: 0
        };
    }

    const avgProfitPerc = result.totalNotional > 0
        ? (result.totalRealizedProfit / result.totalNotional) * 100
        : 0;

    return {
        _id: null,
        totalRealizedProfit: result.totalRealizedProfit,
        count: result.count,
        avgProfitPerc: Number(avgProfitPerc.toFixed(2))
    };
}