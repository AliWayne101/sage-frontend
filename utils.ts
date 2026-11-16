import { DEFAULT_ASSET_PAIRS } from "./constants";
import crypto from "crypto";
import { BacktestTrade, TradeAnalytics } from "./interfaces";
import { ITrades } from "./schema/trades";
import { CustomLineChartInsideData } from "./components/CustomLineChart";
export function formatCurrency(amount: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(amount);
}

export function formatPercent(value: number, decimals: number = 2): string {
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(decimals)}%`;
}

export async function getTradingSymbols(): Promise<string[]> {
    //Get the trading pairs
    return DEFAULT_ASSET_PAIRS;
}

export function generateSageID(totalLength: number = 6): string {
    const PREFIX = "SAGE-";

    if (totalLength <= PREFIX.length) {
        throw new Error(`Length must be greater than prefix length (${PREFIX.length})`);
    }

    const randomLength = totalLength - PREFIX.length;
    // Character set avoiding ambiguous characters (like 0, O, 1, I)
    const charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

    const randomBytes = crypto.randomBytes(randomLength);
    let randomString = "";

    for (let i = 0; i < randomLength; i++) {
        randomString += charset[randomBytes[i] % charset.length];
    }

    return `${PREFIX}${randomString}`;
}

export function generateID(totalLength: number = 12): string {
    const charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

    const randomBytes = crypto.randomBytes(totalLength);
    let randomString = "";

    for (let i = 0; i < totalLength; i++) {
        randomString += charset[randomBytes[i] % charset.length];
    }

    return randomString;
}

export function formatTradeTimestamp(timestamp?: number | string): string {
    if (!timestamp) return '—';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return String(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${mins}`;
}

export const ConstructAnalytics = (trades: (ITrades | BacktestTrade)[], days: number): TradeAnalytics => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const dailyMap = new Map<string, { fee: number; netPnl: number; grossPnl: number }>();

    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);

        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dailyMap.set(dateKey, { fee: 0, netPnl: 0, grossPnl: 0 });
    }

    trades.forEach((t) => {
        const rawTime = ('Timestamp' in t && t.Timestamp) || ('entryTime' in t && t.entryTime);

        if (!rawTime) return;

        const tradeDate = typeof rawTime === 'number'
            ? new Date(rawTime < 1e11 ? rawTime * 1000 : rawTime)
            : new Date(rawTime);

        const dateKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}-${String(tradeDate.getDate()).padStart(2, '0')}`;

        let grossPnl = 0;
        let feeVal = 0;

        if ('grossPnl' in t) {
            // BacktestTrade structure
            grossPnl = t.grossPnl || 0;
            feeVal = t.commission || 0;
        } else {
            // ITrades structure
            grossPnl = t.realizedProfit || 0;
            feeVal = (t.commission || 0) + (t.serviceFee || 0);
        }

        const netProfit = grossPnl - feeVal;

        if (dailyMap.has(dateKey)) {
            const current = dailyMap.get(dateKey)!;
            dailyMap.set(dateKey, {
                fee: current.fee + feeVal,
                netPnl: current.netPnl + netProfit,
                grossPnl: current.grossPnl + grossPnl
            });
        }
    });

    let runningGrossPnl = 0;
    let totalFees = 0;

    const cumulativePnlData: CustomLineChartInsideData[] = [];
    const breakdownChartData: { day: string; fee: number; pnl: number }[] = [];

    Array.from(dailyMap.entries()).forEach(([dateStr, metrics], idx) => {
        runningGrossPnl += metrics.grossPnl;
        totalFees += metrics.fee;

        const [year, month, day] = dateStr.split('-').map(Number);
        const formattedDate = new Date(year, month - 1, day).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });

        cumulativePnlData.push({
            id: idx + 1,
            date: formattedDate,
            value: parseFloat(runningGrossPnl.toFixed(2)),
            value2: parseFloat(metrics.grossPnl.toFixed(2))
        });

        breakdownChartData.push({
            day: formattedDate,
            fee: parseFloat(metrics.fee.toFixed(3)),
            pnl: parseFloat(metrics.netPnl.toFixed(2))
        });
    });

    const totalNetPnl = runningGrossPnl - totalFees;

    return {
        cumulativePnlData,
        breakdownData: {
            chartData: breakdownChartData,
            totalNetPnl: parseFloat(totalNetPnl.toFixed(2)),
            totalFees: parseFloat(totalFees.toFixed(3))
        }
    };
};