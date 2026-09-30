"use client"
import { Lock, AlertTriangle, ArrowLeft, CheckCircle2, Compass, Key, Radio, Scale, Shield, Sliders, DollarSign, RefreshCw, Save, AlertOctagon, Plus, Activity, Tag, CheckCircle, Check, Copy, X, Box, Globe, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../AuthProvider';
import Footer from '@/section/Footer';
import { IDecryptedKeys, IUserInfoRuntime, Strategy } from '@/interfaces';
import { formatCurrency, getTradingSymbols } from '@/utils';
import { getUserByEmail, updateUser, updateUserDemoMode } from '../actions/user.actions';
import { server } from '../actions/server.actions';
import ConfirmationModal from '@/components/ConfirmationModal';

const Settings = () => {
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [userData, setUserData] = useState<IUserInfoRuntime | undefined>(undefined);
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | undefined>(undefined);
    const [assetPairs, setAssetPairs] = useState<string[]>([]);
    const [isModeModalOpen, setIsModeModalOpen] = useState(false);
    const [isChangingMode, setIsChangingMode] = useState(false);
    const [keyFilter, setKeyFilter] = useState<"all" | "demo" | "live">("all");
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
    const [newAPIKey, setNewAPIKey] = useState<IDecryptedKeys>({
        DecryptedKey: "",
        DecryptedSecret: "",
        id: "new",
        isDemo: true,
        label: "",
    });
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
    const [keyFormError, setKeyFormError] = useState<string | null>(null);

    const router = useRouter();
    const { user } = useAuth();

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setErrorMessage(null);
        setSaveSuccess(false);

        try {
            if (!userData) return;
            const updatedUser = await updateUser(userData);
            if (!updatedUser) {
                setErrorMessage('Failed to save settings to backend');
                return;
            }
            await server({ request: "restart" });
            setUserData(updatedUser);
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
        const loadUser = async () => {
            try {
                const data = await getUserByEmail(user.email);
                if (!data) {
                    setErrorMessage("Unable to load the user data");
                    return;
                }
                setUserData(data);
            } catch (error) {
                console.error("Failed to load user:", error);
                setErrorMessage("Failed to load user data");
            }

            const pairs = await getTradingSymbols();
            setAssetPairs(pairs);

            const strategies = await server<Strategy[]>({ request: "getStrategies" });
            setStrategies(strategies);
        }
        loadUser();
    }, [user])

    const handleRequestModeChange = async (targetDemo: boolean) => {
        if (targetDemo === userData?.Demo) return;
        setIsModeModalOpen(true);
    };

    const handleConfirmModeChange = async () => {
        setIsChangingMode(true);
        setErrorMessage(null);
        if (!user || !userData) return;

        try {
            const updated = await updateUserDemoMode(user.email, !userData.Demo);
            if (!updated) {
                setErrorMessage("There seems to be an error updating execution mode");
                return;
            }
            await server({ request: "restart" });
            setUserData({
                ...userData,
                Demo: updated.Demo,
            } as IUserInfoRuntime);
            setIsModeModalOpen(false);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to switch Execution Mode Protocol');
        } finally {
            setIsChangingMode(false);
        }
    }

    const handleCopy = (id: string, text: string) => {
        if (!text) return;
        navigator.clipboard?.writeText(text);
        setCopiedKeyId(id);
        setTimeout(() => setCopiedKeyId(null), 2000);
    }

    const handleOpenAddKeyModal = () => {
        setNewAPIKey({
            DecryptedKey: "",
            DecryptedSecret: "",
            id: "new",
            isDemo: true,
            label: "",
        });
        setKeyFormError(null);
        setIsKeyModalOpen(true);
    }

    const handleApiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewAPIKey({
            ...newAPIKey,
            [e.target.name]: e.target.value
        });
    }

    const handleSaveKeyForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData) return;

        if (newAPIKey.label.length === 0) {
            setKeyFormError('Label is required (e.g. "Main Futures (Live)", "Paper Sandbox")');
            return;
        }
        if (newAPIKey.DecryptedKey.length === 0) {
            setKeyFormError('Binance API Key is required');
            return;
        }
        if (newAPIKey.DecryptedSecret.length === 0) {
            setKeyFormError('Binance API Secret is required');
            return;
        }

        const cleanApiKey = newAPIKey.DecryptedKey.trim();
        const cleanApiSecret = newAPIKey.DecryptedSecret.trim();
        const updatedKeys = [
            ...userData.DecryptedAPIKeys,
            {
                ...newAPIKey,
                DecryptedKey: cleanApiKey,
                DecryptedSecret: cleanApiSecret
            }
        ];
        const _userData: IUserInfoRuntime = { ...userData, DecryptedAPIKeys: updatedKeys }
        // const updatedUser = await updateUser(_userData);
        // if (!updatedUser) {
        //     setErrorMessage("Unable to add the binance API");
        //     return;
        // }
        setUserData(_userData);
        setIsKeyModalOpen(false);
    };

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
                    <section className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 sm:p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-3">
                            <div className="flex items-center gap-2">
                                <Key className="w-4 h-4 text-blue-400 shrink-0" />
                                <div>
                                    <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                                        Binance API Configuration
                                    </h2>
                                    <p className="text-[11px] text-zinc-500 font-mono">
                                        Multi-key repository with labeled Live & Demo execution protocols
                                    </p>
                                </div>
                            </div>
                            {(userData?.DecryptedAPIKeys.length || 3) < 2 && (
                                <button
                                    type="button"
                                    onClick={handleOpenAddKeyModal}
                                    disabled={userData ? userData.DecryptedAPIKeys.length > 1 ? true : false : true}
                                    className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-medium transition-colors shadow-sm"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add API Key</span>
                                </button>
                            )}
                        </div>

                        {/* Active Execution Mode Key Routing Status Banner */}
                        <div className="p-3 bg-[#09090b] border border-zinc-800 rounded-lg space-y-1.5 text-xs font-mono">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    <span className="text-zinc-400">Current Execution Binding:</span>
                                    <span
                                        className={`font-bold px-1.5 py-0.5 rounded text-[10px] border ${userData?.Demo
                                            ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                                            : 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                                            }`}
                                    >
                                        {userData?.Demo ? 'DEMO PAPER MODE' : 'LIVE TRADING'}
                                    </span>
                                </div>

                                {(() => {
                                    const activeKey = userData?.DecryptedAPIKeys.find((key) => key.isDemo === userData?.Demo);

                                    if (activeKey) {
                                        return (
                                            <div className="flex items-center gap-1.5 text-zinc-300 text-[11px]">
                                                <span className="text-zinc-500">Routing orders to:</span>
                                                <span className="text-zinc-100 font-semibold">{activeKey.label}</span>
                                                <span className="text-zinc-500">
                                                    ({activeKey.DecryptedKey ? `${activeKey.DecryptedKey.slice(0, 6)}...${activeKey.DecryptedKey.slice(-4)}` : 'No Key'})
                                                </span>
                                            </div>
                                        );
                                    }
                                    return (
                                        <span className="text-amber-400 text-[10.5px]">
                                            No active {userData?.Demo ? 'Demo' : 'Live'} key configured. Add one below.
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Filter Pills */}
                        <div className="flex items-center gap-1.5 pt-1">
                            <button
                                type="button"
                                onClick={() => setKeyFilter('all')}
                                className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${keyFilter === 'all'
                                    ? 'bg-zinc-800 text-white font-medium border border-zinc-700'
                                    : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                            >
                                All Keys ({userData?.DecryptedAPIKeys.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setKeyFilter('live')}
                                className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors flex items-center gap-1.5 ${keyFilter === 'live'
                                    ? 'bg-emerald-950/80 text-emerald-300 font-medium border border-emerald-800'
                                    : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Live Keys ({userData?.DecryptedAPIKeys.filter((k) => k.isDemo === false).length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setKeyFilter('demo')}
                                className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors flex items-center gap-1.5 ${keyFilter === 'demo'
                                    ? 'bg-amber-950/80 text-amber-300 font-medium border border-amber-800'
                                    : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Demo Keys ({userData?.DecryptedAPIKeys.filter((k) => k.isDemo === true).length})
                            </button>
                        </div>

                        {/* Keys List */}
                        <div className="space-y-3 pt-1">
                            {(() => {
                                const filteredKeys = userData?.DecryptedAPIKeys.filter((k) => {
                                    if (keyFilter === 'live') return k.isDemo === false;
                                    if (keyFilter === 'demo') return k.isDemo === true;
                                    return true;
                                });

                                if (filteredKeys !== undefined && filteredKeys.length === 0) {
                                    return (
                                        <div className="p-6 text-center border border-dashed border-[#27272a] rounded-lg bg-[#09090b]/50 space-y-2">
                                            <Key className="w-6 h-6 text-zinc-600 mx-auto" />
                                            <p className="text-xs font-mono text-zinc-400">
                                                {keyFilter === 'all'
                                                    ? 'No Binance API keys configured yet.'
                                                    : `No ${keyFilter === 'live' ? 'Live' : 'Demo'} API keys found.`}
                                            </p>
                                            {(userData?.DecryptedAPIKeys.length || 3) < 2 && (
                                                <button
                                                    type="button"
                                                    onClick={handleOpenAddKeyModal}
                                                    className="text-xs font-mono text-blue-400 hover:text-blue-300 underline"
                                                >
                                                    + Add a new {keyFilter !== 'all' ? keyFilter : ''} Binance Key
                                                </button>
                                            )}

                                        </div>
                                    );
                                }
                                const sortedKeys = [...filteredKeys || []].sort(
                                    (a, b) => Number(b.isDemo === userData?.Demo) - Number(a.isDemo === userData?.Demo)
                                )
                                return sortedKeys.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`bg-[#09090b] border rounded-lg p-3.5 sm:p-4 space-y-3 transition-colors ${!item.isDemo
                                            ? 'border-emerald-800/80 bg-emerald-950/10'
                                            : 'border-amber-800/80 bg-amber-950/10'
                                            }`}
                                    >
                                        {/* Key Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Tag className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                                <span className="font-mono text-xs font-semibold text-zinc-100">
                                                    {item.label}
                                                </span>

                                                {/* Label Badge */}
                                                <span
                                                    className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${!item.isDemo
                                                        ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800'
                                                        : 'bg-amber-950/70 text-amber-400 border-amber-800'
                                                        }`}
                                                >
                                                    {!item.isDemo ? 'LIVE TRADING' : 'DEMO SANDBOX'}
                                                </span>

                                                {/* Active Badge */}
                                                {item.isDemo === userData?.Demo ? (
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

                                            {/* Actions */}
                                            {/* <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                                {!item.isActive && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetActiveKey(item.id)}
                                                        className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-mono transition-colors"
                                                        title={`Set ${item.label} as active key for ${item.type} mode`}
                                                    >
                                                        Set Active
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditKeyModal(item)}
                                                    className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                                                    title="Edit key label or credentials"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setKeyToDelete(item)}
                                                    className="p-1.5 rounded bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 text-rose-300 hover:text-rose-200 transition-colors"
                                                    title="Delete this API Key"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div> */}
                                        </div>

                                        {/* Credentials Display */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs font-mono pt-1">
                                            {/* API Key */}
                                            <div className="bg-[#121214] border border-[#27272a] rounded p-2.5 space-y-1">
                                                <div className="flex items-center justify-between text-zinc-400 text-[10.5px]">
                                                    <span>API KEY</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(`key_${item.id}`, item.DecryptedKey)}
                                                        className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                                                        title="Copy API Key"
                                                    >
                                                        {copiedKeyId === `key_${item.id}` ? (
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
                                                        ? `${item.DecryptedKey.slice(0, 12)}••••••••••••••••••••••••••••${item.DecryptedKey.slice(-6)}`
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
                                    {assetPairs.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
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
                                    value={userData?.Leverage || 1}
                                    onChange={handleChange}
                                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-3">
                            <div className="flex items-center gap-2">
                                <Compass className="w-4 h-4 text-blue-400 shrink-0" />
                                <div>
                                    <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                                        Execution Environment & Strategy Engine
                                    </h2>
                                    <p className="text-[11px] text-zinc-500 font-mono">
                                        Configure live exchange connectivity or local sandbox execution and select active quant strategy algorithms
                                    </p>
                                </div>
                            </div>

                            {/* Head Navigation Buttons: Sandbox vs Exchange */}
                            <div className="flex items-center gap-1.5 p-1 bg-[#09090b] border border-[#27272a] rounded-lg self-start sm:self-auto shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setUserData({ ...userData!, Sandbox: true })}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${userData?.Sandbox
                                        ? 'bg-amber-600 text-white shadow-sm font-semibold'
                                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                                        }`}
                                >
                                    <Box className="w-3.5 h-3.5" />
                                    <span>Sandbox</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUserData({ ...userData!, Sandbox: false })}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${!userData?.Sandbox
                                        ? 'bg-blue-600 text-white shadow-sm font-semibold'
                                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                                        }`}
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>Exchange</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 sm:space-y-5 pt-1">

                            {userData?.Sandbox && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <div className="p-4 sm:p-5 bg-[#09090b] border border-amber-800/60 rounded-lg space-y-4 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-amber-950/80 border border-amber-700/80 flex items-center justify-center shrink-0 text-amber-400">
                                                    <Box className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-xs font-mono font-bold uppercase text-zinc-100">
                                                            Local Offline Sandbox Simulation
                                                        </h3>
                                                        <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border bg-amber-950/80 text-amber-300 border-amber-800">
                                                            LOCAL 1,000 USDT BALANCE
                                                        </span>
                                                        <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded border bg-zinc-900 text-zinc-400 border-zinc-700">
                                                            ZERO EXCHANGE CALLS
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                                                        The bot will use a <strong className="text-amber-300">local balance of 1,000 USDT</strong> and test the strategy completely offline without making calls on the exchange.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Active Status Badge */}
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/40 border border-amber-800/80 text-amber-300 font-mono text-[11px] shrink-0 self-start">
                                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                                <span>Sandbox Standby</span>
                                            </div>
                                        </div>

                                        {/* Sandbox Details Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs font-mono">
                                            <div className="bg-[#121214] border border-[#27272a] rounded p-3 space-y-1">
                                                <span className="text-[10px] text-zinc-500 uppercase block">Virtual Starting Balance</span>
                                                <div className="text-base font-bold text-amber-400">$1,000.00 USDT</div>
                                                <p className="text-[10.5px] text-zinc-400 leading-normal">
                                                    Isolated local paper margin. PnL and trade statistics accumulate purely in client memory.
                                                </p>
                                            </div>

                                            <div className="bg-[#121214] border border-[#27272a] rounded p-3 space-y-1">
                                                <span className="text-[10px] text-zinc-500 uppercase block">Exchange Network Activity</span>
                                                <div className="text-base font-bold text-emerald-400">Offline (0 Calls)</div>
                                                <p className="text-[10.5px] text-zinc-400 leading-normal">
                                                    No Binance REST orders, WebSocket margin trades, or signature requests are transmitted.
                                                </p>
                                            </div>

                                            <div className="bg-[#121214] border border-[#27272a] rounded p-3 space-y-1">
                                                <span className="text-[10px] text-zinc-500 uppercase block">Strategy Verification</span>
                                                <div className="text-base font-bold text-blue-400">Active Test Matrix</div>
                                                <p className="text-[10.5px] text-zinc-400 leading-normal">
                                                    Evaluates indicators (RSI, EMA, Bollinger, ATR) using local candle feeds and simulated fills.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Advisory Banner */}
                                        <div className="p-3 bg-[#121214] border border-zinc-800 rounded-lg flex items-center justify-between gap-3 text-xs font-mono">
                                            <div className="flex items-center gap-2 text-zinc-300">
                                                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                                                <span>Ready to run live market or testnet orders? Switch to the <strong>Exchange</strong> tab above.</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setUserData({ ...userData!, Sandbox: false })}
                                                className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-colors shrink-0"
                                            >
                                                Switch to Exchange
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: EXCHANGE ENVIRONMENT (Conventional Live / Demo switch & full controls) */}
                            {!userData?.Sandbox && (
                                <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
                                    {/* Demo / Live Switch Toggle (Requested in Engine Config) */}
                                    <div className="p-3.5 sm:p-4 bg-[#09090b] border border-[#27272a] rounded-lg space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                                                        {userData?.Demo ? 'DEMO MODE (TESTNET)' : 'LIVE TRADING'}
                                                    </span>
                                                </div>
                                                <p className="text-[10.5px] sm:text-[11px] text-zinc-500 font-mono leading-relaxed">
                                                    {userData?.Demo
                                                        ? 'Testnet exchange sandbox: places simulated order fills and tracks margin on Binance Testnet endpoints.'
                                                        : 'Live execution: places real USDT-Margined perpetual futures contracts directly on Binance exchange.'}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                                                {/* Explicit protocol pills */}
                                                <div className="inline-flex rounded p-0.5 bg-zinc-900 border border-zinc-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRequestModeChange(true)}
                                                        className={`px-2.5 py-1 text-[10.5px] font-mono rounded transition-colors ${userData?.Demo
                                                            ? 'bg-amber-600 text-white font-semibold shadow-sm'
                                                            : 'text-zinc-400 hover:text-zinc-200'
                                                            }`}
                                                    >
                                                        DEMO
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRequestModeChange(false)}
                                                        className={`px-2.5 py-1 text-[10.5px] font-mono rounded transition-colors ${!userData?.Demo
                                                            ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                                                            : 'text-zinc-400 hover:text-zinc-200'
                                                            }`}
                                                    >
                                                        LIVE
                                                    </button>
                                                </div>

                                                {/* Interactive Switch Toggle */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRequestModeChange(!userData?.Demo)}
                                                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 border shrink-0 ${!userData?.Demo
                                                        ? 'bg-emerald-600 border-emerald-500'
                                                        : 'bg-amber-600 border-amber-500'
                                                        }`}
                                                    title={`Click to switch to ${userData?.Demo ? 'Live Trading' : 'Demo Mode'}`}
                                                >
                                                    <span
                                                        className={`block w-5 h-5 rounded-full bg-white transition-transform ${!userData?.Demo ? 'translate-x-6' : 'translate-x-0.5'
                                                            }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Safety Warning Note */}
                                        <div className="flex items-start gap-2 pt-2 border-t border-zinc-800/80 text-[10.5px] font-mono text-zinc-400">
                                            <AlertOctagon className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                            <span>
                                                <strong className="text-zinc-300">Safety Protocol Gate:</strong> Switching Execution Mode Protocol requires confirmation. All active positions will be closed on current market.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                            {selectedStrategy?.setup?.bbReentryWindow
                                                ? `Trigger: ${selectedStrategy.setup?.bbReentryWindow} bars`
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
                                    +{formatCurrency(userData?.PNL ?? 0, 2)} USDT
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

                {isKeyModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#121214] border border-[#27272a] rounded-lg max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl relative">
                            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                                <div className="flex items-center gap-2">
                                    <Key className="w-4 h-4 text-blue-400" />
                                    <h3 className="text-sm font-mono font-semibold text-zinc-100">
                                        Add Binance API Key
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsKeyModalOpen(false)}
                                    className="text-zinc-400 hover:text-zinc-200 p-1"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {keyFormError && (
                                <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono rounded flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                                    <span>{keyFormError}</span>
                                </div>
                            )}

                            <form onSubmit={handleSaveKeyForm} className="space-y-3.5">
                                {/* Key Label */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-mono text-zinc-300 flex items-center justify-between">
                                        <span>Key Label</span>
                                        <span className="text-[10.5px] text-zinc-500">e.g. Main Futures, Paper Sandbox</span>
                                    </label>
                                    <input
                                        type="text"
                                        name='label'
                                        autoComplete='false'
                                        value={newAPIKey.label}
                                        onChange={handleApiChange}
                                        placeholder="Enter descriptive label"
                                        className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded px-3 py-2 text-xs font-mono text-zinc-100 outline-none"
                                        autoFocus
                                    />
                                </div>

                                {/* Protocol Tag Selector (Live vs Demo) */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-mono text-zinc-300">
                                        Execution Protocol Label
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewAPIKey({ ...newAPIKey, isDemo: false })}
                                            className={`p-2.5 rounded border text-xs font-mono flex items-center justify-center gap-1.5 transition-colors ${!newAPIKey.isDemo
                                                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 font-semibold'
                                                : 'bg-[#09090b] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                                                }`}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                            <span>LIVE TRADING</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewAPIKey({ ...newAPIKey, isDemo: false })}
                                            className={`p-2.5 rounded border text-xs font-mono flex items-center justify-center gap-1.5 transition-colors ${newAPIKey.isDemo
                                                ? 'bg-amber-950/80 border-amber-600 text-amber-300 font-semibold'
                                                : 'bg-[#09090b] border-[#27272a] text-zinc-400 hover:text-zinc-200'
                                                }`}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                                            <span>DEMO SANDBOX</span>
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-mono">
                                        {!newAPIKey.isDemo
                                            ? 'Live execution key: submits real USDT margin orders to Binance perpetual futures.'
                                            : 'Demo sandbox key: used for testnet and paper simulation environments.'}
                                    </p>
                                </div>

                                {/* Binance API Key */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-mono text-zinc-300 flex items-center justify-between">
                                        <span>Binance API Key</span>
                                        <span className="text-[10.5px] text-zinc-500">64 alphanumeric chars</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="DecryptedKey"
                                        autoComplete='false'
                                        value={newAPIKey.DecryptedKey}
                                        onChange={handleApiChange}
                                        placeholder="Enter Binance API Key"
                                        className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded px-3 py-2 text-xs font-mono text-zinc-100 outline-none"
                                    />
                                </div>

                                {/* Binance API Secret */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-mono text-zinc-300 flex items-center justify-between">
                                        <span>Binance API Secret</span>
                                        <span className="text-[10.5px] text-zinc-500">HMAC SHA-256 signature key</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="DecryptedSecret"
                                        autoComplete='false'
                                        value={newAPIKey.DecryptedSecret}
                                        onChange={handleApiChange}
                                        placeholder="Enter Binance API Secret"
                                        className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded px-3 py-2 text-xs font-mono text-zinc-100 outline-none"
                                    />
                                </div>

                                {/* Modal Actions */}
                                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#27272a]">
                                    <button
                                        type="button"
                                        onClick={() => setIsKeyModalOpen(false)}
                                        className="px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold transition-colors shadow-sm"
                                    >
                                        Add API Key
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <ConfirmationModal
                    isOpen={isModeModalOpen}
                    onClose={() => setIsModeModalOpen(false)}
                    onConfirm={handleConfirmModeChange}
                    title={
                        !userData?.Demo
                            ? 'Switch Execution Mode to DEMO'
                            : 'Switch Execution Mode to LIVE'
                    }
                    message="All the active positions will be closed on current market."
                    description={
                        userData?.Demo
                            ? 'Switching from Live Trading to Demo Paper Trading terminates all active Binance perpetual futures contracts at the prevailing market price. Simulated sandbox paper funds will take effect.'
                            : 'Switching from Demo Paper Sandbox to Live Trading terminates all active paper positions at the prevailing market price. Real Binance futures balance and live exchange API order routing will be activated.'
                    }
                    variant={userData?.Demo === false ? 'danger' : 'warning'}
                    confirmText={
                        !userData?.Demo
                            ? 'Confirm Switch to DEMO (Close Active Positions)'
                            : 'Confirm Switch to LIVE (Close Active Positions)'
                    }
                    cancelText="Cancel & Keep Current Mode"
                    isLoading={isChangingMode}
                    details={[
                        {
                            label: 'Target Bot ID',
                            value: <span className="font-mono text-zinc-200">{userData?.BotID}</span>,
                        },
                        {
                            label: 'Current Protocol',
                            value: (
                                <span
                                    className={`font-mono font-bold ${userData?.Demo ? 'text-amber-400' : 'text-emerald-400'
                                        }`}
                                >
                                    {userData?.Demo ? 'DEMO PAPER MODE' : 'LIVE TRADING'}
                                </span>
                            ),
                        },
                        {
                            label: 'Requested Protocol',
                            value: (
                                <span
                                    className={`font-mono font-bold ${!userData?.Demo ? 'text-amber-400' : 'text-emerald-400'
                                        }`}
                                >
                                    {!userData?.Demo ? 'DEMO PAPER MODE' : 'LIVE TRADING'}
                                </span>
                            ),
                        },
                        {
                            label: 'Market Action',
                            value: (
                                <span className="font-mono font-semibold text-rose-400">
                                    All active positions will be closed on current market
                                </span>
                            ),
                        },
                    ]}
                />


            </main>

            <Footer />
        </div>
    )
}

export default Settings