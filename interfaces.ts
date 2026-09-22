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


export interface Filter {
    name: string;
    value: boolean;
    multiplier: number;
}

export interface StrategyCondition {
    enabled: boolean;
    type?: 'above' | 'below' | 'greater' | 'less' | 'bullish' | 'bearish';
    threshold?: number;
    period?: number;
    multiplier?: number;
    bool?: boolean;
    skipDecision?: boolean;
}

export enum SLCondition {
    LiquidationLimit,
    DynamicSL
}

interface ConditionsProps {
    trigger?: Record<string, StrategyCondition>,
    conditions: Record<string, StrategyCondition>,
    filters?: {
        enabled: boolean,
        conditions?: Filter[][]
    }
}

export interface Strategy {
    name: string;
    TriggerWindowBars?: number;
    description?: string;
    MaxCandlesHistory: number;
    MinBalanceRequired?: number;
    KLine?: string;
    InvalidateNewExtreme?: boolean;
    entry: {
        direction: {
            long: ConditionsProps;
            short: ConditionsProps;
        }
    };
    risk: {
        riskPer: number;
        riskPerType?: 'percent' | 'fixed';
        tpPerc: number;
        slPerc?: number;
        slCondition: SLCondition;
    }
}