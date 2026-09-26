"use client"
import ConfirmationModal from '@/components/ConfirmationModal';
import { IUserInfoRuntime } from '@/interfaces';
import Footer from '@/section/Footer';
import { Activity, ArrowLeft, CheckCircle2, ChevronRight, DollarSign, ExternalLink, Key, Layers, Power, RefreshCw, ShieldCheck, Sliders, Sparkles, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'

const Fleet = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [fleetData, setFleetData] = useState<IUserInfoRuntime[]>([]);
    const router = useRouter();

    const fetchFleet = () => {

    }
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
                            <span className={`text-xl sm:text-2xl font-bold font-mono ${fleetStats.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {fleetStats.totalPnL >= 0 ? '+' : ''}${fleetStats.totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">USDT</span>
                        </div>
                    </div>

                    <div className="bg-[#121214] border border-[#27272a] rounded-lg p-3 sm:p-4 space-y-1">
                        <span className="text-[10.5px] font-mono uppercase text-zinc-400">Unpaid Sage Fees (20%)</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-xl sm:text-2xl font-bold font-mono text-blue-400">
                                ${fleetStats.totalUnpaidFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] font-mono text-blue-500/80">Accrued</span>
                        </div>
                    </div>

                    <div className="bg-[#121214] border border-[#27272a] rounded-lg p-3 sm:p-4 space-y-1 col-span-2 lg:col-span-1">
                        <span className="text-[10.5px] font-mono uppercase text-zinc-400">Total Capital Under Mgmt</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-200">
                                ${fleetStats.totalCapital.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[11px] font-mono text-emerald-400/90">{fleetStats.avgWinRate.toFixed(1)}% Win</span>
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
                                    All Deployed Bots ({filteredFleet.length})
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
                                    { key: 'active', label: 'Active' },
                                    { key: 'halted', label: 'Halted' },
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
                                    const isSelected = item.user.BotID === selectedBot.user.BotID;
                                    const isHalted = item.user.IsHalted;

                                    return (
                                        <div
                                            key={item.user.BotID}
                                            onClick={() => setSelectedBotID(item.user.BotID)}
                                            className={`p-3 rounded-lg border transition-all cursor-pointer text-xs font-mono relative ${isSelected
                                                ? 'bg-[#18181b] border-purple-500 shadow-md ring-1 ring-purple-500/30'
                                                : 'bg-[#09090b] border-[#27272a] hover:border-zinc-700 hover:bg-[#121214]'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-zinc-100 flex items-center gap-1.5">
                                                            {item.user.BotID}
                                                        </span>
                                                        <span
                                                            className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-bold border ${item.user.Demo
                                                                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                                                                : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                                                                }`}
                                                        >
                                                            {item.user.Demo ? 'Demo' : 'Live'}
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
                                                        {item.user.Name}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-500 truncate">
                                                        {item.user.Email}
                                                    </p>
                                                </div>

                                                {/* Right: PnL and Pair */}
                                                <div className="text-right shrink-0 space-y-1">
                                                    <div
                                                        className={`font-bold text-xs ${item.user.PNL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                            }`}
                                                    >
                                                        {item.user.PNL >= 0 ? '+' : ''}${item.user.PNL.toFixed(2)}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 inline-block">
                                                        {item.user.Symbol} {item.user.Leverage}x
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer info in bot card */}
                                            <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10.5px] text-zinc-400">
                                                <span className="truncate max-w-[180px] text-zinc-400">
                                                    {item.user.StrategyName}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-zinc-500">
                                                    <span>${item.balance.toLocaleString()}</span>
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
                    <section className="lg:col-span-7 space-y-4">
                        {/* Operator Header Card */}
                        <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-4 shadow-lg">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-900 to-zinc-900 border border-purple-500/60 flex items-center justify-center text-lg font-bold text-purple-200 shadow-inner">
                                        {selectedBot.user.Name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-base font-semibold text-white font-mono">
                                                {selectedBot.user.Name}
                                            </h2>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-800/80">
                                                {selectedBot.role || selectedBot.user.Role || 'Operator'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-400 font-mono">
                                            {selectedBot.user.Email} • Bot ID: <span className="text-zinc-200 font-bold">{selectedBot.user.BotID}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Primary Super User Action: Inspect in Dashboard */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleInspectInDashboard(selectedBot)}
                                        className="flex-1 sm:flex-none px-3.5 py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/30 transition-colors"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        <span>Inspect in Dashboard</span>
                                    </button>

                                    <button
                                        onClick={() => handleToggleHalt(selectedBot.user.BotID)}
                                        className={`px-3 py-2 rounded-md border font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors ${selectedBot.user.IsHalted
                                            ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300 hover:bg-emerald-900/80'
                                            : 'bg-rose-950/70 border-rose-700 text-rose-300 hover:bg-rose-900/80'
                                            }`}
                                    >
                                        <Power className="w-3.5 h-3.5" />
                                        <span>{selectedBot.user.IsHalted ? 'Resume' : 'Halt'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Sub-header meta bar */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                                <div className="bg-[#09090b] border border-[#27272a] p-2.5 rounded">
                                    <span className="text-[10px] text-zinc-500 uppercase block">Account Created</span>
                                    <span className="text-zinc-300 font-medium">{selectedBot.joinedDate}</span>
                                </div>
                                <div className="bg-[#09090b] border border-[#27272a] p-2.5 rounded">
                                    <span className="text-[10px] text-zinc-500 uppercase block">Engine Heartbeat</span>
                                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        {selectedBot.lastHeartbeat}
                                    </span>
                                </div>
                                <div className="bg-[#09090b] border border-[#27272a] p-2.5 rounded">
                                    <span className="text-[10px] text-zinc-500 uppercase block">Total Orders</span>
                                    <span className="text-zinc-300 font-medium">{selectedBot.totalTrades} Executed</span>
                                </div>
                                <div className="bg-[#09090b] border border-[#27272a] p-2.5 rounded">
                                    <span className="text-[10px] text-zinc-500 uppercase block">Win Rate</span>
                                    <span className="text-purple-400 font-medium">{selectedBot.winRate}% Profitable</span>
                                </div>
                            </div>
                        </div>

                        {/* Profile Section 1: Binance API Credentials & Signature Status */}
                        <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-4">
                            <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
                                <Key className="w-4 h-4 text-blue-400 shrink-0" />
                                <div>
                                    <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                                        Binance API Connection & Authentication
                                    </h3>
                                    <p className="text-[11px] text-zinc-500 font-mono">
                                        Cryptographic credentials and exchange permissions assigned to this bot
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                                <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                    <span className="text-[10px] text-zinc-500 uppercase block">API Key (Masked)</span>
                                    <div className="flex items-center justify-between text-zinc-300">
                                        <span className="truncate max-w-[200px]">{selectedBot.user.ApiKey || 'None configured'}</span>
                                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                                            HMAC Valid
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                    <span className="text-[10px] text-zinc-500 uppercase block">API Secret Signature</span>
                                    <div className="flex items-center justify-between text-zinc-300">
                                        <span>••••••••••••••••••••••••••••••••</span>
                                        <span className="text-[10px] text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800">
                                            SHA-256
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 text-[10.5px] font-mono">
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
                                    <span className="text-sm font-bold text-white">{selectedBot.user.Symbol}</span>
                                </div>

                                <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                    <span className="text-[10px] text-zinc-500 uppercase block">Leverage Bracket</span>
                                    <span className="text-sm font-bold text-blue-400">{selectedBot.user.Leverage}x Isolated</span>
                                </div>

                                <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                    <span className="text-[10px] text-zinc-500 uppercase block">Execution Mode</span>
                                    <span className={`text-sm font-bold ${selectedBot.user.Demo ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        {selectedBot.user.Demo ? 'DEMO PAPER' : 'LIVE CAPITAL'}
                                    </span>
                                </div>

                                <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                    <span className="text-[10px] text-zinc-500 uppercase block">Liquidation Guard</span>
                                    <span className={`text-sm font-bold ${selectedBot.user.AvoidLiquidation ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                        {selectedBot.user.AvoidLiquidation ? 'ENABLED (90%)' : 'DISABLED'}
                                    </span>
                                </div>
                            </div>

                            {/* Strategy Details Box */}
                            <div className="p-3.5 bg-[#09090b] border border-[#27272a] rounded space-y-2 text-xs font-mono">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                                        Strategy Profile: <span className="text-zinc-100 font-bold">{selectedBot.user.StrategyName}</span>
                                    </span>
                                    <span className="text-[10px] text-zinc-500">1m Kline Stream</span>
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-relaxed">
                                    {selectedBot.user.StrategyName === 'EMA-RSI Momentum Scout' &&
                                        'Identifies dynamic trend alignment using fast (9) and slow (21) exponential moving averages paired with RSI momentum confirmation (oversold <30, overbought >70).'}
                                    {selectedBot.user.StrategyName === 'Breakout Momentum Alpha' &&
                                        'Trades 20-period volatility channel expansion with volume-spike confirmation for aggressive directional continuations.'}
                                    {selectedBot.user.StrategyName === 'Volatility Mean-Reversion' &&
                                        'Fades standard deviation extremes on Bollinger Bands with ATR-based trailing stop and strict take-profit scalps.'}
                                    {selectedBot.user.StrategyName === 'MACD Divergence Hunter' &&
                                        'Monitors histogram divergence between price action and momentum oscillator to anticipate institutional pivot points.'}
                                    {selectedBot.user.StrategyName === 'Grid Scalper Pro' &&
                                        'Deploys dense limit order matrices across high-probability sideways consolidation bands with micro-spread harvesting.'}
                                    {selectedBot.user.StrategyName === 'Trend Follower Classic' &&
                                        'Classic multi-timeframe trend capture system with defensive trailing stop loss.'}
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
                                        className={`text-lg font-bold ${selectedBot.user.PNL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                            }`}
                                    >
                                        {selectedBot.user.PNL >= 0 ? '+' : ''}${selectedBot.user.PNL.toFixed(2)} USDT
                                    </span>
                                </div>

                                <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                    <span className="text-[10px] text-zinc-500 uppercase block">Unpaid Sage Fee (20%)</span>
                                    <span className="text-lg font-bold text-blue-400">
                                        ${selectedBot.user.UnpaidFee.toFixed(2)} USDT
                                    </span>
                                </div>

                                <div className="bg-[#09090b] border border-[#27272a] p-3 rounded space-y-1">
                                    <span className="text-[10px] text-zinc-500 uppercase block">Available Balance</span>
                                    <span className="text-lg font-bold text-zinc-100">
                                        ${selectedBot.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                                    </span>
                                </div>
                            </div>

                            {/* Active Position / State callout */}
                            <div className="p-3 bg-[#09090b] border border-[#27272a] rounded flex items-center justify-between text-xs font-mono">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-purple-400 shrink-0" />
                                    <span className="text-zinc-400">Active Position State:</span>
                                    <span className="font-bold text-zinc-200">{selectedBot.activePositionSummary || 'No open position'}</span>
                                </div>
                                <button
                                    onClick={() => handleInspectInDashboard(selectedBot)}
                                    className="text-purple-400 hover:text-purple-300 underline text-[11px] shrink-0"
                                >
                                    View Terminal →
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Bot Fleet Action Confirmation Modal */}
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

export default Fleet