"use server"

import { CustomLineChartInsideData } from "@/components/CustomLineChart";
import { SUPER_USER_ROLE } from "@/constants";
import { TradeAnalytics } from "@/interfaces";
import { getSession } from "@/lib/nextauth"
import TradesModel, { ITrades } from "@/schema/trades";
import UserModel from "@/schema/users";

export const getRecentTrades = async (targetEmail: string, limit: number = 10): Promise<ITrades[] | null> => {
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
    const session = await getSession();
    if (!session) return null;

    const user = await UserModel.findOne({ Email: session.user.email }).lean();
    if (!user) return null;

    if (targetEmail !== session.user.email && session.user.accountType !== SUPER_USER_ROLE)
        return null;

    // 1. Calculate start boundary based on dynamic `days` parameter
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    // 2. Fetch trades matching user, status, and Timestamp strictly
    const trades = await TradesModel.find({
        BotID: user.BotID,
        isFilled: true,
        Timestamp: { $gte: startDate }
    }).sort({ Timestamp: 1 }).lean();

    // 3. Map structure for daily tracking
    const dailyMap = new Map<string, { fee: number; pnl: number }>();

    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);

        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dailyMap.set(dateKey, { fee: 0, pnl: 0 });
    }

    // 4. Process all trades strictly using `Timestamp`
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

    // 5. Construct both datasets in a single loop
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

        // Dataset 1: Cumulative PnL Line Chart
        cumulativePnlData.push({
            id: idx + 1,
            date: formattedDate,
            value: parseFloat(runningPnl.toFixed(2)),
            value2: parseFloat(metrics.pnl.toFixed(2))
        });

        // Dataset 2: Fee & PnL Breakdown Bar Chart
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