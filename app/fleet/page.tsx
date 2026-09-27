"use client"
import ConfirmationModal, { ConfirmationModalProps } from '@/components/ConfirmationModal';
import { SAGE_FEE_PERCENTAGE } from '@/constants';
import { BotHeartbeat, IDecryptedKeys, IUserInfoRuntime, Strategy, TradesStatsResults } from '@/interfaces';
import Footer from '@/section/Footer';
import { formatCurrency } from '@/utils';
import { Activity, ArrowLeft, Bot, Check, CheckCircle, CheckCircle2, ChevronRight, Copy, DollarSign, ExternalLink, Key, Layers, Power, Radio, RefreshCw, Search, ShieldCheck, Sliders, Sparkles, Tag, Trash2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react'
import { getBotStats, getOverallRealizedProfit } from '../actions/trades.actions';
import { server } from '../actions/server.actions';
import { deleteAPIKey, getAllUsers, updateKillSwich } from '../actions/user.actions';

const Fleet = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [fleetData, setFleetData] = useState<IUserInfoRuntime[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedBot, setSelectedBot] = useState<IUserInfoRuntime | null>(null);
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalProps>({
        isOpen: false,
        message: '',
        onConfirm: () => { },
        onClose: () => { },
    });
    const [heartBeats, setHeartBeats] = useState<BotHeartbeat[]>([]);
    const [overallProfit, setOverallProfit] = useState<number>(0);
    const [userProfitStats, setUserProfitStats] = useState<TradesStatsResults | null>(null);
    const [apiFilter, setApiFilter] = useState<"all" | "demo" | "live">("all");
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

    const closeConfirmModal = () => {
        setConfirmationModal((prev) => ({ ...prev, isOpen: false, isLoading: false, message: '', onConfirm: () => { }, onClose: () => { } }));
    };

    const filteredBots = useMemo(() => {
        switch (statusFilter) {
            case "all":
                return fleetData;
                break;
            case "halted":
                return fleetData.filter((e) => e.IsHalted === true);
                break;
            case "inactive":
                return fleetData.filter((e) => e.IsActive === false);
                break;
            case "demo":
                return fleetData.filter((e) => e.Demo === true);
                break;
            case "live":
                return fleetData.filter((e) => e.Demo === false);
                break;
            case "forced":
                return fleetData.filter((e) => e.SUKillSwitch === true);
                break;
            default:
                return fleetData;
        }
    }, [statusFilter, fleetData])

    const filteredFleet = useMemo(() => {
        if (searchQuery.length < 1) return filteredBots;
        const query = searchQuery.toLowerCase();
        return filteredBots.filter((e) =>
            e.Name.toLowerCase().includes(query) ||
            e.Email.toLowerCase().includes(query) ||
            e.BotID.toLowerCase().includes(query)
        );
    }, [filteredBots, searchQuery])

    useEffect(() => {
        const LoadData = async () => {
            const profit = await getOverallRealizedProfit();
            setOverallProfit(profit);

            const strategies = await server<Strategy[]>({ request: "getStrategies" });
            setStrategies(strategies);
        }
        fetchFleet();
        LoadData();
    }, [])

    useEffect(() => {
        if (selectedBot === null) {
            setUserProfitStats(null);
            return;
        }
        const getProfitStats = async () => {
            const stats = await getBotStats(selectedBot.BotID);
            setUserProfitStats(stats);
        }
        getProfitStats();
    }, [selectedBot])

    const router = useRouter();

    const fetchFleet = async () => {
        setIsLoading(true);
        const users = await getAllUsers();
        setFleetData(users);
        try {
            const _hData = await server<BotHeartbeat[]>({ request: "allHeartbeats" });
            setHeartBeats(_hData);
        } catch (error) {
            setActionMessage("There seems to be an error loading fleet heartbeat data");
        } finally {
            setIsLoading(false);
        }
    }

    const handleToggleHalt = (botID: string) => {
        const targetBot = selectedBot;
        if (!targetBot) return;
        const isCurrentlyHalted = targetBot.IsHalted;

        if (isCurrentlyHalted) {
            setConfirmationModal({
                isOpen: true,
                title: 'Resume Bot Engine',
                message: `Do you want to resume trading for bot ${botID}?`,
                description:
                    'This will re-activate the automated strategy loop, allowing this bot to scan markets and enter new positions.',
                confirmText: 'Resume Bot Trading',
                cancelText: 'Cancel',
                variant: 'primary',
                details: [
                    { label: 'Target Bot ID', value: botID },
                    { label: 'Assigned Operator', value: targetBot.Name },
                    { label: 'Strategy', value: targetBot.StrategyName },
                ],
                onConfirm: () => executeToggleHalt(botID),
                onClose: closeConfirmModal
            });
        } else {
            setConfirmationModal({
                isOpen: true,
                title: 'Halt Bot Trading',
                message: `Do you want to halt bot ${botID}?`,
                description:
                    'This will pause all algorithmic trading logic for this bot. Open positions will remain unless manually closed, but no new orders will be submitted.',
                confirmText: 'Halt Bot Engine',
                cancelText: 'Cancel',
                variant: 'danger',
                details: [
                    { label: 'Target Bot ID', value: botID },
                    { label: 'Assigned Operator', value: targetBot.Name },
                    { label: 'Strategy', value: targetBot.StrategyName }
                ],
                onConfirm: () => executeToggleHalt(botID),
                onClose: closeConfirmModal
            });
        }
    };

    const executeToggleHalt = async (BotID: string) => {
        if (!selectedBot) return;
        try {
            const updatedBot = await updateKillSwich(BotID, selectedBot!.SUKillSwitch);
            if (!updatedBot) {
                setActionMessage("There seems to be an error updating the bot Kill Switch");
                return;
            }

            const restBots = fleetData.filter((e) => e !== selectedBot);
            setFleetData([
                ...restBots,
                updatedBot
            ]);
            setSelectedBot(updatedBot);
        } catch (error) {
            console.log(error);
            setActionMessage("There seems to be an error updating the bot Kill Switch");
        }
    }

    const handleCopy = (id: string, text: string) => {
        if (!text) return;
        navigator.clipboard?.writeText(text);
        setCopiedKeyId(id);
        setTimeout(() => setCopiedKeyId(null), 2000);
    }

    const executeDeleteSingleApiKey = async (targetBot: IUserInfoRuntime, keyItem: IDecryptedKeys) => {
        setConfirmationModal((prev) => ({ ...prev, isLoading: true }));
        try {
            const updatedUser = await deleteAPIKey(targetBot.BotID, keyItem.id);
            if (!updatedUser) {
                setActionMessage("There seems to be problem deleting the selected API");
                return;
            }
            setSelectedBot(updatedUser);

            fetchFleet();
            setActionMessage(`API Key "${keyItem.label}" successfully deleted for ${targetBot.Name}.`);
        } catch (err: any) {
            console.error('Failed to delete single API key:', err);
            setActionMessage("Unable to delete the API");
        } finally {
            closeConfirmModal();
            setTimeout(() => setActionMessage(null), 4000);
        }
    }

    const handleDeleteSingleApiKey = (targetBot: IUserInfoRuntime, keyItem: IDecryptedKeys) => {
        setConfirmationModal({
            onClose: closeConfirmModal,
            isOpen: true,
            title: 'Delete Binance API Key',
            message: `Do you want to delete the API key "${keyItem.label}" for user "${targetBot.Name}" (${targetBot.BotID})?`,
            description:
                `This will permanently remove this API credential from ${targetBot.Name}'s key repository.`,
            confirmText: 'Delete API Key',
            cancelText: 'Keep Key',
            variant: 'danger',
            details: [
                { label: 'Selected Operator', value: targetBot.Name },
                { label: 'Target Bot ID', value: targetBot.BotID },
                { label: 'Label', value: <span className="font-mono text-zinc-100 font-semibold">{keyItem.label}</span> },
                {
                    label: 'Protocol Type',
                    value: (
                        <span
                            className={`font-mono font-bold ${!keyItem.isDemo ? 'text-emerald-400' : 'text-amber-400'
                                }`}
                        >
                            {!keyItem.isDemo ? 'LIVE TRADING' : 'DEMO SANDBOX'}
                        </span>
                    ),
                },
                {
                    label: 'Status',
                    value: keyItem.isDemo === targetBot.Demo ? (
                        <span className="font-mono text-rose-400 font-semibold">Active Key (Currently In Use)</span>
                    ) : (
                        <span className="font-mono text-zinc-400">Standby Key</span>
                    ),
                },
                {
                    label: 'API Key',
                    value: (
                        <span className="font-mono text-amber-300">
                            {keyItem.DecryptedKey.length > 0
                                ? `${keyItem.DecryptedKey.slice(0, 8)}...${keyItem.DecryptedKey.slice(-4)}`
                                : 'None configured'}
                        </span>
                    ),
                }
            ],
            onConfirm: () => executeDeleteSingleApiKey(targetBot, keyItem),
        });
    };

    useEffect(() => {
        if (!actionMessage) return;
        setTimeout(() => setActionMessage(null), 3500);
    }, [actionMessage])

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
            {/* Header Bar */}
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
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xs sm:text-sm font-semibold tracking-tight text-white font-mono truncate">
                                Fleet Management & User Profiles
                            </h1>
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-800/80">
                                <ShieldCheck className="w-3 h-3 text-purple-400" />
                                Super User
                            </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono hidden md:block">
                            Full directory of deployed bots, execution parameters, and user account profiles
                        </p>
                    </div>
                </div>

                {/* Header Right Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => router.push("/create")}
                        className="px-2.5 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-purple-900/30"
                    >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Create User</span>
                    </button>

                    <button
                        onClick={fetchFleet}
                        disabled={isLoading}
                        className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh Fleet</span>
                    </button>
                </div>
            </header>

            {/* Main Body */}
            <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-[1700px] w-full mx-auto space-y-4 sm:space-y-6">
                {/* Action notification banner */}
                {actionMessage && (
                    <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-800/60 text-purple-200 text-xs font-mono flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                        <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>{actionMessage}</span>
                    </div>
                )}

                {/* Fleet KPI Statistics Bar */}
                <section className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
                    <div className="bg-[#121214] border border-[#27272a] rounded-lg p-3 sm:p-4 space-y-1">
                        <span className="text-[10.5px] font-mono uppercase text-zinc-400">Total Fleet Bots</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">{fleetData.length}</span>
                            <span className="text-[11px] font-mono text-zinc-500">
                                {fleetData.filter((e) => e.Demo === false).length} Live / {fleetData.filter((e) => e.Demo === true).length} Demo
                            </span>
                        </div>
                    </div>

                    <div className="bg-[#121214] border border-[#27272a] rounded-lg p-3 sm:p-4 space-y-1">
                        <span className="text-[10.5px] font-mono uppercase text-zinc-400">Active Execution</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">{fleetData.filter((e) => e.IsHalted === false).length}</span>
                            <span className="text-[11px] font-mono text-rose-400">
                                {fleetData.filter((e) => e.IsHalted === true).length} Halted
                            </span>
                        </div>
                    </div>

                    <div className="bg-[#121214] border border-[#27272a] rounded-lg p-3 sm:p-4 space-y-1">
                        <span className="text-[10.5px] font-mono uppercase text-zinc-400">Combined Realized PnL</span>
                        <div className="flex items-baseline justify-between">
                            <span className={`text-xl sm:text-2xl font-bold font-mono ${overallProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {overallProfit >= 0 ? '+' : ''}{overallProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">USDT</span>
                        </div>
                    </div>

                    <div className="bg-[#121214] border border-[#27272a] rounded-lg p-3 sm:p-4 space-y-1">
                        <span className="text-[10.5px] font-mono uppercase text-zinc-400">Unpaid Sage Fees ({SAGE_FEE_PERCENTAGE}%)</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-xl sm:text-2xl font-bold font-mono text-blue-400">
                                {fleetData.reduce((acc, bot) => (acc + bot.UnpaidFee), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                            </span>
                            <span className="text-[10px] font-mono text-blue-500/80">Accrued</span>
                        </div>
                    </div>

                    <div className="bg-[#121214] border border-[#27272a] rounded-lg p-3 sm:p-4 space-y-1 col-span-2 lg:col-span-1">
                        <span className="text-[10.5px] font-mono uppercase text-zinc-400">Total Capital Under Mgmt</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-200">
                                {heartBeats.reduce((acc, bot) => (acc + bot.Balance), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                            </span>
                            {/* <span className="text-[11px] font-mono text-emerald-400/90">{fleetStats.avgWinRate.toFixed(1)}% Win</span> */}
                        </div>
                    </div>
                </section>

                {/* Master-Detail Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
                    {/* LEFT COLUMN: All Bots List & Selector (5 cols on lg) */}
                    <section className="lg:col-span-5 bg-[#121214] border border-[#27272a] rounded-lg p-3.5 sm:p-4 space-y-3.5 flex flex-col">
                        <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
                            <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4 text-purple-400 shrink-0" />
                                <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                                    All Deployed Bots ({fleetData.length})
                                </h2>
                            </div>
                            <span className="text-[11px] font-mono text-zinc-500">Click to inspect profile</span>
                        </div>

                        {/* Search and Filters */}
                        <div className="space-y-2">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search bot ID, operator name, pair, strategy..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#09090b] border border-[#27272a] focus:border-purple-500 rounded px-3 pl-9 py-1.5 text-xs font-mono text-zinc-200 outline-none"
                                />
                            </div>

                            {/* Status Filter Tabs */}
                            <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                                {[
                                    { key: 'all', label: 'All' },
                                    { key: 'live', label: 'Live' },
                                    { key: 'demo', label: 'Demo' },
                                    { key: 'inactive', label: 'Inacive' },
                                    { key: 'halted', label: 'Halted' },
                                    { key: 'forced', label: 'Force Halt' }
                                ].map((f) => (
                                    <button
                                        key={f.key}
                                        onClick={() => setStatusFilter(f.key as any)}
                                        className={`px-2 py-1 rounded border transition-colors ${statusFilter === f.key
                                            ? 'bg-purple-950/70 border-purple-700 text-purple-200 font-semibold'
                                            : 'bg-[#09090b] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scrollable Bots List */}
                        <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                            {filteredFleet.length === 0 ? (
                                <div className="p-8 text-center text-xs font-mono text-zinc-500 bg-[#09090b] border border-[#27272a] rounded">
                                    No bots match the selected filter criteria.
                                </div>
                            ) : (
                                filteredFleet.map((item) => {
                                    const isSelected = item.BotID === selectedBot?.BotID;
                                    const isHalted = item.SUKillSwitch;
                                    const heartbeat = heartBeats.find((e) => e.BotID === item.BotID);
                                    return (
                                        <div
                                            key={item.BotID}
                                            onClick={() => setSelectedBot(item)}
                                            className={`p-3 rounded-lg border transition-all cursor-pointer text-xs font-mono relative ${isSelected
                                                ? 'bg-[#18181b] border-purple-500 shadow-md ring-1 ring-purple-500/30'
                                                : 'bg-[#09090b] border-[#27272a] hover:border-zinc-700 hover:bg-[#121214]'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-zinc-100 flex items-center gap-1.5">
                                                            {item.BotID}
                                                        </span>
                                                        <span
                                                            className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-bold border ${item.Demo
                                                                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                                                                : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                                                                }`}
                                                        >
                                                            {item.Demo ? 'Demo' : 'Live'}
                                                        </span>
                                                        {isHalted ? (
                                                            <span className="text-[9px] px-1.5 py-0.2 rounded uppercase font-bold bg-rose-950/60 text-rose-300 border border-rose-800/60">
                                                                Halted
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-semibold">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                Active
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-[11px] text-zinc-300 font-medium truncate">
                                                        {item.Name}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-500 truncate">
                                                        {item.Email}
                                                    </p>
                                                </div>

                                                {/* Right: PnL and Pair */}
                                                <div className="text-right shrink-0 space-y-1">
                                                    {heartbeat && heartbeat.ActiveTrade ? (
                                                        <div
                                                            className={`font-bold text-xs ${heartbeat.ActiveTrade.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                                }`}
                                                        >
                                                            {heartbeat.ActiveTrade.unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(heartbeat.ActiveTrade.unrealizedPnl)} USDT
                                                        </div>

                                                    ) : (
                                                        <div className={`font-bold text-xs text-emerald-400`}>
                                                            0.00 USDT
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 inline-block">
                                                        {item.Symbol} {item.Leverage}x
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer info in bot card */}
                                            <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10.5px] text-zinc-400">
                                                <span className="truncate max-w-[180px] text-zinc-400">
                                                    {item.StrategyName}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-zinc-500">
                                                    <span>{heartbeat ? formatCurrency(heartbeat.Balance) : "0.00"} USDT</span>
                                                    <ChevronRight className="w-3 h-3 text-zinc-600" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    {/* RIGHT COLUMN: Selected Bot & User Profile View (7 cols on lg) */}
                    {selectedBot && (
                        <section className="lg:col-span-7 space-y-4">
                            {/* Operator Header Card */}
                            <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-4 shadow-lg">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-900 to-zinc-900 border border-purple-500/60 flex items-center justify-center text-lg font-bold text-purple-200 shadow-inner">
                                            {selectedBot.Name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-base font-semibold text-white font-mono">
                                                    {selectedBot.Name}
                                                </h2>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-800/80">
                                                    {selectedBot.AccountType}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-400 font-mono">
                                                {selectedBot.Email} • Bot ID: <span className="text-zinc-200 font-bold">{selectedBot.BotID}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Primary Super User Action: Inspect in Dashboard */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => router.push(`/inspect/${selectedBot.BotID}`)}
                                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/30 transition-colors"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span>Inspect in Dashboard</span>
                                        </button>

                                        <button
                                            onClick={() => handleToggleHalt(selectedBot.BotID)}
                                            className={`px-3 py-2 rounded-md border font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors ${selectedBot.SUKillSwitch
                                                ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300 hover:bg-emerald-900/80'
                                                : 'bg-rose-950/70 border-rose-700 text-rose-300 hover:bg-rose-900/80'
                                                }`}
                                        >
                                            <Power className="w-3.5 h-3.5" />
                                            <span>{selectedBot.SUKillSwitch ? 'Resume' : 'Halt'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Sub-header meta bar */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                                    <div className="bg-[#09090b] border border-[#27272a] p-2.5 rounded">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Bot Status</span>
                                        <span className="text-zinc-300 font-medium">{selectedBot.IsHalted === true ? "Trading" : "Halted"}</span>
                                    </div>
                                    <div className="bg-[#09090b] border border-[#27272a] p-2.5 rounded">
                                        <span className="text-[10px] text-zinc-500 uppercase block">System Status</span>
                                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            {heartBeats.find((e) => e.BotID === selectedBot.BotID)?.Status || "Loading.."}
                                        </span>
                                    </div>
                                    <div className="bg-[#09090b] border border-[#27272a] p-2.5 rounded">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Total Trades</span>
                                        <span className="text-zinc-300 font-medium">{userProfitStats?.count || 0} Executed</span>
                                    </div>
                                    <div className="bg-[#09090b] border border-[#27272a] p-2.5 rounded">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Avg Profit %</span>
                                        <span className="text-purple-400 font-medium">{userProfitStats?.avgProfitPerc}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Section 1: Binance API Credentials & Signature Status */}
                            <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-3">
                                    <div className="flex items-center gap-2">
                                        <Key className="w-4 h-4 text-blue-400 shrink-0" />
                                        <div>
                                            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                                                Binance API Key Repository & Connections
                                            </h3>
                                            <p className="text-[11px] text-zinc-500 font-mono">
                                                Available exchange API credentials and execution endpoints configured for {selectedBot.Name}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Execution Mode Key Routing Status Banner */}
                                <div className="p-3 bg-[#09090b] border border-zinc-800 rounded-lg space-y-1.5 text-xs font-mono">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Radio className={`w-3.5 h-3.5 shrink-0 ${selectedBot.Demo ? 'text-amber-400' : 'text-emerald-400'}`} />
                                            <span className="text-zinc-400">Current Execution Binding:</span>
                                            <span
                                                className={`font-bold px-1.5 py-0.5 rounded text-[10px] border ${selectedBot.Demo
                                                    ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                                                    : 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                                                    }`}
                                            >
                                                {selectedBot.Demo ? 'DEMO PAPER MODE' : 'LIVE TRADING'}
                                            </span>
                                        </div>

                                        {(() => {
                                            const activeKey = selectedBot.DecryptedAPIKeys.find((key) => key.isDemo === selectedBot.Demo);

                                            if (activeKey) {
                                                return (
                                                    <div className="flex items-center gap-1.5 text-zinc-300 text-[11px]">
                                                        <span className="text-zinc-500">Routing orders to:</span>
                                                        <span className="text-zinc-100 font-semibold">{activeKey.label}</span>
                                                        <span className="text-zinc-500">
                                                            ({activeKey.DecryptedKey.length > 0 ? `${activeKey.DecryptedKey.slice(0, 6)}...${activeKey.DecryptedKey.slice(-4)}` : 'No Key'})
                                                        </span>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <span className="text-amber-400 text-[10.5px]">
                                                    No active {selectedBot.Demo ? 'Demo' : 'Live'} key configured for this bot.
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Filter Pills */}
                                <div className="flex items-center gap-1.5 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setApiFilter('all')}
                                        className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${apiFilter === 'all'
                                            ? 'bg-zinc-800 text-white font-medium border border-zinc-700'
                                            : 'text-zinc-400 hover:text-zinc-200'
                                            }`}
                                    >
                                        All Keys ({selectedBot.DecryptedAPIKeys.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setApiFilter('live')}
                                        className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors flex items-center gap-1.5 ${apiFilter === 'live'
                                            ? 'bg-emerald-950/80 text-emerald-300 font-medium border border-emerald-800'
                                            : 'text-zinc-400 hover:text-zinc-200'
                                            }`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        Live Keys ({selectedBot.DecryptedAPIKeys.filter((k) => k.isDemo === false).length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setApiFilter('demo')}
                                        className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors flex items-center gap-1.5 ${apiFilter === 'demo'
                                            ? 'bg-amber-950/80 text-amber-300 font-medium border border-amber-800'
                                            : 'text-zinc-400 hover:text-zinc-200'
                                            }`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        Demo Keys ({selectedBot.DecryptedAPIKeys.filter((k) => k.isDemo === true).length})
                                    </button>
                                </div>

                                {/* List of Available API Keys with Manual Delete Button */}
                                <div className="space-y-3 pt-1">
                                    {(() => {
                                        const filteredKeys = selectedBot.DecryptedAPIKeys.filter((k) => {
                                            if (apiFilter === "live") return k.isDemo === false;
                                            if (apiFilter === "demo") return k.isDemo === true;
                                            return true;
                                        })

                                        if (filteredKeys.length === 0) {
                                            return (
                                                <div className="p-6 text-center border border-dashed border-[#27272a] rounded-lg bg-[#09090b]/50 space-y-2">
                                                    <Key className="w-6 h-6 text-zinc-600 mx-auto" />
                                                    <p className="text-xs font-mono text-zinc-400">
                                                        {apiFilter === 'all'
                                                            ? `No Binance API credentials configured for ${selectedBot.Name}.`
                                                            : `No ${apiFilter === 'live' ? 'Live' : 'Demo'} API keys found for this operator.`}
                                                    </p>
                                                </div>
                                            );
                                        }

                                        return filteredKeys.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`bg-[#09090b] border rounded-lg p-3.5 sm:p-4 space-y-3 transition-colors ${!item.isDemo
                                                    ? 'border-emerald-800/80 bg-emerald-950/10'
                                                    : 'border-amber-800/80 bg-amber-950/10'
                                                    }`}
                                            >
                                                {/* Key Item Header */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Tag className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                                        <span className="font-mono text-xs font-semibold text-zinc-100">
                                                            {item.label}
                                                        </span>

                                                        {/* Label Badge */}
                                                        <span
                                                            className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${item.isDemo
                                                                ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800'
                                                                : 'bg-amber-950/70 text-amber-400 border-amber-800'
                                                                }`}
                                                        >
                                                            {!item.isDemo ? 'LIVE TRADING' : 'DEMO SANDBOX'}
                                                        </span>

                                                        {/* Active Badge */}
                                                        {item.isDemo === selectedBot.Demo ? (
                                                            <span className="flex items-center gap-1 text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border bg-blue-950/70 text-blue-400 border-blue-800">
                                                                <CheckCircle className="w-3 h-3" />
                                                                <span>ACTIVE</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9.5px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                                                                STANDBY
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Manual Delete Button for this specific API */}
                                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteSingleApiKey(selectedBot, item)}
                                                            className="px-2.5 py-1 rounded bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/70 text-rose-300 hover:text-rose-100 text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                                                            title={`Delete API Key "${item.label}"`}
                                                        >
                                                            <Trash2 className="w-3 h-3 text-rose-400" />
                                                            <span>Delete Key</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Credentials Display with Masking, Reveal & Copy */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs font-mono pt-1">
                                                    {/* API Key */}
                                                    <div className="bg-[#121214] border border-[#27272a] rounded p-2.5 space-y-1">
                                                        <div className="flex items-center justify-between text-zinc-400 text-[10.5px]">
                                                            <span>API KEY</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopy(`fleet_key_${item.id}`, item.DecryptedKey)}
                                                                className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                                                                title="Copy API Key"
                                                            >
                                                                {copiedKeyId === `fleet_key_${item.id}` ? (
                                                                    <span className="text-emerald-400 flex items-center gap-0.5">
                                                                        <Check className="w-3 h-3" /> Copied
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center gap-0.5">
                                                                        <Copy className="w-3 h-3" /> Copy
                                                                    </span>
                                                                )}
                                                            </button>
                                                        </div>
                                                        <div className="font-mono text-zinc-200 break-all text-[11px]">
                                                            {item.DecryptedKey.length > 0
                                                                ? item.DecryptedKey
                                                                : 'None configured'}
                                                        </div>
                                                    </div>

                                                    {/* API Secret */}
                                                    <div className="bg-[#121214] border border-[#27272a] rounded p-2.5 space-y-1">
                                                        <div className="flex items-center justify-between text-zinc-400 text-[10.5px]">
                                                            <span>API SECRET</span>
                                                        </div>
                                                        <div className="font-mono text-zinc-200 break-all text-[11px]">
                                                            {item.DecryptedSecret}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>

                                {/* Permissions & Security Badges */}
                                <div className="flex flex-wrap gap-2 text-[10.5px] font-mono pt-1 border-t border-zinc-800/60">
                                    <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        Futures Trading Allowed
                                    </span>
                                    <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        Withdrawal Disabled (Protected)
                                    </span>
                                    <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        IP Whitelist Enforced
                                    </span>
                                </div>
                            </div>

                            {/* Profile Section 2: Engine Strategy & Risk Parameters */}
                            <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-4">
                                <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
                                    <Sliders className="w-4 h-4 text-blue-400 shrink-0" />
                                    <div>
                                        <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                                            Trading Strategy & Risk Calibration
                                        </h3>
                                        <p className="text-[11px] text-zinc-500 font-mono">
                                            Mathematical model parameters, leverage bracket, and liquidation guard
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                                    <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Target Pair</span>
                                        <span className="text-sm font-bold text-white">{selectedBot.Symbol}</span>
                                    </div>

                                    <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Leverage Bracket</span>
                                        <span className="text-sm font-bold text-blue-400">{selectedBot.Leverage}x Isolated</span>
                                    </div>

                                    <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Execution Mode</span>
                                        <span className={`text-sm font-bold ${selectedBot.Demo ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {selectedBot.Demo ? 'DEMO PAPER' : 'LIVE CAPITAL'}
                                        </span>
                                    </div>

                                    <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Liquidation Guard</span>
                                        <span className={`text-sm font-bold ${selectedBot.AvoidLiquidation ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                            {selectedBot.AvoidLiquidation ? 'ENABLED (90%)' : 'DISABLED'}
                                        </span>
                                    </div>
                                </div>

                                {/* Strategy Details Box */}
                                <div className="p-3.5 bg-[#09090b] border border-[#27272a] rounded space-y-2 text-xs font-mono">
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                                            <Layers className="w-3.5 h-3.5 text-purple-400" />
                                            Strategy Profile: <span className="text-zinc-100 font-bold">{selectedBot.StrategyName}</span>
                                        </span>
                                        <span className="text-[10px] text-zinc-500">{strategies.find((e) => e.name === selectedBot.StrategyName)?.KLine || "1m"} Kline Stream</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                                        {strategies.find((e) => e.name === selectedBot.StrategyName)?.description || "None"}
                                    </p>
                                </div>
                            </div>

                            {/* Profile Section 3: Financials & Sage Fee Accounting */}
                            <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-4">
                                <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
                                    <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <div>
                                        <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                                            Financial Performance & Sage Fee Ledger
                                        </h3>
                                        <p className="text-[11px] text-zinc-500 font-mono">
                                            User wallet balances, lifetime realized PnL, and platform 20% performance fees
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                                    <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Lifetime Realized PnL</span>
                                        <span
                                            className={`text-lg font-bold ${(userProfitStats?.totalRealizedProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                }`}
                                        >
                                            {(userProfitStats?.totalRealizedProfit || 0) >= 0 ? '+' : ''}${userProfitStats?.totalRealizedProfit.toFixed(2)} USDT
                                        </span>
                                    </div>

                                    <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Unpaid Sage Fee ({SAGE_FEE_PERCENTAGE}%)</span>
                                        <span className="text-lg font-bold text-blue-400">
                                            {formatCurrency(selectedBot.UnpaidFee)} USDT
                                        </span>
                                    </div>

                                    <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                        <span className="text-[10px] text-zinc-500 uppercase block">Available Balance</span>
                                        <span className="text-lg font-bold text-zinc-100">
                                            {formatCurrency(heartBeats.find((e) => e.BotID === selectedBot.BotID)?.Balance || 0)} USDT
                                        </span>
                                    </div>
                                </div>

                                {/* Active Position / State callout */}
                                <div className="p-3 bg-[#09090b] border border-[#27272a] rounded flex items-center justify-between text-xs font-mono">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-purple-400 shrink-0" />
                                        <span className="text-zinc-400">Active Position State:</span>
                                        <span className="font-bold text-zinc-200">{heartBeats.find((e) => e.BotID === selectedBot.BotID)?.ActiveTrade?.side || 'No open position'}</span>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/inspect/${selectedBot.BotID}`)}
                                        className="text-purple-400 hover:text-purple-300 underline text-[11px] shrink-0"
                                    >
                                        View Terminal →
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* Bot Fleet Action Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmationModal.onConfirm}
                title={confirmationModal.title}
                message={confirmationModal.message}
                description={confirmationModal.description}
                confirmText={confirmationModal.confirmText}
                cancelText={confirmationModal.cancelText}
                variant={confirmationModal.variant}
                isLoading={confirmationModal.isLoading}
                details={confirmationModal.details}
            />

            <Footer />
        </div>
    )
}

export default Fleet