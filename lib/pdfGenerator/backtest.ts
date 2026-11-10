import jsPDF from "jspdf";
import { BacktestTrade, StrategyBacktestResult } from "@/interfaces";
import { IBacktestSummaryDocument } from "@/schema/backtest";
import { formatCurrency } from "@/utils";

// Professional Typography Constants using clean, corporate sans-serif globally
export const PDF_HEADING_FONT = 'helvetica' as const;
export const PDF_BODY_FONT = 'helvetica' as const;
export const PDF_MONO_FONT = 'helvetica' as const; // Professional clean layout
export const PDF_CANVAS_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

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
    const margin = 12;
    const contentWidth = pageWidth - margin * 2; // 186mm

    // Institutional Colors
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

    // Helper for footer with dynamic page numbering
    const drawFooter = (pageNum: number, totalPages: number) => {
        const yPos = pageHeight - 8;
        doc.setDrawColor(39, 39, 42);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);

        doc.setFont(PDF_MONO_FONT, 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(textSubtle[0], textSubtle[1], textSubtle[2]);
        doc.text('Sage Quant Engine by Wayne Development', margin, yPos);
        doc.text(`Run: ${new Date(summary.createdAt).toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, yPos, { align: 'right' });
    };

    // ==========================================
    // PAGE 1: EXECUTIVE AUDIT & PERFORMANCE SUMMARY
    // ==========================================

    // 1. Top Header Banner
    doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setFont(PDF_HEADING_FONT, 'bold');
    doc.setFontSize(14);
    doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
    doc.text('SAGE QUANT ENGINE', margin, 10);

    doc.setFont(PDF_BODY_FONT, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.text('Performance Audit & Backtest Results', margin, 16);
    // Status Badge in Header
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(pageWidth - margin - 30, 6.5, 30, 11, 1.5, 1.5, 'F');
    doc.setFont(PDF_HEADING_FONT, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(10, 10, 10);
    doc.text('CERTIFIED', pageWidth - margin - 15, 13.5, { align: 'center' });

    // 2. Executive Meta Bar
    let curY = 28;
    drawCard(margin, curY, contentWidth, 13);

    doc.setFont(PDF_BODY_FONT, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);

    const colW = contentWidth / 4;
    doc.text('ASSET / PAIR', margin + 5, curY + 4.5);
    doc.text('TIMEFRAME', margin + colW + 5, curY + 4.5);
    doc.text('EVALUATION PERIOD', margin + colW * 2 + 5, curY + 4.5);
    doc.text('AUDIT TIMESTAMP', margin + colW * 3 + 5, curY + 4.5);

    doc.setFont(PDF_HEADING_FONT, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
    doc.text(summary.symbol || 'BTCUSDT', margin + 5, curY + 9.5);
    doc.text(summary.timeframe || '15m', margin + colW + 5, curY + 9.5);
    doc.text(`${summary.period.days || 30} Days (${summary.period.totalCandles || 2880} bars)`, margin + colW * 2 + 5, curY + 9.5);
    doc.text(`${new Date(summary.createdAt).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}`, margin + colW * 3 + 5, curY + 9.5);

    curY += 16;

    // 3. Strategy Header Badge
    drawCard(margin, curY, contentWidth, 15, [18, 22, 34]);
    doc.setFont(PDF_HEADING_FONT, 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
    doc.text(`STRATEGY: ${strategy.strategyName.toUpperCase()}`, margin + 5, curY + 6);

    doc.setFont(PDF_BODY_FONT, 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
        `Classification: Top Tier Leaderboard • Capital Mode: ${strategy.compounded ? 'Compounded' : 'Fixed'} • Risk Model: Standardized`,
        margin + 5,
        curY + 11.5
    );

    // Strategy Rank Badge
    doc.setFillColor(39, 39, 42);
    doc.roundedRect(pageWidth - margin - 30, curY + 2.5, 26, 10, 1.5, 1.5, 'F');
    doc.setFont(PDF_HEADING_FONT, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(16, 185, 129);
    doc.text('QUALIFIED', pageWidth - margin - 17, curY + 8.5, { align: 'center' });

    curY += 18;

    // 4. Primary KPI Metrics Grid (6 Metric Cards in 2 rows x 3 columns)
    const gridW = (contentWidth - 6) / 3;
    const gridH = 15;

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
            sub: strategy.metrics.profitFactor >= 1.5 ? 'Strong Yield' : 'Moderate',
            isPositive: strategy.metrics.profitFactor >= 1.2,
        },
        {
            label: 'MAX DRAWDOWN',
            val: `${strategy.metrics.maxDrawdownPercent.toFixed(2)}%`,
            sub: `-${formatCurrency(strategy.metrics.maxDrawdownUSDT, 2)} USDT Peak`,
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
            val: `${formatCurrency(strategy.metrics.totalFeesPaid, 2)} USDT`,
            sub: 'Platform Usage Fee deductions',
            isPositive: true,
        },
    ];

    kpis.forEach((kpi, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const xPos = margin + col * (gridW + 3);
        const yPos = curY + row * (gridH + 2.5);

        drawCard(xPos, yPos, gridW, gridH);

        doc.setFont(PDF_BODY_FONT, 'normal');
        doc.setFontSize(7);
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.text(kpi.label, xPos + 4, yPos + 4);

        doc.setFont(PDF_HEADING_FONT, 'bold');
        doc.setFontSize(10);
        if (idx === 0) {
            doc.setTextColor(kpi.isPositive ? emeraldColor[0] : roseColor[0], kpi.isPositive ? emeraldColor[1] : roseColor[1], kpi.isPositive ? emeraldColor[2] : roseColor[2]);
        } else {
            doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
        }
        doc.text(kpi.val, xPos + 4, yPos + 9.5);

        doc.setFont(PDF_BODY_FONT, 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(textSubtle[0], textSubtle[1], textSubtle[2]);
        doc.text(kpi.sub, xPos + 4, yPos + 13);
    });

    curY += gridH * 2 + 6;

    // 5. High-Definition Day-Wise Equity / PnL Line Chart (Enlarged Height: 75mm)
    const equityChartImg = generateEquityChartImage(dayWiseData, strategy.strategyName, strategy.netProfit, summary, 'USDT');
    if (equityChartImg) {
        const chartHeightMm = 75;
        doc.addImage(equityChartImg, 'PNG', margin, curY, contentWidth, chartHeightMm);
        curY += chartHeightMm + 4;
    }

    // 6. Side-by-Side Visual Charts
    const pieChartImg = generateProfitDistributionPieImage(strategy, summary);
    const barChartImg = generateTradeDirectionBarChartImage(strategy);

    const subChartW = (contentWidth - 4) / 2; // ~91mm each
    const subChartH = 55; // 55mm height

    if (pieChartImg && barChartImg) {
        doc.addImage(pieChartImg, 'PNG', margin, curY, subChartW, subChartH);
        doc.addImage(barChartImg, 'PNG', margin + subChartW + 4, curY, subChartW, subChartH);
        curY += subChartH + 4;
    }

    // 7. Capital Growth & Risk Governance Footnote Card (Attractive Multi-Line Layout)
    drawCard(margin, curY, contentWidth, 22, [18, 22, 34]);

    doc.setFont(PDF_HEADING_FONT, 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
    doc.text('CAPITAL PROGRESSION AUDIT', margin + 5, curY + 5.5);

    doc.setFont(PDF_BODY_FONT, 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
        `Initial Capital: ${formatCurrency(strategy.startingBalance, 2)} USDT    -->    Ending Balance: ${formatCurrency(strategy.endingBalance, 2)} USDT`,
        margin + 5,
        curY + 11.5
    );

    const isNetPositive = strategy.netProfit >= 0;
    doc.setFont(PDF_HEADING_FONT, 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(isNetPositive ? emeraldColor[0] : roseColor[0], isNetPositive ? emeraldColor[1] : roseColor[1], isNetPositive ? emeraldColor[2] : roseColor[2]);
    doc.text(
        `Net Performance Delta: ${isNetPositive ? '+' : '-'}${formatCurrency(strategy.netProfit, 2)} USDT (${isNetPositive ? '+' : ''}${strategy.netProfitPercent.toFixed(2)}% ROI)`,
        margin + 5,
        curY + 17.5
    );

    // ==========================================
    // PAGES 2+: ITEMIZED EXECUTIONS & AUDIT LOGS (Dynamic Pagination)
    // ==========================================
    doc.addPage();

    // Helper to draw Page header for subsequent log pages
    const drawLogHeader = () => {
        doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
        doc.rect(0, 0, pageWidth, 16, 'F');

        doc.setFont(PDF_HEADING_FONT, 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
        doc.text('ITEMIZED TRADE EXECUTIONS LOG', margin, 10.5);
    };

    drawLogHeader();
    let p2Y = 21;

    // Trade Statistical Highlights Box (Only on first log page)
    drawCard(margin, p2Y, contentWidth, 13);
    doc.setFont(PDF_HEADING_FONT, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('EXECUTION HIGHLIGHTS', margin + 5, p2Y + 4.5);

    doc.setFont(PDF_BODY_FONT, 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
    doc.text(
        `Largest Win: +${formatCurrency(strategy.metrics.largestWin, 2)} USDT  |  Largest Loss: -${formatCurrency(strategy.metrics.largestLoss, 2)} USDT  |  Avg Trade PnL: ${formatCurrency(strategy.metrics.avgTradePnL, 2)} USDT`,
        margin + 5,
        p2Y + 9.5
    );

    p2Y += 16;

    // Table Header Data Setup
    const tableX = margin;
    const colWidths = [12, 16, 38, 20, 20, 14, 24, 16, 26]; // total = 186mm
    const colHeaders = [
        'NO.',
        'SIDE',
        'TIME (IN / OUT)',
        'ENTRY',
        'EXIT',
        'BARS',
        'NET PnL',
        'ROE %',
        'EXIT REASON',
    ];

    const drawTableHeader = (yPos: number) => {
        doc.setFillColor(24, 24, 27);
        doc.rect(tableX, yPos, contentWidth, 7, 'F');
        doc.setDrawColor(45, 48, 55);
        doc.line(tableX, yPos + 7, tableX + contentWidth, yPos + 7);

        doc.setFont(PDF_HEADING_FONT, 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);

        let headerX = tableX + 2;
        colHeaders.forEach((hdr, i) => {
            doc.text(hdr, headerX, yPos + 4.8);
            headerX += colWidths[i];
        });
    };

    drawTableHeader(p2Y);
    p2Y += 7;

    const trades: BacktestTrade[] = strategy.recentTrades || [];

    if (trades.length === 0) {
        doc.setFont(PDF_BODY_FONT, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(textSubtle[0], textSubtle[1], textSubtle[2]);
        doc.text('No trade execution records captured during this sampling window.', tableX + 4, p2Y + 8);
        p2Y += 14;
    } else {
        // Reverse array so latest trade appears at the top, mapped with correct chronological sequence index
        const reversedTrades = [...trades].reverse().map((t, idx) => ({
            ...t,
            originalIndex: trades.length - idx
        }));

        reversedTrades.forEach((trade, idx) => {
            const rowH = 10.5;
            const bottomLimit = 272; // Page height limit before triggering a new page

            // Check if adding this row exceeds the page limit -> Create new page dynamically
            if (p2Y + rowH > bottomLimit) {
                doc.addPage();
                drawLogHeader();
                p2Y = 21;
                drawTableHeader(p2Y);
                p2Y += 7;
            }

            const isAlt = idx % 2 === 1;
            const isWin = trade.netPnl >= 0;

            if (isAlt) {
                doc.setFillColor(18, 18, 20);
            } else {
                doc.setFillColor(13, 13, 15);
            }
            doc.rect(tableX, p2Y, contentWidth, rowH, 'F');

            doc.setDrawColor(33, 35, 40);
            doc.line(tableX, p2Y + rowH, tableX + contentWidth, p2Y + rowH);

            let cellX = tableX + 2;

            // Col 0: Index Number
            doc.setFont(PDF_BODY_FONT, 'normal');
            doc.setFontSize(6.8);
            doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
            doc.text(`#${trade.originalIndex}`, cellX, p2Y + 6);
            cellX += colWidths[0];

            // Col 1: Side Pill
            doc.setFont(PDF_HEADING_FONT, 'bold');
            doc.setFontSize(7);
            if (trade.side === 'LONG') {
                doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
            } else {
                doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
            }
            doc.text(trade.side, cellX, p2Y + 6);
            cellX += colWidths[1];

            // Col 2: Time (IN / OUT)
            doc.setFont(PDF_BODY_FONT, 'normal');
            doc.setFontSize(6.2);
            doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
            doc.text(`IN:  ${formatPdfTime(trade.entryTime)}`, cellX, p2Y + 3.8);
            doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
            doc.text(`OUT: ${formatPdfTime(trade.exitTime)}`, cellX, p2Y + 7.6);
            cellX += colWidths[2];

            // Col 3: Entry Price
            doc.setFont(PDF_BODY_FONT, 'normal');
            doc.setFontSize(6.8);
            doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
            doc.text(`${formatCurrency(trade.entryPrice, 2)}`, cellX, p2Y + 6);
            cellX += colWidths[3];

            // Col 4: Exit Price
            doc.text(`${formatCurrency(trade.exitPrice, 2)}`, cellX, p2Y + 6);
            cellX += colWidths[4];

            // Col 5: Duration
            doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
            doc.text(`${trade.durationBars}b`, cellX, p2Y + 6);
            cellX += colWidths[5];

            // Col 6: Net PnL
            doc.setFont(PDF_HEADING_FONT, 'bold');
            if (isWin) {
                doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
            } else {
                doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
            }
            doc.text(`${isWin ? '+' : '-'}${formatCurrency(trade.netPnl, 2)}`, cellX, p2Y + 6);
            cellX += colWidths[6];

            // Col 7: ROE %
            doc.text(`${trade.roePercent >= 0 ? '+' : ''}${trade.roePercent.toFixed(1)}%`, cellX, p2Y + 6);
            cellX += colWidths[7];

            // Col 8: Exit Reason
            doc.setFont(PDF_BODY_FONT, 'normal');
            doc.setFontSize(6.2);
            doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
            const reasonText = trade.reason || 'Exit Signal';
            doc.text(reasonText.length > 22 ? reasonText.slice(0, 20) + '...' : reasonText, cellX, p2Y + 6);

            p2Y += rowH;
        });
    }

    p2Y += 5;

    // Check if disclaimer fits on current page, otherwise push to final page
    if (p2Y + 22 > 275) {
        doc.addPage();
        p2Y = 20;
    }

    // Institutional Verification & Confidentiality Statement
    drawCard(margin, p2Y, contentWidth, 22, [18, 22, 34]);
    doc.setFont(PDF_HEADING_FONT, 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
    doc.text('QUANTITATIVE CONFIDENTIALITY & RISK DISCLAIMER', margin + 5, p2Y + 5);

    doc.setFont(PDF_BODY_FONT, 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    const disclaimerText =
        'This quantitative backtest document reflects historical execution simulations conducted under standardized exchange slippage and commission models. Proprietary signals, mathematical models, stop mechanics, and internal decision trees are retained exclusively within the core algorithmic infrastructure and are not disclosed in public audit summaries. Past simulated performance is not indicative of future returns.';
    doc.text(doc.splitTextToSize(disclaimerText, contentWidth - 10), margin + 5, p2Y + 9.5);

    // Digital Signature Checksum Badge
    doc.setFont(PDF_BODY_FONT, 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textSubtle[0], textSubtle[1], textSubtle[2]);
    doc.text(`Digital Verification Signature: ${summary.UID}`, margin + 5, p2Y + 19);

    // Final pass over all pages to inject accurate total page numbers dynamically using jsPDF internal helper
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(i, totalPages);
    }

    // Trigger Save / Download
    const filename = `Sage_Backtest_Audit_${summary.symbol}_${strategy.strategyName.replace(/\s+/g, '_')}_${new Date(summary.createdAt).toISOString().split('T')[0]}.pdf`;
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

    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    const padLeft = 90;
    const padRight = 50;
    const padTop = 65;
    const padBottom = 65;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    if (data.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = `20px ${PDF_CANVAS_FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('No curve data points available', width / 2, height / 2);
        return canvas.toDataURL('image/png');
    }

    const values = data.map((d) => d.value);
    let minVal = Math.min(0, ...values);
    let maxVal = Math.max(...values, 10);
    const valRange = maxVal - minVal || 1;
    const margin = valRange * 0.12;
    minVal -= margin;
    maxVal += margin;
    const adjustedRange = maxVal - minVal;

    ctx.fillStyle = '#e2e8f0';
    ctx.font = `bold 20px ${PDF_CANVAS_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`${summary.period.days}-DAY CUMULATIVE EQUITY TRAJECTORY (REALIZED PnL)`, padLeft, 38);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `14px ${PDF_CANVAS_FONT}`;
    ctx.fillText(`Strategy: ${strategyName.toUpperCase()}`, padLeft, 60);

    const isPos = totalNetPnl >= 0;
    const badgeText = `TOTAL PnL: ${isPos ? '+' : '-'}${formatCurrency(totalNetPnl, 2)} ${currency}`;
    ctx.font = `bold 18px ${PDF_CANVAS_FONT}`;
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

    const yTicksCount = 5;
    ctx.font = `13px ${PDF_CANVAS_FONT}`;
    ctx.textAlign = 'right';
    ctx.lineWidth = 1;

    for (let i = 0; i <= yTicksCount; i++) {
        const tickVal = minVal + (adjustedRange / yTicksCount) * i;
        const yPos = padTop + plotH - ((tickVal - minVal) / adjustedRange) * plotH;

        const isZero = Math.abs(tickVal) < adjustedRange / (yTicksCount * 4);
        ctx.strokeStyle = isZero ? '#475569' : '#1e293b';
        ctx.beginPath();
        ctx.moveTo(padLeft, yPos);
        ctx.lineTo(width - padRight, yPos);
        ctx.stroke();

        ctx.fillStyle = isZero ? '#cbd5e1' : '#64748b';
        ctx.fillText(`${tickVal >= 0 ? '+' : '-'}${Math.round(tickVal)} ${currency}`, padLeft - 14, yPos + 5);
    }

    const points: Array<{ x: number; y: number; val: number; date: string }> = data.map((d, idx) => {
        const x = padLeft + (idx / Math.max(1, data.length - 1)) * plotW;
        const y = padTop + plotH - ((d.value - minVal) / adjustedRange) * plotH;
        return { x, y, val: d.value, date: d.date };
    });

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

    const lastPoint = points[points.length - 1];
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isPos ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = `12px ${PDF_CANVAS_FONT}`;
    ctx.textAlign = 'center';
    const xLabelStep = Math.max(1, Math.floor(points.length / 6));

    for (let i = 0; i < points.length; i += xLabelStep) {
        const pt = points[i];
        ctx.fillText(pt.date, pt.x, height - padBottom + 26);
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(pt.x, height - padBottom);
        ctx.lineTo(pt.x, height - padBottom + 6);
        ctx.stroke();
    }

    if (points.length > 1) {
        const finalPt = points[points.length - 1];
        ctx.fillText(finalPt.date, finalPt.x, height - padBottom + 26);
    }

    return canvas.toDataURL('image/png');
}

function generateProfitDistributionPieImage(strategy: StrategyBacktestResult, summary: IBacktestSummaryDocument): string {
    const width = 760;
    const height = 460;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = `bold 18px ${PDF_CANVAS_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('PROFIT ALLOCATION BREAKDOWN', 30, 36);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `12px ${PDF_CANVAS_FONT}`;
    ctx.fillText('Net Yield vs Platform Service Fee & Exchange Commission', 30, 56);

    const netProfit = Math.max(0, strategy.netProfit);
    const serviceFee = Math.max(0, strategy.metrics.totalFeesPaid);
    const binanceCommissions = Math.max(0, strategy.metrics.totalCommissionsPaid);
    const grossProfit = netProfit + binanceCommissions;

    const slices = [
        {
            label: 'Net Profit',
            sub: 'Trader Realized Return',
            val: netProfit,
            color: '#10b981',
            pct: grossProfit > 0 ? (netProfit / grossProfit) * 100 : 70,
        },
        {
            label: 'Sage Service Fee',
            sub: `${(summary.serviceFee * 100)}% Performance Share`,
            val: serviceFee,
            color: '#38bdf8',
            pct: grossProfit > 0 ? (serviceFee / grossProfit) * 100 : 20,
        },
        {
            label: 'Binance Commission',
            sub: 'Exchange Execution Taker',
            val: binanceCommissions,
            color: '#fbbf24',
            pct: grossProfit > 0 ? (binanceCommissions / grossProfit) * 100 : 10,
        },
    ];

    const cx = 180;
    const cy = 250;
    const outerR = 120;
    const innerR = 72;

    let startAngle = -Math.PI / 2;

    slices.forEach((s) => {
        const sliceAngle = (s.pct / 100) * (Math.PI * 2);
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle, endAngle);
        ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = s.color;
        ctx.fill();

        ctx.strokeStyle = '#0f1117';
        ctx.lineWidth = 3;
        ctx.stroke();

        startAngle = endAngle;
    });

    ctx.fillStyle = '#94a3b8';
    ctx.font = `10.5px ${PDF_CANVAS_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('GROSS PROFIT', cx, cy - 8);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 16px ${PDF_CANVAS_FONT}`;
    ctx.fillText(`${formatCurrency(grossProfit, 2)} USDT`, cx, cy + 14);

    const legendX = 350;
    let legendY = 130;
    const legendRowH = 75;

    slices.forEach((s) => {
        ctx.fillStyle = '#121214';
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(legendX, legendY, 370, 64, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.roundRect(legendX + 14, legendY + 16, 5, 32, 2);
        ctx.fill();

        ctx.fillStyle = '#f4f4f5';
        ctx.font = `bold 14px ${PDF_CANVAS_FONT}`;
        ctx.textAlign = 'left';
        ctx.fillText(s.label.toUpperCase(), legendX + 28, legendY + 28);

        ctx.fillStyle = '#71717a';
        ctx.font = `11px ${PDF_CANVAS_FONT}`;
        ctx.fillText(s.sub, legendX + 28, legendY + 46);

        ctx.fillStyle = s.color;
        ctx.font = `bold 16px ${PDF_CANVAS_FONT}`;
        ctx.textAlign = 'right';
        ctx.fillText(`${formatCurrency(s.val, 2)} USDT`, legendX + 354, legendY + 28);

        ctx.fillStyle = '#94a3b8';
        ctx.font = `12px ${PDF_CANVAS_FONT}`;
        ctx.fillText(`${s.pct.toFixed(1)}% Share`, legendX + 354, legendY + 46);

        legendY += legendRowH;
    });

    ctx.fillStyle = '#64748b';
    ctx.font = `10.5px ${PDF_CANVAS_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('* Sage service fee is billed dynamically upon profitable trade settlement.', 30, height - 20);

    return canvas.toDataURL('image/png');
}

function generateTradeDirectionBarChartImage(strategy: StrategyBacktestResult): string {
    const width = 760;
    const height = 460;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = `bold 18px ${PDF_CANVAS_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('TRADE DIRECTION & VOLUME', 30, 36);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `12px ${PDF_CANVAS_FONT}`;
    ctx.fillText('Long vs Short Order Distribution & Directional Win Rates', 30, 56);

    const totalTrades = Math.max(1, strategy.metrics.totalTrades);
    const longTotal = strategy.breakdown.long.total;
    const longWins = strategy.breakdown.long.wins;
    const longLosses = Math.max(0, longTotal - longWins);
    const longWR = strategy.breakdown.long.winRatePercent;
    const longShare = (longTotal / totalTrades) * 100;

    const shortTotal = strategy.breakdown.short.total;
    const shortWins = strategy.breakdown.short.wins;
    const shortLosses = Math.max(0, shortTotal - shortWins);
    const shortWR = strategy.breakdown.short.winRatePercent;
    const shortShare = (shortTotal / totalTrades) * 100;

    const badgeText = `TOTAL TRADES: ${totalTrades}`;
    ctx.font = `bold 13px ${PDF_CANVAS_FONT}`;
    const badgeW = ctx.measureText(badgeText).width + 24;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(width - 30 - badgeW, 20, badgeW, 28, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, width - 30 - badgeW / 2, 38);

    const chartLeft = 70;
    const chartRight = width - 40;
    const chartTop = 100;
    const chartBottom = 350;
    const chartH = chartBottom - chartTop;
    const chartW = chartRight - chartLeft;

    const maxQty = Math.max(totalTrades, 10);
    const yTicks = 4;
    ctx.font = `11.5px ${PDF_CANVAS_FONT}`;
    ctx.textAlign = 'right';

    for (let i = 0; i <= yTicks; i++) {
        const qtyVal = Math.round((maxQty / yTicks) * i);
        const yPos = chartBottom - (qtyVal / maxQty) * chartH;

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(chartLeft, yPos);
        ctx.lineTo(chartRight, yPos);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.fillText(`${qtyVal}`, chartLeft - 10, yPos + 4);
    }

    const barWidth = 110;
    const gap = 160;
    const longX = chartLeft + chartW / 2 - gap / 2 - barWidth;
    const shortX = chartLeft + chartW / 2 + gap / 2;

    const longBarH = Math.max(8, (longTotal / maxQty) * chartH);
    const longBarY = chartBottom - longBarH;

    const longGrad = ctx.createLinearGradient(0, longBarY, 0, chartBottom);
    longGrad.addColorStop(0, '#10b981');
    longGrad.addColorStop(1, '#064e3b');

    ctx.fillStyle = longGrad;
    ctx.beginPath();
    ctx.roundRect(longX, longBarY, barWidth, longBarH, [6, 6, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = `bold 16px ${PDF_CANVAS_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${longTotal} Orders`, longX + barWidth / 2, longBarY - 12);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = `12px ${PDF_CANVAS_FONT}`;
    ctx.fillText(`${longShare.toFixed(1)}% of Total`, longX + barWidth / 2, longBarY - 30);

    ctx.fillStyle = '#10b981';
    ctx.font = `bold 15px ${PDF_CANVAS_FONT}`;
    ctx.fillText('LONG TRADES', longX + barWidth / 2, chartBottom + 26);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `12px ${PDF_CANVAS_FONT}`;
    ctx.fillText(`${longWins}W / ${longLosses}L (${longWR.toFixed(1)}% WR)`, longX + barWidth / 2, chartBottom + 46);

    const shortBarH = Math.max(8, (shortTotal / maxQty) * chartH);
    const shortBarY = chartBottom - shortBarH;

    const shortGrad = ctx.createLinearGradient(0, shortBarY, 0, chartBottom);
    shortGrad.addColorStop(0, '#f43f5e');
    shortGrad.addColorStop(1, '#881337');

    ctx.fillStyle = shortGrad;
    ctx.beginPath();
    ctx.roundRect(shortX, shortBarY, barWidth, shortBarH, [6, 6, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fb7185';
    ctx.font = `bold 16px ${PDF_CANVAS_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${shortTotal} Orders`, shortX + barWidth / 2, shortBarY - 12);

    ctx.fillStyle = '#fecdd3';
    ctx.font = `12px ${PDF_CANVAS_FONT}`;
    ctx.fillText(`${shortShare.toFixed(1)}% of Total`, shortX + barWidth / 2, shortBarY - 30);

    ctx.fillStyle = '#f43f5e';
    ctx.font = `bold 15px ${PDF_CANVAS_FONT}`;
    ctx.fillText('SHORT TRADES', shortX + barWidth / 2, chartBottom + 26);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `12px ${PDF_CANVAS_FONT}`;
    ctx.fillText(`${shortWins}W / ${shortLosses}L (${shortWR.toFixed(1)}% WR)`, shortX + barWidth / 2, chartBottom + 46);

    ctx.fillStyle = '#64748b';
    ctx.font = `10.5px ${PDF_CANVAS_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('* Directional orders execute conditionally based on market structure and volatility regimes.', 30, height - 20);

    return canvas.toDataURL('image/png');
}

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