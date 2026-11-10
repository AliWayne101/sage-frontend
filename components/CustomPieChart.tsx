import { formatCurrency } from '@/utils';
import React from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';


export interface PieChartSlice {
    name: string;
    value: number;
    color?: string;
    formattedValue?: string;
}

export interface CustomPieChartProps {
    title: string;
    description: string;
    overviewTitle: string;
    overviewData: string;
    data: PieChartSlice[];
    valueFormatter?: (value: number) => string;
    centerLabel?: string;
    centerValue?: string;
}

const DEFAULT_COLORS = ['#10b981', '#38bdf8', '#fbbf24', '#f43f5e', '#a855f7'];

const CustomPieChart: React.FC<CustomPieChartProps> = ({
    title,
    description,
    overviewTitle,
    overviewData,
    data,
    valueFormatter = (val) => `$${formatCurrency(val, 2)}`,
    centerLabel,
    centerValue,
}) => {
    const totalValue = data.reduce((sum, item) => sum + (item.value > 0 ? item.value : 0), 0);

    return (
        <div className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 sm:p-5 flex flex-col font-mono">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                <div>
                    <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-300">
                        {title}
                    </h3>
                    <p className="text-[11px] text-zinc-500">{description}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-zinc-400">{overviewTitle}</span>
                    <span className="text-emerald-400 font-bold">{overviewData}</span>
                </div>
            </div>

            {/* Chart & Legend Container */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-56 sm:h-64">
                {data.length > 0 && totalValue > 0 ? (
                    <>
                        <div className="w-full sm:w-1/2 h-full relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#09090b',
                                            borderColor: '#27272a',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                        }}
                                        itemStyle={{ color: '#f4f4f5' }}
                                        labelStyle={{ color: '#a1a1aa' }}
                                        formatter={(value: any, name: any) => [
                                            valueFormatter(Number(value)),
                                            name,
                                        ]}
                                    />
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={52}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                        stroke="#121214"
                                        strokeWidth={2}
                                    >
                                        {data.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center Stat */}
                            {(centerLabel || centerValue) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                    {centerValue && (
                                        <span className="text-xs sm:text-sm font-bold text-white leading-tight">
                                            {centerValue}
                                        </span>
                                    )}
                                    {centerLabel && (
                                        <span className="text-[9.5px] text-zinc-500 uppercase tracking-wider">
                                            {centerLabel}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Custom Interactive Legend */}
                        <div className="w-full sm:w-1/2 flex flex-col justify-center gap-2 text-xs">
                            {data.map((item, idx) => {
                                const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
                                const pct = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0';
                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-2 rounded bg-[#09090b] border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: color }}
                                            />
                                            <span className="text-zinc-300 truncate text-[11px]">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-right shrink-0">
                                            <span className="font-bold text-zinc-100 text-[11px]">
                                                {item.formattedValue || valueFormatter(item.value)}
                                            </span>
                                            <span className="text-[10px] text-zinc-500 w-10 text-right">
                                                {pct}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                        No data available for breakdown
                    </div>
                )}
            </div>
        </div>
    )
}

export default CustomPieChart