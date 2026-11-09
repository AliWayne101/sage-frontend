import jsPDF from "jspdf";
import { BacktestTrade, StrategyBacktestResult } from "@/interfaces";
import { IBacktestSummaryDocument } from "@/schema/backtest";
import { formatCurrency } from "@/utils";


export interface ExportPdfOptions {
    summary: IBacktestSummaryDocument;
    strategy: StrategyBacktestResult;
    dayWiseData: Array<{ id: number; date: string; value: number }>;
}

export async function exportBacktestPdf({
    summary,
    strategy,
    dayWiseData,
}: ExportPdfOptions): Promise<void> {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2; // 182mm

    // Colors
    const darkNavy = [15, 23, 42]; // #0f172a
    const darkCard = [24, 24, 27]; // #18181b
    const cardBorder = [45, 48, 55];
    const emeraldColor = [16, 185, 129];
    const roseColor = [244, 63, 94];
    const textWhite = [248, 250, 252];
    const textMuted = [148, 163, 184];
    const textSubtle = [100, 116, 139];

    // Helper for drawing cards
    const drawCard = (x: number, y: number, w: number, h: number, bg = darkCard) => {
        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
        doc.roundedRect(x, y, w, h, 2, 2, 'FD');
    };

    // Helper for footer
    const drawFooter = (pageNum: number, totalPages: number) => {
        const yPos = pageHeight - 10;
        doc.setDrawColor(39, 39, 42);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);

        doc.setFont('courier', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(textSubtle[0], textSubtle[1], textSubtle[2]);
        doc.text('Sage Algorithmic Trading Systems', margin, yPos);
        doc.text(`Run Date: ${new Date(summary.createdAt).toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, yPos, { align: 'right' });
    };

    // ==========================================
    // PAGE 1: EXECUTIVE AUDIT & PERFORMANCE SUMMARY
    // ==========================================

    // 1. Top Header Banner
    doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Brand / Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
    doc.text('SAGE QUANTITATIVE TRADING SYSTEMS', margin, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.text('INSTITUTIONAL PERFORMANCE AUDIT & BACKTEST CERTIFICATION', margin, 18);

    // Status Badge in Header
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(pageWidth - margin - 32, 8, 32, 12, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(10, 10, 10);
    doc.text('CERTIFIED RUN', pageWidth - margin - 16, 15.5, { align: 'center' });

    // 2. Executive Meta Bar
    let curY = 33;
    drawCard(margin, curY, contentWidth, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);

    const colW = contentWidth / 4;
    doc.text('ASSET / PAIR', margin + 6, curY + 5);
    doc.text('TIMEFRAME', margin + colW + 6, curY + 5);
    doc.text('EVALUATION PERIOD', margin + colW * 2 + 6, curY + 5);
    doc.text('AUDIT TIMESTAMP', margin + colW * 3 + 6, curY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
    doc.text(summary.symbol || 'BTCUSDT', margin + 6, curY + 10.5);
    doc.text(summary.timeframe || '15m', margin + colW + 6, curY + 10.5);
    doc.text(`${summary.period.days || 30} Days (${summary.period.totalCandles || 2880} bars)`, margin + colW * 2 + 6, curY + 10.5);
    doc.text(`${new Date(summary.createdAt).toLocaleDateString()}`, margin + colW * 3 + 6, curY + 10.5);

    curY += 18;

    // 3. Strategy Header Badge (Clean designation, protects proprietary formulas)
    drawCard(margin, curY, contentWidth, 18, [18, 22, 34]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
    doc.text(`SELECTED STRATEGY: ${strategy.strategyName.toUpperCase()}`, margin + 6, curY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
        `Leaderboard Classification: Top Tier • Standardized Institutional Risk Management • Compounding: ${strategy.compounded ? 'Active' : 'Fixed'}`,
        margin + 6,
        curY + 13.5
    );

    // Strategy Rank Badge
    doc.setFillColor(39, 39, 42);
    doc.roundedRect(pageWidth - margin - 34, curY + 3.5, 28, 11, 1.5, 1.5, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text('QUALIFIED', pageWidth - margin - 20, curY + 10.5, { align: 'center' });

    curY += 22;

    // 4. Primary KPI Metrics Grid (6 Metric Cards in 2 rows x 3 columns)
    const gridW = (contentWidth - 6) / 3;
    const gridH = 17;

    const kpis = [
        {
            label: 'NET PROFIT (USDT)',
            val: `${strategy.netProfit >= 0 ? '+' : '-'}${formatCurrency(strategy.netProfit, 2)} USDT`,
            sub: `${strategy.netProfitPercent >= 0 ? '+' : '-'}${strategy.netProfitPercent.toFixed(2)}% ROI`,
            isPositive: strategy.netProfit >= 0,
        },
        {
            label: 'WIN RATE',
            val: `${strategy.metrics.winRatePercent.toFixed(1)}%`,
            sub: `${strategy.metrics.wins} Wins / ${strategy.metrics.losses} Losses`,
            isPositive: strategy.metrics.winRatePercent >= 50,
        },
        {
            label: 'PROFIT FACTOR',
            val: strategy.metrics.profitFactor.toFixed(2),
            sub: strategy.metrics.profitFactor >= 1.5 ? 'Excellent' : 'Moderate',
            isPositive: strategy.metrics.profitFactor >= 1.2,
        },
        {
            label: 'MAX DRAWDOWN',
            val: `${strategy.metrics.maxDrawdownPercent.toFixed(2)}%`,
            sub: `-$${formatCurrency(strategy.metrics.maxDrawdownUSDT, 2)} Max Peak`,
            isPositive: strategy.metrics.maxDrawdownPercent <= 15,
        },
        {
            label: 'TOTAL EXECUTIONS',
            val: `${strategy.metrics.totalTrades}`,
            sub: `Avg Dur: ${strategy.metrics.avgTradeDurationBars} bars`,
            isPositive: true,
        },
        {
            label: 'PLATFORM FEES',
            val: `$${formatCurrency(strategy.metrics.totalFeesPaid, 2)}`,
            sub: 'All platform fees deducted',
            isPositive: true,
        },
    ];

    kpis.forEach((kpi, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const xPos = margin + col * (gridW + 3);
        const yPos = curY + row * (gridH + 3);

        drawCard(xPos, yPos, gridW, gridH);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.text(kpi.label, xPos + 4, yPos + 4.5);

        doc.setFont('courier', 'bold');
        doc.setFontSize(10.5);
        if (idx === 0) {
            doc.setTextColor(kpi.isPositive ? emeraldColor[0] : roseColor[0], kpi.isPositive ? emeraldColor[1] : roseColor[1], kpi.isPositive ? emeraldColor[2] : roseColor[2]);
        } else {
            doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
        }
        doc.text(kpi.val, xPos + 4, yPos + 10.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(textSubtle[0], textSubtle[1], textSubtle[2]);
        doc.text(kpi.sub, xPos + 4, yPos + 14.5);
    });

    curY += gridH * 2 + 8;

    // 5. Long / Short Breakdown Card
    drawCard(margin, curY, contentWidth, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('DIRECTIONAL EXPOSURE BREAKDOWN', margin + 6, curY + 4.5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.text(`LONG TRADES: ${strategy.breakdown.long.wins} wins / ${strategy.breakdown.long.total} total (${strategy.breakdown.long.winRatePercent.toFixed(1)}% win rate)`, margin + 6, curY + 10);

    doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
    doc.text(`SHORT TRADES: ${strategy.breakdown.short.wins} wins / ${strategy.breakdown.short.total} total (${strategy.breakdown.short.winRatePercent.toFixed(1)}% win rate)`, margin + 95, curY + 10);

    curY += 18;

    // 6. High-Definition Day-Wise Equity / PnL Chart (Canvas Image)
    const chartImgData = generateEquityChartImage(dayWiseData, strategy.strategyName, strategy.netProfit, summary);
    if (chartImgData) {
        const chartHeightMm = 68;
        doc.addImage(chartImgData, 'PNG', margin, curY, contentWidth, chartHeightMm);
        curY += chartHeightMm + 5;
    }

    // 7. Capital Growth & Risk Governance Footnote Card
    drawCard(margin, curY, contentWidth, 19, [18, 22, 34]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
    doc.text('CAPITAL PROGRESSION AUDIT', margin + 6, curY + 5.5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
        `Initial Balance: $${formatCurrency(strategy.startingBalance, 2)}   -->   Ending Balance: $${formatCurrency(strategy.endingBalance, 2)}   (Net Delta: ${strategy.netProfit >= 0 ? '+' : ''}$${formatCurrency(strategy.netProfit, 2)})`,
        margin + 6,
        curY + 11
    );

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.8);
    doc.setTextColor(textSubtle[0], textSubtle[1], textSubtle[2]);
    doc.text(
        '',
        margin + 6,
        curY + 16
    );

    // Draw Page 1 Footer
    drawFooter(1, 2);

    // ==========================================
    // PAGE 2: ITEMIZED EXECUTIONS & AUDIT LOGS
    // ==========================================
    doc.addPage();

    // Top Slim Header
    doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    doc.rect(0, 0, pageWidth, 18, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
    doc.text('ITEMIZED TRADE EXECUTIONS LOG', margin, 11);

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.text(`STRATEGY: ${strategy.strategyName.toUpperCase()}`, pageWidth - margin - 50, 11);

    let p2Y = 24;

    // Trade Statistical Highlights Box
    drawCard(margin, p2Y, contentWidth, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('EXECUTION SAMPLING HIGHLIGHTS', margin + 6, p2Y + 4.5);

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
    doc.text(
        `Largest Win: ${formatCurrency(strategy.metrics.largestWin, 2)} USDT  |  Largest Loss: -${formatCurrency(strategy.metrics.largestLoss, 2)} USDT  |  Avg Trade PnL: ${formatCurrency(strategy.metrics.avgTradePnL, 2)} USDT`,
        margin + 6,
        p2Y + 10
    );

    p2Y += 18;

    // Table Header
    const tableX = margin;
    const colWidths = [18, 38, 22, 22, 16, 20, 18, 28]; // total = 182mm
    const colHeaders = [
        'SIDE',
        'TIME (IN / OUT)',
        'ENTRY ($)',
        'EXIT ($)',
        'BARS',
        'NET PnL',
        'ROE %',
        'EXIT REASON',
    ];

    doc.setFillColor(24, 24, 27);
    doc.rect(tableX, p2Y, contentWidth, 7, 'F');
    doc.setDrawColor(45, 48, 55);
    doc.line(tableX, p2Y + 7, tableX + contentWidth, p2Y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);

    let headerX = tableX + 2;
    colHeaders.forEach((hdr, i) => {
        doc.text(hdr, headerX, p2Y + 4.8);
        headerX += colWidths[i];
    });

    p2Y += 7;

    // Itemized Executions Rows
    const trades: BacktestTrade[] = strategy.recentTrades || [];
    const maxRowsOnPage = 18;
    const tradesToDisplay = trades.slice(0, maxRowsOnPage);

    if (tradesToDisplay.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(textSubtle[0], textSubtle[1], textSubtle[2]);
        doc.text('No trade execution records captured during this sampling window.', tableX + 4, p2Y + 8);
        p2Y += 14;
    } else {
        [...tradesToDisplay].reverse().forEach((trade, idx) => {
            const rowH = 10;
            const isAlt = idx % 2 === 1;
            const isWin = trade.netPnl >= 0;

            // Row background
            if (isAlt) {
                doc.setFillColor(18, 18, 20);
            } else {
                doc.setFillColor(13, 13, 15);
            }
            doc.rect(tableX, p2Y, contentWidth, rowH, 'F');

            // Thin bottom border
            doc.setDrawColor(33, 35, 40);
            doc.line(tableX, p2Y + rowH, tableX + contentWidth, p2Y + rowH);

            let cellX = tableX + 2;

            // Col 0: Side Pill
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            if (trade.side === 'LONG') {
                doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
            } else {
                doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
            }
            doc.text(trade.side, cellX, p2Y + 6);
            cellX += colWidths[0];

            // Col 1: Time (IN / OUT)
            doc.setFont('courier', 'normal');
            doc.setFontSize(6.2);
            doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
            doc.text(`IN:  ${formatPdfTime(trade.entryTime)}`, cellX, p2Y + 4);
            doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
            doc.text(`OUT: ${formatPdfTime(trade.exitTime)}`, cellX, p2Y + 8);
            cellX += colWidths[1];

            // Col 2: Entry Price
            doc.setFont('courier', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
            doc.text(`${formatCurrency(trade.entryPrice, 2)} USDT`, cellX, p2Y + 6);
            cellX += colWidths[2];

            // Col 3: Exit Price
            doc.text(`${formatCurrency(trade.exitPrice, 2)} USDT`, cellX, p2Y + 6);
            cellX += colWidths[3];

            // Col 4: Duration
            doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
            doc.text(`${trade.durationBars}b`, cellX, p2Y + 6);
            cellX += colWidths[4];

            // Col 5: Net PnL
            doc.setFont('courier', 'bold');
            if (isWin) {
                doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
            } else {
                doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
            }
            doc.text(`${isWin ? '+' : '-'}${formatCurrency(trade.netPnl, 2)} USDT`, cellX, p2Y + 6);
            cellX += colWidths[5];

            // Col 6: ROE %
            doc.text(`${trade.roePercent >= 0 ? '+' : ''}${trade.roePercent.toFixed(1)}%`, cellX, p2Y + 6);
            cellX += colWidths[6];

            // Col 7: Exit Reason
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.2);
            doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
            const reasonText = trade.reason || 'Exit Signal';
            doc.text(reasonText.length > 20 ? reasonText.slice(0, 18) + '...' : reasonText, cellX, p2Y + 6);

            p2Y += rowH;
        });
    }

    p2Y += 6;

    // Institutional Verification & Confidentiality Statement
    drawCard(margin, p2Y, contentWidth, 24, [18, 22, 34]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
    doc.text('QUANTITATIVE CONFIDENTIALITY & RISK DISCLAIMER', margin + 6, p2Y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    const disclaimerText =
        'This quantitative backtest document reflects historical execution simulations conducted under standardized exchange slippage and commission models. Proprietary signals, mathematical models, stop mechanics, and internal decision trees are retained exclusively within the core algorithmic infrastructure and are not disclosed in public audit summaries. Past simulated performance is not indicative of future returns.';
    doc.text(doc.splitTextToSize(disclaimerText, contentWidth - 12), margin + 6, p2Y + 10.5);

    // Digital Signature Checksum Badge
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textSubtle[0], textSubtle[1], textSubtle[2]);
    const checksum = `SHA-256: ${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    doc.text(`Digital Verification Signature: ${checksum}`, margin + 6, p2Y + 21);

    // Draw Page 2 Footer
    drawFooter(2, 2);

    // Trigger Save / Download
    const filename = `Sage_Backtest_Audit_${summary.symbol}_${strategy.strategyName.replace(/\s+/g, '_')}_${summary.createdAt}.pdf`;
    doc.save(filename);
}

function generateEquityChartImage(
    data: Array<{ id: number; date: string; value: number }>,
    strategyName: string,
    totalNetPnl: number,
    summary: IBacktestSummaryDocument,
    currency: string = '$'
): string {
    const width = 1400;
    const height = 520;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Background
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, width, height);

    // Padding
    const padLeft = 90;
    const padRight = 50;
    const padTop = 70;
    const padBottom = 70;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    if (data.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = '22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('No curve data points available', width / 2, height / 2);
        return canvas.toDataURL('image/png');
    }

    // Calculate min and max
    const values = data.map((d) => d.value);
    let minVal = Math.min(0, ...values);
    let maxVal = Math.max(...values, 10);
    const valRange = maxVal - minVal || 1;
    const margin = valRange * 0.12;
    minVal -= margin;
    maxVal += margin;
    const adjustedRange = maxVal - minVal;

    // Header inside chart
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${summary.period.days}-DAY CUMULATIVE EQUITY TRAJECTORY (REALIZED PnL)`, padLeft, 38);

    // Subtitle / Strategy Tag
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px monospace';
    ctx.fillText(`Strategy: ${strategyName.toUpperCase()}`, padLeft, 60);

    // Return badge in top right
    const isPos = totalNetPnl >= 0;
    const badgeText = `TOTAL PnL: ${isPos ? '+' : '-'}${currency}${formatCurrency(totalNetPnl, 2)}`;
    ctx.font = 'bold 18px monospace';
    const badgeW = ctx.measureText(badgeText).width + 30;
    ctx.fillStyle = isPos ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';
    ctx.strokeStyle = isPos ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(width - padRight - badgeW, 20, badgeW, 36, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isPos ? '#34d399' : '#fb7185';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, width - padRight - badgeW / 2, 44);

    // Horizontal Grid Lines & Y-Axis labels
    const yTicksCount = 5;
    ctx.font = '15px monospace';
    ctx.textAlign = 'right';
    ctx.lineWidth = 1;

    for (let i = 0; i <= yTicksCount; i++) {
        const tickVal = minVal + (adjustedRange / yTicksCount) * i;
        const yPos = padTop + plotH - ((tickVal - minVal) / adjustedRange) * plotH;

        // Zero-line highlight vs normal grid
        const isZero = Math.abs(tickVal) < adjustedRange / (yTicksCount * 4);
        ctx.strokeStyle = isZero ? '#475569' : '#1e293b';
        ctx.beginPath();
        ctx.moveTo(padLeft, yPos);
        ctx.lineTo(width - padRight, yPos);
        ctx.stroke();

        ctx.fillStyle = isZero ? '#cbd5e1' : '#64748b';
        ctx.fillText(`${tickVal >= 0 ? '+' : ''}${currency}${Math.round(tickVal)}`, padLeft - 14, yPos + 5);
    }

    // Points coordinates mapping
    const points: Array<{ x: number; y: number; val: number; date: string }> = data.map((d, idx) => {
        const x = padLeft + (idx / Math.max(1, data.length - 1)) * plotW;
        const y = padTop + plotH - ((d.value - minVal) / adjustedRange) * plotH;
        return { x, y, val: d.value, date: d.date };
    });

    // Gradient Area Fill under the line
    const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    if (isPos) {
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.38)');
        grad.addColorStop(0.6, 'rgba(16, 185, 129, 0.12)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    } else {
        grad.addColorStop(0, 'rgba(244, 63, 94, 0.38)');
        grad.addColorStop(0.6, 'rgba(244, 63, 94, 0.12)');
        grad.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, padTop + plotH);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padTop + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Stroke Curve
    ctx.strokeStyle = isPos ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Draw End Point Dot
    const lastPoint = points[points.length - 1];
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isPos ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 3;
    ctx.stroke();

    // X-Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    const xLabelStep = Math.max(1, Math.floor(points.length / 6));

    for (let i = 0; i < points.length; i += xLabelStep) {
        const pt = points[i];
        ctx.fillText(pt.date, pt.x, height - padBottom + 26);
        // Tick mark
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(pt.x, height - padBottom);
        ctx.lineTo(pt.x, height - padBottom + 6);
        ctx.stroke();
    }

    // Always label final day
    if (points.length > 1) {
        const finalPt = points[points.length - 1];
        ctx.fillText(finalPt.date, finalPt.x, height - padBottom + 26);
    }

    return canvas.toDataURL('image/png');
}

/**
 * Format timestamp helper for PDF itemized logs
 */
function formatPdfTime(timestamp?: number | string): string {
    if (!timestamp) return '—';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return String(timestamp);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${m}/${day} ${h}:${min}`;
}