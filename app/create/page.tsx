"use client"
import { SECRET_PLACEHOLDER } from '@/constants';
import { IUserInfoRuntime, Strategy } from '@/interfaces';
import Footer from '@/section/Footer';
import { Lock, AlertCircle, ArrowLeft, Bot, Check, CheckCircle2, Copy, ExternalLink, Mail, ShieldCheck, Sliders, UserIcon, Sparkles, EyeOff, Eye, X, Key, Layers, Power, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../AuthProvider';
import { generateSageID, getTradingSymbols } from '@/utils';
import { server } from '../actions/server.actions';
import { createUser } from '../actions/user.actions';

const CreateUser = () => {
  const [createdItem, setCreatedItem] = useState<IUserInfoRuntime | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBotSliders, setShowBotSliders] = useState(false);
  const [userInfo, setUserInfo] = useState<Partial<IUserInfoRuntime>>({
    Name: "",
    Email: "",
    BotID: "",
    UID: "",
    AccountType: "USER",
    Password: "",
    StrategyName: "",
    Leverage: 0,
    Symbol: "",
    DecryptedKey: "",
    DecryptedSecret: "",
    AvoidLiquidation: true,
    Demo: false
  });
  const [enableBinanceApi, setEnableBinanceApi] = useState(false);
  const [strategyEngineOn, setStrategyEngineOn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [assetPairs, setAssetPairs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { user } = useAuth();

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 12; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserInfo({
      ...setUserInfo, Password: res
    });
    setShowPassword(true);
  };

  const handleCopyCredentials = () => {
    if (!createdItem) return;
    const text = `SAGE TRADING TERMINAL - OPERATOR CREDENTIALS\n` +
      `-------------------------------------------\n` +
      `Operator Name: ${createdItem.Name}\n` +
      `Email / Login: ${createdItem.Email}\n` +
      `Password: ${userInfo.Password}\n` +
      `Trading Pair: ${createdItem.Symbol} (${createdItem.Leverage}x)\n` +
      `Strategy: ${createdItem.StrategyName ?? "NONE"}\n` +
      `Mode: ${createdItem.Demo ? 'DEMO' : 'LIVE'}\n`;

    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 3000);
  };

  const handleResetForAnother = () => {
    setUserInfo({
      Name: "",
      Email: "",
      BotID: generateSageID(),
      UID: "",
      AccountType: "USER",
      Password: "",
      StrategyName: "",
      Leverage: 0,
      Symbol: "",
      DecryptedKey: "",
      DecryptedSecret: "",
      AvoidLiquidation: true,
      Demo: false
    });
    setCreatedItem(null);
    setErrorMessage(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!userInfo.Name) {
      setErrorMessage('Full Name is required.');
      return;
    }
    if (!userInfo.Email || !userInfo.Email.includes('@')) {
      setErrorMessage('A valid Email address is required.');
      return;
    }
    if (!userInfo.Password || userInfo.Password.length < 3) {
      setErrorMessage('Password must be at least 3 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const createdUser = await createUser(userInfo);
      if (!createdUser) {
        setErrorMessage("There seems to be an error creating a user");
        return;
      }
      setCreatedItem(createdUser);
    } catch (error) {
      console.log(error);
      setErrorMessage(`There seems to be an error creating the user`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInfo({
      ...userInfo,
      [e.target.name]: value
    })
  }

  useEffect(() => {
    const getPairs = async () => {
      const pairs = await getTradingSymbols();
      setAssetPairs(pairs);

      const strategies = await server<Strategy[]>({ request: "getStrategies" });
      setStrategies(strategies);
    }

    setUserInfo((prev) => ({
      ...prev,
      BotID: generateSageID(10)
    }));

    getPairs();
  }, [user])


  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0c0c0e]/95 backdrop-blur border-b border-[#27272a] px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => router.back()}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded bg-zinc-900 border border-[#27272a] hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center gap-1.5 text-xs font-mono shrink-0"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Back to Fleet</span>
            <span className="sm:hidden">Fleet</span>
          </button>
          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-semibold tracking-tight text-white font-mono truncate">
                Provision Operator & Bot Credentials
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-800/80">
                <ShieldCheck className="w-3 h-3 text-purple-400" />
                Super User
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono hidden md:block">
              Register new operator accounts, provision Binance API credentials, and calibrate strategy engines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.push('/')}
            className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] text-zinc-300 text-xs font-mono transition-colors"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-[1280px] w-full mx-auto space-y-6">
        {/* SUCCESS MODAL / CONFIRMATION */}
        {createdItem ? (
          <div className="bg-[#121214] border border-emerald-500/40 rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-600 flex items-center justify-center shrink-0 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold font-mono text-white flex items-center gap-2">
                  <span>Operator Account & Bot Provisioned</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Active
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                  {createdItem.Name} has been assigned Bot ID <span className="text-white font-bold">{createdItem.BotID}</span>. You can share these credentials or inspect this bot directly.
                </p>
              </div>
            </div>

            {/* Credentials Card */}
            <div className="bg-[#09090b] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400 font-semibold uppercase text-[10.5px]">Credential Summary</span>
                <button
                  onClick={handleCopyCredentials}
                  className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 px-2 py-1 rounded bg-purple-950/40 border border-purple-800/60 transition-colors"
                >
                  {copiedCredentials ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Credentials</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase block">Bot ID</span>
                  <span className="text-white font-bold text-sm">{createdItem.BotID}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase block">Operator Name</span>
                  <span className="text-zinc-200 font-medium">{createdItem.Name}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase block">Login Email</span>
                  <span className="text-zinc-200 font-medium">{createdItem.Email}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase block">Assigned Password</span>
                  <span className="text-emerald-400 font-mono font-bold">{SECRET_PLACEHOLDER}</span>
                </div>
                {(createdItem.Symbol && createdItem.Symbol.trim()) && (
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase block">Trading Asset</span>
                    <span className="text-blue-400 font-medium">{createdItem.Symbol} ({createdItem.Leverage}x)</span>
                  </div>
                )}
                {(createdItem.StrategyName && createdItem.StrategyName.trim()) && (
                  <>
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block">Strategy Algorithm</span>
                      <span className="text-zinc-300 font-medium">{createdItem.StrategyName}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block">Execution Mode</span>
                      <span className={`font-semibold ${createdItem.Demo ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {createdItem.Demo ? 'DEMO PAPER' : 'LIVE CAPITAL'}
                      </span>
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* Post-creation Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => router.push(`/inspect/${createdItem.BotID}`)}
                className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Switch to this Bot & Open Dashboard</span>
              </button>

              <button
                onClick={() => router.push('/fleet')}
                className="px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] text-zinc-200 font-mono text-xs font-medium flex items-center gap-2 transition-colors"
              >
                <Bot className="w-4 h-4 text-purple-400" />
                <span>View in Fleet Directory</span>
              </button>

              <button
                onClick={handleResetForAnother}
                className="px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] text-zinc-300 font-mono text-xs transition-colors ml-auto"
              >
                + Provision Another User
              </button>
            </div>
          </div>
        ) : (
          /* CREATION FORM */
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Pipeline Step Slider Bar */}
            <div className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 sm:p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
                    Provisioning Pipeline Slider
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-zinc-500">Pipeline Mode:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${showBotSliders
                      ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                      : 'text-zinc-400 bg-zinc-900 border-zinc-800'
                      }`}
                  >
                    {showBotSliders ? 'Full Bot & Exchange Provisioning' : 'Identity Only'}
                  </span>
                </div>
              </div>

              {/* Steps Progress Track */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                {/* Step 1: Operator Identity */}
                <div className="p-2.5 rounded-lg bg-[#09090b] border border-purple-500/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-700 text-purple-300 flex items-center justify-center text-[10px] font-bold">
                      1
                    </span>
                    <span className="text-zinc-200 font-medium">1. Operator Identity</span>
                  </div>
                  {userInfo.Name && userInfo.Email && userInfo.Password ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase">Required</span>
                  )}
                </div>

                {/* Step 2: Binance Api Configuration */}
                <div
                  className={`p-2.5 rounded-lg bg-[#09090b] border transition-all flex items-center justify-between ${showBotSliders && enableBinanceApi
                    ? 'border-blue-500/50 shadow-sm shadow-blue-950/30'
                    : 'border-zinc-800/80 opacity-60'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-950 border border-blue-700 text-blue-300 flex items-center justify-center text-[10px] font-bold">
                      2
                    </span>
                    <span className="text-zinc-200 font-medium">2. Binance API Config</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${showBotSliders && enableBinanceApi
                      ? 'text-blue-400 bg-blue-950/60 border-blue-800'
                      : 'text-zinc-500 bg-zinc-900 border-zinc-800'
                      }`}
                  >
                    {showBotSliders && enableBinanceApi ? 'ENABLED' : 'OFF'}
                  </span>
                </div>

                {/* Step 3: Strategy Engine (if on) */}
                <div
                  className={`p-2.5 rounded-lg bg-[#09090b] border transition-all flex items-center justify-between ${showBotSliders && strategyEngineOn
                    ? 'border-emerald-500/50 shadow-sm shadow-emerald-950/30'
                    : 'border-zinc-800/80 opacity-60'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                      3
                    </span>
                    <span className="text-zinc-200 font-medium">3. Strategy Engine</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${showBotSliders && strategyEngineOn
                      ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                      : 'text-amber-400 bg-amber-950/60 border-amber-800'
                      }`}
                  >
                    {showBotSliders && strategyEngineOn ? 'ENGINE ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Form Sections (8 Cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* SECTION 1: Operator Identity & Login Credentials */}
                <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
                    <UserIcon className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                        1. Operator Identity & Authentication Credentials
                      </h2>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        Basic user profile and credentials for logging into Sage Trading Terminal
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-medium flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-zinc-500" />
                        Full Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ali Wains"
                        name="Name"
                        value={userInfo.Name}
                        onChange={handleChange}
                        className="w-full bg-[#09090b] border border-[#27272a] focus:border-purple-500 rounded px-3 py-2 text-zinc-100 outline-none text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-medium flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-zinc-500" />
                        Login Email Address <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. a.wains@quantdesk.io"
                        name="Email"
                        value={userInfo.Email}
                        onChange={handleChange}
                        className="w-full bg-[#09090b] border border-[#27272a] focus:border-purple-500 rounded px-3 py-2 text-zinc-100 outline-none text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-zinc-400 font-medium flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-zinc-500" />
                          Operator Password <span className="text-rose-400">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Generate Secure</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Initial access password"
                          name='Password'
                          value={userInfo.Password}
                          onChange={handleChange}
                          className="w-full bg-[#09090b] border border-[#27272a] focus:border-purple-500 rounded px-3 pr-10 py-2 text-zinc-100 outline-none text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                  </div>


                </div>

                {/* MASTER SLIDER: SHOW 2. BINANCE API CONFIGURATION AND 3. STRATEGY ENGINE */}
                <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${showBotSliders
                          ? 'bg-blue-950/80 border-blue-700 text-blue-400 shadow-md shadow-blue-950/50'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}
                      >
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                            Bot Engine & Binance API Provisioning Slider
                          </h3>
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border transition-colors ${showBotSliders
                              ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                              : 'text-zinc-400 bg-zinc-900 border-zinc-800'
                              }`}
                          >
                            {showBotSliders ? 'SLIDER ON' : 'SLIDER OFF'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          Toggle slider to show 2. Binance Api Configuration and 3. Strategy Engine (if on)
                        </p>
                      </div>
                    </div>

                    {/* Master Slider Toggle */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="text-xs font-mono text-zinc-400 font-semibold">
                        {showBotSliders ? 'Show Exchange & Engine' : 'Hidden'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showBotSliders}
                        onClick={() => setShowBotSliders(!showBotSliders)}
                        className={`w-14 h-7 rounded-full transition-colors relative shrink-0 p-1 flex items-center cursor-pointer ${showBotSliders ? 'bg-purple-600 hover:bg-purple-500' : 'bg-zinc-800 hover:bg-zinc-700'
                          }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 flex items-center justify-center ${showBotSliders ? 'translate-x-7' : 'translate-x-0'
                            }`}
                        >
                          {showBotSliders ? (
                            <Check className="w-3 h-3 text-purple-700 font-bold" />
                          ) : (
                            <X className="w-3 h-3 text-zinc-600" />
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* SECTIONS 2 & 3: SHOWN WHEN MASTER SLIDER IS ON */}
                {showBotSliders ? (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* SECTION 2: Bot Identification & Binance API Credentials */}
                    <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#27272a] pb-3 gap-3">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-blue-400 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                                2. Binance Api Configuration
                              </h2>
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase border ${enableBinanceApi
                                  ? 'text-blue-400 bg-blue-950/60 border-blue-800'
                                  : 'text-zinc-500 bg-zinc-900 border-zinc-800'
                                  }`}
                              >
                                {enableBinanceApi ? 'CONNECTED' : 'STANDBY'}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 font-mono">
                              Exchange API credentials for live Binance Futures execution
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">

                          {/* Slider switch for 2. Binance API Configuration */}
                          <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                            <span className="text-[10px] font-mono text-zinc-400">API Config:</span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={enableBinanceApi}
                              onClick={() => setEnableBinanceApi(!enableBinanceApi)}
                              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 cursor-pointer ${enableBinanceApi ? 'bg-blue-600' : 'bg-zinc-800'
                                }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full bg-white transition-transform ${enableBinanceApi ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {enableBinanceApi ? (
                        <div className="space-y-4 text-xs font-mono animate-in fade-in">
                          {/* Bot ID selection */}


                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-zinc-400 font-medium">Binance Futures API Key</label>
                              <input
                                type="text"
                                placeholder="vmQ4P892..."
                                name='DecryptedKey'
                                value={userInfo.DecryptedKey}
                                onChange={handleChange}
                                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded px-3 py-2 text-zinc-100 outline-none text-xs"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-zinc-400 font-medium">Binance API Secret</label>
                                <button
                                  type="button"
                                  onClick={() => setShowSecret(!showSecret)}
                                  className="text-[10px] text-zinc-500 hover:text-zinc-300"
                                >
                                  {showSecret ? 'Hide' : 'Show'}
                                </button>
                              </div>
                              <div className="relative">
                                <input
                                  type={showSecret ? 'text' : 'password'}
                                  placeholder="sJ9914710..."
                                  name='DecryptedSecret'
                                  value={userInfo.DecryptedSecret}
                                  onChange={handleChange}
                                  className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-500 rounded px-3 pr-10 py-2 text-zinc-100 outline-none text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Liquidation Avoidance Guard Toggle */}
                          <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-lg flex items-center justify-between">
                            <div className="space-y-0.5 pr-2">
                              <span className="font-semibold text-zinc-200 block">
                                Avoid Liquidation Guard (90% Buffer)
                              </span>
                              <p className="text-[11px] text-zinc-400">
                                Automatically injects isolated wallet margin when mark price approaches liquidation distance.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setUserInfo({ ...userInfo, AvoidLiquidation: !userInfo.AvoidLiquidation })}
                              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${userInfo.AvoidLiquidation ? 'bg-emerald-600' : 'bg-zinc-800'
                                }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full bg-white transition-transform ${userInfo.AvoidLiquidation ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-[#09090b] border border-zinc-800 text-xs font-mono space-y-1">
                          <div className="flex items-center gap-2 text-zinc-300 font-medium">
                            <AlertCircle className="w-4 h-4 text-zinc-500" />
                            <span>Binance API Configuration is Inactive</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-relaxed">
                            Exchange API keys will not be stored. This operator can connect their Binance Futures API key later from Settings or run with simulated demo executions.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* SECTION 3: Strategy Engine & Risk Calibration (if on) */}
                    <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#27272a] pb-3 gap-3">
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                                3. Strategy Engine (if on)
                              </h2>
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase border ${strategyEngineOn
                                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                                  : 'text-amber-400 bg-amber-950/60 border-amber-800'
                                  }`}
                              >
                                {strategyEngineOn ? 'ENGINE ON' : 'ENGINE OFF'}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 font-mono">
                              Select default algorithmic strategy, trading pair, leverage limit, and execution mode
                            </p>
                          </div>
                        </div>

                        {/* Section 3 Slider Switch: 3. Strategy Engine (if on) */}
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] font-mono font-medium text-zinc-400">
                            Strategy Engine:{' '}
                            <span className={strategyEngineOn ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                              {strategyEngineOn ? 'ON' : 'OFF'}
                            </span>
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={strategyEngineOn}
                            onClick={() => setStrategyEngineOn(!strategyEngineOn)}
                            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 cursor-pointer ${strategyEngineOn ? 'bg-emerald-600' : 'bg-zinc-800'
                              }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white transition-transform ${strategyEngineOn ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* ONLY SHOW IF ON */}
                      {strategyEngineOn ? (
                        <div className="space-y-4 animate-in fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                            <div className="space-y-1.5">
                              <label className="text-zinc-400 font-medium">Trading Asset Pair</label>
                              <select
                                value={userInfo.Symbol}
                                name='Symbol'
                                onChange={(e) => setUserInfo({ ...userInfo, Symbol: e.target.value })}
                                className="w-full bg-[#09090b] border border-[#27272a] focus:border-purple-500 rounded px-3 py-2 text-zinc-100 outline-none text-xs font-bold"
                              >
                                <option value="">Select symbol..</option>
                                {assetPairs.map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-zinc-400 font-medium">Margin Leverage ({userInfo.Leverage}x)</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="120"
                                  step={5}
                                  value={userInfo.Leverage}
                                  onChange={(e) => setUserInfo({ ...userInfo, Leverage: Number(e.target.value) })}
                                  className="w-full accent-purple-500 cursor-pointer"
                                />
                                <span className="font-bold text-white px-2 py-1 bg-[#09090b] border border-[#27272a] rounded shrink-0">
                                  {userInfo.Leverage}x
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-zinc-400 font-medium">Execution Mode</label>
                              <div className="flex rounded border border-[#27272a] overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => setUserInfo({ ...userInfo, Demo: false })}
                                  className={`flex-1 py-1.5 text-center text-xs font-semibold transition-colors ${!userInfo.Demo
                                    ? 'bg-emerald-950/90 text-emerald-300 font-bold'
                                    : 'bg-[#09090b] text-zinc-400 hover:text-zinc-200'
                                    }`}
                                >
                                  LIVE CAPITAL
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setUserInfo({ ...userInfo, Demo: true })}
                                  className={`flex-1 py-1.5 text-center text-xs font-semibold transition-colors ${userInfo.Demo
                                    ? 'bg-amber-950/90 text-amber-300 font-bold'
                                    : 'bg-[#09090b] text-zinc-400 hover:text-zinc-200'
                                    }`}
                                >
                                  DEMO PAPER
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Strategy Selector */}
                          <div className="space-y-2 text-xs font-mono">
                            <label className="text-zinc-400 font-medium flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-purple-400" />
                              Algorithmic Trading Strategy
                            </label>
                            <select
                              value={userInfo.StrategyName}
                              name='StrategyName'
                              onChange={(e) => setUserInfo({ ...userInfo, StrategyName: e.target.value })}
                              className="w-full bg-[#09090b] border border-[#27272a] focus:border-purple-500 rounded px-3 py-2 text-zinc-100 outline-none text-xs"
                            >
                              {strategies.map((s) => (
                                <option key={s.name} value={s.name}>
                                  {s.name}
                                </option>
                              ))}
                            </select>

                            <div className="p-3 bg-[#09090b] border border-[#27272a] rounded text-[11px] text-zinc-400 leading-relaxed">
                              {strategies.find((s) => s.name === userInfo.StrategyName)?.description ||
                                'Algorithmic momentum and execution rules for high-efficiency futures scalping.'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-[#09090b] border border-amber-900/30 text-xs font-mono space-y-1.5">
                          <div className="flex items-center gap-2 text-amber-300 font-medium">
                            <Power className="w-4 h-4 text-amber-400" />
                            <span>Strategy Engine is OFF (Engine Inactive)</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            Algorithmic trading is deactivated for this bot. It will be provisioned in halted/standby mode with manual discretionary execution only. No automatic orders will be placed. You can turn on the Strategy Engine slider above to configure automated strategies.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* WHEN MASTER SLIDER IS OFF */
                  <div className="bg-[#121214] border border-[#27272a] rounded-lg p-6 text-center space-y-3 font-mono">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 mx-auto flex items-center justify-center">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-zinc-200">
                        Binance API & Strategy Engine Configuration Hidden
                      </h3>
                      <p className="text-xs text-zinc-500 max-w-md mx-auto">
                        Turn ON the slider above to show 2. Binance Api Configuration and 3. Strategy Engine (if on).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBotSliders(true)}
                      className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-purple-300 border border-purple-800/40 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      <span>Turn Slider ON to Configure</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Live Configuration Preview & Submit (4 Cols) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#121214] border border-[#27272a] rounded-lg p-4 sm:p-5 space-y-4 sticky top-20 shadow-md">
                  <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                      Provisioning Summary Preview
                    </h3>
                  </div>

                  {/* Preview Card */}
                  <div className="bg-[#09090b] border border-purple-500/50 rounded-lg p-3.5 space-y-3 font-mono text-xs shadow-inner">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-purple-400 font-bold block">
                          {userInfo.BotID || "SAGE-NEW"}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate max-w-[170px]">
                          {userInfo.Name || 'New Operator'}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate max-w-[170px]">
                          {userInfo.Email || 'operator@domain.com'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${showBotSliders && strategyEngineOn
                            ? userInfo.Demo
                              ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                              : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                            }`}
                        >
                          {showBotSliders && strategyEngineOn ? (userInfo.Demo ? 'DEMO' : 'LIVE') : 'STANDBY'}
                        </span>
                        <div className="mt-1 text-[11px] text-zinc-400">
                          {showBotSliders && strategyEngineOn ? `${userInfo.Symbol} ${userInfo.Leverage}x` : 'Engine OFF'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Binance API:</span>
                        <span
                          className={
                            showBotSliders && enableBinanceApi
                              ? 'text-blue-400 font-medium'
                              : 'text-zinc-500'
                          }
                        >
                          {showBotSliders && enableBinanceApi
                            ? userInfo.DecryptedKey
                              ? 'Configured (Live)'
                              : 'Not Configured'
                            : 'Inactive / Standby'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Strategy Engine:</span>
                        <span
                          className={`font-medium truncate max-w-[140px] ${showBotSliders && strategyEngineOn ? 'text-zinc-200' : 'text-amber-400/90'
                            }`}
                        >
                          {showBotSliders && strategyEngineOn ? userInfo.StrategyName : 'Engine OFF (Standby)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Liquidation Guard:</span>
                        <span
                          className={
                            showBotSliders && enableBinanceApi && userInfo.AvoidLiquidation
                              ? 'text-emerald-400'
                              : 'text-zinc-500'
                          }
                        >
                          {showBotSliders && enableBinanceApi && userInfo.AvoidLiquidation ? '90% Buffer ON' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isSubmitting ? 'Provisioning User & Bot...' : 'Provision User & Deploy Bot'}</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-zinc-500 font-mono leading-normal text-center">
                    Super User action will register this user in the fleet directory, enable instant login with assigned password, and configure execution parameters.
                  </p>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default CreateUser