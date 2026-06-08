const STOCK_DATA = {
  "lastUpdated": "2026-06-01T10:00:00Z",
  "trackedStocks": [
    {"name": "格力电器", "code": "sz000651", "sector": "家电"},
    {"name": "药明康德", "code": "sh603259", "sector": "医药"},
    {"name": "宁德时代", "code": "sz300750", "sector": "新能源"},
    {"name": "巨星科技", "code": "sz002444", "sector": "出海"},
    {"name": "立昂微", "code": "sh605358", "sector": "半导体"},
    {"name": "粤电力A", "code": "sz000539", "sector": "电力"},
    {"name": "沪电股份", "code": "sz002463", "sector": "PCB"},
    {"name": "中芯国际", "code": "sh688981", "sector": "半导体"},
    {"name": "贵州茅台", "code": "sh600519", "sector": "白酒"},
    {"name": "西安奕材", "code": "sh688783", "sector": "半导体"}
  ],
  "currentWeek": {
    "weekLabel": "2026年第24周 (6/8 - 6/12)",
    "weekId": "2026-W24",
    "topPick": {
      "name": "京能电力",
      "code": "600578",
      "sector": "电力",
      "rating": "强烈推荐",
      "price": 8.83,
      "targetPrice": 10.50,
      "upside": "19%",
      "marketCap": "590亿",
      "pe": "14倍",
      "pb": 1.6,
      "dividendYield": "3.2%",
      "riskLevel": "中等",
      "horizon": "短期 (2-4周)",
      "entryZone": "8.5-8.9元",
      "stopLoss": "8.2元",
      "thesis": "美股暴跌纳指-4%，芯片崩-10%，全球恐慌中资金涌向电力防御板块。京能电力今日全市场领涨+4.4%，逆市放量突破。夏季用电高峰+厄尔尼诺82%概率+油价$96+算电协同政策，多重催化叠加。周一全市场仅4只股票上涨，它排第一——恐慌日里还在涨的，就是聪明钱在买。",
      "catalysts": [
        "夏季用电高峰+厄尔尼诺82%概率+油价$96",
        "美国非农超预期→加息预期升温→防御板块受益",
        "以旧换新补贴每台最高800元",
        "多家券商6月金股推荐"
      ],
      "risks": [
        "地产链拖累家电整体需求",
        "铜铝等原材料价格上行",
        "夏季天气若不达预期则销量承压"
      ]
    },
    "secondaryPicks": [
      {
        "name": "药明康德",
        "code": "603259",
        "sector": "医药CXO",
        "rating": "买入",
        "badge": "buy",
        "price": 101.60,
        "targetPrice": 130.00,
        "upside": "28%",
        "pe": 14.6,
        "dividendYield": "1.2%",
        "riskLevel": "中等",
        "horizon": "中长期 (1-3年)",
        "entryZone": "95-105元左侧布局",
        "stopLoss": "85元",
        "thesis": "全球CXO龙头，PE 14倍处历史最低分位。Q1新签订单回暖，在手订单创新高。中泰证券6月金股推荐。医药板块底部特征明显，防御+反转双击。"
      },
      {
        "name": "宁德时代",
        "code": "300750",
        "sector": "新能源",
        "rating": "买入",
        "badge": "buy",
        "price": 424.00,
        "targetPrice": 550.00,
        "upside": "30%",
        "pe": 22.5,
        "dividendYield": "1.5%",
        "riskLevel": "中等",
        "horizon": "中长期 (1-2年)",
        "entryZone": "410-430元分批建仓",
        "stopLoss": "380元",
        "thesis": "全球锂电龙头，储能+动力双轮驱动。全固态电池2027年装车催化。开源/光大/中原三家券商6月金股同时推荐。海外大储需求旺盛，钠离子电池量产装车。"
      },
      {
        "name": "巨星科技",
        "code": "002444",
        "sector": "出海制造",
        "rating": "关注",
        "badge": "watch",
        "price": 32.40,
        "targetPrice": 45.00,
        "upside": "39%",
        "pe": 16.3,
        "dividendYield": "2.5%",
        "riskLevel": "中等",
        "horizon": "中长期 (2-3年)",
        "entryZone": "30-33元区间",
        "stopLoss": "27元",
        "thesis": "全球手工具龙头，境外收入占比95%，A股最纯正出海标的。美国地产周期复苏+DIY文化驱动。PE仅16倍明显低估。入选证券时报2026年26只潜力股。"
      }
    ]
  },
  "history": [
    {
      "weekId": "2026-W22",
      "weekLabel": "2026年第22周 (5/25 - 5/29)",
      "topPick": "立昂微",
      "picks": [
        {"name": "立昂微", "code": "605358", "sector": "半导体", "entryPrice": 59.09, "currentPrice": 55.38, "perf": "-6.3%"},
        {"name": "格力电器", "code": "000651", "sector": "家电", "entryPrice": 40.20, "currentPrice": 39.17, "perf": "-2.6%"},
        {"name": "巨星科技", "code": "002444", "sector": "出海", "entryPrice": 31.80, "currentPrice": 32.40, "perf": "+1.9%"}
      ]
    },
    {
      "weekId": "2026-W21",
      "weekLabel": "2026年第21周 (5/18 - 5/22)",
      "topPick": "立昂微",
      "picks": [
        {"name": "立昂微", "code": "605358", "sector": "半导体", "entryPrice": 55.78, "currentPrice": 59.09, "perf": "+5.9%"},
        {"name": "格力电器", "code": "000651", "sector": "家电", "entryPrice": 39.50, "currentPrice": 40.20, "perf": "+1.8%"},
        {"name": "巨星科技", "code": "002444", "sector": "出海", "entryPrice": 30.50, "currentPrice": 31.80, "perf": "+4.3%"}
      ]
    },
    {
      "weekId": "2026-W20",
      "weekLabel": "2026年第20周 (5/11 - 5/15)",
      "topPick": "宁德时代",
      "picks": [
        {"name": "宁德时代", "code": "300750", "sector": "新能源", "entryPrice": 245.00, "currentPrice": 258.50, "perf": "+5.5%"},
        {"name": "阳光电源", "code": "300274", "sector": "新能源", "entryPrice": 118.00, "currentPrice": 125.30, "perf": "+6.2%"},
        {"name": "中芯国际", "code": "688981", "sector": "半导体", "entryPrice": 88.50, "currentPrice": 92.10, "perf": "+4.1%"}
      ]
    },
    {
      "weekId": "2026-W19",
      "weekLabel": "2026年第19周 (5/4 - 5/8)",
      "topPick": "贵州茅台",
      "picks": [
        {"name": "贵州茅台", "code": "600519", "sector": "白酒", "entryPrice": 1680.00, "currentPrice": 1720.00, "perf": "+2.4%"},
        {"name": "恒瑞医药", "code": "600276", "sector": "医药", "entryPrice": 52.30, "currentPrice": 54.80, "perf": "+4.8%"},
        {"name": "立昂微", "code": "605358", "sector": "半导体", "entryPrice": 48.50, "currentPrice": 55.78, "perf": "+15.0%"}
      ]
    }
  ]
};
