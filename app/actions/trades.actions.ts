"use server"

import { CustomLineChartInsideData } from "@/components/CustomLineChart";
import { SUPER_USER_ROLE } from "@/constants";
import { TradeAnalytics, TradesStatsResults } from "@/interfaces";
import { connectDB } from "@/lib/mongoose";
import { getSession } from "@/lib/nextauth"
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

    const trades = await TradesModel
        .find({ BotID: user.BotID, isFilled: true })
        .sort({ Timestamp: -1 })
        .limit(limit)
        .lean();

    return JSON.parse(JSON.stringify(trades));
}

export const generateDailyTradeAnalytics = async (
    targetEmail: string,
    days: number = 7
): Promise<TradeAnalytics | null> => {
    await connectDB();
    const session = await getSession();
    if (!session) return null;

    const user = await UserModel.findOne({ Email: session.user.email }).lean();
    if (!user) return null;

    if (targetEmail !== session.user.email && session.user.accountType !== SUPER_USER_ROLE)
        return null;

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const trades = await TradesModel.find({
        BotID: user.BotID,
        isFilled: true,
        Timestamp: { $gte: startDate }
    }).sort({ Timestamp: 1 }).lean();

    const dailyMap = new Map<string, { fee: number; pnl: number }>();

    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);

        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dailyMap.set(dateKey, { fee: 0, pnl: 0 });
    }

    trades.forEach((t) => {
        const tradeDate = new Date(t.Timestamp);
        const dateKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}-${String(tradeDate.getDate()).padStart(2, '0')}`;

        const feeVal = (t.commission || 0) + (t.serviceFee || 0);
        const netProfit = (t.realizedProfit || 0) - feeVal;

        if (dailyMap.has(dateKey)) {
            const current = dailyMap.get(dateKey)!;
            dailyMap.set(dateKey, {
                fee: current.fee + feeVal,
                pnl: current.pnl + netProfit
            });
        }
    });

    let runningPnl = 0;
    let totalFees = 0;

    const cumulativePnlData: CustomLineChartInsideData[] = [];
    const breakdownChartData: { day: string; fee: number; pnl: number }[] = [];

    Array.from(dailyMap.entries()).forEach(([dateStr, metrics], idx) => {
        runningPnl += metrics.pnl;
        totalFees += metrics.fee;

        const [year, month, day] = dateStr.split('-').map(Number);
        const formattedDate = new Date(year, month - 1, day).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });

        cumulativePnlData.push({
            id: idx + 1,
            date: formattedDate,
            value: parseFloat(runningPnl.toFixed(2)),
            value2: parseFloat(metrics.pnl.toFixed(2))
        });

        breakdownChartData.push({
            day: formattedDate,
            fee: parseFloat(metrics.fee.toFixed(3)),
            pnl: parseFloat(metrics.pnl.toFixed(2))
        });
    });

    return {
        cumulativePnlData,
        breakdownData: {
            chartData: breakdownChartData,
            totalNetPnl: parseFloat(runningPnl.toFixed(2)),
            totalFees: parseFloat(totalFees.toFixed(3))
        }
    };
};

export const getUserTrades = async (botID: string, targetDates: { fromDate: string, toDate: string }): Promise<ITrades[]> => {
    await connectDB();
    if (!botID.trim()) return [];

    let query: any = {
        BotID: botID,
        isFilled: true,
    };

    const _timestamp: Record<string, number> = {};
    if (targetDates?.fromDate?.trim()) {
        const startTimestamp = new Date(`${targetDates.fromDate.trim()}T00:00:00.000Z`).getTime();
        if (!isNaN(startTimestamp)) {
            _timestamp.$gte = startTimestamp;
        }
    }

    if (targetDates?.toDate?.trim()) {
        const endTimestamp = new Date(`${targetDates.toDate.trim()}T23:59:59.999Z`).getTime();
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
            $match: { Demo: false, isFilled: true }
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
                Demo: false,
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