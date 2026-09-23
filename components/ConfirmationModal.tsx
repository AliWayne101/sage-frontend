import React, { useEffect, useCallback } from 'react';
import {
    AlertTriangle,
    XCircle,
    AlertOctagon,
    Info,
    X,
    RefreshCw,
    ShieldAlert,
} from 'lucide-react';
import { TERMINAL_VER } from '@/configs';

export type ConfirmationVariant = 'danger' | 'warning' | 'info' | 'primary';

export interface ConfirmationModalDetail {
    label: string;
    value: React.ReactNode;
}

export interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title?: string;
    message: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmationVariant;
    isLoading?: boolean;
    details?: ConfirmationModalDetail[];
    confirmButtonDisabled?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    description,
    confirmText = 'Confirm Action',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false,
    details = [],
    confirmButtonDisabled = false,
}) => {
    // Handle ESC key press
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isLoading) {
                onClose();
            }
        },
        [onClose, isLoading]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    // Variant design tokens
    const variantStyles = {
        danger: {
            badge: 'text-rose-400 bg-rose-950/60 border-rose-800/80',
            glow: 'bg-rose-500/10',
            borderAccent: 'border-rose-900/50',
            icon: <XCircle className="w-5 h-5 text-rose-400" />,
            iconBox: 'bg-rose-950/80 border-rose-800/80 text-rose-400',
            confirmButton:
                'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50 border border-rose-500/40 focus:ring-rose-500/40',
            defaultTitle: 'Confirm Irreversible Action',
        },
        warning: {
            badge: 'text-amber-400 bg-amber-950/60 border-amber-800/80',
            glow: 'bg-amber-500/10',
            borderAccent: 'border-amber-900/50',
            icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
            iconBox: 'bg-amber-950/80 border-amber-800/80 text-amber-400',
            confirmButton:
                'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/50 border border-amber-500/40 focus:ring-amber-500/40',
            defaultTitle: 'Attention Required',
        },
        info: {
            badge: 'text-blue-400 bg-blue-950/60 border-blue-800/80',
            glow: 'bg-blue-500/10',
            borderAccent: 'border-blue-900/50',
            icon: <Info className="w-5 h-5 text-blue-400" />,
            iconBox: 'bg-blue-950/80 border-blue-800/80 text-blue-400',
            confirmButton:
                'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/50 border border-blue-500/40 focus:ring-blue-500/40',
            defaultTitle: 'Action Confirmation',
        },
        primary: {
            badge: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80',
            glow: 'bg-emerald-500/10',
            borderAccent: 'border-emerald-900/50',
            icon: <ShieldAlert className="w-5 h-5 text-emerald-400" />,
            iconBox: 'bg-emerald-950/80 border-emerald-800/80 text-emerald-400',
            confirmButton:
                'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 border border-emerald-500/40 focus:ring-emerald-500/40',
            defaultTitle: 'Confirm Execution',
        },
    }[variant];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={() => {
                    if (!isLoading) onClose();
                }}
            />

            {/* Modal Dialog Card */}
            <div
                className={`relative w-full max-w-lg bg-[#121214] border border-[#27272a] ${variantStyles.borderAccent} rounded-xl shadow-2xl shadow-black/80 overflow-hidden z-10 transition-all font-sans`}
            >
                {/* Ambient Top Glow */}
                <div
                    className={`absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-32 ${variantStyles.glow} rounded-full blur-3xl pointer-events-none`}
                />

                {/* Header Bar */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#27272a] bg-[#161619]/90 relative z-10">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg border ${variantStyles.iconBox}`}>
                            {variantStyles.icon}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
                                    {title || variantStyles.defaultTitle}
                                </span>
                                <span
                                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${variantStyles.badge}`}
                                >
                                    Confirmation
                                </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 font-mono">
                                Sage Terminal {TERMINAL_VER} Security Protocol
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors disabled:opacity-40"
                        aria-label="Close modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-6 space-y-4 relative z-10">
                    {/* Main Confirmation Message Prompt */}
                    <div className="space-y-1.5">
                        <h4 className="text-sm sm:text-base font-semibold text-white tracking-tight leading-snug">
                            {message}
                        </h4>
                        {description && (
                            <p className="text-xs sm:text-[13px] text-zinc-400 font-sans leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Optional Key Details Breakdown Grid */}
                    {details.length > 0 && (
                        <div className="bg-[#09090b] border border-[#27272a] rounded-lg p-3 space-y-2 font-mono text-xs">
                            <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 border-b border-zinc-800/80 pb-1.5">
                                Target Operation Parameters
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {details.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between sm:justify-start sm:gap-2">
                                        <span className="text-zinc-500 text-[11px] shrink-0">{item.label}:</span>
                                        <span className="text-zinc-200 font-semibold text-[11.5px] truncate">
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Security Notice Warning */}
                    {variant === 'danger' && (
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-[11px] font-mono text-rose-300">
                            <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            <span>
                                Orders placed via force close will immediately fill against the Binance Orderbook. Make sure slippage is acceptable.
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 px-4 sm:px-6 py-3.5 border-t border-[#27272a] bg-[#141417]/80 relative z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] text-zinc-300 hover:text-white text-xs font-mono font-medium transition-colors text-center disabled:opacity-50"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading || confirmButtonDisabled}
                        className={`w-full sm:w-auto px-5 py-2 rounded-lg text-xs font-mono font-semibold tracking-wide transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 disabled:opacity-50 ${variantStyles.confirmButton}`}
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Executing...</span>
                            </>
                        ) : (
                            <span>{confirmText}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
