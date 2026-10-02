"use client"
import { IUserInfoRuntime } from '@/interfaces';
import { ITransaction } from '@/schema/transactions';
import Footer from '@/section/Footer';
import { formatCurrency } from '@/utils';
import { ArrowLeft, ArrowUpRight, Bot, CalendarDays, Check, CheckCircle2, Clock, Copy, DollarSign, Download, Filter, Receipt, RefreshCw, ShieldCheck, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react'

export interface FeesPageProps {
    BotID: string;
}

const FeesPage = ({BotID}: FeesPageProps) => {
    const [User, setUser] = useState<IUserInfoRuntime | null>(null);
    const [activePreset, setActivePreset] = useState<string>('7days');
    const [searchFilter, setSearchFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<ITransaction[]>([]);
    const [copiedTxid, setCopiedTxid] = useState<string | null>(null);

    const router = useRouter();

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const sevenDaysAgoStr = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    }, []);

    const [targetDates, setTargetDates] = useState({
        from: sevenDaysAgoStr,
        to: todayStr
    });

    const filteredList = useMemo(() => {
        if (!searchFilter.trim()) return transactions;
        const term = searchFilter.toLowerCase();
        return transactions.filter(
            (tx) =>
                tx.TXID.toLowerCase().includes(term) ||
                (tx.Description && tx.Description.toLowerCase().includes(term))
        );
    }, [transactions, searchFilter]);

    const stats = useMemo(() => {
        const count = filteredList.length;
        const totalAmount = filteredList.reduce((acc, curr) => acc + (curr.Amount || 0), 0);
        const avgAmount = count > 0 ? totalAmount / count : 0;
        const maxSingleFee = filteredList.reduce((max, curr) => Math.max(max, curr.Amount || 0), 0);

        return {
            count,
            totalAmount,
            avgAmount,
            maxSingleFee,
        };
    }, [filteredList]);



    const handleSetPreset = (preset: string) => {
        // Logic to set the date filter preset
    }

    const handleApplyFilter = (e: React.FormEvent) => {
        e.preventDefault();
    }

    const handleExportCSV = () => {
        if (filteredList.length === 0) return;
        const headers = ['BotID', 'TXID', 'Amount_USDT', 'Timestamp', 'Status', 'Notes'];
        const rows = filteredList.map((tx) => [
            tx.BotID,
            tx.TXID,
            tx.Amount.toFixed(2),
            typeof tx.Timestamp === 'string' ? tx.Timestamp : new Date(tx.Timestamp).toISOString(),
            tx.Status || 'confirmed',
            `"${(tx.Description || '').replace(/"/g, '""')}"`,
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Sage_Fees_Paid_${User?.BotID}_${targetDates.from || 'all'}_to_${targetDates.to || 'all'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const handleCopy = (id: string, text: string) => {
        if (!text) return;
        navigator.clipboard?.writeText(text);
        setCopiedTxid(id);
        setTimeout(() => setCopiedTxid(null), 2000);
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
            {/* Top Header Bar */}
            <header className="sticky top-0 z-30 bg-[#0c0c0e]/95 backdrop-blur border-b border-[#27272a] px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded bg-zinc-900 border border-[#27272a] hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center gap-1.5 text-xs font-mono shrink-0"
                        title="Return to Dashboard"
                    >
                        <ArrowLeft className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">Dashboard</span>
                    </button>

                    <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded bg-blue-950/80 border border-blue-700/80 flex items-center justify-center font-bold text-blue-400 text-xs shadow-md shrink-0">
                            <Receipt className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xs sm:text-sm font-semibold tracking-tight text-white font-mono truncate">
                                    Service Fees Paid Ledger
                                </h1>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800 shrink-0">
                                    AUTO-PAY SETTLEMENTS
                                </span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono hidden md:block">
                                On-chain auto-deductions made by bot ({User?.BotID}) to settle performance fees
                            </p>
                        </div>
                    </div>
                </div>


            </header>

            {/* Main Container */}
            <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-4 sm:space-y-6">
                {/* Date Filter & Control Toolbar */}
                <section className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 sm:p-5 shadow-sm space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#27272a]">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-blue-400 shrink-0" />
                            <div>
                                <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                                    Transaction Date Filter & Presets
                                </h2>
                                <p className="text-[11px] text-zinc-500 font-mono">
                                    Default view shows fees paid in the last 7 days. Select presets or enter custom calendar boundaries.
                                </p>
                            </div>
                        </div>

                        {/* Date Preset Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto">
                            <button
                                type="button"
                                onClick={() => handleSetPreset('7days')}
                                className={`px-3 py-1 rounded text-xs font-mono transition-colors border ${activePreset === '7days'
                                    ? 'bg-amber-600 text-white font-semibold border-amber-500 shadow-sm'
                                    : 'bg-[#09090b] text-zinc-400 hover:text-zinc-200 border-[#27272a]'
                                    }`}
                            >
                                Last 7 Days (Default)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSetPreset('today')}
                                className={`px-3 py-1 rounded text-xs font-mono transition-colors border ${activePreset === 'today'
                                    ? 'bg-blue-600 text-white font-semibold border-blue-500 shadow-sm'
                                    : 'bg-[#09090b] text-zinc-400 hover:text-zinc-200 border-[#27272a]'
                                    }`}
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSetPreset('30days')}
                                className={`px-3 py-1 rounded text-xs font-mono transition-colors border ${activePreset === '30days'
                                    ? 'bg-blue-600 text-white font-semibold border-blue-500 shadow-sm'
                                    : 'bg-[#09090b] text-zinc-400 hover:text-zinc-200 border-[#27272a]'
                                    }`}
                            >
                                Last 30 Days
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSetPreset('all')}
                                className={`px-3 py-1 rounded text-xs font-mono transition-colors border ${activePreset === 'all'
                                    ? 'bg-blue-600 text-white font-semibold border-blue-500 shadow-sm'
                                    : 'bg-[#09090b] text-zinc-400 hover:text-zinc-200 border-[#27272a]'
                                    }`}
                            >
                                All Time
                            </button>
                        </div>
                    </div>

                    {/* Date Picker Form & Search Bar */}
                    <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                        <div className="lg:col-span-3 space-y-1.5">
                            <label className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-zinc-500" />
                                <span>From Date (00:00:00 UTC)</span>
                            </label>
                            <input
                                type="date"
                                value={targetDates.from}
                                onChange={(e) => {
                                    setTargetDates({ ...targetDates, from: e.target.value });
                                    setActivePreset('all');
                                }}
                                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded px-3 py-2 text-xs font-mono text-zinc-200 outline-none cursor-pointer"
                            />
                        </div>

                        <div className="lg:col-span-3 space-y-1.5">
                            <label className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-zinc-500" />
                                <span>To Date (23:59:59 UTC)</span>
                            </label>
                            <input
                                type="date"
                                value={targetDates.to}
                                onChange={(e) => {
                                    setTargetDates({ ...targetDates, to: e.target.value });
                                    setActivePreset('all');
                                }}
                                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded px-3 py-2 text-xs font-mono text-zinc-200 outline-none cursor-pointer"
                            />
                        </div>

                        <div className="lg:col-span-4 space-y-1.5">
                            <label className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                                <span>Filter by TXID or Note Description</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Search 0x... or keywords"
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded px-3 py-2 text-xs font-mono text-zinc-200 outline-none"
                            />
                        </div>

                        <div className="lg:col-span-2 flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <Filter className="w-3.5 h-3.5" />
                                <span>Apply Filter</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleExportCSV}
                                disabled={filteredList.length === 0}
                                className="p-2 rounded bg-zinc-900 border border-[#27272a] hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors disabled:opacity-40"
                                title="Export Filtered CSV"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </section>

                {/* Aggregate Metrics KPI Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Total Fees Paid in Selected Period */}
                    <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 space-y-1 relative overflow-hidden">
                        <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
                            <span className="uppercase tracking-wider">Fees Paid in Window</span>
                            <DollarSign className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
                            {formatCurrency(stats.totalAmount, 2)} USDT
                        </div>
                        <p className="text-[11px] text-zinc-500 font-mono">
                            Across {stats.count} automatic fee payments
                        </p>
                    </div>

                    {/* Average Settlement Amount */}
                    <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 space-y-1">
                        <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
                            <span className="uppercase tracking-wider">Average Settlement</span>
                            <Clock className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
                            {formatCurrency(stats.avgAmount, 2)} USDT
                        </div>
                        <p className="text-[11px] text-zinc-500 font-mono">
                            Per reconciliation cycle
                        </p>
                    </div>

                    {/* Highest Single Fee Deduction */}
                    <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 space-y-1">
                        <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
                            <span className="uppercase tracking-wider">Peak Single Fee</span>
                            <ArrowUpRight className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-purple-300">
                            {formatCurrency(stats.maxSingleFee, 2)} USDT
                        </div>
                        <p className="text-[11px] text-zinc-500 font-mono">
                            Highest fee amount paid in a single settlement
                        </p>
                    </div>

                    {/* Unpaid Fee Balance */}
                    <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 space-y-1">
                        <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
                            <span className="uppercase tracking-wider">Unpaid Fee Balance</span>
                            <Wallet className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                            {formatCurrency(User?.UnpaidFee ?? User?.UnpaidFee ?? 0, 2)} USDT
                        </div>
                        <p className="text-[11px] text-zinc-500 font-mono">
                            {(User?.UnpaidFee ?? User?.UnpaidFee ?? 0) > 0
                                ? 'Pending next automated bot deduction'
                                : 'All service fee payments up to date'}
                        </p>
                    </div>
                </section>

                {/* Transactions Table & Audit Log */}
                <section className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-amber-400 shrink-0" />
                                <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                                    Itemized Service Fee Payment Transactions
                                </h3>
                            </div>
                            {/* <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                                Exact Mongoose schema record: <code className="text-zinc-400 font-mono">_id</code>, <code className="text-zinc-400 font-mono">BotID</code>, <code className="text-zinc-400 font-mono">TXID</code>, <code className="text-zinc-400 font-mono">Amount</code>, <code className="text-zinc-400 font-mono">Timestamp</code>
                            </p> */}
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-zinc-400">
                                Displaying: <strong className="text-white">{filteredList.length}</strong> settlements
                            </span>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                        <table className="w-full text-left text-xs font-mono min-w-[880px]">
                            <thead>
                                <tr className="border-b border-[#27272a] text-zinc-500 text-[11px] uppercase">
                                    <th className="py-2.5 px-3">Timestamp (UTC)</th>
                                    <th className="py-2.5 px-3">Bot ID</th>
                                    <th className="py-2.5 px-3">Transaction Hash (TXID)</th>
                                    <th className="py-2.5 px-3 text-right">Fee Paid (USDT)</th>
                                    <th className="py-2.5 px-3">Settlement Status</th>
                                    {/* <th className="py-2.5 px-3">Network / Channel</th> */}
                                    <th className="py-2.5 px-3">Reconciliation Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#27272a]/60">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono">
                                            <div className="flex items-center justify-center gap-2">
                                                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                                                <span>Loading fee transaction ledger...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono space-y-2">
                                            <Receipt className="w-8 h-8 text-zinc-600 mx-auto" />
                                            <p className="text-zinc-300 font-semibold text-sm">No Fee Payments Recorded in Selected Window</p>
                                            <p className="text-zinc-500 text-xs max-w-md mx-auto">
                                                No service fees were deducted between {targetDates.from || 'beginning of records'} and {targetDates.to || 'now'}. Switch presets to view all time or check closed trade profits.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => handleSetPreset('all')}
                                                className="mt-2 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-xs font-mono text-zinc-300"
                                            >
                                                View All-Time Fee History
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredList.map((tx) => {
                                        const formattedDate = tx.Timestamp
                                            ? new Date(tx.Timestamp).toLocaleString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                timeZone: 'UTC',
                                            })
                                            : 'N/A';

                                        return (
                                            <tr key={tx.TXID} className="hover:bg-zinc-900/50 transition-colors">
                                                {/* Timestamp */}
                                                <td className="py-3 px-3 text-zinc-300 text-[11px] whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3 text-zinc-500" />
                                                        <span>{formattedDate} UTC</span>
                                                    </div>
                                                    {/* <span className="text-[9.5px] text-zinc-500 font-mono block">
                                                        MongoDB _id: {tx._id}
                                                    </span> */}
                                                </td>

                                                {/* BotID */}
                                                <td className="py-3 px-3">
                                                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-semibold text-[11px] inline-flex items-center gap-1">
                                                        <Bot className="w-3 h-3 text-purple-400" />
                                                        <span>{tx.BotID}</span>
                                                    </span>
                                                </td>

                                                {/* TXID with Copy */}
                                                <td className="py-3 px-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-blue-400 hover:text-blue-300 text-[11px] max-w-[180px] sm:max-w-[220px] truncate" title={tx.TXID}>
                                                            {tx.TXID}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(tx.TXID, tx.TXID)}
                                                            className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors"
                                                            title="Copy Transaction Hash"
                                                        >
                                                            {copiedTxid === tx.TXID ? (
                                                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Amount */}
                                                <td className="py-3 px-3 text-right">
                                                    <span className="font-bold text-amber-400 text-sm">
                                                        {formatCurrency(tx.Amount, 2)}
                                                    </span>
                                                    <span className="text-[9.5px] text-zinc-500 block">USDT</span>
                                                </td>

                                                {/* Settlement Status */}
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <span className="px-2 py-0.5 rounded border text-[10px] font-bold uppercase inline-flex items-center gap-1 bg-emerald-950/60 text-emerald-400 border-emerald-800">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span>{tx.Status || 'Confirmed'}</span>
                                                    </span>
                                                </td>

                                                {/* Network */}
                                                {/* <td className="py-3 px-3 text-zinc-400 text-[11px] whitespace-nowrap">
                                                    <span>{tx.network || 'BNB Smart Chain (BEP20)'}</span>
                                                </td> */}

                                                {/* Notes / Reason */}
                                                <td className="py-3 px-3 text-zinc-300 text-[11px] max-w-[260px] truncate" title={tx.Description || 'Automated performance fee deduction'}>
                                                    {tx.Description || 'Automated performance fee deduction'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Notice */}
                    <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>
                                Fees are automatically audited and executed via on-chain smart reconciliation when profitable trades close.
                            </span>
                        </div>
                        <div className="text-zinc-400">
                            Showing {filteredList.length} of {transactions.length} total entries
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}

export default FeesPage