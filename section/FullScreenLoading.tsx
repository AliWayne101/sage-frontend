import React, { useState, useEffect } from 'react'

interface FullScreenLoadingProps {
    message?: string;
    subtext?: string;
}

const loadingSubtexts = [
    "Querying secure database records & telemetry...",
    "Handshaking with Binance Futures quant server...",
    "Evaluating active risk parameters & alpha models...",
    "Synchronizing execution states across server nodes...",
];

const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
    message = 'INITIALIZING TERMINAL...',
    subtext,
}) => {
    const [currentSubtextIndex, setCurrentSubtextIndex] = useState(0);

    // Optional: Cycle through authentic quant engine subtexts dynamically
    useEffect(() => {
        if (subtext) return; // Use custom subtext if explicitly provided
        const interval = setInterval(() => {
            setCurrentSubtextIndex((prev) => (prev + 1) % loadingSubtexts.length);
        }, 2200);
        return () => clearInterval(interval);
    }, [subtext]);

    const activeSubtext = subtext || loadingSubtexts[currentSubtextIndex];

    return (
        <div className="fixed inset-0 bg-[#09090b]/85 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono">
            <div className="bg-[#121214] border border-[#27272a] rounded-lg p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-5 relative overflow-hidden">
                {/* Top Subtle Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-75" />

                {/* Branded Terminal Spinner */}
                <div className="relative flex items-center justify-center w-14 h-14">
                    {/* Outer Spinning Ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-[#27272a] border-t-blue-500 border-r-emerald-400/70 animate-spin" />

                    {/* Inner Sage Terminal Logo Badge */}
                    <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center font-sans font-bold text-white text-sm shadow-md shadow-blue-500/20">
                        S
                    </div>
                </div>

                {/* Status Readout */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <p className="text-xs font-bold text-zinc-100 uppercase tracking-widest">
                            {message}
                        </p>
                    </div>
                    <p className="text-[11px] text-zinc-400 transition-all duration-300 min-h-[28px] flex items-center justify-center">
                        {activeSubtext}
                    </p>
                </div>

                {/* Terminal Progress Bar / Node Indicator */}
                {/* <div className="w-full space-y-1.5">
                    <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden border border-zinc-800/80">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 w-2/3 rounded-full animate-pulse" />
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-zinc-500">
                        <span>SERVER: ONLINE</span>
                        <span>DB: SYNCED</span>
                    </div>
                </div> */}
            </div>
        </div>
    )
}

export default FullScreenLoading