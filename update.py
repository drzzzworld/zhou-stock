#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Weekly Stock Picks Update Script
Run this script each week to add new picks and update performance tracking.

Usage:
  python update.py --add-week    Add a new week's picks (interactive)
  python update.py --update-perf Update performance of current picks
  python update.py --help        Show help
"""

import json
import os
import sys
from datetime import datetime, timedelta

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.js")
PREFIX = "const STOCK_DATA = "
SUFFIX = ";"


def load_data():
    """Load stock data from data.js"""
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    json_str = content[len(PREFIX):-len(SUFFIX)]
    return json.loads(json_str)


def save_data(data):
    """Save stock data back to data.js"""
    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    full = PREFIX + json_str + SUFFIX
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        f.write(full)
    print(f"[OK] Data saved to {DATA_FILE}")


def get_week_info(date=None):
    """Get ISO week number and label"""
    if date is None:
        date = datetime.now()
    iso = date.isocalendar()
    week_id = f"{iso[0]}-W{iso[1]:02d}"
    # Get Monday and Friday of this week
    monday = date - timedelta(days=date.weekday())
    friday = monday + timedelta(days=4)
    week_label = f"{iso[0]}年第{iso[1]}周 ({monday.month}/{monday.day} - {friday.month}/{friday.day})"
    return week_id, week_label


def add_new_week():
    """Interactive prompt to add a new week's stock picks"""
    data = load_data()
    now = datetime.now()
    week_id, week_label = get_week_info(now)

    # Check if this week already exists
    if data["currentWeek"]["weekId"] == week_id:
        print(f"[WARN] Current week {week_id} already exists in data.")
        ans = input("Overwrite? (y/n): ").strip().lower()
        if ans != "y":
            return
    else:
        # Archive current week to history
        old = data["currentWeek"]
        history_entry = {
            "weekId": old["weekId"],
            "weekLabel": old["weekLabel"],
            "topPick": old["topPick"]["name"],
            "picks": []
        }
        # Add top pick
        history_entry["picks"].append({
            "name": old["topPick"]["name"],
            "code": old["topPick"]["code"],
            "entryPrice": old["topPick"]["price"],
            "currentPrice": old["topPick"]["price"],
            "perf": "0.0%"
        })
        # Add secondary picks
        for sp in old["secondaryPicks"]:
            history_entry["picks"].append({
                "name": sp["name"],
                "code": sp["code"],
                "entryPrice": sp["price"],
                "currentPrice": sp["price"],
                "perf": "0.0%"
            })
        data["history"].insert(0, history_entry)
        print(f"[INFO] Archived previous week {old['weekId']} to history.")

    print(f"\n{'='*60}")
    print(f"Adding new picks for: {week_label} ({week_id})")
    print(f"{'='*60}\n")

    # --- Top Pick ---
    print("--- TOP PICK (本周最看好) ---")
    top = {
        "name": input("股票名称: ").strip(),
        "code": input("股票代码: ").strip(),
        "sector": input("所属板块 (如: 半导体硅片): ").strip(),
        "rating": "强烈推荐",
        "price": float(input("当前股价 (元): ").strip()),
        "targetPrice": float(input("目标价 (元): ").strip()),
        "upside": input("上涨空间 (如: 30%): ").strip(),
        "marketCap": input("市值 (如: 397亿): ").strip(),
        "pe": input("PE (如: 扭亏期 / 18.3): ").strip(),
        "pb": float(input("PB: ").strip()),
        "dividendYield": input("股息率 (如: — / 7.72%): ").strip(),
        "riskLevel": input("风险等级 (低/中等/高): ").strip(),
        "horizon": input("持有周期 (如: 中长期 1-2年): ").strip(),
        "thesis": input("投资逻辑 (一段话): ").strip(),
        "catalysts": [],
        "risks": []
    }
    print("催化剂 (每行一个, 空行结束):")
    while True:
        c = input("  > ").strip()
        if not c:
            break
        top["catalysts"].append(c)
    print("风险 (每行一个, 空行结束):")
    while True:
        r = input("  > ").strip()
        if not r:
            break
        top["risks"].append(r)

    # --- Secondary Picks ---
    secondary = []
    print("\n--- SECONDARY PICKS (次选推荐) ---")
    for i in range(3):
        print(f"\n次选 #{i+1}:")
        name = input("  股票名称 (回车跳过): ").strip()
        if not name:
            break
        sp = {
            "name": name,
            "code": input("  股票代码: ").strip(),
            "sector": input("  所属板块: ").strip(),
            "rating": "买入",
            "badge": input("  标签 (buy/hold/watch): ").strip() or "buy",
            "price": float(input("  当前股价: ").strip()),
            "targetPrice": float(input("  目标价: ").strip()),
            "upside": input("  上涨空间: ").strip(),
            "pe": float(input("  PE: ").strip()) if input("  PE (回车跳过): ").strip() else "—",
            "dividendYield": input("  股息率: ").strip(),
            "riskLevel": input("  风险等级: ").strip(),
            "horizon": input("  持有周期: ").strip(),
            "thesis": input("  投资逻辑: ").strip()
        }
        secondary.append(sp)

    data["currentWeek"] = {
        "weekLabel": week_label,
        "weekId": week_id,
        "topPick": top,
        "secondaryPicks": secondary
    }
    data["lastUpdated"] = now.isoformat() + "Z"

    save_data(data)
    print(f"\n[SUCCESS] Week {week_label} added successfully!")


def update_performance():
    """Update current prices and performance for the most recent history entry"""
    data = load_data()

    if not data["history"]:
        print("[INFO] No history entries to update.")
        return

    latest = data["history"][0]
    print(f"Updating performance for: {latest['weekLabel']}")
    print(f"Current picks: {len(latest['picks'])} stocks\n")

    for p in latest["picks"]:
        print(f"  {p['name']} ({p['code']})")
        print(f"    Entry price: {p['entryPrice']}")
        new_price = input(f"    Current price (回车跳过): ").strip()
        if new_price:
            p["currentPrice"] = float(new_price)
            change = (p["currentPrice"] - p["entryPrice"]) / p["entryPrice"] * 100
            p["perf"] = f"{change:+.1f}%"
            print(f"    Performance: {p['perf']}")

    data["lastUpdated"] = datetime.now().isoformat() + "Z"
    save_data(data)
    print("\n[SUCCESS] Performance updated!")


def print_help():
    print("""
Weekly Stock Picks Update Tool
===============================
Usage:
  python update.py --add-week     Add new weekly picks (interactive)
  python update.py --update-perf  Update performance of latest history
  python update.py --help         Show this help

File structure:
  data.js    - Stock picks data (auto-generated JSON in JS)
  index.html - Main website
  update.py  - This script
""")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print_help()
    elif sys.argv[1] == "--add-week":
        add_new_week()
    elif sys.argv[1] == "--update-perf":
        update_performance()
    elif sys.argv[1] == "--help":
        print_help()
    else:
        print(f"Unknown option: {sys.argv[1]}")
        print_help()
