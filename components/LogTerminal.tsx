import { Log } from '@/interfaces';
import { ArrowDown, Check, Copy, Terminal, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react'

interface LogTerminalProps {
    logs: Log[];
    onClear?: () => void;
}

const LogTerminal = ({ logs, onClear }: LogTerminalProps) => {

    const [activeFilter, setActiveFilter] = useState('ALL');
    const [copied, setCopied] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const terminalEndRef = useRef<HTMLDivElement>(null);
    const terminalContainerRef = useRef<HTMLDivElement>(null);


    const handleCopyLogs = async () => {
        const textToCopy = filteredLogs
            .map((l) => `[${l.timestamp}] [${l.type}] ${l.message}`)
            .join('\n');
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
        }
    };

    const filteredLogs = useMemo(() => {
        if (activeFilter === 'ALL') return logs;
        return logs.filter(log => log.type.toUpperCase() === activeFilter);
    }, [logs, activeFilter]);

    useEffect(() => {
        if (autoScroll && terminalContainerRef.current) {
            terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
        }
    }, [filteredLogs, autoScroll]);

    const getBadgeColor = (level: string) => {
        switch (level) {
            case 'order':
                return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
            case 'system':
                return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
            case 'error':
                return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
            default:
                return 'text-zinc-400 bg-zinc-800/60 border-zinc-700/60';
        }
    };

    return (
        <div className="flex flex-col bg-[#09090b] border border-[#27272a] rounded-lg overflow-hidden shadow-2xl">
            {/* Terminal Titlebar */}
            <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#121214] border-b border-[#27272a] gap-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 mr-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                    </div>
                    <Terminal className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-mono font-medium text-zinc-300">Sage Bot Runtime Terminal</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                        {filteredLogs.length} events
                    </span>
                </div>

                {/* Filter Tags & Controls */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {(['ALL', 'ORDERS', 'SYSTEM', 'ERRORS']).map((tag) => {
                        const isActive = activeFilter === tag;
                        return (
                            <button
                                key={tag}
                                onClick={() => setActiveFilter(tag)}
                                className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${isActive
                                    ? 'bg-zinc-800 text-zinc-100 border-zinc-500 font-semibold'
                                    : 'bg-transparent text-zinc-400 border-[#27272a] hover:text-zinc-200 hover:border-zinc-700'
                                    }`}
                            >
                                [{tag}]
                            </button>
                        );
                    })}

                    <div className="h-3.5 w-px bg-zinc-800 mx-1" />

                    <button
                        onClick={() => setAutoScroll(!autoScroll)}
                        title={autoScroll ? 'Disable Auto-Scroll' : 'Enable Auto-Scroll'}
                        className={`p-1 rounded text-xs border transition-colors ${autoScroll
                            ? 'text-emerald-400 border-emerald-900/60 bg-emerald-950/40'
                            : 'text-zinc-500 border-zinc-800 hover:text-zinc-300'
                            }`}
                    >
                        <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                        onClick={handleCopyLogs}
                        className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors"
                        title="Copy Logs to Clipboard"
                    >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    {onClear && (
                        <button
                            onClick={onClear}
                            className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-rose-900/60 text-zinc-400 hover:text-rose-400 transition-colors"
                            title="Clear Terminal View"
                            disabled={logs.length === 0}
                        >
                            <Trash2 className="w-3 h-3" />
                            <span>Clear</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Terminal View Body */}
            <div
                ref={terminalContainerRef}
                className="h-64 sm:h-72 overflow-y-auto p-3 font-mono text-[11.5px] leading-relaxed text-zinc-300 space-y-1.5 selection:bg-zinc-800 selection:text-white"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a #09090b' }}
            >
                {filteredLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-1">
                        <Terminal className="w-6 h-6 stroke-1 text-zinc-700" />
                        <p>No log entries matching [{activeFilter}]</p>
                    </div>
                ) : (
                    filteredLogs.map((log) => (
                        <div
                            key={log.timestamp + log.message}
                            className="flex items-start gap-2 hover:bg-zinc-900/50 px-1.5 py-0.5 rounded transition-colors group"
                        >
                            <span className="text-zinc-600 select-none shrink-0 text-[10.5px]">
                                {(new Date(log.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span
                                className={`text-[9.5px] px-1.5 py-0.2 rounded border font-semibold shrink-0 uppercase tracking-wide ${getBadgeColor(
                                    log.type
                                )}`}
                            >
                                {log.type}
                            </span>
                            <span
                                className={`break-all ${log.type === 'error'
                                    ? 'text-rose-300'
                                    : log.type === 'system'
                                        ? 'text-amber-200'
                                        : log.type === 'order'
                                            ? 'text-emerald-200'
                                            : 'text-zinc-300'
                                    }`}
                            >
                                {log.message}
                            </span>
                        </div>
                    ))
                )}
                <div ref={terminalEndRef} />
            </div>

            {/* Terminal Footer Status */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#09090b] border-t border-[#1c1c1f] text-[10.5px] font-mono text-zinc-500">
                <div className="flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>STDOUT / WS Stream Active</span>
                </div>
                <span>Buffer: {filteredLogs.length} items</span>
            </div>
        </div>
    )
}

export default LogTerminal