"use client"
import { Lock, AlertTriangle, ArrowLeft, CheckCircle2, Compass, Eye, EyeOff, Key, Radio, Scale, Shield, Sliders, DollarSign, RefreshCw, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../AuthProvider';
import Footer from '@/section/Footer';
import { Strategy } from '@/interfaces';
import { formatCurrency, IUserInfoRuntime } from '@/utils';

const Settings = () => {
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [userData, setUserData] = useState<IUserInfoRuntime | undefined>(undefined);
    const [showKey, setShowKey] = useState(false);
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | undefined>(undefined);


    const router = useRouter();
    const { user } = useAuth();


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setErrorMessage(null);
        setSaveSuccess(false);

        try {
            // const updated = await updateUserSettings(botID, {
            //     ApiKey: apiKey,
            //     ApiSecret: apiSecret,
            //     Symbol: symbol,
            //     Leverage: leverage,
            //     AvoidLiquidation: avoidLiquidation,
            //     Demo: demo,
            //     StrategyName: strategyName,
            // });

            // setUserData(updated);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to save settings to backend');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!userData) return;
        setUserData({
            ...userData,
            [e.target.name]: e.target.value
        })
    }

    const updateAvoidLiquidation = () => {
        const liquidation = userData?.AvoidLiquidation ?? false;
        setUserData({
            ...userData!,
            AvoidLiquidation: !liquidation
        })
    }

    useEffect(() => {
        if (!user) return;
        //Load user data
        //Load the strategies from backend
    }, [user])

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
            {/* Settings Header Bar */}
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
                        <h1 className="text-xs sm:text-sm font-semibold text-white tracking-tight truncate">Bot Engine Configuration</h1>
                        <p className="text-[10px] sm:text-[11px] text-zinc-500 font-mono truncate">Binance API, Strategy Logic & Risk for {userData?.BotID}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {saveSuccess && (
                        <span className="flex items-center gap-1 text-[11px] sm:text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 sm:px-2.5 py-1 rounded">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden sm:inline">Settings Updated</span>
                            <span className="sm:hidden">Saved</span>
                        </span>
                    )}
                </div>
            </header>

            {/* Main Settings Content */}
            <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-4 sm:space-y-6">
                {errorMessage && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded text-rose-300 text-xs font-mono flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
                    {/* Section 1: Binance API Configuration */}
                    <section className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 sm:p-5 space-y-4">
                        <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
                            <Key className="w-4 h-4 text-blue-400 shrink-0" />
                            <div>
                                <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                                    Binance API Configuration
                                </h2>
                                <p className="text-[11px] text-zinc-500 font-mono">
                                    HMAC SHA-256 API credentials with Futures Trading permissions
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-1">
                            {/* API Key */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-mono text-zinc-400 flex items-center justify-between">
                                    <span>API Key</span>
                                    <span className="text-[10px] text-zinc-500 font-mono">Encrypted at rest with BotID salt</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showKey ? 'text' : 'password'}
                                        name='apiKey'
                                        disabled={userData?.DecryptedKey.length! > 0}
                                        value={userData?.DecryptedKey}
                                        onChange={handleChange}
                                        placeholder="Enter 64-char Binance API Key"
                                        className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded px-3 py-2 text-xs font-mono text-zinc-200 outline-none pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                    >
                                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            {/* API Secret */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-mono text-zinc-400 flex items-center justify-between">
                                    <span>API Secret</span>
                                    <span className="text-[10px] text-zinc-500 font-mono">HMAC SHA-256 Signature signing key</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={'password'}
                                        name="apiSecret"
                                        disabled={userData?.DecryptedSecret.length! > 0}
                                        value={userData?.DecryptedSecret}
                                        onChange={handleChange}
                                        placeholder="Enter Binance Secret Key"
                                        className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded px-3 py-2 text-xs font-mono text-zinc-200 outline-none pr-10"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Risk Controls & Leverage Calibration */}
                    <section className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 sm:p-5 space-y-4">
                        <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
                            <Sliders className="w-4 h-4 text-blue-400 shrink-0" />
                            <div>
                                <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                                    Risk Controls & Leverage Calibration
                                </h2>
                                <p className="text-[11px] text-zinc-500 font-mono">
                                    Active execution pair, margin leverage bracket, and liquidation avoidance
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 sm:space-y-5">
                            {/* Symbol Selection */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-mono text-zinc-400">Target Trading Pair</label>
                                <select
                                    value={userData?.Symbol}
                                    name={"Symbol"}
                                    onChange={(e) =>
                                        setUserData({
                                            ...userData!,
                                            [e.target.name]: e.target.value
                                        })
                                    }
                                    className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded px-3 py-2 text-xs font-mono text-zinc-200 outline-none cursor-pointer"
                                >
                                    <option value="">Select symbol..</option>
                                    <option value="ETHUSDT">ETHUSDT (Ethereum Perpetual)</option>
                                    <option value="BTCUSDT">BTCUSDT (Bitcoin Perpetual)</option>
                                    <option value="SOLUSDT">SOLUSDT (Solana Perpetual)</option>
                                    <option value="BNBUSDT">BNBUSDT (BNB Perpetual)</option>
                                </select>
                            </div>

                            {/* Leverage Slider */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-mono text-zinc-400">Leverage Setting</label>
                                    <span
                                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${userData?.Leverage! > 20
                                            ? 'text-rose-400 bg-rose-950/50 border-rose-800'
                                            : 'text-blue-400 bg-blue-950/50 border-blue-800'
                                            }`}
                                    >
                                        {userData?.Leverage!}x
                                    </span>
                                </div>

                                <input
                                    type="range"
                                    min="1"
                                    max="125"
                                    step="1"
                                    name="Leverage"
                                    value={userData?.Leverage}
                                    onChange={handleChange}
                                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />

                                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                                    <span>1x</span>
                                    <span>20x</span>
                                    <span>50x</span>
                                    <span>100x</span>
                                    <span>125x</span>
                                </div>

                                {userData?.Leverage! > 20 && (
                                    <div className="p-2.5 bg-rose-950/30 border border-rose-800/60 rounded flex items-center gap-2 text-[11px] font-mono text-rose-300">
                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                        <span>
                                            High Leverage Warning: Setting leverage above 20x significantly reduces distance to liquidation
                                            and increases margin volatility.
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Avoid Liquidation Protocol Toggle */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#09090b] border border-[#27272a] rounded gap-3">
                                <div className="space-y-1 sm:pr-4">
                                    <div className="flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        <span className="text-xs font-mono font-medium text-zinc-200">
                                            Liquidation Protocol (`AvoidLiquidation`)
                                        </span>
                                    </div>
                                    <p className="text-[10.5px] sm:text-[11px] text-zinc-500 font-mono leading-relaxed">
                                        When active position reaches 90% of liquidation distance, automatically injects margin buffer from
                                        free USDT balance.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    name="AvoidLiquidation"
                                    onClick={updateAvoidLiquidation}
                                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border shrink-0 ${userData?.AvoidLiquidation
                                        ? 'bg-emerald-600 border-emerald-500'
                                        : 'bg-zinc-800 border-zinc-700'
                                        }`}
                                >
                                    <span
                                        className={`block w-4.5 h-4.5 rounded-full bg-white transition-transform ${userData?.AvoidLiquidation ? 'translate-x-5' : 'translate-x-0.5'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Execution Environment & Strategy Engine */}
                    <section className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 sm:p-5 space-y-4 sm:space-y-5">
                        <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
                            <Compass className="w-4 h-4 text-blue-400 shrink-0" />
                            <div>
                                <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                                    Execution Environment & Strategy Engine
                                </h2>
                                <p className="text-[11px] text-zinc-500 font-mono">
                                    Configure live exchange connectivity and select active quant strategy algorithms
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 sm:space-y-5 pt-1">
                            {/* Demo / Live Switch Toggle (Requested in Engine Config) */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#09090b] border border-[#27272a] rounded gap-3">
                                <div className="space-y-1 sm:pr-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Radio className={`w-3.5 h-3.5 shrink-0 ${userData?.Demo ? 'text-amber-400' : 'text-emerald-400'}`} />
                                        <span className="text-xs font-mono font-medium text-zinc-200">
                                            Execution Mode Protocol
                                        </span>
                                        <span
                                            className={`text-[9.5px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${userData?.Demo
                                                ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                                                : 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                                                }`}
                                        >
                                            {userData?.Demo ? 'DEMO MODE' : 'LIVE TRADING'}
                                        </span>
                                    </div>
                                    <p className="text-[10.5px] sm:text-[11px] text-zinc-500 font-mono leading-relaxed">
                                        {userData?.Demo
                                            ? 'Paper trading sandbox: simulated order fills and margin tracking without risking real capital.'
                                            : 'Live execution: places real USDT-Margined perpetual futures contracts directly on Binance.'}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setUserData({
                                            ...userData!,
                                            Demo: !userData?.Demo
                                        })
                                    }}
                                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 border shrink-0 ${!userData?.Demo
                                        ? 'bg-emerald-600 border-emerald-500'
                                        : 'bg-amber-600 border-amber-500'
                                        }`}
                                    title="Toggle Live / Demo execution"
                                >
                                    <span
                                        className={`block w-5 h-5 rounded-full bg-white transition-transform ${!userData?.Demo ? 'translate-x-6' : 'translate-x-0.5'}`}
                                    />
                                </button>
                            </div>

                            {/* Strategy Dropdown */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-mono text-zinc-400 flex items-center justify-between">
                                    <span>Selected Trading Strategy</span>
                                    <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">Predefined strategies for bot</span>
                                </label>
                                <select
                                    value={selectedStrategy?.name}
                                    onChange={(e) => {
                                        const strat = strategies.find(({ name }) => name === e.target.value);
                                        setSelectedStrategy(strat);
                                    }}
                                    className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded px-3 py-2 text-xs font-mono text-zinc-200 outline-none cursor-pointer"
                                >
                                    <option value="">Select strategy..</option>
                                    {strategies.map((strat) => (
                                        <option key={strat.name} value={strat.name}>
                                            {strat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Strategy Parameters Display (Only for the selected strategy!) */}
                            <div className="bg-[#09090b] border border-blue-900/30 rounded-lg p-3 sm:p-4 space-y-3.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-zinc-800/80 pb-2.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Scale className="w-4 h-4 text-blue-400 shrink-0" />
                                        <span className="text-xs font-mono font-semibold text-zinc-200 truncate">
                                            Strategy Risk Profile: {selectedStrategy?.name}
                                        </span>
                                    </div>

                                    {/* Read-Only Minimum Balance Required */}
                                    <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-amber-500/40 px-2.5 py-1 rounded text-xs font-mono shrink-0 self-start sm:self-auto">
                                        <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                                        <span className="text-zinc-400 text-[10.5px] sm:text-[11px]">MIN_BALANCE_REQUIRED:</span>
                                        <span className="font-bold text-amber-300">
                                            ${selectedStrategy?.MinBalanceRequired?.toFixed(2)} USDT
                                        </span>
                                        <span className="text-[9px] text-zinc-500 font-mono ml-1 uppercase bg-zinc-800 px-1 rounded">
                                            READ-ONLY
                                        </span>
                                    </div>
                                </div>

                                {selectedStrategy?.description && (
                                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                                        {selectedStrategy.description}
                                    </p>
                                )}

                                {/* Specific Risk Parameters for Selected Strategy */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
                                    {/* Risk Per Trade */}
                                    <div className="bg-[#121214] border border-[#27272a] p-2.5 sm:p-3 rounded space-y-1">
                                        <span className="text-[9.5px] sm:text-[10px] font-mono uppercase text-zinc-500 block">Risk Per Trade</span>
                                        <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400 block">
                                            {selectedStrategy?.risk.riskPerType === 'percent'
                                                ? `${(selectedStrategy.risk.riskPer * 100).toFixed(1)}%`
                                                : `$${selectedStrategy?.risk.riskPer.toFixed(2)}`}
                                        </span>
                                        <span className="text-[9px] sm:text-[9.5px] font-mono text-zinc-500">
                                            Type: {selectedStrategy?.risk.riskPerType || 'percent'}
                                        </span>
                                    </div>

                                    {/* Take Profit Target */}
                                    <div className="bg-[#121214] border border-[#27272a] p-2.5 sm:p-3 rounded space-y-1">
                                        <span className="text-[9.5px] sm:text-[10px] font-mono uppercase text-zinc-500 block">Take Profit (TP)</span>
                                        <span className="text-xs sm:text-sm font-mono font-bold text-blue-400 block">
                                            {selectedStrategy?.risk.tpPerc !== undefined
                                                ? `${(selectedStrategy.risk.tpPerc * 100).toFixed(2)}%`
                                                : 'Dynamic / Trailing'}
                                        </span>
                                        <span className="text-[9px] sm:text-[9.5px] font-mono text-zinc-500">Fixed target</span>
                                    </div>

                                    {/* Stop Loss Condition */}
                                    <div className="bg-[#121214] border border-[#27272a] p-2.5 sm:p-3 rounded space-y-1">
                                        <span className="text-[9.5px] sm:text-[10px] font-mono uppercase text-zinc-500 block">Stop Loss Condition</span>
                                        <span className="text-xs font-mono font-bold text-amber-400 block truncate">
                                            {selectedStrategy?.risk.slCondition}
                                        </span>
                                        <span className="text-[9px] sm:text-[9.5px] font-mono text-zinc-500 truncate block">
                                            {selectedStrategy?.risk.slPerc
                                                ? `Threshold: ${(selectedStrategy.risk.slPerc * 100).toFixed(1)}%`
                                                : 'Protocol limit'}
                                        </span>
                                    </div>

                                    {/* Candle Lookback Window */}
                                    <div className="bg-[#121214] border border-[#27272a] p-2.5 sm:p-3 rounded space-y-1">
                                        <span className="text-[9.5px] sm:text-[10px] font-mono uppercase text-zinc-500 block">Candle Lookback</span>
                                        <span className="text-xs sm:text-sm font-mono font-bold text-zinc-200 block">
                                            {selectedStrategy?.MaxCandlesHistory ?? 20} candles
                                        </span>
                                        <span className="text-[9px] sm:text-[9.5px] font-mono text-zinc-500 truncate block">
                                            {selectedStrategy?.TriggerWindowBars
                                                ? `Trigger: ${selectedStrategy.TriggerWindowBars} bars`
                                                : 'Instant trigger'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Service Fee Ledger */}
                    <section className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 sm:p-5 space-y-4">
                        <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
                            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div>
                                <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                                    Service Fee Ledger & PnL Accounting
                                </h2>
                                <p className="text-[11px] text-zinc-500 font-mono">
                                    Performance-based fee ledger calculated upon trade reconciliation
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                            <div className="bg-[#09090b] border border-[#27272a] p-3.5 sm:p-4 rounded space-y-1">
                                <span className="text-[10.5px] sm:text-[11px] font-mono text-zinc-500 uppercase">Lifetime Realized PnL</span>
                                <p className="text-lg sm:text-xl font-mono font-bold text-emerald-400">
                                    +${formatCurrency(userData?.PNL ?? 0, 2)} USDT
                                </p>
                                <span className="text-[10px] sm:text-[10.5px] font-mono text-zinc-500 block">
                                    Aggregate profit across all closed positions
                                </span>
                            </div>

                            <div className="bg-[#09090b] border border-[#27272a] p-3.5 sm:p-4 rounded space-y-1">
                                <span className="text-[10.5px] sm:text-[11px] font-mono text-zinc-500 uppercase">Accumulated Unpaid Fee</span>
                                <p className="text-lg sm:text-xl font-mono font-bold text-amber-400">
                                    ${formatCurrency(userData?.UnpaidFee ?? 0, 2)} USDT
                                </p>
                                <span className="text-[10px] sm:text-[10.5px] font-mono text-zinc-500 block">
                                    Service fee calculated at 20% of net profits
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Form Submit Action */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                router.back();
                            }}
                            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded bg-zinc-900 border border-[#27272a] hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition-colors text-center"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 sm:py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold tracking-wide transition-all shadow-md shadow-blue-500/20"
                        >
                            {isSaving ? (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Save Configuration</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>

            <Footer />
        </div>
    )
}

export default Settings