"use client"
import { AlertTriangle, ArrowLeft, Award, CheckCircle2, Clock, Play, RefreshCw, Zap, Lock, ShieldAlert, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useAuth } from '../AuthProvider';
import { BacktestSummary, BotHeartbeat, IUserInfoRuntime } from '@/interfaces';
import { getUserByBotID } from '../actions/user.actions';
import { formatCurrency } from '@/utils';

const BacktestPage = () => {
    const router = useRouter();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<'run' | 'results' | 'history'>('run');
    const [User, setUser] = useState<IUserInfoRuntime | null>(null);
    const [isCheckingPosition, setIsCheckingPosition] = useState<boolean>(false);
    const [isBacktesting, setIsBacktesting] = useState(false);
    const [heartBeat, setHeartBeat] = useState<BotHeartbeat | undefined>(undefined);


    // Results & Error state
    const [summary, setSummary] = useState<BacktestSummary | null>(null);
    const [selectedStrategyIndex, setSelectedStrategyIndex] = useState<number>(0);
    const [historyList, setHistoryList] = useState<BacktestSummary[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);


    useEffect(() => {
        if (!user || !user.uid) return;
        const loadUser = async () => {
            const _user = await getUserByBotID(user.uid);
            if (!_user) return;
            setUser(_user);
        }
        loadUser();
    }, [user])

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
            {/* Top Header */}
            <header className="sticky top-0 z-30 bg-[#0c0c0e]/95 backdrop-blur border-b border-[#27272a] px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded bg-zinc-900 border border-[#27272a] hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center gap-1.5 text-xs font-mono shrink-0"
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
                                    Quant Strategy Backtester
                                </h1>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800 shrink-0">
                                    BOT ENGINE
                                </span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono hidden md:block">
                                Multi-strategy candle simulation & performance ranking for {User?.BotID || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Header Right Navigation & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Revertability / Feature flag note */}
                    <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400" title="Backtest feature can be toggled in src/config/features.ts">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Modular Backtest Engine</span>
                    </div>

                    <button
                        onClick={() => {
                            verifyPosition();
                            loadHistoryAndStatus();
                        }}
                        disabled={isCheckingPosition}
                        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded bg-zinc-900 border border-[#27272a] hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition-colors flex items-center gap-1.5"
                        title="Refresh Position & Status"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCheckingPosition ? 'animate-spin text-blue-400' : ''}`} />
                        <span className="hidden md:inline">Refresh</span>
                    </button>
                </div>
            </header>

            {/* Main Container */}
            <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-4 sm:space-y-6">
                {/* Navigation Tabs Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272a] pb-3">
                    <div className="flex items-center gap-1.5 bg-[#121214] border border-[#27272a] p-1 rounded-lg text-xs font-mono">
                        <button
                            type="button"
                            onClick={() => setActiveTab('run')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors ${activeTab === 'run'
                                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                                : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                        >
                            <Play className="w-3.5 h-3.5" />
                            <span>Run Backtest</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('results')}
                            disabled={!summary}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${activeTab === 'results'
                                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                                : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                        >
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                            <span>Backtest Results</span>
                            {summary && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 border border-blue-800 text-blue-300">
                                    {summary.symbol}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors ${activeTab === 'history'
                                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                                : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                        >
                            <Clock className="w-3.5 h-3.5 text-purple-400" />
                            <span>Historical Archive</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                                {historyList.length}
                            </span>
                        </button>
                    </div>

                    {/* Safe Mode Lock Notice */}
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                        {isBacktesting ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/80 border border-amber-700/80 text-amber-300 animate-pulse font-semibold">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Trading Operations Locked (Simulation Active)</span>
                            </span>
                        ) : heartBeat?.ActiveTrade ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                <span>Active Position: Flat Exposure Required</span>
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Flat Exposure: Ready to Backtest</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Global Error Banner */}
                {errorMessage && (
                    <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs font-mono rounded flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                        <button
                            onClick={() => setErrorMessage(null)}
                            className="text-zinc-400 hover:text-zinc-200 font-bold px-2 py-0.5"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* ACTIVE POSITION WARNING / BLOCKER BANNER */}
                {heartBeat?.ActiveTrade && (
                    <div className="p-4 sm:p-5 bg-rose-950/30 border border-rose-800/80 rounded-lg space-y-3 font-mono">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-xs sm:text-sm font-semibold text-rose-200 uppercase tracking-wide">
                                        Active Position Detected — Backtest Locked
                                    </h3>
                                    <p className="text-xs text-rose-300/90 mt-1 leading-relaxed max-w-3xl">
                                        Backtest simulation can only run when the active position is empty. An open position is currently held on the bot engine:
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                                        <span className="bg-rose-950/80 border border-rose-700/80 px-2 py-0.5 rounded text-rose-300 font-bold">
                                            {heartBeat?.ActiveTrade.symbol}
                                        </span>
                                        <span className="text-zinc-300">
                                            Side: <strong>{(heartBeat?.ActiveTrade.side === 0) ? 'LONG' : 'SHORT'}</strong>
                                        </span>
                                        <span className="text-zinc-300">
                                            Entry: <strong>${formatCurrency(heartBeat?.ActiveTrade.entryPrice, 2)}</strong>
                                        </span>
                                        <span className="text-zinc-300">
                                            Unrealized PnL: <strong className={(heartBeat?.ActiveTrade.unrealizedPnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                {(heartBeat?.ActiveTrade.unrealizedPnl ?? 0) >= 0 ? '+' : ''}USDT {formatCurrency(heartBeat?.ActiveTrade.unrealizedPnl ?? 0, 2)}
                                            </strong>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleOpenForceCloseModal}
                                className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shrink-0 transition-colors shadow-sm flex items-center gap-1.5"
                            >
                                <XCircle className="w-4 h-4" />
                                <span>Liquidate Position to Backtest</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ONGOING BACKTEST PROGRESS BAR */}
                {isBacktesting && (
                    <div className="p-4 bg-blue-950/40 border border-blue-800/80 rounded-lg space-y-3 font-mono">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-blue-300">
                                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                                <span className="font-semibold">{currentStep || 'Executing multi-strategy simulation...'}</span>
                            </div>
                            <span className="font-bold text-blue-300">{progressPercent}%</span>
                        </div>

                        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-blue-500 h-2 transition-all duration-300 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        <p className="text-[11px] text-zinc-400">
                            Note: Trading operations on the bot engine are locked while backtesting to prevent margin conflict and simulated state corruption.
                        </p>
                    </div>
                )}

                {/* TAB 1: RUN BACKTEST PARAMETERS */}
                {activeTab === 'run' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left 2 Cols: Configuration Form */}
                        <div className="lg:col-span-2 space-y-5">
                            <section className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-6 space-y-5 shadow-sm">
                                <div className="border-b border-[#27272a] pb-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <SlidersHorizontal className="w-4 h-4 text-blue-400 shrink-0" />
                                        <div>
                                            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                                                Simulation Parameters
                                            </h2>
                                            <p className="text-[11px] text-zinc-500 font-mono">
                                                Select asset, timeframe, and capital parameters to benchmark strategies
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                        Step-Ratchet Enabled
                                    </span>
                                </div>

                                <form onSubmit={handleRunBacktest} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Symbol Selection */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-mono text-zinc-400">Target Trading Pair</label>
                                            <select
                                                value={symbol}
                                                onChange={(e) => setSymbol(e.target.value)}
                                                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded px-3 py-2 text-xs font-mono text-zinc-200 outline-none cursor-pointer"
                                            >
                                                <option value="BTCUSDT">BTCUSDT (Bitcoin Perpetual)</option>
                                                <option value="ETHUSDT">ETHUSDT (Ethereum Perpetual)</option>
                                                <option value="SOLUSDT">SOLUSDT (Solana Perpetual)</option>
                                                <option value="BNBUSDT">BNBUSDT (BNB Perpetual)</option>
                                            </select>
                                        </div>

                                        {/* Starting Capital Balance */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-mono text-zinc-400">Virtual Starting Balance (USDT)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-xs font-mono text-zinc-500">$</span>
                                                <input
                                                    type="number"
                                                    min="100"
                                                    max="100000"
                                                    step="100"
                                                    value={startingBalance}
                                                    onChange={(e) => setStartingBalance(Number(e.target.value))}
                                                    className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded pl-7 pr-3 py-2 text-xs font-mono text-zinc-200 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hardcoded & Strategy-Driven Specifications */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
                                        {/* Hardcoded Historical Lookback Window */}
                                        <div className="p-3 bg-[#09090b] border border-[#27272a] rounded space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-zinc-500 uppercase block">Lookback Window</span>
                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                    HARDCODED
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold text-zinc-200">30 Days (720 Bars)</div>
                                            <p className="text-[10.5px] text-zinc-500">Fixed institutional interval (no user override)</p>
                                        </div>

                                        {/* KLine Bar Interval from Strategy JSON */}
                                        <div className="p-3 bg-[#09090b] border border-[#27272a] rounded space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-zinc-500 uppercase block">KLine Bar Interval</span>
                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800">
                                                    FROM STRATEGY JSON
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold text-blue-300">Strategy Defined</div>
                                            <p className="text-[10.5px] text-zinc-500">EMA-RSI: 1h • Mean Rev: 15m • Filtered: 4h</p>
                                        </div>

                                        {/* Default Compounding Mode */}
                                        <div className="p-3 bg-[#09090b] border border-[#27272a] rounded space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-zinc-500 uppercase block">Compound Profits</span>
                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                    DEFAULT
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold text-zinc-200">Standard Sizing</div>
                                            <p className="text-[10.5px] text-zinc-500">Default fractional position sizing model</p>
                                        </div>
                                    </div>

                                    {/* Step-Ratchet Trailing System Toggle */}
                                    <div className="pt-1">
                                        <div className="p-3 bg-[#09090b] border border-[#27272a] rounded flex items-center justify-between text-xs font-mono">
                                            <div className="space-y-0.5 pr-2">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-semibold text-zinc-200 block">Step-Ratchet Trailing System</span>
                                                    <span className="text-[9px] px-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                                                        PROFIT
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-zinc-500 block">Ratchet profit floor dynamically upward as price advances</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsTrailing(!isTrailing)}
                                                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 border shrink-0 ${isTrailing ? 'bg-emerald-600 border-emerald-500' : 'bg-zinc-800 border-zinc-700'
                                                    }`}
                                                title={`Toggle Step-Ratchet Trailing ${isTrailing ? 'OFF' : 'ON'}`}
                                            >
                                                <span
                                                    className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${isTrailing ? 'translate-x-5' : 'translate-x-0.5'
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Submit Action */}
                                    <div className="pt-3 flex items-center justify-end gap-3">
                                        <button
                                            type="submit"
                                            disabled={isBacktesting || Boolean(currentPosition)}
                                            className="w-full sm:w-auto px-6 py-2.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                                        >
                                            <Play className="w-4 h-4 fill-white" />
                                            <span>{isBacktesting ? 'Simulation Running...' : 'Execute Quant Backtest'}</span>
                                        </button>
                                    </div>
                                </form>
                            </section>
                        </div>

                        {/* Right Col: Backtest Engine Info & Pre-flight Checklist */}
                        <div className="space-y-4">
                            <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-3 font-mono text-xs">
                                <h3 className="font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2 border-b border-[#27272a] pb-2.5">
                                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>Execution Rules & Constraints</span>
                                </h3>

                                <ul className="space-y-2.5 text-zinc-400 text-[11px] leading-relaxed">
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-400 font-bold shrink-0">✓</span>
                                        <span><strong>Flat Exposure Rule:</strong> Backtesting strictly requires no open position to ensure margin simulation remains isolated.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400 font-bold shrink-0">⚡</span>
                                        <span><strong>Trading Lock:</strong> While running, trade entry/exit on the live engine is temporarily locked until results return.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-400 font-bold shrink-0">📊</span>
                                        <span><strong>Multi-Strategy Ranking:</strong> All 3 quant models (EMA-RSI, Mean Reversion, Mean Reversion Filtered) are simulated concurrently and ranked by net return.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-400 font-bold shrink-0">📜</span>
                                        <span><strong>Persistent Summary:</strong> Completed tests are saved into the Historical Archive with full itemized trade breakdowns.</span>
                                    </li>
                                </ul>

                                {historyList.length > 0 && (
                                    <div className="pt-2 border-t border-[#27272a]">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSummary(historyList[0]);
                                                setActiveTab('results');
                                            }}
                                            className="w-full py-2 px-3 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Award className="w-3.5 h-3.5 text-amber-400" />
                                            <span>View Latest Results ({historyList[0].symbol})</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: BACKTEST RESULTS VIEWER */}
                {activeTab === 'results' && summary && (
                    <div className="space-y-6">
                        {/* Summary Top Banner */}
                        <section className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-6 space-y-4 shadow-sm">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#27272a] pb-4">
                                <div className="flex items-start sm:items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-amber-950/80 border border-amber-700/80 flex items-center justify-center font-bold text-amber-400 shrink-0">
                                        <Award className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-sm sm:text-base font-mono font-bold text-white">
                                                Backtest Summary: {summary.symbol}
                                            </h2>
                                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                                                BEST: {summary.bestStrategy}
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-700">
                                                {summary.timeframe} • {summary.period.days} Days ({summary.period.totalCandles} Candles)
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                            Period: {new Date(summary.period.from).toLocaleDateString()} to {new Date(summary.period.to).toLocaleDateString()} • Executed {summary.executedAt ? new Date(summary.executedAt).toLocaleTimeString() : 'Recently'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('run')}
                                        className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                    >
                                        <Play className="w-3.5 h-3.5" />
                                        <span>Run Another Test</span>
                                    </button>
                                </div>
                            </div>

                            {/* KPI Metrics Grid for the Top / Best Strategy */}
                            {activeStrategy && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-1 font-mono">
                                    {/* Net Profit */}
                                    <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Net Profit</span>
                                        <span className={`text-base sm:text-lg font-bold block ${activeStrategy.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {activeStrategy.netProfit >= 0 ? '+' : ''}${formatCurrency(activeStrategy.netProfit, 2)}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 block">
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
                                            -${formatCurrency(activeStrategy.metrics.maxDrawdownUSDT, 2)} USDT
                                        </span>
                                    </div>

                                    {/* Ending Balance */}
                                    <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Final Capital</span>
                                        <span className="text-base sm:text-lg font-bold text-zinc-100 block">
                                            ${formatCurrency(activeStrategy.endingBalance, 2)}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 block">
                                            From ${formatCurrency(activeStrategy.startingBalance, 2)}
                                        </span>
                                    </div>

                                    {/* Service Fees Paid */}
                                    <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Platform Fees</span>
                                        <span className="text-base sm:text-lg font-bold text-amber-400 block">
                                            ${formatCurrency(activeStrategy.metrics.totalFeesPaid, 2)}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 block">
                                            20% performance fee
                                        </span>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Ranked Strategy Comparison Table */}
                        <section className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-4 shadow-sm font-mono">
                            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                                    <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-200">
                                        Ranked Strategy Leaderboard
                                    </h3>
                                </div>
                                <span className="text-[11px] text-zinc-500">
                                    Click a strategy to inspect detailed trades & risk
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
                                            <th className="py-2.5 px-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/60">
                                        {summary.rankedResults.map((strat, idx) => {
                                            const isSelected = idx === selectedStrategyIndex;
                                            const isTop = idx === 0;
                                            return (
                                                <tr
                                                    key={strat.strategyName}
                                                    onClick={() => setSelectedStrategyIndex(idx)}
                                                    className={`cursor-pointer transition-colors ${isSelected
                                                        ? 'bg-blue-950/40 text-white'
                                                        : 'hover:bg-zinc-900/60 text-zinc-300'
                                                        }`}
                                                >
                                                    <td className="py-3 px-3">
                                                        <span
                                                            className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${isTop
                                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                                                : 'bg-zinc-800 text-zinc-400'
                                                                }`}
                                                        >
                                                            #{idx + 1}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 font-semibold text-zinc-100">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{strat.strategyName}</span>
                                                            {isTop && (
                                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800">
                                                                    BEST
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-zinc-500 font-normal block truncate max-w-xs">
                                                            {strat.description}
                                                        </span>
                                                    </td>
                                                    <td className={`py-3 px-3 font-bold ${strat.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {strat.netProfit >= 0 ? '+' : ''}${formatCurrency(strat.netProfit, 2)}
                                                    </td>
                                                    <td className={`py-3 px-3 font-bold ${strat.netProfitPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {strat.netProfitPercent >= 0 ? '+' : ''}{strat.netProfitPercent.toFixed(2)}%
                                                    </td>
                                                    <td className="py-3 px-3 text-blue-400 font-semibold">
                                                        {strat.metrics.winRatePercent.toFixed(1)}%
                                                    </td>
                                                    <td className="py-3 px-3 text-zinc-300">
                                                        {strat.metrics.totalTrades} ({strat.metrics.wins}W / {strat.metrics.losses}L)
                                                    </td>
                                                    <td className="py-3 px-3 text-purple-400 font-semibold">
                                                        {strat.metrics.profitFactor.toFixed(2)}
                                                    </td>
                                                    <td className="py-3 px-3 text-rose-400">
                                                        -{strat.metrics.maxDrawdownPercent.toFixed(2)}%
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedStrategyIndex(idx);
                                                            }}
                                                            className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${isSelected
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                                                }`}
                                                        >
                                                            {isSelected ? 'Inspecting' : 'Inspect'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Deep-Dive Inspection: Selected Strategy Breakdown & Trade History */}
                        {activeStrategy && (
                            <section className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-4 shadow-sm font-mono">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-3">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <div>
                                            <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-200">
                                                Detailed Trade Ledger: {activeStrategy.strategyName}
                                            </h3>
                                            <p className="text-[11px] text-zinc-500">
                                                Long vs Short performance and itemized recent backtest executions
                                            </p>
                                        </div>
                                    </div>

                                    {/* Long vs Short Pill Breakdown */}
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="px-2.5 py-1 rounded bg-[#09090b] border border-zinc-800 flex items-center gap-1.5">
                                            <span className="text-emerald-400 font-bold">LONG:</span>
                                            <span>{activeStrategy.breakdown.long.wins}/{activeStrategy.breakdown.long.total} ({activeStrategy.breakdown.long.winRatePercent.toFixed(1)}%)</span>
                                        </div>
                                        <div className="px-2.5 py-1 rounded bg-[#09090b] border border-zinc-800 flex items-center gap-1.5">
                                            <span className="text-rose-400 font-bold">SHORT:</span>
                                            <span>{activeStrategy.breakdown.short.wins}/{activeStrategy.breakdown.short.total} ({activeStrategy.breakdown.short.winRatePercent.toFixed(1)}%)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Risk & Strategy Detail Cards */}
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
                                            {activeStrategy.riskConfig.isTrailing ? 'Step-Ratchet ACTIVE' : 'OFF'}
                                        </span>
                                    </div>
                                    <div className="bg-[#09090b] border border-[#27272a] p-2.5 rounded space-y-0.5">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Avg Trade Duration</span>
                                        <span className="font-bold text-zinc-200 block">{activeStrategy.metrics.avgTradeDurationBars} bars</span>
                                    </div>
                                </div>

                                {/* Simulated Recent Trades Table */}
                                <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between text-xs text-zinc-400">
                                        <span className="font-semibold uppercase text-[10.5px]">Itemized Trades ({activeStrategy.recentTrades.length} samples)</span>
                                    </div>

                                    {activeStrategy.recentTrades.length === 0 ? (
                                        <div className="p-4 bg-[#09090b] border border-zinc-800 rounded text-center text-zinc-500 text-xs">
                                            No trades triggered during this simulation interval.
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
                                                                    ${formatCurrency(t.entryPrice, 2)}
                                                                </td>
                                                                <td className="py-2 px-3 text-zinc-300 font-mono">
                                                                    ${formatCurrency(t.exitPrice, 2)}
                                                                </td>
                                                                <td className="py-2 px-3 text-zinc-400 font-mono">
                                                                    {t.durationBars} bars
                                                                </td>
                                                                <td className={`py-2 px-3 font-bold font-mono ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                    {isWin ? '+' : ''}${formatCurrency(t.netPnl, 2)}
                                                                </td>
                                                                <td className={`py-2 px-3 font-mono ${t.roePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                    {t.roePercent >= 0 ? '+' : ''}{t.roePercent.toFixed(2)}%
                                                                </td>
                                                                <td className="py-2 px-3 text-zinc-400 font-mono">
                                                                    ${formatCurrency(t.commission, 2)}
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

                {/* TAB 3: HISTORICAL ARCHIVE */}
                {activeTab === 'history' && (
                    <section className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-6 space-y-4 shadow-sm font-mono">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                                    <h2 className="text-xs uppercase tracking-wider font-semibold text-zinc-200">
                                        Historical Backtest Archive
                                    </h2>
                                </div>
                                <p className="text-[11px] text-zinc-500 mt-0.5">
                                    Archived quant simulations with best performing models and parameters
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setActiveTab('run')}
                                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                                <Play className="w-3.5 h-3.5" />
                                <span>Run New Backtest</span>
                            </button>
                        </div>

                        {historyList.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 text-xs">
                                No historical backtests found. Run your first simulation to generate benchmark data.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-zinc-800 text-zinc-400 text-[10.5px] uppercase">
                                            <th className="py-2.5 px-3">Date Executed</th>
                                            <th className="py-2.5 px-3">Symbol</th>
                                            <th className="py-2.5 px-3">Timeframe</th>
                                            <th className="py-2.5 px-3">Period</th>
                                            <th className="py-2.5 px-3">Best Strategy</th>
                                            <th className="py-2.5 px-3">Top Net Profit</th>
                                            <th className="py-2.5 px-3">ROI %</th>
                                            <th className="py-2.5 px-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/60">
                                        {historyList.map((item, idx) => {
                                            const topStrat = item.rankedResults[0];
                                            return (
                                                <tr key={item.id || idx} className="hover:bg-zinc-900/50">
                                                    <td className="py-3 px-3 text-zinc-400 text-[11px]">
                                                        {item.executedAt ? new Date(item.executedAt).toLocaleString() : 'Pre-seeded'}
                                                    </td>
                                                    <td className="py-3 px-3 font-bold text-zinc-100">
                                                        {item.symbol}
                                                    </td>
                                                    <td className="py-3 px-3 text-blue-400">
                                                        {item.timeframe}
                                                    </td>
                                                    <td className="py-3 px-3 text-zinc-400">
                                                        {item.period.days} Days ({item.period.totalCandles} bars)
                                                    </td>
                                                    <td className="py-3 px-3 font-semibold text-amber-400">
                                                        {item.bestStrategy}
                                                    </td>
                                                    <td className={`py-3 px-3 font-bold ${(topStrat?.netProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {(topStrat?.netProfit ?? 0) >= 0 ? '+' : ''}${formatCurrency(topStrat?.netProfit ?? 0, 2)}
                                                    </td>
                                                    <td className={`py-3 px-3 font-bold ${(topStrat?.netProfitPercent ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {(topStrat?.netProfitPercent ?? 0) >= 0 ? '+' : ''}{(topStrat?.netProfitPercent ?? 0).toFixed(2)}%
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSummary(item);
                                                                setSelectedStrategyIndex(0);
                                                                setActiveTab('results');
                                                            }}
                                                            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            <span>Inspect Results</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}
            </main>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                description={confirmModal.description}
                confirmText={confirmModal.confirmText}
                cancelText={confirmModal.cancelText}
                variant="danger"
                isLoading={confirmModal.isLoading}
                details={confirmModal.details}
                onConfirm={confirmModal.onConfirm}
                onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
            />

            <Footer />
        </div>
    )
}

export default BacktestPage