/**
 * Mockup Candle Data & Generator for TradingView Chart Integration
 * 
 * SCHEMA DEFINITION:
 * export type Candle = {
 *    symbol: string;               // e.g. "BTCUSDT" (dictated by active strategy)
 *    open_time: number;            // Unix timestamp (ms) when candle starts
 *    close_time: number;           // Unix timestamp (ms) when candle completes
 *    interval: string;             // e.g. "1m", "5m", "15m", "1h" (dictated by strategy KlineBar)
 *    open: number;                 // Opening price of the bar
 *    close: number;                // Closing price of the bar
 *    high: number;                 // Highest price reached during bar
 *    low: number;                  // Lowest price reached during bar
 *    volume: number;               // Volume traded during bar
 *    barIndex: number | undefined; // 0-based sequential index (0, 1, 2, ..., N-1)
 * };
 */

import { Candle, HeartbeatActiveTrade, Position } from '@/interfaces';

/**
 * Direction enum mapping to match your project codebase (0 = Long, 1 = Short)
 */
export enum Direction {
    Long = 0,
    Short = 1,
}

/**
 * Example Active Position matching HeartbeatActiveTrade schema
 * This position opened on bar #124 at $64,280.50
 */
export const SAMPLE_ACTIVE_POSITION: HeartbeatActiveTrade = {
    orderId: '89104712',
    symbol: 'BTCUSDT',
    side: Direction.Long,
    entryPrice: 64280.50,
    markPrice: 65120.00,
    size: 0.15,
    notional: 9768.00,
    liqPrice: 58450.00,
    marginBuffer: 90.5,
    unrealizedPnl: 125.92,
    roe: 12.89,
    entryBarIndex: 124, // Primary barIndex where active position opened
};

/**
 * Example Completed Historical Closed Trades matching your Position schema
 * Contains both entryBarIndex and closeBarIndex for proper chart marker placement.
 */
export const SAMPLE_HISTORICAL_TRADES: Position[] = [
    {
        uid: 'tr_01_a9f',
        orderId: 89091241,
        symbol: 'BTCUSDT',
        side: Direction.Long,
        entryPrice: 63800.00,
        quantity: 0.15,
        notional: 9570.00,
        isolatedWallet: 957.00,
        liquidationPrice: 57900.00,
        commission: 3.82,
        realizedPnl: 142.50,
        margin: 957.00,
        Timestamp: new Date(Date.now() - 3600000 * 2),
        entryBarIndex: 92,
        closeBarIndex: 110,
    },
    {
        uid: 'tr_02_b8e',
        orderId: 89083120,
        symbol: 'BTCUSDT',
        side: Direction.Short,
        entryPrice: 64550.20,
        quantity: 0.15,
        notional: 9682.53,
        isolatedWallet: 968.25,
        liquidationPrice: 71200.00,
        commission: 3.87,
        realizedPnl: 86.40,
        margin: 968.25,
        Timestamp: new Date(Date.now() - 3600000 * 5),
        entryBarIndex: 68,
        closeBarIndex: 85,
    },
    {
        uid: 'tr_03_c7d',
        orderId: 89075411,
        symbol: 'BTCUSDT',
        side: Direction.Long,
        entryPrice: 64200.00,
        quantity: 0.15,
        notional: 9630.00,
        isolatedWallet: 963.00,
        liquidationPrice: 58100.00,
        commission: 3.83,
        realizedPnl: -35.20,
        margin: 963.00,
        Timestamp: new Date(Date.now() - 86400000),
        entryBarIndex: 40,
        closeBarIndex: 58,
    },
    {
        uid: 'tr_04_d6c',
        orderId: 89061099,
        symbol: 'BTCUSDT',
        side: Direction.Long,
        entryPrice: 62900.00,
        quantity: 0.15,
        notional: 9435.00,
        isolatedWallet: 943.50,
        liquidationPrice: 56900.00,
        commission: 3.78,
        realizedPnl: 215.80,
        margin: 943.50,
        Timestamp: new Date(Date.now() - 86400000 * 2),
        entryBarIndex: 15,
        closeBarIndex: 32,
    },
    {
        uid: 'tr_05_e5b',
        orderId: 89042817,
        symbol: 'BTCUSDT',
        side: Direction.Short,
        entryPrice: 63400.00,
        quantity: 0.15,
        notional: 9510.00,
        isolatedWallet: 951.00,
        liquidationPrice: 69800.00,
        commission: 3.80,
        realizedPnl: 110.30,
        margin: 951.00,
        Timestamp: new Date(Date.now() - 86400000 * 3),
        entryBarIndex: 2,
        closeBarIndex: 12,
    },
];

/**
 * Generator helper to synthesize a realistic, mathematically continuous
 * candle series with zero gaps (`open[i] === close[i - 1]`).
 */
export function createMockCandleSeries(options?: {
    symbol?: string;
    interval?: string;
    totalBars?: number;
    startPrice?: number;
    endPrice?: number;
    activePosEntryBar?: number;
    activePosEntryPrice?: number;
}): Candle[] {
    const symbol = options?.symbol || 'BTCUSDT';
    const interval = options?.interval || '1m';
    const totalBars = options?.totalBars || 150;
    const startPrice = options?.startPrice || 63400;
    const endPrice = options?.endPrice || 65120;
    const activePosEntryBar = options?.activePosEntryBar ?? 124;
    const activePosEntryPrice = options?.activePosEntryPrice ?? 64280.50;

    const intervalMs = interval === '5m' ? 300000 : interval === '15m' ? 900000 : interval === '1h' ? 3600000 : 60000;
    const now = Date.now();
    const currentBarClose = Math.floor(now / intervalMs) * intervalMs;
    const startBarOpen = currentBarClose - totalBars * intervalMs;

    const waypoints = [
        { bar: 0, price: startPrice },
        { bar: 2, price: 63400 },
        { bar: 12, price: 62820 },
        { bar: 15, price: 62900 },
        { bar: 32, price: 64350 },
        { bar: 40, price: 64200 },
        { bar: 58, price: 63965 },
        { bar: 68, price: 64550 },
        { bar: 85, price: 63974 },
        { bar: 92, price: 63800 },
        { bar: 110, price: 64750 },
        { bar: activePosEntryBar, price: activePosEntryPrice },
        { bar: totalBars - 1, price: endPrice },
    ];

    function getTarget(b: number): number {
        for (let w = 0; w < waypoints.length - 1; w++) {
            const w1 = waypoints[w];
            const w2 = waypoints[w + 1];
            if (b >= w1.bar && b <= w2.bar) {
                const t = (b - w1.bar) / Math.max(1, w2.bar - w1.bar);
                const smooth = t * t * (3 - 2 * t);
                return w1.price + (w2.price - w1.price) * smooth;
            }
        }
        return waypoints[waypoints.length - 1].price;
    }

    const candles: Candle[] = [];
    let prevClose = startPrice;

    for (let i = 0; i < totalBars; i++) {
        const openTime = startBarOpen + i * intervalMs;
        const closeTime = openTime + intervalMs - 1;

        // Strict zero-gap: Open matches previous Close
        const open = Math.round(prevClose * 100) / 100;
        const target = getTarget(i);
        const wp = waypoints.find((w) => w.bar === i);

        let close: number;
        if (wp && i > 0) {
            close = Math.round(wp.price * 100) / 100;
        } else {
            const pull = (target - open) * 0.45;
            const noise = (Math.sin(i * 1.618) * 0.5 + Math.cos(i * 2.718) * 0.5) * (open * 0.0006);
            close = Math.round((open + pull + noise) * 100) / 100;
        }

        const bodyMax = Math.max(open, close);
        const bodyMin = Math.min(open, close);
        const upperWick = Math.round((Math.abs(Math.sin(i * 3.14)) * 0.6 + 0.2) * (open * 0.0007) * 100) / 100;
        const lowerWick = Math.round((Math.abs(Math.cos(i * 2.41)) * 0.6 + 0.2) * (open * 0.0007) * 100) / 100;

        const high = Math.round((bodyMax + upperWick) * 100) / 100;
        const low = Math.round((bodyMin - lowerWick) * 100) / 100;
        const volume = Math.round((22 + Math.abs(Math.sin(i * 1.5)) * 30) * 100) / 100;

        candles.push({
            symbol,
            open_time: openTime,
            close_time: closeTime,
            interval,
            open,
            close,
            high,
            low,
            volume,
            barIndex: i,
        });

        prevClose = close;
    }

    return candles;
}

/**
 * Standard 150-bar Mockup Dataset for BTCUSDT 1m
 */
export const MOCK_CANDLE_DATA: Candle[] = createMockCandleSeries({
    symbol: 'BTCUSDT',
    interval: '1m',
    totalBars: 150,
    startPrice: 63400,
    endPrice: 65120,
    activePosEntryBar: 124,
    activePosEntryPrice: 64280.50,
});

export default MOCK_CANDLE_DATA;