import { formatCurrency } from '@/utils'
import React from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const CustomLineChart = () => {
    return (
        <div className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 sm:p-5 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                        Cumulative Realized PnL
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono">Net profit curve across closed futures trades</p>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-zinc-400">Total Net:</span>
                    <span className="text-emerald-400 font-bold">
                        +${formatCurrency(user?.PNL ?? runningPnl, 2)} USDT
                    </span>
                </div>
            </div>

            <div className="h-52 sm:h-60 w-full">
                {cumulativePnlData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cumulativePnlData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#71717a"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#71717a"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `$${val}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#09090b',
                                    borderColor: '#27272a',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontFamily: 'monospace',
                                }}
                                itemStyle={{ color: '#34d399' }}
                                labelStyle={{ color: '#a1a1aa' }}
                                formatter={(value: any) => [`$${value} USDT`, 'Cumulative PnL']}
                            />
                            <Area
                                type="monotone"
                                dataKey="pnl"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#pnlGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-xs font-mono">
                        No trade curve data available yet
                    </div>
                )}
            </div>
        </div>
    )
}

export default CustomLineChart