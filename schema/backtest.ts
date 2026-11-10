import { BacktestSummary } from "@/interfaces";
import mongoose, { Model, Schema, Document } from "mongoose";

const BacktestTradeSchema = new Schema({
    side: { type: String, enum: ['LONG', 'SHORT'], required: true },
    entryPrice: { type: Number, required: true },
    exitPrice: { type: Number, required: true },
    entryTime: { type: Number, required: true },
    exitTime: { type: Number, required: true },
    durationBars: { type: Number, required: true },
    grossPnl: { type: Number, required: true },
    netPnl: { type: Number, required: true },
    commission: { type: Number, required: true },
    roePercent: { type: Number, required: true },
    reason: { type: String, required: true },
}, { _id: false });

const RiskConfigSchema = new Schema({
    risk: { type: Number, required: true },
    riskType: { type: String, required: true },
    tpPerc: { type: Number, required: true },
    slPerc: { type: Number },
    slCondition: { type: String, required: true },
    isTrailing: { type: Boolean, required: true },
}, { _id: false });

const MetricsSchema = new Schema({
    totalTrades: { type: Number, required: true },
    wins: { type: Number, required: true },
    losses: { type: Number, required: true },
    winRatePercent: { type: Number, required: true },
    profitFactor: { type: Number, required: true },
    maxDrawdownPercent: { type: Number, required: true },
    maxDrawdownUSDT: { type: Number, required: true },
    totalFeesPaid: { type: Number, required: true },
    totalCommissionsPaid: { type: Number, required: true },
    avgTradeDurationBars: { type: Number, required: true },
    avgTradePnL: { type: Number, required: true },
    largestWin: { type: Number, required: true },
    largestLoss: { type: Number, required: true },
}, { _id: false });

const SideBreakdownSchema = new Schema({
    total: { type: Number, required: true },
    wins: { type: Number, required: true },
    winRatePercent: { type: Number, required: true },
}, { _id: false });

const StrategyBacktestResultSchema = new Schema({
    strategyName: { type: String, required: true },
    description: { type: String },
    timeframe: { type: String, required: true },
    startingBalance: { type: Number, required: true },
    endingBalance: { type: Number, required: true },
    netProfit: { type: Number, required: true },
    netProfitPercent: { type: Number, required: true },
    compounded: { type: Boolean, required: true },
    riskConfig: { type: RiskConfigSchema, required: true },
    metrics: { type: MetricsSchema, required: true },
    breakdown: {
        long: { type: SideBreakdownSchema, required: true },
        short: { type: SideBreakdownSchema, required: true },
    },
    recentTrades: [BacktestTradeSchema],
}, { _id: false });

export interface IBacktestSummaryDocument extends BacktestSummary, Document {
    BotID: string,
    UID: string,
    createdAt: Date;
    updatedAt: Date;
}

const BacktestSummarySchema = new Schema<IBacktestSummaryDocument>({
    BotID: { type: String, required: true, index: true },
    UID: { type: String, required: true, index: true },
    symbol: { type: String, required: true, index: true },
    timeframe: { type: String, required: true, index: true },
    serviceFee: { type: Number, required: true },
    period: {
        days: { type: Number, required: true },
        totalCandles: { type: Number, required: true },
        from: { type: Date, required: true },
        to: { type: Date, required: true },
    },
    bestStrategy: { type: String, required: true },
    rankedResults: [StrategyBacktestResultSchema],
}, {
    timestamps: true
});

BacktestSummarySchema.index({ BotID: 1, createdAt: -1 });
BacktestSummarySchema.index({ symbol: 1, timeframe: 1 });

let BacktestModel: Model<IBacktestSummaryDocument>;
try {
    BacktestModel = mongoose.model<IBacktestSummaryDocument>("backtests");
} catch {
    BacktestModel = mongoose.model<IBacktestSummaryDocument>("backtests", BacktestSummarySchema, "Backtests");
}

export default BacktestModel