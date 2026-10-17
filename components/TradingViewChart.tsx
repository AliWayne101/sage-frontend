"use client"
import { Candle, Direction, HeartbeatActiveTrade, Position } from '@/interfaces'
import { formatCurrency, formatPercent } from '@/utils'
import { CandlestickSeries, ColorType, createChart, createSeriesMarkers, CrosshairMode, HistogramSeries, IPriceLine, ISeriesApi, LineStyle, PriceScaleMode, UTCTimestamp } from 'lightweight-charts'
import { Activity, BarChart2, Compass, Layers, Maximize2, Minimize2, Tag } from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'

export interface TradingViewChartInterface {
    candles: Candle[],
    position: HeartbeatActiveTrade | undefined,
    trades: Position[],
    symbol: string,
    interval: string,
    isLoading: boolean
}

const TradingViewChart = ({ candles, interval, isLoading, position, symbol, trades }: TradingViewChartInterface) => {

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick', any> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram', any> | null>(null);
    const markersPluginRef = useRef<any>(null);
    const priceLinesRef = useRef<IPriceLine[]>([]);
    const initialFitDoneRef = useRef<boolean>(false);

    const [showMarkers, setShowMarkers] = useState(true);
    const [showPriceLines, setShowPriceLines] = useState(true);
    const [showVolume, setShowVolume] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);


    // Reset fit flag on symbol or interval switch
    useEffect(() => {
        initialFitDoneRef.current = false;
    }, [symbol, interval]);

    const latestCandle = useMemo(() => {
        return candles.length > 0 ? candles[candles.length - 1] : null;
    }, [candles]);


    const activeDisplayCandle = hoveredCandle || latestCandle;

    useEffect(() => {
        if (!markersPluginRef.current || !candleSeriesRef.current) return;

        if (!showMarkers || candles.length === 0) {
            markersPluginRef.current.setMarkers([]);
            return;
        }

        const markers: any[] = [];

        const barIndexToCandleMap = new Map<number, Candle>();
        candles.forEach((c, index) => {
            const idx = c.barIndex !== undefined ? c.barIndex : index;
            barIndexToCandleMap.set(idx, c);
        });

        if (position) {
            const entryBarIdx = position.entryBarIndex;
            const entryCandle =
                entryBarIdx !== undefined ? barIndexToCandleMap.get(entryBarIdx) : candles[Math.max(0, candles.length - 25)];

            if (entryCandle !== undefined && entryBarIdx !== 0) {
                const isLong = position.side === Direction.Long;
                markers.push({
                    time: Math.floor(entryCandle.open_time / 1000) as UTCTimestamp,
                    position: isLong ? 'belowBar' : 'aboveBar',
                    color: isLong ? '#10b981' : '#f43f5e',
                    shape: isLong ? 'arrowUp' : 'arrowDown',
                    text: isLong ? `LONG #${entryBarIdx ?? ''}` : `SHORT #${entryBarIdx ?? ''}`,
                    size: 1.2,
                    id: `pos_entry_${position.orderId || 'active'}`,
                });
            }
        }

        trades.forEach((trade) => {
            if (trade.entryBarIndex === undefined || trade.entryBarIndex === 0) return;

            const openBar = trade.entryBarIndex;
            const isLong = trade.side === Direction.Long;
            const candle = barIndexToCandleMap.get(openBar);

            if (candle) {
                markers.push({
                    time: Math.floor(candle.open_time / 1000) as UTCTimestamp,
                    position: isLong ? 'belowBar' : 'aboveBar',
                    color: isLong ? '#10b981' : '#f43f5e',
                    shape: isLong ? 'arrowUp' : 'arrowDown',
                    text: isLong ? `BUY #${openBar}` : `SELL #${openBar}`,
                    size: 1.1,
                    id: `trade_entry_${trade.uid || trade.orderId}`,
                });
            }

            if (trade.closeBarIndex !== undefined) {
                const exitCandle = barIndexToCandleMap.get(trade.closeBarIndex);
                if (exitCandle) {
                    const isWin = (trade.realizedPnl ?? 0) >= 0;
                    markers.push({
                        time: Math.floor(exitCandle.open_time / 1000) as UTCTimestamp,
                        position: isLong ? 'aboveBar' : 'belowBar',
                        color: isWin ? '#10b981' : '#f43f5e',
                        shape: isLong ? 'arrowDown' : 'arrowUp',
                        text: `${isWin ? 'TP' : 'SL'} #${trade.closeBarIndex} (${isWin ? '+' : ''}$${Math.round(trade.realizedPnl ?? 0)})`,
                        size: 1.1,
                        id: `trade_exit_${trade.uid || trade.orderId}`,
                    });
                }
            }
        });

        const sortedMarkers = [...markers].sort((a, b) => {
            const diff = (a.time as number) - (b.time as number);
            if (diff !== 0) return diff;
            return (a.id || '').localeCompare(b.id || '');
        });

        try {
            markersPluginRef.current.setMarkers(sortedMarkers);
        } catch (err) {
            console.warn('Failed to set lightweight-charts markers:', err);
        }
    }, [candles, position, trades, showMarkers]);

    // Initialize and mount Lightweight Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Clean up any existing chart
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        const container = chartContainerRef.current;
        const chart = createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight || 420,
            layout: {
                background: { type: ColorType.Solid, color: '#0c0c0e' },
                textColor: '#94a3b8',
                fontSize: 11,
                fontFamily: "'JetBrains Mono', 'Roboto Mono', 'SF Pro Text', Menlo, monospace",
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.04)', style: LineStyle.SparseDotted },
                horzLines: { color: 'rgba(255, 255, 255, 0.04)', style: LineStyle.SparseDotted },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    color: '#64748b',
                    width: 1,
                    style: LineStyle.Dashed,
                    labelBackgroundColor: '#1e293b',
                },
                horzLine: {
                    color: '#64748b',
                    width: 1,
                    style: LineStyle.Dashed,
                    labelBackgroundColor: '#1e293b',
                },
            },
            rightPriceScale: {
                mode: PriceScaleMode.Normal,
                borderColor: '#27272a',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.22,
                },
            },
            timeScale: {
                borderColor: '#27272a',
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 12,
                barSpacing: 14,
                minBarSpacing: 5,
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: true,
            },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true,
            },
        });

        // Add Candlestick Series styled to match terminal theme (Emerald Green / Rose Red)
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10b981',
            downColor: '#f43f5e',
            borderVisible: true,
            wickVisible: true,
            borderUpColor: '#10b981',
            borderDownColor: '#f43f5e',
            wickUpColor: '#10b981',
            wickDownColor: '#f43f5e',
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01,
            },
        });

        // Add Volume Histogram Series pinned at bottom overlay
        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#38bdf8',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '', // overlay without separate price axis
        });

        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.82,
                bottom: 0,
            },
        });

        // Initialize Markers Plugin
        const markersPlugin = createSeriesMarkers(candleSeries, []);

        // Crosshair move handler to update OHLCV legend
        chart.subscribeCrosshairMove((param) => {
            if (!param || !param.time || !param.seriesData) {
                setHoveredCandle(null);
                return;
            }

            const candlePoint = param.seriesData.get(candleSeries) as any;
            if (candlePoint) {
                // Find corresponding candle from input dataset to display exact barIndex
                const matched = candles.find((c) => Math.floor(c.open_time / 1000) === (param.time as number));
                if (matched) {
                    setHoveredCandle(matched);
                } else {
                    setHoveredCandle({
                        symbol,
                        open_time: (param.time as number) * 1000,
                        close_time: (param.time as number) * 1000 + 60000,
                        interval,
                        open: candlePoint.open,
                        high: candlePoint.high,
                        low: candlePoint.low,
                        close: candlePoint.close,
                        volume: 0,
                        barIndex: undefined,
                    });
                }
            } else {
                setHoveredCandle(null);
            }
        });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
        volumeSeriesRef.current = volumeSeries;
        markersPluginRef.current = markersPlugin;

        // Resize observer to keep chart responsive to container dimensions
        const resizeObserver = new ResizeObserver((entries) => {
            if (!entries || entries.length === 0 || !chartRef.current) return;
            const { width, height } = entries[0].contentRect;
            chartRef.current.applyOptions({ width, height: height || 420 });
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            if (markersPluginRef.current?.detach) {
                try {
                    markersPluginRef.current.detach();
                } catch {
                    // ignore
                }
            }
            chart.remove();
            chartRef.current = null;
            candleSeriesRef.current = null;
            volumeSeriesRef.current = null;
            markersPluginRef.current = null;
            priceLinesRef.current = [];
        };
    }, []);

    useEffect(() => {
        if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) return;

        // Format candlestick data with UTC timestamp in seconds and guarantee valid OHLC
        const formattedCandles = candles.map((c) => ({
            time: Math.floor(c.open_time / 1000) as UTCTimestamp,
            open: c.open,
            high: Math.max(c.open, c.close, c.high),
            low: Math.min(c.open, c.close, c.low),
            close: c.close,
        }));

        // Deduplicate & sort by time ascending (strict lightweight-charts requirement)
        const sortedCandles = [...formattedCandles].sort((a, b) => (a.time as number) - (b.time as number));
        const uniqueCandles = sortedCandles.filter((item, index, arr) => {
            return index === 0 || item.time > arr[index - 1].time;
        });

        candleSeriesRef.current.setData(uniqueCandles);

        // Format Volume bars with corresponding bull/bear tint
        if (showVolume) {
            const formattedVolume = candles.map((c) => {
                const isBull = c.close >= c.open;
                return {
                    time: Math.floor(c.open_time / 1000) as UTCTimestamp,
                    value: c.volume,
                    color: isBull ? 'rgba(16, 185, 129, 0.28)' : 'rgba(244, 63, 94, 0.28)',
                };
            });
            const sortedVolume = [...formattedVolume].sort((a, b) => (a.time as number) - (b.time as number));
            const uniqueVolume = sortedVolume.filter((item, index, arr) => {
                return index === 0 || item.time > arr[index - 1].time;
            });
            volumeSeriesRef.current.setData(uniqueVolume);
        } else {
            volumeSeriesRef.current.setData([]);
        }

        // Auto fit content to screen on initial load so candles are cleanly proportioned
        if (chartRef.current && !initialFitDoneRef.current && uniqueCandles.length > 0) {
            chartRef.current.timeScale().fitContent();
            initialFitDoneRef.current = true;
        }
    }, [candles, showVolume]);

    const handleFitContent = () => {
        if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
        }
    };

    useEffect(() => {
        if (!candleSeriesRef.current) return;

        // Remove existing price lines
        priceLinesRef.current.forEach((line) => {
            try {
                candleSeriesRef.current?.removePriceLine(line);
            } catch {
                // ignore
            }
        });
        priceLinesRef.current = [];

        if (!showPriceLines || !position) return;

        const series = candleSeriesRef.current;
        const isLong = position.side === Direction.Long;

        // 1. Entry Price Line (Cyan / Sky)
        if (position.entryPrice) {
            const entryLine = series.createPriceLine({
                price: position.entryPrice,
                color: '#06b6d4',
                lineWidth: 1,
                lineStyle: LineStyle.Dashed,
                axisLabelVisible: true,
                title: `ENTRY: $${formatCurrency(position.entryPrice, 2)}`,
            });
            priceLinesRef.current.push(entryLine);
        }

        // 2. Take-Profit Estimated Line (+2.0% default or calculated)
        const tpPrice = isLong
            ? position.entryPrice * 1.02
            : position.entryPrice * 0.98;

        const tpLine = series.createPriceLine({
            price: Math.round(tpPrice * 100) / 100,
            color: '#10b981',
            lineWidth: 1,
            lineStyle: LineStyle.SparseDotted,
            axisLabelVisible: true,
            title: `TP TARGET: $${formatCurrency(tpPrice, 2)}`,
        });
        priceLinesRef.current.push(tpLine);

        // 3. Liquidation / Avoid Liquidation Buffer Line (Red)
        // if (position.liquidationPrice) {
        //     const liqLine = series.createPriceLine({
        //         price: position.liquidationPrice,
        //         color: '#ef4444',
        //         lineWidth: 1,
        //         lineStyle: LineStyle.LargeDashed,
        //         axisLabelVisible: true,
        //         title: `LIQ: $${formatCurrency(position.liquidationPrice, 2)}`,
        //     });
        //     priceLinesRef.current.push(liqLine);
        // }
    }, [position, showPriceLines]);

    const priceChange = activeDisplayCandle
        ? activeDisplayCandle.close - activeDisplayCandle.open
        : 0;
    const priceChangePercent = activeDisplayCandle && activeDisplayCandle.open > 0
        ? (priceChange / activeDisplayCandle.open) * 100
        : 0;
    const isCandleBullish = priceChange >= 0;

    return (
        <div
            className={`bg-[#121214] border border-[#27272a] rounded-lg flex flex-col overflow-hidden transition-all duration-200 ${isExpanded ? 'fixed inset-4 z-50 shadow-2xl bg-[#0e0e11]' : ''}`}
        >
            {/* 1. Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-[#27272a] bg-[#0c0c0e] gap-2.5">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Symbol Indicator (Hardcoded by Strategy) */}
                    <div className="flex items-center gap-2 bg-[#18181b] px-3 py-1 rounded border border-[#27272a]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-mono font-bold text-zinc-100 uppercase tracking-wide">
                            {symbol}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">PERP</span>
                    </div>

                    {/* Timeframe Indicator (Hardcoded by Strategy KlineBar) */}
                    <div className="flex items-center gap-1.5 bg-[#18181b] px-2.5 py-1 rounded border border-[#27272a] font-mono text-xs">
                        <span className="text-[10.5px] uppercase text-zinc-500 font-semibold">Timeframe</span>
                        <span className="font-bold text-blue-400">{interval}</span>
                    </div>

                    {/* Last Closed Candle Price Display */}
                    {latestCandle && (
                        <div className="hidden md:flex items-center gap-2 font-mono text-xs pl-2 border-l border-[#27272a]">
                            <span className="text-zinc-400">Last Close:</span>
                            <span
                                className={`font-bold transition-colors ${isCandleBullish ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                            >
                                ${formatCurrency(latestCandle.close, 2)}
                            </span>
                            <span
                                className={`text-[11px] ${isCandleBullish ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                            >
                                {isCandleBullish ? '+' : ''}
                                {formatPercent(priceChangePercent, 2)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Action Controls & Toggles */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Marker Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowMarkers(!showMarkers)}
                        title="Toggle Entry and Exit Markers"
                        className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1 border transition-colors ${showMarkers
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                            }`}
                    >
                        <Tag className="w-3 h-3" />
                        <span className="hidden sm:inline">Markers</span>
                        <span className="text-[9px] uppercase opacity-75">{showMarkers ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* Price Lines Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowPriceLines(!showPriceLines)}
                        title="Toggle TP / Liquidation Price Lines"
                        className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1 border transition-colors ${showPriceLines
                            ? 'bg-blue-950/60 text-blue-300 border-blue-700/60'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                            }`}
                    >
                        <Layers className="w-3 h-3" />
                        <span className="hidden sm:inline">Levels</span>
                        <span className="text-[9px] uppercase opacity-75">{showPriceLines ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* Volume Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowVolume(!showVolume)}
                        title="Toggle Volume Histogram"
                        className={`p-1 sm:px-2 sm:py-1 rounded text-[11px] font-mono flex items-center gap-1 border transition-colors ${showVolume
                            ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                            }`}
                    >
                        <BarChart2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Vol</span>
                    </button>

                    {/* Fit Content Button */}
                    <button
                        type="button"
                        onClick={handleFitContent}
                        title="Fit Chart to Content"
                        className="p-1 sm:px-2 sm:py-1 rounded text-[11px] font-mono bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center gap-1"
                    >
                        <Compass className="w-3 h-3" />
                        <span className="hidden sm:inline">Auto</span>
                    </button>

                    {/* Expand / Minimize Fullscreen Toggle */}
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        title={isExpanded ? 'Minimize' : 'Expand Chart'}
                        className="p-1.5 rounded bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 transition-colors"
                    >
                        {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* 2. TradingView Interactive OHLCV Floating HUD */}
            <div className="px-3.5 py-1.5 bg-[#0c0c0e]/90 border-b border-[#1c1c1f] flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-zinc-400 select-none">
                <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-zinc-200">{symbol}</span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-blue-400">{interval}</span>
                </div>

                {activeDisplayCandle && (
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                        <span>
                            O: <span className="text-zinc-200 font-semibold">${formatCurrency(activeDisplayCandle.open, 2)}</span>
                        </span>
                        <span>
                            H: <span className="text-zinc-200 font-semibold">${formatCurrency(activeDisplayCandle.high, 2)}</span>
                        </span>
                        <span>
                            L: <span className="text-zinc-200 font-semibold">${formatCurrency(activeDisplayCandle.low, 2)}</span>
                        </span>
                        <span>
                            C:{' '}
                            <span
                                className={`font-semibold ${isCandleBullish ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                            >
                                ${formatCurrency(activeDisplayCandle.close, 2)}
                            </span>
                        </span>
                        <span>
                            Chg:{' '}
                            <span
                                className={`font-semibold ${isCandleBullish ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                            >
                                {priceChange >= 0 ? '+' : ''}${formatCurrency(priceChange, 2)} ({priceChangePercent >= 0 ? '+' : ''}
                                {formatPercent(priceChangePercent, 2)})
                            </span>
                        </span>
                        <span>
                            Vol: <span className="text-zinc-300">{activeDisplayCandle.volume.toFixed(2)}</span>
                        </span>
                        {activeDisplayCandle.barIndex !== undefined && (
                            <span className="bg-zinc-800/80 px-1.5 py-0.2 rounded text-[10px] text-zinc-300 border border-zinc-700/50">
                                Bar #{activeDisplayCandle.barIndex}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* 3. Lightweight Charts Canvas Container */}
            <div className="relative flex-1 w-full bg-[#0c0c0e]" style={{ minHeight: isExpanded ? '680px' : '420px' }}>
                <div ref={chartContainerRef} className="w-full h-full absolute inset-0" />

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-10">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300">
                            <Activity className="w-4 h-4 text-blue-400 animate-spin" />
                            <span>Streaming candles & indicators...</span>
                        </div>
                    </div>
                )}

                {/* Markers Legend Hint at Bottom Left */}
                {/* {showMarkers && (
                    <div className="absolute bottom-2 left-2 z-10 pointer-events-none hidden sm:flex items-center gap-2 px-2 py-1 rounded bg-[#09090b]/80 border border-zinc-800/80 font-mono text-[10px] text-zinc-400 backdrop-blur-xs">
                        <span className="flex items-center gap-1 text-emerald-400">
                            <span>▲</span> Long Entry
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span className="flex items-center gap-1 text-rose-400">
                            <span>▼</span> Short Entry
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span className="flex items-center gap-1 text-sky-400">
                            <span>▼/▲</span> Exit (TP/SL)
                        </span>
                    </div>
                )} */}

                {/* Active Position Overlay Banner if Position is Active */}
                {/* {position && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900/90 border border-zinc-700/80 font-mono text-[11px] shadow-lg backdrop-blur-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="font-semibold text-zinc-200 uppercase">
                            {position.side === 0 ? 'LONG' : 'SHORT'} {position.quantity} {position.symbol}
                        </span>
                        <span className="text-zinc-500">|</span>
                        <span className="text-zinc-400">Entry: ${formatCurrency(position.entryPrice, 2)}</span>
                        <span className="text-zinc-500">|</span>
                        <span className={((position.unrealizedPnl ?? 0) >= 0) ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {((position.unrealizedPnl ?? 0) >= 0) ? '+' : ''}${formatCurrency(position.unrealizedPnl ?? 0, 2)} ({formatPercent(position.roePercent ?? 0, 2)})
                        </span>
                        {position.barIndex !== undefined && (
                            <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1 rounded">
                                Bar #{position.barIndex}
                            </span>
                        )}
                    </div>
                )} */}
            </div>

            {/* 4. Chart Footer Info Bar */}
            <div className="flex flex-wrap items-center justify-between px-3.5 py-1.5 sm:px-4 bg-[#0c0c0e] border-t border-[#1c1c1f] font-mono text-[10px] text-zinc-500">
                <div className="flex items-center gap-2">
                    <span>Engine: <span className="text-zinc-300">TradingView HTML5 Canvas</span></span>
                    <span>·</span>
                    <span>Feed: <span className="text-zinc-300">Completed Filled Candles (Stopped on Last Closed Bar)</span></span>
                </div>
                <div className="flex items-center gap-3">
                    <span>Total Bars: <span className="text-zinc-300">{candles.length}</span></span>
                    {position && position.entryBarIndex !== undefined && (
                        <span>Position Entry Bar: <span className="text-emerald-400 font-semibold">#{position.entryBarIndex}</span></span>
                    )}
                </div>
            </div>
        </div>
    )
}

export default TradingViewChart