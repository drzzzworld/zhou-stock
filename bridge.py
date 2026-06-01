#!/usr/bin/env python3
"""
Bridge: Sequoia-X quantitative strategies -> zhou-stock website data.js
Run weekly via GitHub Actions to auto-generate stock picks.
"""

import json
import os
import sys
from datetime import datetime, date

# ===== Step 1: Get stock picks from quantitative screening =====

def get_quant_picks():
    """
    Run quantitative screening and return ranked stock picks.
    Uses Sequoia-X strategies where available, falls back to built-in screening.
    """
    picks = []

    try:
        # Add sequoia-x to path
        seq_path = os.path.expanduser('~/sequoia-x')
        if os.path.exists(seq_path) and seq_path not in sys.path:
            sys.path.insert(0, seq_path)

        from sequoia_x.core.config import get_settings
        from sequoia_x.data.engine import DataEngine
        from sequoia_x.strategy.ma_volume import MaVolumeStrategy
        from sequoia_x.strategy.turtle_trade import TurtleTradeStrategy
        from sequoia_x.strategy.rps_breakout import RpsBreakoutStrategy

        settings = get_settings()
        engine = DataEngine(settings)

        # Sync latest data (incremental)
        count = engine.sync_today_bulk()
        print(f"[Sequoia] Synced {count} stocks")

        # Run strategies
        strategies = [
            MaVolumeStrategy(engine=engine, settings=settings),
            TurtleTradeStrategy(engine=engine, settings=settings),
            RpsBreakoutStrategy(engine=engine, settings=settings),
        ]

        all_selected = {}
        for s in strategies:
            name = type(s).__name__
            selected = s.run()
            print(f"[Sequoia] {name}: {len(selected)} picks")
            for symbol in selected:
                if symbol not in all_selected:
                    all_selected[symbol] = []
                all_selected[symbol].append(name)

        # Rank by number of strategies that picked each stock
        ranked = sorted(all_selected.items(), key=lambda x: len(x[1]), reverse=True)
        for symbol, strats in ranked[:10]:
            picks.append({
                'symbol': symbol,
                'score': len(strats),
                'strategies': strats
            })
    except Exception as e:
        print(f"[Sequoia] Engine not available, using fallback: {e}")

    # Fallback if Sequoia-X not available
    if not picks:
        picks = fallback_screening()

    return picks


def fallback_screening():
    """Simple quantitative screening when Sequoia-X is unavailable"""
    try:
        import baostock as bs
        import pandas as pd

        bs.login()
        today = date.today().strftime('%Y-%m-%d')

        picks = []
        # Get CSI 800 stocks and screen for:
        # 1. Price > MA20 (uptrend)
        # 2. Volume > 20-day average (active)
        # 3. Recent price change > 0 (positive momentum)

        rs = bs.query_stock_basic()
        stocks = []
        while (rs.error_code == '0') & rs.next():
            stocks.append(rs.get_row_data()[0])

        # Sample: screen the first 200 stocks for speed
        for code in stocks[:200]:
            if code.startswith('sh.688') or code.startswith('sz.300'):
                continue  # Skip STAR/ChiNext for simplicity

            try:
                rs = bs.query_history_k_data_plus(
                    code, 'date,close,volume',
                    start_date=(date.today().replace(day=1)).strftime('%Y-%m-%d'),
                    end_date=today,
                    frequency='d', adjustflag='2'
                )
                if rs.error_code != '0':
                    continue

                data = []
                while rs.next():
                    data.append(rs.get_row_data())

                if len(data) < 20:
                    continue

                df = pd.DataFrame(data, columns=['date', 'close', 'volume'])
                df['close'] = pd.to_numeric(df['close'])
                df['volume'] = pd.to_numeric(df['volume'])
                df['ma20'] = df['close'].rolling(20).mean()
                df['avg_vol'] = df['volume'].rolling(20).mean()

                last = df.iloc[-1]
                if last['close'] > last['ma20'] and last['volume'] > last['avg_vol'] * 1.2:
                    change = (df['close'].iloc[-1] - df['close'].iloc[-5]) / df['close'].iloc[-5] * 100
                    if change > 0:
                        picks.append({
                            'symbol': code,
                            'score': 1,
                            'change': round(change, 1)
                        })
            except:
                continue

        bs.logout()

        # Sort by change and return top picks
        picks.sort(key=lambda x: x.get('change', 0), reverse=True)
        return picks[:10]

    except Exception as e:
        print(f"Fallback screening failed: {e}")
        return []


# ===== Step 2: Update website data.js =====

def update_website_data(picks, data_path):
    """Update data.js with new weekly picks"""
    if not picks:
        print("No picks generated, skipping update")
        return False

    today = date.today()
    # Find Monday of this week
    monday = today - __import__('datetime').timedelta(days=today.weekday())
    friday = monday + __import__('datetime').timedelta(days=4)
    week_label = f"{today.year}年第{today.isocalendar()[1]}周 ({monday.month}/{monday.day} - {friday.month}/{friday.day})"
    week_id = f"{today.year}-W{today.isocalendar()[1]:02d}"

    # Read existing data
    with open(data_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Parse the STOCK_DATA JSON
    json_start = content.index('{')
    json_end = content.rindex('}') + 1
    existing = json.loads(content[json_start:json_end])

    # Archive current week to history
    if existing.get('currentWeek'):
        old = existing['currentWeek']
        history_entry = {
            'weekId': old['weekId'],
            'weekLabel': old['weekLabel'],
            'topPick': old['topPick']['name'],
            'picks': []
        }
        # Top pick
        tp = old['topPick']
        history_entry['picks'].append({
            'name': tp['name'], 'code': tp['code'],
            'sector': tp.get('sector', ''),
            'entryPrice': tp['price'], 'currentPrice': tp['price'], 'perf': '0.0%'
        })
        # Secondary picks
        for sp in old['secondaryPicks']:
            history_entry['picks'].append({
                'name': sp['name'], 'code': sp['code'],
                'sector': sp.get('sector', ''),
                'entryPrice': sp['price'], 'currentPrice': sp['price'], 'perf': '0.0%'
            })
        existing['history'].insert(0, history_entry)
        # Keep max 10 history entries
        existing['history'] = existing['history'][:10]

    # Build new currentWeek from quantitative picks
    symbol_to_name = {
        'sh.600519': '贵州茅台', 'sh.600900': '长江电力', 'sh.600585': '海螺水泥',
        'sh.600036': '招商银行', 'sh.601318': '中国平安', 'sh.600276': '恒瑞医药',
        'sh.600030': '中信证券', 'sh.601012': '隆基绿能',
        'sz.000651': '格力电器', 'sz.000858': '五粮液', 'sz.000333': '美的集团',
        'sz.002415': '海康威视', 'sz.300750': '宁德时代', 'sz.002594': '比亚迪',
        'sz.000001': '平安银行', 'sz.002444': '巨星科技',
        'sh.605358': '立昂微', 'sh.603259': '药明康德', 'sh.688981': '中芯国际',
        'sz.000539': '粤电力A', 'sh.603527': '众源新材',
    }

    top_symbol = picks[0]['symbol'] if picks else 'sz.000651'
    top_name = symbol_to_name.get(top_symbol, top_symbol)

    # Preserve existing prices from old data if stocks are the same
    old_prices = {}
    for sp in existing['currentWeek'].get('secondaryPicks', []):
        old_prices[sp['name']] = sp['price']
    old_prices[existing['currentWeek']['topPick']['name']] = existing['currentWeek']['topPick']['price']

    new_top = {
        'name': top_name,
        'code': top_symbol.split('.')[1] if '.' in top_symbol else top_symbol,
        'sector': '量化精选',
        'rating': '强烈推荐',
        'price': old_prices.get(top_name, 50.00),
        'targetPrice': round(old_prices.get(top_name, 50.00) * 1.2, 2),
        'upside': '20%',
        'marketCap': '—',
        'pe': '—',
        'pb': 0,
        'dividendYield': '—',
        'riskLevel': '中等',
        'horizon': '中长期',
        'entryZone': '—',
        'stopLoss': '—',
        'thesis': f'本周量化策略综合评分最高。{picks[0].get("score",1)}个策略同时选中。',
        'catalysts': ['量化策略信号触发', '技术形态突破', '量价配合良好'],
        'risks': ['量化策略可能失效', '市场整体回调风险', '个股基本面变化']
    }

    secondary = []
    for i, p in enumerate(picks[1:4]):
        name = symbol_to_name.get(p['symbol'], p['symbol'])
        sec = {
            'name': name,
            'code': p['symbol'].split('.')[1] if '.' in p['symbol'] else p['symbol'],
            'sector': '量化精选',
            'rating': '关注',
            'badge': 'watch',
            'price': old_prices.get(name, 30.00),
            'targetPrice': round(old_prices.get(name, 30.00) * 1.3, 2),
            'upside': '30%',
            'pe': 0,
            'dividendYield': '—',
            'riskLevel': '中等',
            'horizon': '中长期',
            'entryZone': '—',
            'stopLoss': '—',
            'thesis': f'量化策略评分第{i+2}名。{p.get("score",1)}个策略选中。'
        }
        secondary.append(sec)

    existing['currentWeek'] = {
        'weekLabel': week_label,
        'weekId': week_id,
        'topPick': new_top,
        'secondaryPicks': secondary if secondary else existing['currentWeek']['secondaryPicks']
    }
    existing['lastUpdated'] = datetime.now().isoformat() + 'Z'

    # Write back
    new_json = json.dumps(existing, ensure_ascii=False, indent=2)
    new_content = 'const STOCK_DATA = ' + new_json + ';'

    with open(data_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"Updated data.js with {len(picks)} quantitative picks")
    print(f"Top pick: {top_name}")
    return True


# ===== Main =====
if __name__ == '__main__':
    data_path = os.path.join(os.path.dirname(__file__), 'data.js')
    picks = get_quant_picks()
    update_website_data(picks, data_path)
