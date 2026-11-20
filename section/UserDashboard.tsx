"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Footer from '@/section/Footer';
import { Activity, ArrowDownRight, ArrowUpRight, Calendar, CheckCircle, ChevronDown, Copy, DollarSign, Eye, Layers, LogOut, Pause, Play, Receipt, RefreshCw, RotateCcw, Sliders, TrendingUp, UserPlus, Users, X, XCircle, Zap } from 'lucide-react';
import CustomLineChart from '@/components/CustomLineChart';
import CustomBarChart from '@/components/CustomBarChart';
import { formatCurrency } from '@/utils';
import { TERMINAL_VER } from '@/configs';
import { BotHeartbeat, Candle, ConfirmModalProps, Direction, IUserInfoRuntime, Log, SLCondition, Strategy, TradeAnalytics } from '@/interfaces';
import { useRouter } from 'next/navigation';
import { ITrades } from '@/schema/trades';
import LogTerminal from '@/components/LogTerminal';
import { LOAD_INTERVAL } from '@/constants';
import { signOut } from 'next-auth/react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { generateDailyTradeAnalytics, getRecentTrades } from '@/app/actions/trades.actions';
import { server } from '@/app/actions/server.actions';
import { getUserByBotID } from '@/app/actions/user.actions';
import { useAuth } from '@/app/AuthProvider';
import TradingViewChart from '@/components/TradingViewChart';
import FullScreenLoading from './FullScreenLoading';

export interface UserDashboardProps {
    BotID: string;
}

const UserDashboard = ({ BotID }: UserDashboardProps) => {
    const [actionNotice, setActionNotice] = useState<string | null>(null);
    const [errorNotice, setErrorNotice] = useState<string | null>(null);
    const [User, setUser] = useState<IUserInfoRuntime | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [heartbeatData, setHeartbeatData] = useState<BotHeartbeat | undefined>(undefined);
    const [historicalCandlesState, setHistoricalCandlesState] = useState<Candle[]>([]);
    const [userStrategy, setUserStrategy] = useState<Strategy | undefined>(undefined);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [stratDrawerOpen, setStratDrawerOpen] = useState(false);
    const [loadingAction, setLoadingAction] = useState("null");
    const [lastTrades, setLastTrades] = useState<ITrades[]>([]);
    const candlesRef = useRef<Candle[]>([]);
    const [tradeAnalytics, setTradeAnalytics] = useState<TradeAnalytics>({
        cumulativePnlData: [],
        breakdownData: {
            chartData: [],
            totalFees: 0,
            totalNetPnl: 0
        }
    });
    const [excludedLogs, setExcludedLogs] = useState<Log[]>([]);
    const [confirmModal, setConfirmModal] = useState<ConfirmModalProps>({
        isOpen: false,
        message: '',
        onConfirm: () => { }
    });

    const router = useRouter();
    const { user } = useAuth();
    const prevTradeRef = useRef<boolean>(false);

    const fetchData = useCallback(async () => {
        setRefreshing(true);
        try {
            const _hData = await server<BotHeartbeat>({ request: "heartbeat", targetBot: BotID });
            if (!_hData) {
                setErrorNotice("Unable to load the heartbeat data");
                return;
            }

            setHeartbeatData(_hData);

            const currentCandles = candlesRef.current;
            const latest = _hData.LatestCandle;
            if (currentCandles.length > 0) {
                const lastHist = currentCandles[currentCandles.length - 1];
                if (latest?.barIndex === undefined || latest?.barIndex === 0) {
                    console.log(latest);
                }

                if (latest?.barIndex !== undefined && lastHist?.barIndex !== undefined) {
                    const gap = latest.barIndex - lastHist.barIndex;

                    if (gap > 1) {
                        console.log("Force fetching the historical data");
                        const _candles = await server<Candle[]>({ request: "getHistoricalCandles", targetBot: BotID });
                        if (Array.isArray(_candles) && _candles.length > 0) {
                            candlesRef.current = _candles;
                            setHistoricalCandlesState(_candles);
                        }
                    } else {
                        if (lastHist.barIndex < latest.barIndex) {
                            const nextCandles = [...currentCandles.slice(1), latest];
                            candlesRef.current = nextCandles;
                            setHistoricalCandlesState(nextCandles);
                        }
                    }
                }
            }
        } catch (error) {
            setErrorNotice("Seems to be an error refreshing");
            console.log(error);
        } finally {
            setRefreshing(false);
        }
    }, [BotID])

    const manualRefresh = async () => {
        await fetchData();
        await loadAnalyticsAndTrades();
    }

    const loadAnalyticsAndTrades = async () => {
        if (!User) return;
        const trades = await getRecentTrades(User.Email, 10);
        if (!trades)
            setErrorNotice("There seems to be an issue loading user trades");
        else
            setLastTrades(trades);

        const _tradeAnalytics = await generateDailyTradeAnalytics(User.Email, 7);
        if (_tradeAnalytics)
            setTradeAnalytics(_tradeAnalytics);
    }

    // Audio Alert Hook when active position closes
    useEffect(() => {
        const hasActiveNow = heartbeatData?.ActiveTrade !== null && heartbeatData?.ActiveTrade !== undefined;
        if (prevTradeRef.current && !hasActiveNow) {
            loadAnalyticsAndTrades();
            try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            } catch (e) {
                // Audio context suppressed
            }
        }
        prevTradeRef.current = hasActiveNow;
    }, [heartbeatData?.ActiveTrade]);

    const closeConfirmModal = () => {
        setConfirmModal({ isOpen: false, message: "", onConfirm: () => { } });
    };

    const handleForceClose = () => {
        if (!heartbeatData?.ActiveTrade) return;
        const position = heartbeatData.ActiveTrade;
        setConfirmModal({
            isOpen: true,
            title: 'Force Close Position',
            message: 'Do you want to force close the position?',
            description: 'This will trigger an immediate Binance market liquidation order to close out the active trade and cancel connected limit orders.',
            confirmText: 'Yes, Force Close Position',
            cancelText: 'Cancel',
            variant: 'danger',
            details: [
                { label: 'Target Bot ID', value: User?.BotID },
                {
                    label: 'Symbol & Side',
                    value: (
                        <span className="flex items-center gap-1.5">
                            <span>{position.symbol.toUpperCase()}</span>
                            <span
                                className={`text-[9px] px-1 py-0.5 rounded border font-mono font-bold ${position.side === Direction.Long
                                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                                    : 'text-rose-400 bg-rose-950/60 border-rose-800'
                                    }`}
                            >
                                {position.side.toString()}
                            </span>
                        </span>
                    ),
                },
                {
                    label: 'Size / Notional',
                    value: `${position.size} ($${formatCurrency(position.notional, 2)})`,
                },
                { label: 'Entry Price', value: `$${formatCurrency(position.entryPrice, 2)}` },
                { label: 'Mark Price', value: `$${formatCurrency(position.markPrice, 2)}` },
                {
                    label: 'Est. Unrealized PnL',
                    value: (
                        <span className={`font-bold ${position.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {position.unrealizedPnl}
                        </span>
                    ),
                },
            ],
            onConfirm: executeForceClosePosition,
        });
    }

    const executeForceClosePosition = () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        handleButtonEvents("forceClose");
    }

    const handleButtonEvents = async (actionState: string) => {
        setLoadingAction(actionState);
        try {
            const serverResponse = await server({ request: actionState, targetBot: BotID });

            if (!serverResponse || typeof serverResponse.success === 'undefined') {
                setErrorNotice("Error: Invalid response from server");
                return;
            }

            if (!serverResponse.success) {
                setErrorNotice("Unknown server error");
                return;
            }

            setActionNotice(`${actionState} executed successfully!`);
        } catch (error: any) {
            setErrorNotice("Error: Unable to send request to server");
        } finally {
            setLoadingAction("null");
        }
    }

    const botLogs = useMemo(() => {
        if (!heartbeatData) return [];
        const newLogs = heartbeatData.Logs.filter(
            log => !excludedLogs.some(exLog => exLog.timestamp.getTime() === log.timestamp.getTime())
        );
        return newLogs;
    }, [heartbeatData, excludedLogs])

    const handleToggleTrading = async () => {
        if (!User) return;
        setLoadingAction("trading");
        try {
            const newTradingState = !User.IsHalted;
            const serverResponse = await server({ request: "halt", value: newTradingState, targetBot: BotID });
            if (serverResponse.success) {
                setUser({
                    ...User,
                    ["IsHalted"]: newTradingState
                });
            } else
                setErrorNotice(serverResponse.message!);
        } catch (error) {
            setErrorNotice("Error: Unable to send request to server");
        } finally {
            setLoadingAction("null");
        }
    }

    const handleClearLogs = () => {
        if (!heartbeatData) return;
        setExcludedLogs(heartbeatData.Logs);
    }

    useEffect(() => {
        if (BotID.length < 1) return;
        const loadUser = async () => {
            const _user = await getUserByBotID(BotID);
            if (!_user) return;
            setUser(_user);

            const _strategy = await server<Strategy | undefined>({ request: "getStrategy", targetBot: BotID });
            setUserStrategy(_strategy);

            const _candles = await server<Candle[]>({ request: "getHistoricalCandles", targetBot: BotID });
            setHistoricalCandlesState(_candles);
        }
        loadUser();
    }, [BotID])

    useEffect(() => {
        loadAnalyticsAndTrades();
    }, [User])

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, LOAD_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchData])

    useEffect(() => {
        if (!actionNotice && !errorNotice) return;
        setTimeout(() => setActionNotice(null), (LOAD_INTERVAL * 1.5));
        setTimeout(() => setErrorNotice(null), (LOAD_INTERVAL * 1.5));
    }, [actionNotice, errorNotice])

    useEffect(() => {
        candlesRef.current = historicalCandlesState;
    }, [historicalCandlesState]);

    if (User === null) {
        return <FullScreenLoading />;
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
            {(actionNotice || errorNotice) && (
                <div className={`fixed bottom-5 right-5 z-50 bg-[#18181b] border shadow-2xl px-4 py-2.5 rounded-md flex items-center gap-2.5 text-xs font-mono text-white animate-in fade-in slide-in-from-bottom-2 duration-200 ${errorNotice ? 'border-rose-500/50' : 'border-blue-500/50'
                    }`}>
                    {errorNotice ? (
                        <XCircle className="w-4 h-4 text-rose-400" />
                    ) : (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>{errorNotice || actionNotice}</span>
                </div>
            )}

            {/* QOL Feature: Strategy Parameter Inspector Drawer */}
            {stratDrawerOpen && userStrategy && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="w-full max-w-md bg-[#0c0c0e] border-l border-[#27272a] h-full flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a]">
                            <div>
                                <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-blue-400" />
                                    <span>{userStrategy.name}</span>
                                </h3>
                                <p className="text-[11px] font-mono text-zinc-500 mt-0.5">Active Strategy Parameters (Read-Only)</p>
                            </div>
                            <button
                                onClick={() => setStratDrawerOpen(false)}
                                className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-5 font-mono text-xs">
                            {userStrategy.description && (
                                <div className="bg-zinc-900/70 border border-zinc-800 p-3 rounded text-zinc-300 text-[11px] leading-relaxed">
                                    {userStrategy.description}
                                </div>
                            )}

                            {/* General Config */}
                            <div className="space-y-2">
                                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block">Execution Specs</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-[#121214] border border-[#27272a] p-2.5 rounded">
                                        <span className="text-[10px] text-zinc-500 block">Timeframe</span>
                                        <span className="text-blue-400 font-bold">{userStrategy.KLine || '1m'}</span>
                                    </div>
                                    <div className="bg-[#121214] border border-[#27272a] p-2.5 rounded">
                                        <span className="text-[10px] text-zinc-500 block">Min Balance</span>
                                        <span className="text-zinc-200 font-bold">${userStrategy.MinBalanceRequired} USDT</span>
                                    </div>
                                </div>
                            </div>

                            {/* Risk Config */}
                            <div className="space-y-2">
                                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block">Risk & Exit Controls</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-[#121214] border border-[#27272a] p-2.5 rounded">
                                        <span className="text-[10px] text-zinc-500 block">Allocation ({userStrategy.risk.riskType})</span>
                                        <span className="text-zinc-200 font-bold">
                                            {userStrategy.risk.riskType === 'percent'
                                                ? `${(userStrategy.risk.risk * 100).toFixed(1)}%`
                                                : `$${userStrategy.risk.risk} USDT`}
                                        </span>
                                    </div>
                                    <div className="bg-[#121214] border border-[#27272a] p-2.5 rounded">
                                        <span className="text-[10px] text-zinc-500 block">Take Profit Target</span>
                                        <span className="text-emerald-400 font-bold">
                                            {userStrategy.risk.tpPerc ? `${(userStrategy.risk.tpPerc * 100).toFixed(2)}%` : 'Dynamic'}
                                        </span>
                                    </div>
                                    <div className="bg-[#121214] border border-[#27272a] p-2.5 rounded">
                                        <span className="text-[10px] text-zinc-500 block">Stop Loss Mode</span>
                                        <span className="text-amber-400 font-bold">
                                            {userStrategy.risk.slCondition === 0 ? 'Dynamic SL' : 'Liquidation Limit'}
                                        </span>
                                    </div>
                                    {userStrategy.risk.slPerc !== undefined && (
                                        <div className="bg-[#121214] border border-[#27272a] p-2.5 rounded">
                                            <span className="text-[10px] text-zinc-500 block">Stop Loss %</span>
                                            <span className="text-rose-400 font-bold">{(userStrategy.risk.slPerc * 100).toFixed(2)}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 1. Header Top-Bar */}
            <header className="sticky top-0 z-30 bg-[#0c0c0e]/95 backdrop-blur border-b border-[#27272a] px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-xs sm:text-sm shadow-md shadow-blue-500/10 shrink-0">
                            S
                        </div>
                        <div>
                            {/* Updated layout: stacks vertically on mobile, row on sm+ */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                                <span className="font-semibold text-xs sm:text-sm tracking-tight text-white whitespace-nowrap">Sage Terminal</span>
                                <span className="text-[9px] sm:text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 self-start sm:self-auto">
                                    {TERMINAL_VER}
                                </span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono hidden md:block truncate">Binance Futures Quant Engine</p>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-zinc-800">
                        {/* Bot ID Badge */}
                        <div className="flex items-center gap-1.5 bg-zinc-900 border border-[#27272a] px-2.5 py-1 rounded text-xs font-mono shrink-0">
                            <span className="text-zinc-500">ID:</span>
                            <span className="text-zinc-200 font-semibold">{User?.BotID}</span>
                        </div>

                        {/* Active Symbol Badge */}
                        <div className="hidden lg:flex items-center gap-1.5 bg-zinc-900 border border-[#27272a] px-2.5 py-1 rounded text-xs font-mono shrink-0">
                            <span className="text-zinc-500">PAIR:</span>
                            <span className="text-blue-400 font-bold">{User?.Symbol || 'NONE'}</span>
                            <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1 rounded">{User?.Leverage || 10}x</span>
                        </div>

                        {/* Interactive Strategy Inspector Badge */}
                        <button
                            type="button"
                            onClick={() => userStrategy && setStratDrawerOpen(true)}
                            disabled={!userStrategy}
                            className={`hidden xl:flex items-center gap-1.5 bg-zinc-900 border border-[#27272a] px-2.5 py-1 rounded text-[11px] font-mono text-zinc-400 shrink-0 transition-colors ${userStrategy ? 'hover:border-blue-500/50 hover:text-zinc-200 cursor-pointer' : 'cursor-default'}`}
                            title={userStrategy ? 'Click to inspect active strategy parameters' : 'Strategy parameters unavailable'}
                        >
                            <span className="text-zinc-500">STRAT:</span>
                            <span className="text-zinc-200 truncate max-w-[140px]">{User?.StrategyName || 'Undefined'}</span>
                            {userStrategy && <Eye className="w-3 h-3 text-blue-400 ml-0.5" />}
                        </button>
                    </div>
                </div>

                {/* Right Section: Balance Widget, READ-ONLY Live/Demo badge, Profile */}
                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                    {/* Refresh Button */}
                    <button
                        onClick={manualRefresh}
                        disabled={refreshing}
                        className="p-1.5 sm:p-2 rounded border border-[#27272a] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
                    </button>

                    {/* Read-Only Live / Demo Badge */}
                    <div
                        className={`hidden sm:flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs font-mono font-semibold border cursor-default select-none ${User?.Demo || User?.Sandbox
                            ? 'bg-amber-950/50 text-amber-400 border-amber-800/80'
                            : 'bg-emerald-950/50 text-emerald-400 border-emerald-800/80'
                            }`}
                        title={`Execution Protocol: ${User?.Sandbox ? 'SANDBOX' : User?.Demo ? 'DEMO' : 'LIVE'}`}
                    >
                        <span
                            className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${User?.Demo || User?.Sandbox ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}
                        />
                        <span className="hidden sm:inline">{User?.Sandbox ? 'SANDBOX' : User?.Demo ? 'DEMO' : 'LIVE'}</span>
                    </div>

                    {/* Account Balance Widget */}
                    <div className="h-8 sm:h-9 relative flex items-center justify-end bg-zinc-900 border border-[#27272a] px-3 rounded shrink-0">
                        {/* Mobile Left-Side 10px Indicator Rectangle (Green for Live, Amber for Demo/Sandbox) */}
                        <div
                            className={`absolute left-0 top-0 bottom-0 w-[10px] rounded-l sm:hidden animate-pulse ${User?.Demo || User?.Sandbox ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        />

                        {/* Floating USDT Badge Straddling the Top Border */}
                        <span className={`absolute -top-[7px] right-1 px-1 bg-zinc-900 border border-[#27272a] text-[8px] sm:text-[9px] font-mono uppercase ${User?.Demo || User?.Sandbox ? 'text-amber-500' : 'text-emerald-500'} rounded leading-none`}>
                            USDT
                        </span>

                        {/* Balance Amount */}
                        <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400 whitespace-nowrap">
                            {formatCurrency(heartbeatData?.Balance ?? 0, 2)}
                        </span>
                    </div>

                    {/* User Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                            className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] px-2 sm:px-2.5 py-1 sm:py-1.5 rounded text-xs transition-colors"
                        >
                            <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-300 font-bold shrink-0">
                                {User?.Name.charAt(0) || 'A'}
                            </div>
                            <span className="hidden md:inline text-zinc-300 font-medium text-xs truncate max-w-[90px]">{User?.Name}</span>
                            <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
                        </button>

                        {userDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-[#121214] border border-[#27272a] rounded-lg shadow-xl py-1.5 z-50 text-xs">
                                <div className="px-3 py-2 border-b border-zinc-800">
                                    <p className="font-semibold text-zinc-200">{User?.Name}</p>
                                    <p className="text-zinc-500 font-mono text-[10px] truncate">{User?.Email}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setUserDropdownOpen(false);
                                        router.push(BotID === user?.uid! ? '/trades' : `/trades/${BotID}`);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-zinc-800/80 text-zinc-300 flex items-center gap-2"
                                >
                                    <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    <span>Trades by Date Window</span>
                                </button>
                                <button
                                    onClick={() => router.push('/fees')}
                                    className="w-full text-left px-3 py-2 hover:bg-zinc-800/80 text-zinc-300 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Receipt className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>Service Fees Paid Ledger</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { router.push('/backtest') }}
                                    className="w-full text-left px-3 py-2 hover:bg-zinc-800/80 text-zinc-300 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                        <span>Daily Backtest Results</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => {
                                        setUserDropdownOpen(false);
                                        router.push('/settings');
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-zinc-800/80 text-zinc-300 flex items-center gap-2"
                                >
                                    <Sliders className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    <span>Bot Engine Configuration</span>
                                </button>
                                {User?.AccountType === "SUPER" && (<>
                                    <button
                                        onClick={() => {
                                            setUserDropdownOpen(false);
                                            router.push('/fleet');
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-zinc-800/80 text-zinc-300 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                            <span>User Profiles</span>
                                        </div>
                                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/80">
                                            SUPER
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setUserDropdownOpen(false);
                                            router.push('/create');
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-zinc-800/80 text-zinc-300 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <UserPlus className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                            <span>Create User & Bot</span>
                                        </div>
                                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/80">
                                            SUPER
                                        </span>
                                    </button>
                                </>)}
                                <button
                                    onClick={() => {
                                        setUserDropdownOpen(false);
                                        signOut();
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-rose-950/40 text-rose-400 flex items-center gap-2 border-t border-zinc-800/60"
                                >
                                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                                    <span>Disconnect Session</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Body */}
            <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-4 sm:space-y-6">
                {/* 2. Bot Action Control Bar */}
                <section className="bg-[#121214] border border-[#27272a] rounded-lg p-3 sm:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 shadow-md">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
                        <button
                            onClick={handleToggleTrading}
                            disabled={loadingAction === "trading"}
                            className={`flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-2 rounded-md font-mono text-xs font-semibold uppercase tracking-wider transition-all shadow-sm col-span-2 sm:col-span-1 md:w-auto ${User?.IsHalted
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                                }`}
                        >
                            {!User?.IsHalted ? (
                                <>
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-200"></span>
                                    </span>
                                    <Pause className="w-3.5 h-3.5 shrink-0" />
                                    <span>Pause Trading</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-3.5 h-3.5 shrink-0" />
                                    <span>Resume Trading</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => handleButtonEvents("restart")}
                            disabled={loadingAction === "restart"}
                            className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-md font-mono text-xs text-zinc-300 bg-zinc-900 border border-[#27272a] hover:bg-zinc-800 hover:text-white transition-colors"
                            title="Restart Bot Engine"
                        >
                            <RotateCcw className={`w-3.5 h-3.5 shrink-0 ${loadingAction === 'restart' ? 'animate-spin' : ''}`} />
                            <span>Restart Engine</span>
                        </button>

                        <button
                            onClick={handleForceClose}
                            disabled={loadingAction === "forceClose" || heartbeatData?.ActiveTrade === null}
                            className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-md font-mono text-xs border transition-all ${heartbeatData?.ActiveTrade !== null
                                ? 'bg-rose-950/40 text-rose-300 border-rose-800/80 hover:bg-rose-900/50 hover:text-white'
                                : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 cursor-not-allowed opacity-60'
                                }`}
                            title={heartbeatData?.ActiveTrade !== null ? 'Immediately market-close current position' : 'No active position to close'}
                        >
                            <XCircle className={`w-3.5 h-3.5 shrink-0 ${loadingAction === 'forceClose' ? 'animate-spin' : 'text-rose-400'}`} />
                            <span>Force Close</span>
                        </button>

                        <button
                            onClick={() => fetchData()}
                            disabled={loadingAction === 'syncPosition'}
                            className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-md font-mono text-xs text-zinc-300 bg-zinc-900 border border-[#27272a] hover:bg-zinc-800 hover:text-white transition-colors"
                            title="Synchronize margin buffer and mark price from Binance"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loadingAction === 'syncPosition' ? 'animate-spin' : 'text-blue-400'}`} />
                            <span>Sync Risk</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between md:justify-start gap-2 bg-[#09090b] border border-[#27272a] px-3.5 py-1.5 rounded-full w-full md:w-auto">
                        <span className="text-[11px] font-mono text-zinc-500 uppercase">Engine <span className="hidden sm:inline text-zinc-400">status</span>:</span>
                        <span className="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-1.5">
                            <span
                                className={`w-2 h-2 rounded-full shrink-0 ${heartbeatData?.ActiveTrade
                                    ? 'bg-emerald-400'
                                    : 'bg-blue-400 animate-pulse'}
                                `}
                            />
                            <span className="truncate">{heartbeatData ? heartbeatData.Status : "Loading.."}</span>
                        </span>
                    </div>
                </section>

                {/* Real-time TradingView Candlestick Chart */}
                <section className="w-full">
                    <TradingViewChart
                        candles={historicalCandlesState}
                        position={heartbeatData?.ActiveTrade}
                        trades={heartbeatData?.Trades || []}
                        symbol={User?.Symbol || heartbeatData?.LatestCandle?.symbol || "undefined"}
                        interval={heartbeatData && heartbeatData.LatestCandle?.interval || "1m"}
                        isLoading={heartbeatData === undefined}
                        strategy={userStrategy}
                    />
                </section>

                {/* 3. Live Position Card with Embedded QOL Progress Bar */}
                <section className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between mb-3 border-b border-[#27272a] pb-2.5 gap-2">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                                Active Futures Position
                            </h2>
                        </div>
                        {heartbeatData?.ActiveTrade && (
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-[10.5px] sm:text-[11px] font-mono text-zinc-500">
                                    Order ID: {heartbeatData.ActiveTrade.orderId}
                                </span>
                                <button
                                    onClick={handleForceClose}
                                    disabled={loadingAction === 'forceClose'}
                                    className="px-2.5 py-1 rounded bg-rose-950/60 border border-rose-800 text-rose-300 hover:bg-rose-900/80 text-[10px] font-mono transition-colors"
                                >
                                    Close Position
                                </button>
                            </div>
                        )}
                    </div>

                    {heartbeatData?.ActiveTrade ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-4 pt-1">
                                <div className="space-y-1">
                                    <span className="text-[10.5px] font-mono text-zinc-500 uppercase block">Symbol / Side</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-sm font-mono text-white">{heartbeatData.ActiveTrade.symbol}</span>
                                        <span
                                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${heartbeatData?.ActiveTrade.side === Direction.Long
                                                ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                                                : 'text-rose-400 bg-rose-950/60 border-rose-800'
                                                }`}
                                        >
                                            {heartbeatData.ActiveTrade.side === Direction.Long ? 'LONG' : 'SHORT'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10.5px] font-mono text-zinc-500 uppercase block">Entry Price</span>
                                    <span className="font-mono text-sm font-semibold text-zinc-200">
                                        ${formatCurrency(heartbeatData.ActiveTrade.entryPrice, 2)}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10.5px] font-mono text-zinc-500 uppercase block">Mark Price</span>
                                    <span className="font-mono text-sm font-semibold text-zinc-200">
                                        ${formatCurrency(heartbeatData.ActiveTrade.markPrice, 2)}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10.5px] font-mono text-zinc-500 uppercase block">Size (Notional)</span>
                                    <div className="flex flex-col">
                                        <span className="font-mono text-sm font-semibold text-zinc-200">
                                            {heartbeatData.ActiveTrade.size}
                                        </span>
                                        <span className="font-mono text-[10.5px] text-zinc-500">
                                            ≈ ${formatCurrency(heartbeatData.ActiveTrade.notional, 2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10.5px] font-mono text-zinc-500 uppercase block">Liq. Price</span>
                                    <span className="font-mono text-sm font-semibold text-amber-400">
                                        ${formatCurrency(heartbeatData.ActiveTrade.liqPrice, 2)}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10.5px] font-mono text-zinc-500 uppercase block">Margin Buffer</span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-mono text-sm font-semibold text-emerald-400">
                                            {`${(heartbeatData.ActiveTrade.marginBuffer ?? 0).toFixed(3)}`}<small> USDT</small>
                                        </span>
                                        {User?.AvoidLiquidation && (
                                            <span className="text-[9px] px-1 bg-blue-950 text-blue-400 border border-blue-800 rounded">
                                                AUTO-ADD
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10.5px] font-mono text-zinc-500 uppercase block">Unrealized PnL</span>
                                    {(() => {
                                        const unPnl = heartbeatData.ActiveTrade.unrealizedPnl;
                                        const isPos = unPnl >= 0;
                                        return (
                                            <span
                                                className={`font-mono text-sm font-bold flex items-center gap-0.5 ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}
                                            >
                                                {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                                {isPos ? '+' : ''}{formatCurrency(unPnl, 3)}<small> USDT</small>
                                            </span>
                                        );
                                    })()}
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10.5px] font-mono text-zinc-500 uppercase block">ROE %</span>
                                    {(() => {
                                        const roe = heartbeatData.ActiveTrade.roe;
                                        const isPos = roe >= 0;
                                        return (
                                            <span
                                                className={`font-mono text-sm font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'
                                                    }`}
                                            >
                                                {heartbeatData.ActiveTrade.roe.toFixed(2)}%
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* QOL Enhancement: Center-Anchored Bi-Directional Risk / Reward Bar */}
                            {(() => {
                                const pos = heartbeatData.ActiveTrade;
                                const isLong = pos.side === Direction.Long;

                                const tpPerc = userStrategy?.risk?.tpPerc || 0.02;
                                const tpPrice = isLong
                                    ? pos.entryPrice * (1 + tpPerc)
                                    : pos.entryPrice * (1 - tpPerc);

                                const isDynamicSL = userStrategy?.risk?.slCondition === SLCondition.DynamicSL;
                                const slPerc = userStrategy?.risk?.slPerc || 0.01;

                                const dangerPrice = isDynamicSL
                                    ? (isLong ? pos.entryPrice * (1 - slPerc) : pos.entryPrice * (1 + slPerc))
                                    : pos.liqPrice;

                                const dangerLabel = isDynamicSL ? 'Stop Loss' : 'Liquidation';

                                // 3. Calculate Directional Progress (0% to 100% of respective half)
                                const priceDelta = isLong
                                    ? (pos.markPrice - pos.entryPrice)
                                    : (pos.entryPrice - pos.markPrice);

                                const isWinning = priceDelta >= 0;

                                let halfWidthPercent = 0;
                                if (isWinning) {
                                    const maxRewardDist = Math.abs(tpPrice - pos.entryPrice);
                                    halfWidthPercent = maxRewardDist > 0
                                        ? Math.min((priceDelta / maxRewardDist) * 100, 100)
                                        : 0;
                                } else {
                                    const maxRiskDist = Math.abs(dangerPrice - pos.entryPrice);
                                    halfWidthPercent = maxRiskDist > 0
                                        ? Math.min((Math.abs(priceDelta) / maxRiskDist) * 100, 100)
                                        : 0;
                                }

                                const trackFillWidth = halfWidthPercent * 0.5;

                                return (
                                    <div className="mt-3 pt-3 border-t border-[#27272a]/60 space-y-1.5">
                                        {/* Top Labels */}
                                        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                                            <span className="text-rose-400">
                                                {dangerLabel}
                                            </span>
                                            <span className="text-emerald-400">
                                                Take Profit Target
                                            </span>
                                        </div>

                                        {/* Center-Anchored Track */}
                                        <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800 relative flex items-center">
                                            {/* Center Entry Anchor Marker */}
                                            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-zinc-400 z-10 -translate-x-1/2" />

                                            {isWinning ? (
                                                /* Expands Right from 50% -> 100% (Green) */
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 rounded-r-full"
                                                    style={{
                                                        marginLeft: '50%',
                                                        width: `${trackFillWidth}%`,
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    className="h-full bg-gradient-to-l from-rose-600 to-rose-400 transition-all duration-500 rounded-l-full"
                                                    style={{
                                                        marginLeft: `${50 - trackFillWidth}%`,
                                                        width: `${trackFillWidth}%`,
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                                <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
                            </div>
                            <div>
                                <p className="text-sm font-mono text-zinc-300 font-semibold">
                                    No Open Position - Engine Scanning Market
                                </p>
                                {!User?.IsHalted && (
                                    <p className="text-xs text-zinc-500 font-mono mt-0.5">
                                        Listening to Binance {User?.Symbol || 'BTCUSDT'} candles.<br />
                                        {User?.StrategyName && (
                                            <>Strategy: {User?.StrategyName}</>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* 4. Analytics & Performance Charts Grid */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <CustomLineChart
                        title="Cumulative Realized PnL"
                        description="Net profit curve across closed futures trades"
                        overviewTitle="Total Net:"
                        overviewData={`
                            ${(tradeAnalytics.cumulativePnlData.reduce((acc, item) => acc + (item.value2 ?? 0), 0) ?? 0) > 0 ? "+" : "-"}
                            ${formatCurrency(tradeAnalytics.cumulativePnlData.reduce((acc, item) => acc + (item.value2 ?? 0), 0) ?? 0, 2)} USDT`
                        }
                        data={tradeAnalytics.cumulativePnlData}
                        valueLabel="Cumulative PnL"
                        valueFormatter={(value) => `${value} USDT`}
                    />

                    <CustomBarChart
                        title="Net Profit Breakdown"
                        data={tradeAnalytics.breakdownData.chartData}
                        metrics={[{
                            key: 'pnl',
                            text: 'PnL',
                            color: '#10b981',
                            icon: TrendingUp,
                            description: 'Daily realized net profit & loss recorded from executed futures orders',
                        },
                        {
                            key: 'fee',
                            text: 'Fee',
                            color: '#3b82f6',
                            icon: DollarSign,
                            description: 'Daily exchange commission & service fees incurred on order execution',
                        },]}
                        overviewTitle={(active) => active === 'pnl' ? 'Total Net PnL:' : 'Total Fees Paid:'}
                        overviewData={(active) =>
                            active === 'pnl'
                                ? `${tradeAnalytics.breakdownData.totalNetPnl >= 0 ? '+' : '-'}${formatCurrency(tradeAnalytics.breakdownData.totalNetPnl, 2)} USDT`
                                : `${formatCurrency(tradeAnalytics.breakdownData.totalFees, 2)} USDT`
                        }
                        valueFormatter={(val) => `${val} USDT`}
                        cellColor={(val, entry, active) => active === 'pnl' ? (val >= 0 ? '#10b981' : '#f43f5e') : '#3b82f6'}
                    />
                </section>

                <section>
                    <LogTerminal logs={botLogs} onClear={handleClearLogs} />
                </section>

                {/* 6. Recent Closed Trades Table with One-Click Share/Copy Button */}
                <section id="recent-trades-section" className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between mb-4 border-b border-[#27272a] pb-2.5 gap-2">
                        <div>
                            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                                Recent Closed Trades
                            </h3>
                            <p className="text-[11px] text-zinc-500 font-mono">
                                Audit record of executed Binance futures orders with itemized Service Fee and Binance Commission
                            </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                                Total: {lastTrades.length}
                            </span>

                            <button
                                onClick={() => {
                                    router.push(BotID === user?.uid! ? '/trades' : `/trades/${BotID}`);
                                }}
                                className="flex items-center gap-1.5 text-xs font-mono text-blue-400 hover:text-blue-300 bg-blue-950/40 border border-blue-800/80 px-2.5 py-1 rounded transition-colors"
                            >
                                <Calendar className="w-3 h-3" />
                                <span>Filter by Date Window &rarr;</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto -mx-3.5 sm:mx-0 px-3.5 sm:px-0">
                        <table className="w-full text-left text-xs font-mono min-w-[780px]">
                            <thead>
                                <tr className="border-b border-[#27272a] text-zinc-500 text-[11px] uppercase">
                                    <th className="py-2.5 px-3">Date / Time</th>
                                    <th className="py-2.5 px-3">Symbol</th>
                                    <th className="py-2.5 px-3">Side</th>
                                    <th className="py-2.5 px-3 text-right">Profit %</th>
                                    <th className="py-2.5 px-3 text-right">Qty</th>
                                    <th className="py-2.5 px-3 text-right">Gross PnL</th>
                                    <th className="py-2.5 px-3 text-right text-amber-400">Fee (Service)</th>
                                    <th className="py-2.5 px-3 text-right text-blue-400">Commission (Binance)</th>
                                    <th className="py-2.5 px-3 text-right text-emerald-400">Net Profit</th>
                                    <th className="py-2.5 px-3">Exit Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#27272a]/60">
                                {lastTrades.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-6 text-center text-zinc-600 font-mono">
                                            No trade executions recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    lastTrades.map((t, id) => {
                                        return (
                                            <tr key={t.orderId + id} className="hover:bg-zinc-900/50 transition-colors">
                                                <td className="py-3 px-3 text-zinc-400 text-[11px] whitespace-nowrap">{(new Date(t.Timestamp).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                }))}</td>
                                                <td className="py-3 px-3 font-semibold text-white">{t.symbol}</td>
                                                <td className="py-3 px-3">
                                                    <span
                                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${t.side === Direction.Long
                                                            ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                                                            : 'text-rose-400 bg-rose-950/60 border-rose-800'
                                                            }`}
                                                    >
                                                        {Direction[t.side]}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right text-zinc-300 font-mono">
                                                    {(((t.realizedProfit) / (t.notional ?? t.isolatedWallet)) * 100) > 0 ? "+" : "-"}{((Math.abs(t.realizedProfit) / (t.notional ?? t.isolatedWallet)) * 100).toFixed(2)}%
                                                </td>
                                                <td className="py-3 px-3 text-right text-zinc-400 font-mono">
                                                    {t.quantity}
                                                </td>
                                                <td className="py-3 px-3 text-right font-semibold font-mono">
                                                    <span className={t.realizedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                        {t.realizedProfit >= 0 ? '+' : '-'}{formatCurrency((t.realizedProfit), 2)}<small> USDT</small>
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right text-amber-400 font-mono">
                                                    {formatCurrency(t.serviceFee, 2)}<small> USDT</small>
                                                </td>
                                                <td className="py-3 px-3 text-right text-blue-400 font-mono">
                                                    {formatCurrency(t.commission, 2)}<small> USDT</small>
                                                </td>
                                                <td className="py-3 px-3 text-right font-bold font-mono">
                                                    <span className={(t.realizedProfit - (t.serviceFee + t.commission)) > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                        {(t.realizedProfit - (t.serviceFee + t.commission)) > 0 ? '+' : '-'}{formatCurrency(t.realizedProfit - (t.serviceFee + t.commission), 2)}<small> USDT</small>
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                                        {t.Reason || 'Strategy Exit'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                description={confirmModal.description}
                confirmText={confirmModal.confirmText}
                cancelText={confirmModal.cancelText}
                variant={confirmModal.variant}
                isLoading={confirmModal.isLoading}
                details={confirmModal.details}
            />
            <Footer />
        </div>
    )
}

export default UserDashboard