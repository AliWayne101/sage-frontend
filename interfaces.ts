import { CustomLineChartInsideData } from "./components/CustomLineChart";
import { IUserInfo } from "./schema/users";

export interface SessionUser {
    name: string;
    uid: string;
    accountType: string;
    email: string;
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
    Status: string;
    Logs: Log[];
    ActiveTrade?: {
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

export interface IUserInfoRuntime extends IUserInfo {
    DecryptedKey: string;
    DecryptedSecret: string;
}

export interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmationVariant;
    isLoading?: boolean;
    details?: ConfirmationModalDetail[];
    onConfirm: () => void | Promise<void>;
}
export type ConfirmationVariant = 'danger' | 'warning' | 'info' | 'primary';
export interface ConfirmationModalDetail {
    label: string;
    value: React.ReactNode;
}

export interface TradeAnalytics {
    cumulativePnlData: CustomLineChartInsideData[];
    breakdownData: {
        chartData: { day: string; fee: number; pnl: number }[];
        totalNetPnl: number;
        totalFees: number;
    };
}

export interface TradeMetrics {
    winRate: number,
    totalGrossProfit: number,
    totalCommission: number,
    totalNetProfit: number,
    totalFees: number
}