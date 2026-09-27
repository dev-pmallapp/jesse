"""Equal-weight basket, rebalanced every N calendar days - summary + CSVs.

Run from inside a Jesse project directory (it needs the project's `.env` and database,
with daily candles already imported for every member), e.g.:

    python equal_weight_rebalance.py --universe 'NIFTY200 ALPHA 30' \\
        --start 2025-01-01 --finish 2026-09-24 --capital 15000 --days 15 --csv out/

See jesse/research/portfolio_rebalance.py for the exact rules (whole shares only,
unaffordable stocks stay as cash, sells before buys, fills at the session close).
"""
import argparse
import csv
from pathlib import Path

from jesse import research


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--universe', default='NIFTY200 ALPHA 30')
    parser.add_argument('--symbols', help='comma-separated tickers instead of a universe')
    parser.add_argument('--start', required=True)
    parser.add_argument('--finish', required=True)
    parser.add_argument('--capital', type=float, default=15_000)
    parser.add_argument('--days', type=int, default=15, help='rebalance every N calendar days')
    parser.add_argument('--fee', type=float, default=0.001, help='fraction of traded notional, per side')
    parser.add_argument('--benchmark', help='optional extra symbol to compare against')
    parser.add_argument('--csv', help='directory for equity.csv and trades.csv')
    args = parser.parse_args()

    selection = {'symbols': args.symbols.split(',')} if args.symbols else {'universe': args.universe}
    r = research.portfolio_rebalance(
        args.start, args.finish, capital=args.capital, rebalance_days=args.days,
        fee=args.fee, benchmark=args.benchmark, **selection,
    )

    rows = [('Equal weight, rebalanced', r['metrics']),
            ('Equal weight, buy & hold', r['buy_and_hold_equal_weight']['metrics'])]
    if r.get('benchmark', {}).get('metrics'):
        rows.append((f"Benchmark {r['benchmark']['symbol']}", r['benchmark']['metrics']))
    print(f"\n{len(r['config']['symbols'])} symbols, {args.start} .. {args.finish}, "
          f"capital {args.capital:,.0f}, every {args.days} days, fee {args.fee}")
    print(f"{'':28} {'final':>12} {'return%':>9} {'CAGR%':>8} {'maxDD%':>8} {'sharpe':>7}")
    for name, m in rows:
        print(f"{name:28} {m['final_value']:>12,.0f} {m['total_return_pct']:>9.2f} {m['cagr_pct']:>8.2f} "
              f"{m['max_drawdown_pct']:>8.2f} {m['sharpe']:>7.2f}")
    m = r['metrics']
    print(f"\nrebalances {m['n_rebalances']}, fees {m['total_fees']:,.2f}, turnover {m['turnover']:.2f}x, "
          f"avg cash {m['avg_cash_pct']:.1f}%")
    if r['unaffordable']:
        print(f"never held (1 share > target): "
              + ', '.join(f'{s} ({p:,.0f})' for s, p in r['unaffordable'].items()))
    if r['survivorship_warning']:
        print("WARNING: today's index membership applied to the past (survivorship bias).")

    if args.csv:
        out = Path(args.csv)
        out.mkdir(parents=True, exist_ok=True)
        bh = {p['date']: p['value'] for p in r['buy_and_hold_equal_weight']['equity_curve']}
        with open(out / 'equity.csv', 'w', newline='') as f:
            w = csv.writer(f)
            w.writerow(['date', 'value', 'cash', 'buy_and_hold_value'])
            for p in r['equity_curve']:
                w.writerow([p['date'], round(p['value'], 2), round(p['cash'], 2), round(bh[p['date']], 2)])
        with open(out / 'trades.csv', 'w', newline='') as f:
            w = csv.writer(f)
            w.writerow(['date', 'symbol', 'side', 'qty', 'price', 'notional', 'fee'])
            for reb in r['rebalances']:
                for t in reb['trades']:
                    w.writerow([reb['date'], t['symbol'], t['side'], t['qty'], t['price'],
                                round(t['notional'], 2), round(t['fee'], 2)])
        print(f'wrote {out / "equity.csv"} and {out / "trades.csv"}')


if __name__ == '__main__':
    main()
