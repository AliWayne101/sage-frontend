"use server"

import BacktestModel, { IBacktestSummaryDocument } from "@/schema/backtest";

export const getRecentBacktestSummary = async(): Promise<IBacktestSummaryDocument[]> => {
    const backtests = await BacktestModel.find().sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(backtests)) as IBacktestSummaryDocument[];
}