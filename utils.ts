import { DEFAULT_ASSET_PAIRS } from "./constants";
import crypto from "crypto";
export function formatCurrency(amount: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(amount);
}

export function formatPercent(value: number, decimals: number = 2): string {
    const prefix = value > 0 ? '+' : '-';
    return `${prefix}${value.toFixed(decimals)}%`;
}

export async function getTradingSymbols(): Promise<string[]> {
    //Get the trading pairs
    return DEFAULT_ASSET_PAIRS;
}

export function generateSageID(totalLength: number = 6): string {
    const PREFIX = "SAGE-";

    if (totalLength <= PREFIX.length) {
        throw new Error(`Length must be greater than prefix length (${PREFIX.length})`);
    }

    const randomLength = totalLength - PREFIX.length;
    // Character set avoiding ambiguous characters (like 0, O, 1, I)
    const charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

    const randomBytes = crypto.randomBytes(randomLength);
    let randomString = "";

    for (let i = 0; i < randomLength; i++) {
        randomString += charset[randomBytes[i] % charset.length];
    }

    return `${PREFIX}${randomString}`;
}

export function generateID(totalLength: number = 12): string {
    const charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

    const randomBytes = crypto.randomBytes(totalLength);
    let randomString = "";

    for (let i = 0; i < totalLength; i++) {
        randomString += charset[randomBytes[i] % charset.length];
    }

    return randomString;
}

export function formatTradeTimestamp(timestamp?: number | string): string {
  if (!timestamp) return '—';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return String(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}`;
}