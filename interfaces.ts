export interface SessionUser {
    name: string;
    uid: string;
    role: string;
    accountType: string;
    image: string;
}

export interface LineChartData {
    index: number;
    date: string;
    linevalue: number;
    independentvalue: number;
}

export interface BotHeartbeat {
    Balance: number;
    Demo: boolean;
    Trading: boolean;
    Logs: Log[];
    ActiveTrade: {
        orderId: string;
        symbol: string;
        side: string;
        entryPrice: number;
        markPrice: number;
        size: number;
        notional: number;
        liqPrice: number;
        marginBuffer: number;
        unrealizedPnl: number;
        roe: number;
    }
}

export interface Log {
    type: "system" | "error" | "order";
    message: string;
    timestamp: Date;
}

export enum Direction {
    Long,
    Short
}
