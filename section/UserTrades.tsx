"use client"
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Calendar, Download, Filter, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { Direction, IUserInfoRuntime, TradeMetrics } from '@/interfaces';
import { ITrades } from '@/schema/trades';
import { formatCurrency } from '@/utils';
import Footer from './Footer';
import { getUserTrades } from '@/app/actions/trades.actions';

export interface UserTradesProps {
    targetUser: IUserInfoRuntime | null
}

const Trades = ({ targetUser }: UserTradesProps) => {
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const [userTrades, setUserTrades] = useState<ITrades[]>([]);
    const [activePreset, setActivePreset] = useState<'today' | 'yesterday' | '7days' | 'all'>("today");
    const [loading, setLoading] = useState(false);
    const [targetDates, setTargetDates] = useState({
        fromDate: todayStr,
        toDate: todayStr
    });

    const router = useRouter();

    const metrics = useMemo<TradeMetrics>(() => {
        if (userTrades.length === 0)
            return {
                totalCommission: 0,
                totalGrossProfit: 0,
                totalNetProfit: 0,
                winRate: 0,
                totalFees: 0
            }

        return {
            totalCommission: 0,
            totalGrossProfit: 0,
            totalNetProfit: 0,
            winRate: 0,
            totalFees: 0
        }
    }, [userTrades])

    const handleExportCsv = () => {
        if (userTrades.length === 0) return;
        const headers = [
            'Date & Time',
            'Symbol',
            'Side',
            'Entry Price',
            'Quantity',
            'Notional',
            'Gross Realized PnL',
            'Service Fee',
            'Binance Commission',
            'Net Profit',
            'Exit Reason',
        ];
        const rows = userTrades.map((t) => [
            t.closeTime ? new Date(t.closeTime).toISOString() : '',
            t.symbol,
            (t.side === Direction.Long) ? 'LONG' : 'SHORT',
            t.entryPrice,
            t.quantity,
            t.notional,
            t.realizedProfit,
            t.serviceFee,
            t.commission,
            t.realizedProfit,
            `"${t.Reason || 'Exit'}"`,
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `sage_trades_${targetDates.fromDate || 'all'}_to_${targetDates.toDate || 'all'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSetPreset = (preset: 'today' | 'yesterday' | '7days' | 'all') => {
        const now = new Date();
        let from = todayStr;
        let to = todayStr;

        if (preset === 'today') {
            from = todayStr;
            to = todayStr;
        } else if (preset === 'yesterday') {
            const yest = new Date(now.getTime() - 86400000);
            from = yest.toISOString().split('T')[0];
            to = from;
        } else if (preset === '7days') {
            const past = new Date(now.getTime() - 7 * 86400000);
            from = past.toISOString().split('T')[0];
            to = todayStr;
        } else if (preset === 'all') {
            from = '';
            to = '';
        }

        setTargetDates({
            fromDate: from,
            toDate: to
        });
        setActivePreset(preset);
    }

    useEffect(() => {
        fetchTrades();
    }, [activePreset])

    const fetchTrades = async () => {
        setLoading(true);
        const _trades = await getUserTrades(targetUser?.BotID || "", targetDates);
        setUserTrades(_trades);
        setLoading(false);
    }

    const handleApplyFilter = (e?: React.FormEvent) => {
        e?.preventDefault();
        fetchTrades();
    }

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTargetDates({
            ...targetDates,
            [e.target.name]: e.target.value
        })
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
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <h1 className="text-xs sm:text-sm font-semibold text-white tracking-tight truncate">Date-Range Trade History</h1>
                            <span className="text-[9px] sm:text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-blue-950/60 text-blue-400 border border-blue-800 shrink-0">
                                P&L Audit
                            </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-zinc-500 font-mono truncate">
                            Binance Futures closed positions for {targetUser?.BotID}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleExportCsv}
                        disabled={userTrades.length === 0}
                        className="flex cursor-pointer items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded bg-zinc-900 border border-[#27272a] hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-mono transition-colors disabled:opacity-40"
                        title="Download CSV report"
                    >
                        <Download className="w-3.5 h-3.5 text-blue-400" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-4 sm:space-y-6">
                {/* Date Filter Controls Card */}
                <section className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 sm:p-5 shadow-sm space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                                Select Date Window
                            </h2>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                            <span className="text-zinc-500 text-[11px] mr-1 hidden sm:inline">Presets:</span>
                            <button
                                type="button"
                                onClick={() => handleSetPreset('today')}
                                className={`px-2.5 py-1 rounded text-xs border transition-colors ${activePreset === 'today'
                                    ? 'bg-blue-600 text-white border-blue-500'
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                                    }`}
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSetPreset('yesterday')}
                                className={`px-2.5 py-1 rounded text-xs border transition-colors ${activePreset === 'yesterday'
                                    ? 'bg-blue-600 text-white border-blue-500'
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                                    }`}
                            >
                                Yesterday
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSetPreset('7days')}
                                className={`px-2.5 py-1 rounded text-xs border transition-colors ${activePreset === '7days'
                                    ? 'bg-blue-600 text-white border-blue-500'
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                                    }`}
                            >
                                Last 7 Days
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSetPreset('all')}
                                className={`px-2.5 py-1 rounded text-xs border transition-colors ${activePreset === 'all'
                                    ? 'bg-blue-600 text-white border-blue-500'
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                                    }`}
                            >
                                All History
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleApplyFilter} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-1">
                        {/* From Date */}
                        <div className="space-y-1.5 flex-1">
                            <label className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                                <span>From Date</span>
                                <span className="text-[10px] text-zinc-500 font-mono">(YYYY-MM-DD)</span>
                            </label>
                            <input
                                type="date"
                                name='fromDate'
                                value={targetDates.fromDate}
                                onChange={handleDateChange}
                                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded px-3 py-2 text-xs font-mono text-zinc-200 outline-none"
                            />
                        </div>

                        {/* To Date */}
                        <div className="space-y-1.5 flex-1">
                            <label className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                                <span>To Date</span>
                                <span className="text-[10px] text-zinc-500 font-mono">(YYYY-MM-DD)</span>
                            </label>
                            <input
                                type="date"
                                name='toDate'
                                value={targetDates.toDate}
                                onChange={handleDateChange}
                                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded px-3 py-2 text-xs font-mono text-zinc-200 outline-none"
                            />
                        </div>

                        {/* Submit Filter Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold tracking-wide transition-all shadow-sm shrink-0"
                        >
                            {loading ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Filter className="w-3.5 h-3.5" />
                            )}
                            <span>Apply Filter</span>
                        </button>
                    </form>
                </section>

                {/* Date Window Metrics Overview Cards */}
                <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
                    {/* Total Trades */}
                    <div className="bg-[#121214] border border-[#27272a] p-3 sm:p-3.5 rounded-lg space-y-1">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 block">Total Closed Trades</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-base sm:text-lg font-mono font-bold text-white">{userTrades.length}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">Market Trades</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">
                            Win Rate: <strong className="text-zinc-300">{metrics.winRate.toFixed(1)}%</strong>
                        </span>
                    </div>

                    {/* Gross Realized Profit */}
                    <div className="bg-[#121214] border border-[#27272a] p-3 sm:p-3.5 rounded-lg space-y-1">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 block">Gross Realized PnL</span>
                        <span
                            className={`text-base sm:text-lg font-mono font-bold block ${metrics.totalGrossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                        >
                            {metrics.totalGrossProfit >= 0 ? '+' : ''}${formatCurrency(metrics.totalGrossProfit, 2)}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">Before exchange & fees</span>
                    </div>

                    {/* Service Fee */}
                    <div className="bg-[#121214] border border-[#27272a] p-3 sm:p-3.5 rounded-lg space-y-1">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 block">Sage Service Fee</span>
                        <span className="text-base sm:text-lg font-mono font-bold text-amber-400 block">
                            ${formatCurrency(metrics.totalFees, 2)}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">Computing Commission</span>
                    </div>

                    {/* Binance Commission */}
                    <div className="bg-[#121214] border border-[#27272a] p-3 sm:p-3.5 rounded-lg space-y-1">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 block">Binance Commission</span>
                        <span className="text-base sm:text-lg font-mono font-bold text-blue-400 block">
                            ${formatCurrency(metrics.totalCommission, 2)}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">Exchange fees</span>
                    </div>

                    {/* Net Profit */}
                    <div className="bg-[#121214] border border-[#27272a] p-3 sm:p-3.5 rounded-lg space-y-1 col-span-2 sm:col-span-2 lg:col-span-2 bg-gradient-to-r from-[#121214] to-zinc-900/60">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase text-zinc-400 block">Net Profit (Take-Home)</span>
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                Gross - Fees - Comm
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {metrics.totalNetProfit >= 0 ? (
                                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                            ) : (
                                <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                            )}
                            <span
                                className={`text-lg sm:text-xl font-mono font-bold ${metrics.totalNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                            >
                                {metrics.totalNetProfit >= 0 ? '+' : ''}${formatCurrency(metrics.totalNetProfit, 2)} USDT
                            </span>
                        </div>
                        <span className="text-[10px] sm:text-[10.5px] font-mono text-zinc-500">
                            Clean bottom-line realized profit for selected timeframe
                        </span>
                    </div>
                </section>

                {/* Detailed Trades Table */}
                <section className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between mb-4 border-b border-[#27272a] pb-2.5 gap-2">
                        <div>
                            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                                Executed Trades Ledger
                            </h3>
                            <p className="text-[11px] text-zinc-500 font-mono">
                                Itemized view with separated Service Fee, Binance Commission, and Net Profit
                            </p>
                        </div>
                        <span className="text-xs font-mono text-zinc-500">
                            Matches Found: <strong className="text-zinc-200">{userTrades.length}</strong>
                        </span>
                    </div>

                    <div className="overflow-x-auto -mx-3.5 sm:mx-0 px-3.5 sm:px-0">
                        <table className="w-full text-left text-xs font-mono min-w-[780px]">
                            <thead>
                                <tr className="border-b border-[#27272a] text-zinc-500 text-[11px] uppercase">
                                    <th className="py-2.5 px-3">Date / Time</th>
                                    <th className="py-2.5 px-3">Symbol</th>
                                    <th className="py-2.5 px-3">Side</th>
                                    <th className="py-2.5 px-3 text-right">Entry Price</th>
                                    <th className="py-2.5 px-3 text-right">Qty</th>
                                    <th className="py-2.5 px-3 text-right">Gross PnL</th>
                                    <th className="py-2.5 px-3 text-right text-amber-400">Fee (Service)</th>
                                    <th className="py-2.5 px-3 text-right text-blue-400">Commission (Binance)</th>
                                    <th className="py-2.5 px-3 text-right text-emerald-400">Net Profit</th>
                                    <th className="py-2.5 px-3">Exit Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#27272a]/60">
                                {userTrades.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-8 text-center text-zinc-500 font-mono space-y-1">
                                            <p className="text-zinc-400 font-semibold">No trade executions found for this date range.</p>
                                            <p className="text-[11px] text-zinc-600">
                                                Try selecting another date, or click &quot;All History&quot; to review previous records.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    userTrades.map((t) => {
                                        const isLong = t.side === Direction.Long;
                                        const gross = t.realizedProfit ?? 0;
                                        const fee = t.serviceFee ?? (gross > 0 ? gross * 0.20 : 0);
                                        const comm = t.commission ?? 0;
                                        const net = (t.realizedProfit - fee) || (gross - fee - comm);
                                        const isNetPositive = net >= 0;

                                        const formattedDate = t.Timestamp
                                            ? new Date(t.Timestamp).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                            })
                                            : 'N/A';

                                        return (
                                            <tr key={t.uid + t.orderId} className="hover:bg-zinc-900/50 transition-colors">
                                                <td className="py-3 px-3 text-zinc-400 text-[11px] whitespace-nowrap">{formattedDate}</td>
                                                <td className="py-3 px-3 font-semibold text-white">{t.symbol}</td>
                                                <td className="py-3 px-3">
                                                    <span
                                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${isLong
                                                            ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                                                            : 'text-rose-400 bg-rose-950/60 border-rose-800'
                                                            }`}
                                                    >
                                                        {isLong ? 'LONG' : 'SHORT'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right text-zinc-300 font-mono">
                                                    ${formatCurrency(t.entryPrice, 2)}
                                                </td>
                                                <td className="py-3 px-3 text-right text-zinc-400 font-mono">
                                                    {t.quantity}
                                                </td>
                                                <td className="py-3 px-3 text-right font-semibold font-mono">
                                                    <span className={gross >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                        {gross >= 0 ? '+' : ''}${formatCurrency(gross, 2)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right text-amber-400 font-mono">
                                                    ${formatCurrency(fee, 2)}
                                                </td>
                                                <td className="py-3 px-3 text-right text-blue-400 font-mono">
                                                    ${formatCurrency(comm, 2)}
                                                </td>
                                                <td className="py-3 px-3 text-right font-bold font-mono">
                                                    <span className={isNetPositive ? 'text-emerald-400' : 'text-rose-400'}>
                                                        {isNetPositive ? '+' : ''}${formatCurrency(net, 2)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                                        {t.Reason || 'Strategy Exit'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}

export default Trades