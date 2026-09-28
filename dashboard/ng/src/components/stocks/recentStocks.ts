// "Recently viewed" stocks, persisted client-side only (no server concept of this) -
// read by StocksPage's pre-search intro state, written by StockDetailPage on every
// successful stock load. Every localStorage access is wrapped in try/catch: private
// browsing / storage-full / disabled-storage should degrade to "no recents", not throw.
const STORAGE_KEY = 'ng.recentStocks';
const MAX_RECENTS = 8;

export interface RecentStock {
  ticker: string;
  symbol: string;
  exchange: string;
  company: string | null;
}

export function loadRecentStocks(): RecentStock[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentStock[]) : [];
  } catch {
    return [];
  }
}

export function recordRecentStock(stock: RecentStock): void {
  try {
    const existing = loadRecentStocks().filter((s) => s.ticker !== stock.ticker);
    existing.unshift(stock);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, MAX_RECENTS)));
  } catch {
    /* best effort - a full/disabled store just means no recents persist */
  }
}
