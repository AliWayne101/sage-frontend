"use client"
import { History, AlertTriangle, ArrowLeft, Award, CheckCircle2, Zap, Layers, Activity, Sparkles, AlertOctagon, Calendar, ArrowRight, RotateCcw, Check, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthProvider';
import { BacktestSummary, BotHeartbeat, Direction, IUserInfoRuntime, StrategyBacktestResult } from '@/interfaces';
import { getUserByBotID, updateUser } from '../actions/user.actions';
import { formatCurrency } from '@/utils';
import Footer from '@/section/Footer';
import ConfirmationModal, { ConfirmationModalDetail, ConfirmationVariant } from '@/components/ConfirmationModal';
import { getRecentBacktestSummary } from '../actions/backtest.actions';
import { server } from '../actions/server.actions';
import { LOAD_INTERVAL } from '@/constants';
import React, { useCallback, useEffect, useMemo, useState } from 'react'

const BacktestPage = () => {
    const router = useRouter();
    const { user } = useAuth();

    const [dailyRuns, setDailyRuns] = useState<BacktestSummary[]>([]);
    const [viewMode, setViewMode] = useState<'detail' | 'history'>('detail');
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [selectedRunIndex, setSelectedRunIndex] = useState(0);
    const [User, setUser] = useState<IUserInfoRuntime | null>(null);
    const [heartBeat, setHeartBeat] = useState<BotHeartbeat | undefined>(undefined);
    const [selectedStrategyIndex, setSelectedStrategyIndex] = useState<number>(0);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title?: string;
        message: string;
        description?: string;
        confirmText?: string;
        cancelText?: string;
        isLoading?: boolean;
        variant?: ConfirmationVariant;
        details?: ConfirmationModalDetail[];
        onConfirm: () => void | Promise<void>;
    }>({
        isOpen: false,
        message: '',
        onConfirm: () => { },
    });

    const updateUserStrategy = async (strategy: StrategyBacktestResult) => {
        if (!User) return;
        setUser((prev) => prev ? { ...prev, StrategyName: strategy.strategyName } : prev);
        await updateUser(User);

        await server({ request: "restart", targetBot: User.BotID });
        fetchData();
    }

    const activeSummary: BacktestSummary | null = useMemo(() => {
        if (!dailyRuns || dailyRuns.length === 0) return null;
        return dailyRuns[selectedRunIndex] || dailyRuns[0];
    }, [dailyRuns, selectedRunIndex]);

    const activeStrategy: StrategyBacktestResult | null = useMemo(() => {
        if (!activeSummary || !activeSummary.rankedResults || activeSummary.rankedResults.length === 0) {
            return null;
        }
        return activeSummary.rankedResults[selectedStrategyIndex] || activeSummary.rankedResults[0];
    }, [activeSummary, selectedStrategyIndex]);

    const handleInitiateApplyStrategy = async (strategy: StrategyBacktestResult) => {
        const isCurrentActive = User?.StrategyName === strategy.strategyName;
        if (isCurrentActive || !heartBeat || !User) return;

        if (heartBeat.ActiveTrade) {
            const sideText = (heartBeat.ActiveTrade.side === Direction.Long) ? 'LONG' : 'SHORT';
            const pnlValue = heartBeat.ActiveTrade.unrealizedPnl ?? 0;
            const pnlFormatted = `${pnlValue >= 0 ? '+' : ''} USDT ${formatCurrency(pnlValue, 2)}`;

            setConfirmModal({
                isOpen: true,
                title: 'Active Position Detected — Liquidate to Apply',
                message: `Liquidate open ${heartBeat.ActiveTrade.symbol} position and apply "${strategy.strategyName}"?`,
                description: `An active position in ${heartBeat.ActiveTrade.symbol} is currently open. Applying a new strategy requires a completely flat market exposure to prevent indicator or margin conflicts. Confirming will liquidate this position at current market price before saving "${strategy.strategyName}" to your bot profile in the database.`,
                variant: 'danger',
                confirmText: 'Liquidate Position & Apply Strategy',
                cancelText: 'Cancel',
                details: [
                    { label: 'Current Position', value: `${heartBeat.ActiveTrade.symbol} (${sideText})` },
                    { label: 'Entry Price', value: `USDT ${formatCurrency(heartBeat.ActiveTrade.entryPrice, 2)}` },
                    { label: 'Mark Price', value: `USDT ${formatCurrency(heartBeat.ActiveTrade.markPrice || heartBeat.ActiveTrade.entryPrice, 2)}` },
                    { label: 'Unrealized PnL', value: pnlFormatted },
                    { label: 'Target Strategy', value: strategy.strategyName },
                    { label: 'Trailing Ratchet', value: strategy.riskConfig.isTrailing ? 'Step-Ratchet ON' : 'Standard' },
                ],
                onConfirm: async () => {
                    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
                    try {
                        await server({ request: "forceClose", targetBot: User.BotID });
                        await updateUserStrategy(strategy);
                        showToast(
                            `Active position liquidated and strategy "${strategy.strategyName}" successfully applied to your bot profile in the database!`,
                            'success'
                        );
                        setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
                    } catch (err: any) {
                        console.error('Failed to apply strategy with liquidation:', err);
                        showToast(err.message || 'Failed to apply strategy', 'error');
                        setConfirmModal((prev) => ({ ...prev, isLoading: false }));
                    }
                },
            });
        } else {
            setConfirmModal({
                isOpen: true,
                title: 'Apply Strategy to Bot Profile',
                message: `Apply "${strategy.strategyName}" to your bot profile in database?`,
                description: `Market exposure is flat (no active positions). Confirming will update bot ${User.BotID}'s active strategy to "${strategy.strategyName}" in the database. Upcoming trades will execute with this model's parameters.`,
                variant: 'primary',
                confirmText: `Apply Strategy`,
                cancelText: 'Cancel',
                details: [
                    { label: 'Bot ID', value: User.BotID },
                    { label: 'Strategy Name', value: strategy.strategyName },
                    { label: 'Target Asset', value: activeSummary?.symbol || 'N/A' },
                    { label: 'Take Profit Target', value: `${(strategy.riskConfig.tpPerc * 100).toFixed(2)}%` },
                    { label: 'Stop Loss Condition', value: strategy.riskConfig.slCondition },
                    { label: 'Trailing Ratchet', value: strategy.riskConfig.isTrailing ? 'Step-Ratchet ON' : 'Disabled' },
                    { label: 'Simulated Win Rate', value: `${strategy.metrics.winRatePercent.toFixed(1)}%` },
                ],
                onConfirm: async () => {
                    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
                    try {
                        await updateUserStrategy(strategy);
                        showToast(
                            `Strategy "${strategy.strategyName}" successfully applied to your bot profile in database!`,
                            'success'
                        );
                        setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
                    } catch (err: any) {
                        console.error('Failed to apply strategy:', err);
                        showToast(err.message || 'Failed to apply strategy', 'error');
                        setConfirmModal((prev) => ({ ...prev, isLoading: false }));
                    }
                },
            });
        }
    };

    const handleSelectHistoryRun = (index: number) => {
        setSelectedRunIndex(index);
        setSelectedStrategyIndex(0);
        setViewMode('detail');
    };

    const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => {
            setToastMessage(null);
        }, 6000);
    };

    useEffect(() => {
        if (!user || !user.uid) return;
        const loadUser = async () => {
            const _user = await getUserByBotID(user.uid);
            if (!_user) return;
            setUser(_user);

            const summaries = await getRecentBacktestSummary();
            setDailyRuns(summaries);
        }
        loadUser();
    }, [user])

    const fetchData = useCallback(async () => {
        try {
            const _hData = await server<BotHeartbeat>({ request: "heartbeat" });
            if (!_hData) {
                showToast("Unable to load the heartbeat data", "error");
            } else {
                setHeartBeat(_hData);
            }
        } catch (error) {
            showToast("Seems to be an error refreshing", "error");
            console.log(error);
        }
    }, [User])

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, LOAD_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchData])

    const isViewingLatest = selectedRunIndex === 0;

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
            <header className="sticky top-0 z-30 bg-[#0c0c0e]/95 backdrop-blur border-b border-[#27272a] px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded bg-zinc-900 border border-[#27272a] hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center gap-1.5 text-xs font-mono shrink-0"
                        title="Return to Live Dashboard"
                    >
                        <ArrowLeft className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">Back to Dashboard</span>
                        <span className="sm:hidden">Back</span>
                    </button>

                    <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded bg-blue-950/80 border border-blue-700/80 flex items-center justify-center font-bold text-blue-400 text-xs shadow-md shrink-0">
                            <Zap className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xs sm:text-sm font-semibold tracking-tight text-white font-mono truncate">
                                    {viewMode === 'history' ? 'Daily Backtest History' : 'Daily Backtest Benchmarks'}
                                </h1>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono hidden md:block">
                                {viewMode === 'history'
                                    ? 'Historical archive of automated backtests'
                                    : 'Automated daily benchmark results'}
                            </p>
                        </div>
                    </div>
                </div>

            </header>

            {/* Main Container */}
            <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-4 sm:space-y-6">
                {/* Toast Feedback Notification Banner */}
                {toastMessage && (
                    <div
                        className={`p-3.5 rounded-lg border text-xs font-mono flex items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 ${toastMessage.type === 'success'
                            ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                            : toastMessage.type === 'error'
                                ? 'bg-rose-950/80 border-rose-600 text-rose-200'
                                : 'bg-blue-950/80 border-blue-600 text-blue-200'
                            }`}
                    >
                        <div className="flex items-center gap-2.5">
                            {toastMessage.type === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : toastMessage.type === 'error' ? (
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            ) : (
                                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                            )}
                            <span className="leading-relaxed font-medium">{toastMessage.text}</span>
                        </div>
                        <button
                            onClick={() => setToastMessage(null)}
                            className="text-zinc-400 hover:text-white font-bold px-1.5"
                        >
                            X
                        </button>
                    </div>
                )}

                {/* Live Active Position Warning / Status Indicator */}
                {heartBeat?.ActiveTrade ? (
                    <div className="p-3.5 sm:p-4 bg-amber-950/30 border border-amber-800/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                        <div className="flex items-start sm:items-center gap-2.5">
                            <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                            <div>
                                <span className="font-semibold text-amber-300 block sm:inline">Active Trade in Progress: </span>
                                <span className="text-zinc-300">
                                    {heartBeat.ActiveTrade.symbol} ({(heartBeat.ActiveTrade.side === Direction.Long) ? 'LONG' : 'SHORT'}) @ <small>USDT</small> {formatCurrency(heartBeat.ActiveTrade.entryPrice, 2)}
                                    <strong className={(heartBeat.ActiveTrade.unrealizedPnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                        {(heartBeat.ActiveTrade.unrealizedPnl ?? 0) >= 0 ? '+' : ''}<small>USDT</small> {formatCurrency(heartBeat.ActiveTrade.unrealizedPnl ?? 0, 2)}
                                    </strong>
                                </span>
                                <p className="text-[11px] text-zinc-400 mt-0.5">
                                    Applying any strategy will open a confirmation modal to liquidate this position at market price before saving the strategy to your profile.
                                </p>
                            </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 border border-amber-700 text-amber-300 uppercase tracking-wider shrink-0 self-start sm:self-auto font-bold">
                            Position Open
                        </span>
                    </div>
                ) : (
                    <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between gap-3 font-mono text-xs text-zinc-400">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>
                                <strong>Flat Market Exposure:</strong> No active positions open on bot {User?.BotID}. You can apply any benchmarked strategy directly to your bot profile in the database.
                            </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 shrink-0">
                            Ready to Apply
                        </span>
                    </div>
                )}

                {viewMode === 'history' && (
                    <div className="space-y-4">
                        {/* History Header & Navigation */}
                        <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono shadow-sm">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <History className="w-4 h-4 text-blue-400 shrink-0" />
                                    <h2 className="text-xs sm:text-sm uppercase tracking-wider font-bold text-white">
                                        Daily Backtest History Archive
                                    </h2>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                                        {dailyRuns.length} Runs Logged
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-400">
                                    Select any historical backtest run to inspect its complete strategy metrics and apply its model to your bot profile.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedRunIndex(0);
                                        setSelectedStrategyIndex(0);
                                        setViewMode('detail');
                                    }}
                                    className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                                >
                                    <Award className="w-3.5 h-3.5" />
                                    <span>View Latest Result</span>
                                </button>
                            </div>
                        </div>

                        {/* Vertical List of Daily Backtest Runs */}
                        <div className="space-y-3 font-mono">
                            {dailyRuns.map((run, idx) => {
                                const isLatest = idx === 0;
                                const isCurrentlySelected = idx === selectedRunIndex;
                                const bestStrat = run.rankedResults[0];
                                const startingBal = bestStrat?.startingBalance || 1000;
                                const endingBal = bestStrat?.endingBalance || 1000;
                                const netProfit = bestStrat?.netProfit ?? 0;
                                const profitPercent = bestStrat?.netProfitPercent ?? 0;
                                const winRate = bestStrat?.metrics?.winRatePercent ?? 0;
                                const wins = bestStrat?.metrics?.wins ?? 0;
                                const losses = bestStrat?.metrics?.losses ?? 0;
                                const totalTrades = bestStrat?.metrics?.totalTrades ?? 0;
                                const profitFactor = bestStrat?.metrics?.profitFactor ?? 0;
                                const maxDd = bestStrat?.metrics?.maxDrawdownPercent ?? 0;

                                const dateLabel = isLatest ? 'Today' : idx === 1 ? 'Yesterday' : `${new Date(run.executedAt).toLocaleDateString()}`;

                                return (
                                    <div
                                        key={run.executedAt.getTime()}
                                        onClick={() => handleSelectHistoryRun(idx)}
                                        className={`bg-[#121214] border transition-all rounded-lg p-4 sm:p-5 cursor-pointer group hover:bg-[#151518] hover:border-blue-500/80 shadow-md ${isCurrentlySelected
                                            ? 'border-blue-500 bg-blue-950/10 ring-1 ring-blue-500/50'
                                            : 'border-[#27272a]'
                                            }`}
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            <div className="space-y-2 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="flex items-center gap-1.5 text-xs text-white font-bold">
                                                        <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                                        <span>{dateLabel}</span>
                                                    </div>

                                                    {isLatest && (
                                                        <span className="text-[9.5px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                                                            LATEST RESULT
                                                        </span>
                                                    )}

                                                    {isCurrentlySelected && (
                                                        <span className="text-[9.5px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-blue-950 text-blue-300 border border-blue-700">
                                                            CURRENTLY SELECTED
                                                        </span>
                                                    )}

                                                    <span className="text-[10px] text-zinc-500">
                                                        Symbol: <strong className="text-zinc-300">{run.symbol}</strong> • {run.period.days} Days Lookback
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                                    <span className="text-zinc-400">Best Ranked Strategy:</span>
                                                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-amber-300 font-semibold flex items-center gap-1">
                                                        <Award className="w-3 h-3 text-amber-400" />
                                                        <span>{run.bestStrategy}</span>
                                                    </span>
                                                    <span className="text-[11px] text-zinc-500 hidden sm:inline">
                                                        Tested across {run.rankedResults.length} quant models
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 sm:gap-6 self-start lg:self-auto">
                                                <div className="space-y-0.5 min-w-[140px]">
                                                    <span className="text-[10px] text-zinc-500 uppercase block">Capital Delta</span>
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className={`text-base font-bold ${profitPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                                                        </span>
                                                        <span className="text-[11px] text-zinc-400 font-medium">
                                                            ({netProfit >= 0 ? '+' : ''}<small>USDT</small> {formatCurrency(netProfit, 2)})
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-zinc-500 block">
                                                        <small>USDT</small> {formatCurrency(startingBal, 0)} → <small>USDT</small> {formatCurrency(endingBal, 2)}
                                                    </span>
                                                </div>

                                                <div className="space-y-0.5 min-w-[120px]">
                                                    <span className="text-[10px] text-zinc-500 uppercase block">Win Rate</span>
                                                    <span className="text-base font-bold text-blue-400 block">
                                                        {winRate.toFixed(1)}%
                                                    </span>
                                                    <span className="text-[10px] text-zinc-400 block">
                                                        {wins}W / {losses}L ({totalTrades} Trades)
                                                    </span>
                                                </div>

                                                <div className="space-y-0.5 min-w-[110px] hidden sm:block">
                                                    <span className="text-[10px] text-zinc-500 uppercase block">Risk Profile</span>
                                                    <span className="text-xs font-semibold text-purple-400 block">
                                                        PF: {profitFactor.toFixed(2)}
                                                    </span>
                                                    <span className="text-[10px] text-rose-400 block">
                                                        Max DD: -{maxDd.toFixed(2)}%
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectHistoryRun(idx);
                                                    }}
                                                    className="px-3.5 py-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 group-hover:bg-blue-600 group-hover:border-blue-500 group-hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm ml-auto"
                                                >
                                                    <span>Inspect Result</span>
                                                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Secondary Strategy Mini-Pills */}
                                        <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                                            <span className="text-[10px] text-zinc-500 uppercase">Other Models:</span>
                                            {run.rankedResults.slice(1).map((subStrat, sIdx) => (
                                                <div
                                                    key={sIdx}
                                                    className="px-2 py-0.5 rounded bg-[#09090b] border border-zinc-800/90 flex items-center gap-1.5"
                                                >
                                                    <span className="text-zinc-300">#{sIdx + 2} {subStrat.strategyName}:</span>
                                                    <span className={subStrat.netProfitPercent >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                                                        {subStrat.netProfitPercent >= 0 ? '+' : ''}{subStrat.netProfitPercent.toFixed(2)}% ROI
                                                    </span>
                                                    <span className="text-zinc-500">({subStrat.metrics.winRatePercent.toFixed(1)}% WR)</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {viewMode === 'detail' && activeSummary && (
                    <div className="space-y-6">
                        {/* Historical vs Latest Breadcrumb / Switcher Bar */}
                        <div className="bg-[#121214] border border-[#27272a] rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                                <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                                <div className="flex flex-wrap items-center gap-2 min-w-0">
                                    <span className="text-zinc-400">Backtest Result</span>
                                    <span className="font-bold text-white">
                                        {isViewingLatest ? `Today (${new Date(activeSummary.executedAt).toLocaleDateString()})` : `${new Date(activeSummary.executedAt).toLocaleDateString()}`}
                                    </span>
                                    {isViewingLatest ? (
                                        <span className="text-[9.5px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                                            LATEST RUN
                                        </span>
                                    ) : (
                                        <span className="text-[9.5px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800">
                                            HISTORICAL RUN
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {!isViewingLatest && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedRunIndex(0);
                                            setSelectedStrategyIndex(0);
                                        }}
                                        className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                        title="Return to latest daily backtest"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Switch to Latest</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setViewMode('history')}
                                    className="px-3 py-1.5 rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-700/80 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                                    title="Open vertical list of all historical runs"
                                >
                                    <History className="w-3.5 h-3.5" />
                                    <span>Check History</span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-900 text-blue-200 border border-blue-600">
                                        {dailyRuns.length}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <section className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-6 space-y-5 shadow-sm font-mono">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#27272a] pb-4">
                                <div className="flex items-start sm:items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-amber-950/80 border border-amber-700/80 flex items-center justify-center font-bold text-amber-400 shrink-0">
                                        <Award className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-sm sm:text-base font-bold text-white">
                                                Backtest Summary: {new Date(activeSummary.executedAt).toLocaleDateString()} ({activeSummary.symbol})
                                            </h2>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                                                RANK #1: {activeSummary.bestStrategy}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-700">
                                                {activeSummary.timeframe} • {activeSummary.period.days} Days ({activeSummary.period.totalCandles} Candles)
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-400 mt-1">
                                            Evaluated Period: {new Date(activeSummary.period.from).toLocaleDateString()} to {new Date(activeSummary.period.to).toLocaleDateString()} • Automated Daily Cron Engine
                                        </p>
                                    </div>
                                </div>

                                {/* <div className="flex items-center gap-2 self-start lg:self-center">
                                    <div className="px-3 py-1.5 rounded bg-[#09090b] border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2">
                                        <Database className="w-3.5 h-3.5 text-purple-400" />
                                        <span>Bot Profile: <strong className="text-white">{botID}</strong></span>
                                    </div>
                                </div> */}
                            </div>

                            {/* KPI Metrics Grid for Currently Inspected Strategy */}
                            {activeStrategy && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs text-zinc-400">
                                        <span className="font-semibold uppercase text-[10.5px] text-zinc-300">
                                            Inspecting Metrics: <strong className="text-white">{activeStrategy.strategyName}</strong>
                                        </span>
                                        <span className="text-[11px] text-zinc-500">
                                            Baseline Virtual Capital: <small>USDT</small> {formatCurrency(activeStrategy.startingBalance, 2)} USDT
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                                        {/* Net Profit & % Difference */}
                                        <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                            <span className="text-[10px] text-zinc-500 uppercase block">Net Profit / Delta</span>
                                            <span className={`text-base sm:text-lg font-bold block ${activeStrategy.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {activeStrategy.netProfit >= 0 ? '+' : ''}<small>USDT</small> {formatCurrency(activeStrategy.netProfit, 2)}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 block font-semibold">
                                                {activeStrategy.netProfitPercent >= 0 ? '+' : ''}{activeStrategy.netProfitPercent.toFixed(2)}% ROI
                                            </span>
                                        </div>

                                        {/* Win Rate */}
                                        <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                            <span className="text-[10px] text-zinc-500 uppercase block">Win Rate</span>
                                            <span className="text-base sm:text-lg font-bold text-blue-400 block">
                                                {activeStrategy.metrics.winRatePercent.toFixed(1)}%
                                            </span>
                                            <span className="text-[10px] text-zinc-400 block">
                                                {activeStrategy.metrics.wins}W / {activeStrategy.metrics.losses}L ({activeStrategy.metrics.totalTrades} Trades)
                                            </span>
                                        </div>

                                        {/* Profit Factor */}
                                        <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                            <span className="text-[10px] text-zinc-500 uppercase block">Profit Factor</span>
                                            <span className="text-base sm:text-lg font-bold text-purple-400 block">
                                                {activeStrategy.metrics.profitFactor.toFixed(2)}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 block">
                                                Gross Win / Loss ratio
                                            </span>
                                        </div>

                                        {/* Max Drawdown */}
                                        <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                            <span className="text-[10px] text-zinc-500 uppercase block">Max Drawdown</span>
                                            <span className="text-base sm:text-lg font-bold text-rose-400 block">
                                                -{activeStrategy.metrics.maxDrawdownPercent.toFixed(2)}%
                                            </span>
                                            <span className="text-[10px] text-zinc-400 block">
                                                -{formatCurrency(activeStrategy.metrics.maxDrawdownUSDT, 2)} USDT
                                            </span>
                                        </div>

                                        {/* Final Capital */}
                                        <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                            <span className="text-[10px] text-zinc-500 uppercase block">Final Capital</span>
                                            <span className="text-base sm:text-lg font-bold text-zinc-100 block">
                                                <small>USDT</small> {formatCurrency(activeStrategy.endingBalance, 2)}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 block">
                                                From <small>USDT</small> {formatCurrency(activeStrategy.startingBalance, 2)}
                                            </span>
                                        </div>

                                        {/* Platform Service Fees */}
                                        <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                            <span className="text-[10px] text-zinc-500 uppercase block">Platform Fees</span>
                                            <span className="text-base sm:text-lg font-bold text-amber-400 block">
                                                <small>USDT</small> {formatCurrency(activeStrategy.metrics.totalFeesPaid, 2)}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 block">
                                                {activeSummary.serviceFee * 100}% performance fee
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Ranked Strategy Leaderboard with "Apply Strategy" capability */}
                        <section className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-4 shadow-sm font-mono">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#27272a] pb-3">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                                    <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-200">
                                        Ranked Strategy Leaderboard
                                    </h3>
                                </div>
                                <span className="text-[11px] text-zinc-400">
                                    Ranked by Net Return
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-zinc-800 text-zinc-400 text-[10.5px] uppercase">
                                            <th className="py-2.5 px-3">Rank</th>
                                            <th className="py-2.5 px-3">Strategy</th>
                                            <th className="py-2.5 px-3">Net Profit</th>
                                            <th className="py-2.5 px-3">ROI %</th>
                                            <th className="py-2.5 px-3">Win Rate</th>
                                            <th className="py-2.5 px-3">Trades</th>
                                            <th className="py-2.5 px-3">Profit Factor</th>
                                            <th className="py-2.5 px-3">Max DD</th>
                                            <th className="py-2.5 px-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/60">
                                        {activeSummary.rankedResults.map((strat, idx) => {
                                            const isSelected = idx === selectedStrategyIndex;
                                            const isTop = idx === 0;
                                            const isCurrentBotStrategy = User?.StrategyName === strat.strategyName;

                                            return (
                                                <tr
                                                    key={strat.strategyName}
                                                    onClick={() => setSelectedStrategyIndex(idx)}
                                                    className={`cursor-pointer transition-colors ${isSelected
                                                        ? 'bg-blue-950/40 text-white'
                                                        : 'hover:bg-zinc-900/60 text-zinc-300'
                                                        }`}
                                                >
                                                    {/* Rank */}
                                                    <td className="py-3 px-3">
                                                        <span
                                                            className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${isTop
                                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                                                : 'bg-zinc-800 text-zinc-400'
                                                                }`}
                                                        >
                                                            #{idx + 1}
                                                        </span>
                                                    </td>

                                                    {/* Strategy Name & Tag */}
                                                    <td className="py-3 px-3 font-semibold text-zinc-100">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span>{strat.strategyName}</span>
                                                            {isTop && (
                                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800">
                                                                    TOP RANK
                                                                </span>
                                                            )}
                                                            {isCurrentBotStrategy && (
                                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                                                                    <Check className="w-2.5 h-2.5" />
                                                                    <span>CURRENT ACTIVE</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10.5px] text-zinc-500 font-normal block truncate max-w-sm mt-0.5">
                                                            {strat.description}
                                                        </span>
                                                    </td>

                                                    {/* Net Profit */}
                                                    <td className={`py-3 px-3 font-bold ${strat.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {strat.netProfit >= 0 ? '+' : ''}<small>USDT</small> {formatCurrency(strat.netProfit, 2)}
                                                    </td>

                                                    {/* ROI % */}
                                                    <td className={`py-3 px-3 font-bold ${strat.netProfitPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {strat.netProfitPercent >= 0 ? '+' : ''}{strat.netProfitPercent.toFixed(2)}%
                                                    </td>

                                                    {/* Win Rate */}
                                                    <td className="py-3 px-3 text-blue-400 font-semibold">
                                                        {strat.metrics.winRatePercent.toFixed(1)}%
                                                    </td>

                                                    {/* Total Trades */}
                                                    <td className="py-3 px-3 text-zinc-300">
                                                        {strat.metrics.totalTrades} ({strat.metrics.wins}W / {strat.metrics.losses}L)
                                                    </td>

                                                    {/* Profit Factor */}
                                                    <td className="py-3 px-3 text-purple-400 font-semibold">
                                                        {strat.metrics.profitFactor.toFixed(2)}
                                                    </td>

                                                    {/* Max Drawdown */}
                                                    <td className="py-3 px-3 text-rose-400">
                                                        -{strat.metrics.maxDrawdownPercent.toFixed(2)}%
                                                    </td>

                                                    {/* Action Buttons */}
                                                    <td className="py-3 px-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedStrategyIndex(idx)}
                                                                className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${isSelected
                                                                    ? 'bg-zinc-800 text-white border border-zinc-700'
                                                                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
                                                                    }`}
                                                            >
                                                                {isSelected ? 'Inspecting' : 'Inspect'}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleInitiateApplyStrategy(strat)}
                                                                className={`px-2.5 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-all shadow-sm ${isCurrentBotStrategy
                                                                    ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300 hover:bg-emerald-900/90'
                                                                    : isTop
                                                                        ? 'bg-blue-600 hover:bg-blue-500 text-white font-bold'
                                                                        : 'bg-zinc-800 hover:bg-blue-600 text-zinc-200 hover:text-white border border-zinc-700'
                                                                    }`}
                                                                title={`Apply ${strat.strategyName} to bot profile in database`}
                                                            >
                                                                <Database className="w-3 h-3" />
                                                                <span>{isCurrentBotStrategy ? 'Applied' : 'Apply Strategy'}</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Deep-Dive Strategy Detail & Trade Ledger */}
                        {activeStrategy && (
                            <section className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-4 shadow-sm font-mono">
                                {/* Strategy Title & Apply CTA Banner */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#27272a] pb-3">
                                    <div className="flex items-start sm:items-center gap-2.5">
                                        <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-200">
                                                    Strategy Deep-Dive: {activeStrategy.strategyName}
                                                </h3>
                                                {User?.StrategyName === activeStrategy.strategyName ? (
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                                                        ACTIVE ON BOT
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                        BENCHMARKED
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-zinc-500 mt-0.5">
                                                Long vs Short performance and itemized simulated execution log
                                            </p>
                                        </div>
                                    </div>

                                    {/* Apply Strategy Button from Deep-Dive */}
                                    <div className="flex items-center gap-2 self-start md:self-auto">
                                        <button
                                            type="button"
                                            onClick={() => handleInitiateApplyStrategy(activeStrategy)}
                                            className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                                        >
                                            <Database className="w-3.5 h-3.5" />
                                            <span>
                                                {User?.StrategyName === activeStrategy.strategyName
                                                    ? 'Applied'
                                                    : `Apply ${activeStrategy.strategyName} to Profile`}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Risk & Configuration Parameters Cards */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div className="bg-[#09090b] border border-[#27272a] p-2.5 rounded space-y-0.5">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Take Profit Target</span>
                                        <span className="font-bold text-blue-400 block">{(activeStrategy.riskConfig.tpPerc * 100).toFixed(2)}%</span>
                                    </div>
                                    <div className="bg-[#09090b] border border-[#27272a] p-2.5 rounded space-y-0.5">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Stop Loss Condition</span>
                                        <span className="font-bold text-amber-400 block">{activeStrategy.riskConfig.slCondition}</span>
                                    </div>
                                    <div className="bg-[#09090b] border border-[#27272a] p-2.5 rounded space-y-0.5">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Trailing Ratchet</span>
                                        <span className={`font-bold block ${activeStrategy.riskConfig.isTrailing ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                            {activeStrategy.riskConfig.isTrailing ? 'Step-Ratchet ACTIVE' : 'Standard'}
                                        </span>
                                    </div>
                                    <div className="bg-[#09090b] border border-[#27272a] p-2.5 rounded space-y-0.5">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Avg Trade Duration</span>
                                        <span className="font-bold text-zinc-200 block">{activeStrategy.metrics.avgTradeDurationBars} bars</span>
                                    </div>
                                </div>

                                {/* Long vs Short Breakdown Row */}
                                <div className="flex flex-wrap items-center gap-3 p-3 bg-[#09090b] border border-[#27272a] rounded text-xs">
                                    <span className="text-zinc-500 uppercase text-[10.5px]">Directional Performance:</span>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800">
                                        <span className="text-emerald-400 font-bold">LONG:</span>
                                        <span>
                                            {activeStrategy.breakdown.long.wins}/{activeStrategy.breakdown.long.total} (
                                            {activeStrategy.breakdown.long.winRatePercent.toFixed(1)}% win rate)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800">
                                        <span className="text-rose-400 font-bold">SHORT:</span>
                                        <span>
                                            {activeStrategy.breakdown.short.wins}/{activeStrategy.breakdown.short.total} (
                                            {activeStrategy.breakdown.short.winRatePercent.toFixed(1)}% win rate)
                                        </span>
                                    </div>
                                    <div className="ml-auto text-[11px] text-zinc-500">
                                        Largest Win: <strong className="text-emerald-400">+<small>USDT</small> {activeStrategy.metrics.largestWin.toFixed(2)}</strong> • Largest Loss:{activeStrategy.metrics.largestLoss.toFixed(2)}
                                        <strong className="text-rose-400">${activeStrategy.metrics.largestLoss.toFixed(2)}</strong>
                                    </div>
                                </div>

                                {/* Itemized Recent Trades Table */}
                                <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between text-xs text-zinc-400">
                                        <span className="font-semibold uppercase text-[10.5px]">
                                            Itemized Executions ({activeStrategy.recentTrades.length} samples)
                                        </span>
                                    </div>

                                    {activeStrategy.recentTrades.length === 0 ? (
                                        <div className="p-4 bg-[#09090b] border border-zinc-800 rounded text-center text-zinc-500 text-xs">
                                            No trade executions in this sample window.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto border border-zinc-800/80 rounded">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-zinc-800 bg-[#09090b] text-zinc-400 text-[10px] uppercase">
                                                        <th className="py-2 px-3">Side</th>
                                                        <th className="py-2 px-3">Entry Price</th>
                                                        <th className="py-2 px-3">Exit Price</th>
                                                        <th className="py-2 px-3">Duration</th>
                                                        <th className="py-2 px-3">Net PnL</th>
                                                        <th className="py-2 px-3">ROE %</th>
                                                        <th className="py-2 px-3">Commission</th>
                                                        <th className="py-2 px-3">Exit Reason</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-800/60 bg-[#121214]">
                                                    {activeStrategy.recentTrades.map((t, idx) => {
                                                        const isWin = t.netPnl > 0;
                                                        return (
                                                            <tr key={idx} className="hover:bg-zinc-900/50">
                                                                <td className="py-2 px-3">
                                                                    <span
                                                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.side === 'LONG'
                                                                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                                                                            : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                                                                            }`}
                                                                    >
                                                                        {t.side}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2 px-3 text-zinc-300 font-mono">
                                                                    <small>USDT</small> {formatCurrency(t.entryPrice, 2)}
                                                                </td>
                                                                <td className="py-2 px-3 text-zinc-300 font-mono">
                                                                    <small>USDT</small> {formatCurrency(t.exitPrice, 2)}
                                                                </td>
                                                                <td className="py-2 px-3 text-zinc-400 font-mono">
                                                                    {t.durationBars} bars
                                                                </td>
                                                                <td className={`py-2 px-3 font-bold font-mono ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                    {isWin ? '+' : ''}<small>USDT</small> {formatCurrency(t.netPnl, 2)}
                                                                </td>
                                                                <td className={`py-2 px-3 font-mono ${t.roePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                    {t.roePercent >= 0 ? '+' : ''}{t.roePercent.toFixed(2)}%
                                                                </td>
                                                                <td className="py-2 px-3 text-zinc-400 font-mono">
                                                                    <small>USDT</small> {formatCurrency(t.commission, 2)}
                                                                </td>
                                                                <td className="py-2 px-3 text-zinc-300 text-[11px] truncate max-w-xs">
                                                                    {t.reason}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>

            {/* Confirmation Modal (Handles both Active Position Liquidation and Flat Exposure Confirmation) */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                description={confirmModal.description}
                confirmText={confirmModal.confirmText}
                cancelText={confirmModal.cancelText}
                variant={confirmModal.variant}
                isLoading={confirmModal.isLoading}
                details={confirmModal.details}
                onConfirm={confirmModal.onConfirm}
                onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }))}
            />

            {/* Footer */}
            <Footer />
        </div>
    )
}

export default BacktestPage