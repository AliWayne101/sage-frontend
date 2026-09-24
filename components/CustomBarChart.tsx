'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

export type CustomBarChartMetric = {
    key: string
    text: string
    color: string
    icon: LucideIcon
    description?: string
}

export type CustomBarChartData = {
    [key: string]: string | number
}

export type CustomBarChartProps = {
    title: string
    description?: string
    overviewTitle?: string | ((activeMetricKey: string) => string)
    overviewData?: string | ((activeMetricKey: string) => string)
    data: CustomBarChartData[]
    metrics: CustomBarChartMetric[]
    defaultMetric?: string
    xDataKey?: string
    valueFormatter?: (value: number) => string
    cellColor?: (
        value: number,
        entry: CustomBarChartData,
        activeMetricKey: string
    ) => string

    emptyMessage?: string
}

const CustomBarChart = ({
    title,
    description,
    overviewTitle,
    overviewData,
    data,
    metrics,
    defaultMetric,
    xDataKey = 'day',
    valueFormatter = (value) => String(value),
    cellColor,
    emptyMessage = 'No chart data available',
}: CustomBarChartProps) => {
    const [selectedMetric, setSelectedMetric] = useState(
        defaultMetric ?? metrics[0]?.key ?? ''
    )

    const activeMetric = metrics.find(
        (metric) => metric.key === selectedMetric
    )

    // Evaluate static string or dynamic function props
    const renderOverviewTitle = () => {
        if (typeof overviewTitle === 'function') {
            return overviewTitle(selectedMetric)
        }
        return overviewTitle ?? 'Total:'
    }

    const renderOverviewData = () => {
        if (typeof overviewData === 'function') {
            return overviewData(selectedMetric)
        }
        return overviewData ?? ''
    }

    return (
        <div className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 sm:p-5 flex flex-col">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">

                <div>
                    <div className="flex flex-wrap items-center gap-2.5">

                        {/* Title */}
                        <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                            {title}
                        </h3>

                        {/* Metric Toggle Buttons */}
                        {metrics.length > 0 && (
                            <div className="inline-flex items-center p-0.5 rounded-md bg-[#09090b] border border-[#27272a]">

                                {metrics.map((metric) => {
                                    const Icon = metric.icon
                                    const isActive = selectedMetric === metric.key

                                    return (
                                        <button
                                            key={metric.key}
                                            type="button"
                                            onClick={() => setSelectedMetric(metric.key)}
                                            className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${isActive
                                                    ? 'text-white shadow-sm'
                                                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                                                }`}
                                            style={
                                                isActive
                                                    ? {
                                                        backgroundColor: metric.color,
                                                        boxShadow: `0 0 8px ${metric.color}40`,
                                                    }
                                                    : undefined
                                            }
                                        >
                                            <Icon className="w-3 h-3" />
                                            <span>{metric.text}</span>
                                        </button>
                                    )
                                })}

                            </div>
                        )}

                    </div>

                    {/* Metric / Chart Description */}
                    <p className="text-[11px] text-zinc-500 font-mono mt-1">
                        {activeMetric?.description ?? description}
                    </p>
                </div>

                {/* Overview Header (Title + Dynamic Value) */}
                <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-zinc-400">
                        {renderOverviewTitle()}
                    </span>

                    <span
                        className="font-bold"
                        style={{
                            color: activeMetric?.color ?? '#34d399',
                        }}
                    >
                        {renderOverviewData()}
                    </span>
                </div>
            </div>

            {/* Chart Container */}
            <div className="h-52 sm:h-60 w-full">

                {data.length > 0 && activeMetric ? (

                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                            }}
                        >
                            {/* Grid */}
                            <CartesianGrid
                                stroke="#27272a"
                                strokeDasharray="3 3"
                                vertical={false}
                            />

                            {/* X Axis */}
                            <XAxis
                                dataKey={xDataKey}
                                stroke="#71717a"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                            />

                            {/* Y Axis */}
                            <YAxis
                                stroke="#71717a"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={valueFormatter}
                            />

                            {/* Tooltip */}
                            <Tooltip
                                cursor={{
                                    fill: 'rgba(255, 255, 255, 0.04)',
                                }}
                                contentStyle={{
                                    backgroundColor: '#09090b',
                                    borderColor: '#27272a',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontFamily: 'monospace',
                                }}
                                itemStyle={{
                                    color: activeMetric.color,
                                }}
                                labelStyle={{
                                    color: '#a1a1aa',
                                }}
                                formatter={(value: any) => [
                                    valueFormatter(Number(value)),
                                    activeMetric.text,
                                ]}
                            />

                            {/* Bars */}
                            <Bar
                                dataKey={activeMetric.key}
                                fill={activeMetric.color}
                                radius={[3, 3, 0, 0]}
                            >
                                {data.map((entry, index) => {
                                    const value = Number(entry[activeMetric.key])

                                    return (
                                        <Cell
                                            key={`${activeMetric.key}-cell-${index}`}
                                            fill={
                                                cellColor
                                                    ? cellColor(value, entry, activeMetric.key)
                                                    : activeMetric.color
                                            }
                                        />
                                    )
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                ) : (

                    <div className="h-full flex items-center justify-center text-zinc-600 text-xs font-mono">
                        {data.length === 0
                            ? emptyMessage
                            : 'No metric selected'}
                    </div>

                )}

            </div>

        </div>
    )
}

export default CustomBarChart