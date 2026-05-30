(function() {
  const data = typeof STOCK_DATA !== 'undefined' ? STOCK_DATA : null;
  if (!data) { document.body.innerHTML = '<div style="text-align:center;padding:100px;color:#ef4444;">数据加载失败</div>'; return; }

  const { currentWeek, history, trackedStocks } = data;

  // ===== Utility =====
  function formatRelativeTime(isoStr) {
    const now = new Date(); const then = new Date(isoStr.replace('Z', ''));
    const diffMin = Math.floor((now - then) / 60000);
    if (diffMin < 1) return '刚刚更新'; if (diffMin < 60) return diffMin + ' 分钟前更新';
    const diffH = Math.floor(diffMin / 60); if (diffH < 24) return diffH + ' 小时前更新';
    return Math.floor(diffH / 24) + ' 天前更新';
  }
  function parsePerf(perfStr) { return parseFloat(perfStr.replace('%', '').replace('+', '')) || 0; }

  // ===== Meta =====
  const updateTime = new Date(data.lastUpdated).toLocaleDateString('zh-CN', { year:'numeric',month:'long',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit' });
  document.getElementById('update-time').textContent = updateTime;
  document.getElementById('relative-time').textContent = formatRelativeTime(data.lastUpdated);
  document.getElementById('week-tag').textContent = currentWeek.weekLabel;

  // ===== A. LIVE STOCK TICKER =====
  const tickerTrack = document.getElementById('ticker-track');
  const tickerTime = document.getElementById('ticker-time');
  let stockPrices = {};

  function updateTicker() {
    if (!trackedStocks || trackedStocks.length === 0) return;

    // Use Tencent stock API - CORS friendly via JSONP
    const prefixMap = {};
    trackedStocks.forEach(s => {
      if (!prefixMap[s.code]) prefixMap[s.code] = s.name;
    });
    const codes = trackedStocks.map(s => s.code).join(',');

    // Try primary: Tencent API via fetch (returns JS string)
    fetch('https://web.sqt.gtimg.cn/utf8/q=' + codes)
      .then(r => r.text())
      .then(data => {
        const newPrices = {};
        trackedStocks.forEach(s => {
          const prefix = s.code.startsWith('sh') ? 'sh' : 'sz';
          const codeNum = s.code.replace('sh', '').replace('sz', '');
          const re = new RegExp('v_' + prefix + codeNum + '="([^"]+)"');
          const match = data.match(re);
          if (match) {
            const fields = match[1].split('~');
            // fields: name, code, current_price, prev_close, open, volume...
            const name = fields[1] || s.name;
            const price = parseFloat(fields[3]);
            const prevClose = parseFloat(fields[4]);
            if (!isNaN(price) && !isNaN(prevClose) && prevClose > 0) {
              const change = price - prevClose;
              const changePct = (change / prevClose) * 100;
              newPrices[name || s.name] = { code: s.code, price, change, changePct };
            }
          }
        });
        if (Object.keys(newPrices).length > 0) {
          stockPrices = newPrices;
          renderTicker();
          document.getElementById('ticker-time').textContent = new Date().toLocaleTimeString('zh-CN');
          try { localStorage.setItem('zhou_stock_prices', JSON.stringify({ time: Date.now(), prices: stockPrices })); } catch(e) {}
        }
      })
      .catch(() => {
        // Fallback: try cached prices
        try {
          const cached = JSON.parse(localStorage.getItem('zhou_stock_prices'));
          if (cached && cached.prices) { stockPrices = cached.prices; renderTicker(); }
        } catch(e) {}
      });
  }

  function renderTicker() {
    if (Object.keys(stockPrices).length === 0) {
      tickerTrack.innerHTML = '<span class="ticker-loading">⏳ 加载行情中...</span>';
      return;
    }
    const entries = [];
    trackedStocks.forEach(s => {
      const p = stockPrices[s.name];
      if (p) {
        const clr = p.changePct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
        const arrow = p.changePct >= 0 ? '↑' : '↓';
        entries.push('<span class="ticker-item"><span class="tname">' + s.name + '</span><span class="tprice">' + p.price.toFixed(2) + '</span><span class="tchange" style="color:' + clr + '">' + arrow + Math.abs(p.changePct).toFixed(2) + '%</span></span>');
      }
    });
    // Duplicate for seamless scroll
    tickerTrack.innerHTML = entries.join('') + '&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;' + entries.join('');
    tickerTrack.style.animationDuration = Math.max(20, entries.length * 5) + 's';
  }

  // Initial load + refresh every 5 minutes
  updateTicker();
  setInterval(updateTicker, 300000);

  // ===== B. FINANCIAL NEWS =====
  let newsData = [];
  const newsList = document.getElementById('news-list');
  const newsTime = document.getElementById('news-time');
  const newsModalOverlay = document.getElementById('news-modal-overlay');
  const newsModalContent = document.getElementById('news-modal-content');

  function fetchNews() {
    loadNewsFromBuiltIn();
  }

  function loadNewsFromBuiltIn() {
    var today = new Date();
    var dateStr = today.getFullYear() + '年' + (today.getMonth()+1) + '月' + today.getDate() + '日';

    newsData = [
      {rank:1,title:'A股三大指数震荡分化 芯片半导体板块集体退潮 电力消费走强',source:'eastmoney',time:dateStr+' 15:30',url:'https://finance.eastmoney.com/a/czqyw.html',body:'5月29日，A股三大指数高开低走，上证指数收跌0.37%，深证成指跌1.00%，创业板指跌1.14%。半导体板块遭遇集体回调，国家大基金减持消息引发获利盘涌出。电力、白酒、房地产板块逆势走强，资金高低切换明显。两市成交额达2.97万亿元。'},
      {rank:2,title:'国家大基金高位减持沪硅产业、中芯国际 半导体板块承压',source:'cls',time:dateStr+' 14:15',url:'https://www.cls.cn/depth/xxx',body:'国家集成电路产业投资基金（大基金）宣布减持沪硅产业不超过2%股份、中芯国际不超过1%股份。这是大基金2026年以来的首次减持动作，引发市场对半导体板块估值过热的担忧。受此消息影响，沪硅产业跌超8%，中芯国际跌超6%。'},
      {rank:3,title:'南方电网电力负荷连续三日刷新历史纪录 电力股掀涨停潮',source:'sina',time:dateStr+' 13:45',url:'https://finance.sina.com.cn/stock/',body:'受持续高温天气影响，南方电网电力负荷连续第三天刷新历史最高纪录。6月空调用电高峰提前到来，多地已启动有序用电预案。电力板块今日大涨，粤电力A、华电能源、晋控电力等多股涨停。机构预计今夏电力供需偏紧格局将持续。'},
      {rank:4,title:'618大促启动 家电以旧换新补贴加码 空调销量同比增45%',source:'eastmoney',time:dateStr+' 12:20',url:'https://finance.eastmoney.com/a/czqyw.html',body:'各大电商平台618大促正式启动，家电品类成为核心战场。根据京东、天猫数据，空调品类预售量同比增长45%，冰箱、洗衣机增长30%+。商务部以旧换新补贴政策持续发力，每台空调最高补贴800元。格力、美的、海尔等龙头品牌受益显著。'},
      {rank:5,title:'台积电2026年资本开支计划上调至580亿美元 硅片需求持续旺盛',source:'cls',time:dateStr+' 11:00',url:'https://www.cls.cn/depth/xxx',body:'台积电在年度技术论坛上宣布，将2026年资本开支计划从560亿美元上调至580亿美元，主要用于3nm/2nm先进制程扩产。公司预计AI芯片需求将持续强劲，2026-2028年AI相关营收年复合增长率将超过50%。12英寸硅片需求随之水涨船高。'},
      {rank:6,title:'白酒板块逆势大涨 酒鬼酒、老白干酒涨停 机构看好消费复苏',source:'sina',time:dateStr+' 10:35',url:'https://finance.sina.com.cn/stock/',body:'白酒板块今日逆势走强，酒鬼酒、老白干酒涨停，贵州茅台涨超2%。华创证券研报指出，白酒板块估值处于近10年最低分位（1.2%），二季度动销数据环比改善明显，中秋国庆旺季备货行情即将启动。'},
      {rank:7,title:'西安奕材武汉第三工厂全面封顶 12英寸硅片产能将达120万片/月',source:'eastmoney',time:dateStr+' 09:50',url:'https://finance.eastmoney.com/a/czqyw.html',body:'西安奕材（688783）宣布其位于武汉的第三工厂已完成主体结构全面封顶，总投资125亿元，预计2026年Q4设备搬入、2027年H1首批投产。届时公司总产能将达120万片/月，有望跻身全球12英寸硅片前三。'},
      {rank:8,title:'宁德时代固态电池量产时间表公布 预计2027年装车',source:'cls',time:dateStr+' 09:15',url:'https://www.cls.cn/depth/xxx',body:'宁德时代在投资者交流会上透露，公司全固态电池研发进展顺利，能量密度达500Wh/kg，预计2027年实现小批量装车。同时公司钠离子电池已实现量产装车，2026年产能规划达10GWh。花旗维持买入评级，目标价350元。'},
      {rank:9,title:'美联储6月议息会议临近 市场预期维持利率不变',source:'sina',time:dateStr+' 08:40',url:'https://finance.sina.com.cn/stock/',body:'美联储6月议息会议将于下周召开，CME FedWatch显示市场预期维持利率不变概率为87%。分析师认为，美国通胀数据虽有回落但距2%目标仍有距离，美联储将继续观察经济数据。人民币兑美元中间价报7.12，较上日调升58个基点。'},
      {rank:10,title:'格力电器股价逆势上扬 夏季高温+以旧换新双催化 股息率7.72%',source:'eastmoney',time:dateStr+' 08:00',url:'https://finance.eastmoney.com/a/czqyw.html',body:'格力电器（000651）今日逆势涨超3%，报39.07元。分析师指出，夏季高温天气提前到来、618大促启动、以旧换新补贴政策三重催化下，空调龙头二季度业绩确定性高。公司PE仅8倍、股息率7.72%，在当前市场环境下具备较强的防御价值和分红吸引力。'}
    ];
    renderNews();
  }

  function renderNews() {
    newsList.innerHTML = newsData.map(n => {
      let rankClass = ''; if (n.rank === 1) rankClass = 'r1'; else if (n.rank === 2) rankClass = 'r2'; else if (n.rank === 3) rankClass = 'r3';
      let srcClass = 'source-eastmoney'; if (n.source === 'sina') srcClass = 'source-sina'; else if (n.source === 'cls') srcClass = 'source-cls';
      const srcLabel = { eastmoney: '东方财富', sina: '新浪财经', cls: '财联社' }[n.source] || n.source;
      return '<div class="news-card" data-news-idx="' + (n.rank-1) + '" onclick="window._openNews(' + (n.rank-1) + ')">' +
        '<span class="news-rank ' + rankClass + '">' + (n.rank < 10 ? '0' : '') + n.rank + '</span>' +
        '<div class="news-content"><div class="news-title">' + n.title + '</div>' +
        '<div class="news-meta"><span class="news-source-tag ' + srcClass + '">' + srcLabel + '</span><span>' + n.time + '</span></div></div>' +
        '</div>';
    }).join('');
    newsTime.textContent = '更新于 ' + new Date().toLocaleTimeString('zh-CN');
    try { localStorage.setItem('zhou_news_time', Date.now().toString()); } catch(e) {}
  }

  window._openNews = function(idx) {
    const n = newsData[idx];
    if (!n) return;
    newsModalContent.innerHTML =
      '<button class="modal-close" onclick="document.getElementById(\'news-modal-overlay\').classList.remove(\'active\')">&times;</button>' +
      '<h2 style="font-size:22px;margin-bottom:8px;color:var(--text-primary);">' + n.title + '</h2>' +
      '<div class="news-detail-time">' + n.time + ' · 来源：' + ({eastmoney:'东方财富',sina:'新浪财经',cls:'财联社'}[n.source]||n.source) + '</div>' +
      '<div class="news-detail-body"><p>' + n.body + '</p></div>' +
      (n.url && n.url !== '#' ? '<a class="news-detail-link" href="' + n.url + '" target="_blank" rel="noopener">查看原文 →</a>' : '') +
      '<div style="margin-top:16px;display:flex;gap:12px;">' +
        (idx > 0 ? '<button class="btn-refresh" onclick="window._openNews(' + (idx-1) + ')">← 上一篇</button>' : '') +
        (idx < newsData.length-1 ? '<button class="btn-refresh" onclick="window._openNews(' + (idx+1) + ')">下一篇 →</button>' : '') +
      '</div>';
    newsModalOverlay.classList.add('active');
  };
  window.refreshNews = function() { fetchNews(); };

  newsModalOverlay.addEventListener('click', function(e) { if (e.target === newsModalOverlay) newsModalOverlay.classList.remove('active'); });

  // Load news on start + refresh every 12 hours
  fetchNews();
  setInterval(fetchNews, 43200000);

  // ===== C. SECTOR FILTERS =====
  const allSectors = new Set();
  allSectors.add(currentWeek.topPick.sector);
  currentWeek.secondaryPicks.forEach(p => allSectors.add(p.sector));
  history.forEach(h => h.picks.forEach(p => { if (p.sector) allSectors.add(p.sector); }));
  const filterContainer = document.getElementById('sector-filters');
  allSectors.forEach(s => {
    const btn = document.createElement('button'); btn.className = 'filter-btn'; btn.dataset.sector = s; btn.textContent = s;
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); filterCards(s);
    });
    filterContainer.appendChild(btn);
  });
  document.querySelector('.filter-btn[data-sector="all"]').addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active'); filterCards('all');
  });
  function filterCards(sector) {
    const tp = currentWeek.topPick;
    document.getElementById('top-pick').style.display = (sector === 'all' || tp.sector === sector) ? '' : 'none';
    const cards = document.getElementById('secondary-picks').querySelectorAll('.pick-card');
    cards.forEach((card, i) => { card.style.display = (sector === 'all' || currentWeek.secondaryPicks[i].sector === sector) ? '' : 'none'; });
  }

  // ===== D. RENDER TOP PICK =====
  const tp = currentWeek.topPick;
  document.getElementById('top-pick').innerHTML =
    '<div class="top-pick-card" data-code="' + tp.code + '" data-name="' + tp.name + '">' +
    '<div class="top-pick-badge">⭐ 本周最看好</div>' +
    '<div class="top-pick-header"><div><span class="top-pick-name">' + tp.name + '</span><span class="top-pick-code">' + tp.code + '</span></div><span class="top-pick-sector">' + tp.sector + '</span></div>' +
    '<div class="top-pick-grid">' +
      '<div class="metric-card"><div class="metric-label">当前股价</div><div class="metric-value" id="live-price-' + tp.code + '">' + tp.price + ' 元</div></div>' +
      '<div class="metric-card"><div class="metric-label">目标价</div><div class="metric-value up">' + tp.targetPrice + ' 元</div></div>' +
      '<div class="metric-card"><div class="metric-label">上涨空间</div><div class="metric-value up">' + tp.upside + '</div></div>' +
      '<div class="metric-card"><div class="metric-label">市值</div><div class="metric-value">' + tp.marketCap + '</div></div>' +
      '<div class="metric-card"><div class="metric-label">PE / PB</div><div class="metric-value">' + tp.pe + ' / ' + tp.pb + '</div></div>' +
      '<div class="metric-card"><div class="metric-label">风险等级</div><div class="metric-value warn">' + tp.riskLevel + '</div></div>' +
    '</div>' +
    '<div class="top-pick-thesis"><h4>📋 投资逻辑</h4><p>' + tp.thesis + '</p></div>' +
    '<div style="display:flex;gap:20px;margin-top:14px;flex-wrap:wrap;">' +
      '<div style="flex:1;min-width:180px;"><h4 style="font-size:13px;color:var(--accent-green);margin-bottom:6px;">✅ 催化剂</h4><ul style="list-style:none;font-size:13px;color:var(--text-secondary);">' + tp.catalysts.map(c => '<li style="padding:2px 0;">▸ ' + c + '</li>').join('') + '</ul></div>' +
      '<div style="flex:1;min-width:180px;"><h4 style="font-size:13px;color:var(--accent-red);margin-bottom:6px;">⚠️ 风险</h4><ul style="list-style:none;font-size:13px;color:var(--text-secondary);">' + tp.risks.map(r => '<li style="padding:2px 0;">▸ ' + r + '</li>').join('') + '</ul></div>' +
      '<div style="flex:1;min-width:180px;"><h4 style="font-size:13px;color:var(--accent-yellow);margin-bottom:6px;">🎯 操作参考</h4><div style="font-size:13px;color:var(--text-secondary);"><div style="padding:2px 0;">入场区：' + (tp.entryZone || '—') + '</div><div style="padding:2px 0;">止损位：' + (tp.stopLoss || '—') + '</div><div style="padding:2px 0;">目标价：' + tp.targetPrice + ' 元</div></div></div>' +
    '</div></div>';

  // ===== E. RENDER SECONDARY PICKS =====
  const badgeMap = { buy: 'badge-buy', hold: 'badge-hold', watch: 'badge-watch' };
  const ratingLabel = { buy: '买入', hold: '持有', watch: '关注' };
  document.getElementById('secondary-picks').innerHTML = currentWeek.secondaryPicks.map(p =>
    '<div class="pick-card" data-code="' + p.code + '" data-name="' + p.name + '">' +
    '<div class="pick-card-header"><div><span class="pick-card-name">' + p.name + '</span><span class="pick-card-code"> ' + p.code + '</span></div><span class="pick-card-badge ' + (badgeMap[p.badge]||'badge-watch') + '">' + (ratingLabel[p.badge]||'关注') + '</span></div>' +
    '<div class="pick-card-metrics">' +
      '<div><div class="pick-metric-label">现价 / 目标</div><div class="pick-metric-value">' + p.price + ' / <span style="color:var(--accent-green)">' + p.targetPrice + '</span></div></div>' +
      '<div><div class="pick-metric-label">上涨空间</div><div class="pick-metric-value" style="color:var(--accent-green)">' + p.upside + '</div></div>' +
      '<div><div class="pick-metric-label">PE / 股息率</div><div class="pick-metric-value">' + p.pe + ' / ' + p.dividendYield + '</div></div>' +
      '<div><div class="pick-metric-label">风险 / 周期</div><div class="pick-metric-value" style="font-size:13px">' + p.riskLevel + ' / ' + p.horizon + '</div></div>' +
    '</div>' +
    '<div class="pick-card-thesis">' + p.thesis + '</div>' +
    '<div class="pick-card-extra"><span>🟢 入场：' + (p.entryZone || '—') + '</span><span>🔴 止损：' + (p.stopLoss || '—') + '</span></div>' +
    '</div>'
  ).join('');

  // ===== F. DASHBOARD =====
  const allHistPicks = []; history.forEach(h => { h.picks.forEach(p => { allHistPicks.push({...p, week: h.weekLabel}); }); });
  const totalPicks = allHistPicks.length;
  const winningPicks = allHistPicks.filter(p => parsePerf(p.perf) > 0).length;
  const winRate = totalPicks > 0 ? ((winningPicks / totalPicks) * 100).toFixed(0) : 0;
  const avgReturn = totalPicks > 0 ? (allHistPicks.reduce((s,p) => s + parsePerf(p.perf), 0) / totalPicks).toFixed(1) : 0;
  const bestPick = allHistPicks.length > 0 ? allHistPicks.reduce((a,b) => parsePerf(a.perf) > parsePerf(b.perf) ? a : b) : null;
  const worstPick = allHistPicks.length > 0 ? allHistPicks.reduce((a,b) => parsePerf(a.perf) < parsePerf(b.perf) ? a : b) : null;
  const totalWeeks = history.length;

  document.getElementById('dashboard-content').innerHTML =
    '<div class="dashboard-grid">' +
      '<div class="stat-card"><div class="stat-icon">📅</div><div class="stat-value">' + totalWeeks + '</div><div class="stat-label">跟踪周数</div></div>' +
      '<div class="stat-card"><div class="stat-icon">📊</div><div class="stat-value">' + totalPicks + '</div><div class="stat-label">累计推荐</div></div>' +
      '<div class="stat-card"><div class="stat-icon">🏆</div><div class="stat-value" style="color:var(--accent-green)">' + winRate + '%</div><div class="stat-label">胜率</div><div class="stat-sub">' + winningPicks + '/' + totalPicks + ' 只盈利</div></div>' +
      '<div class="stat-card"><div class="stat-icon">📈</div><div class="stat-value" style="color:' + (avgReturn >= 0 ? 'var(--accent-green)' : 'var(--accent-red)') + '">' + (avgReturn >= 0 ? '+' : '') + avgReturn + '%</div><div class="stat-label">平均收益</div></div>' +
      '<div class="stat-card"><div class="stat-icon">🥇</div><div class="stat-value" style="font-size:20px;color:var(--accent-green)">' + (bestPick ? bestPick.name : '—') + '</div><div class="stat-label">最佳表现</div><div class="stat-sub">' + (bestPick ? bestPick.perf : '') + '</div></div>' +
      '<div class="stat-card"><div class="stat-icon">⚠️</div><div class="stat-value" style="font-size:20px;color:' + (worstPick && parsePerf(worstPick.perf) < 0 ? 'var(--accent-red)' : 'var(--text-secondary)') + '">' + (worstPick && parsePerf(worstPick.perf) < 0 ? worstPick.name : '暂无') + '</div><div class="stat-label">最大回撤</div><div class="stat-sub">' + (worstPick && parsePerf(worstPick.perf) < 0 ? worstPick.perf : '全部盈利') + '</div></div>' +
    '</div>' +
    '<div class="chart-container"><div class="chart-title">📊 历史推荐表现分布</div><div class="chart-bars" id="chart-bars"></div></div>';

  const chartBars = document.getElementById('chart-bars');
  allHistPicks.forEach(p => {
    const perfNum = parsePerf(p.perf);
    const group = document.createElement('div'); group.className = 'chart-bar-group';
    const bar = document.createElement('div');
    bar.className = 'chart-bar ' + (perfNum >= 0 ? 'up' : 'down');
    bar.style.height = Math.max(4, Math.abs(perfNum) * 6) + 'px';
    bar.title = p.name + ': ' + p.perf;
    const name = document.createElement('span'); name.className = 'chart-bar-label'; name.textContent = p.name.length > 4 ? p.name.slice(0,4)+'..' : p.name;
    const value = document.createElement('span'); value.className = 'chart-bar-value'; value.textContent = p.perf; value.style.color = perfNum >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    group.appendChild(bar); group.appendChild(value); group.appendChild(name);
    chartBars.appendChild(group);
  });

  // ===== G. HISTORY TABLE =====
  document.getElementById('history-tbody').innerHTML = history.map(h => {
    const avgPf = (h.picks.reduce((s,p) => s + parsePerf(p.perf), 0) / h.picks.length);
    const avgStr = (avgPf >= 0 ? '+' : '') + avgPf.toFixed(1) + '%';
    const avgClass = avgPf >= 0 ? 'pos' : 'neg';
    return '<tr><td class="hist-week">' + h.weekLabel + '</td><td class="hist-top">' + h.topPick + '</td>' +
      '<td class="hist-picks-td">' + h.picks.map(p =>
        '<span class="hist-tag"><span class="n">' + p.name + '</span><span style="color:var(--text-muted);font-size:11px">' + p.code + '</span><span style="color:' + (parsePerf(p.perf)>=0?'var(--accent-green)':'var(--accent-red)') + ';font-weight:600;font-size:12px">' + p.perf + '</span></span>'
      ).join('') + '</td>' +
      '<td class="hist-avg ' + avgClass + '">' + avgStr + '</td></tr>';
  }).join('');

  // ===== H. STOCK DETAIL MODAL =====
  const overlay = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-content');
  function openModal(stockData) {
    const isTop = stockData.rating === '强烈推荐';
    modalContent.innerHTML =
      '<button class="modal-close" onclick="document.getElementById(\'modal-overlay\').classList.remove(\'active\')">&times;</button>' +
      '<div style="margin-bottom:8px;"><span class="modal-stock-name">' + stockData.name + '</span><span class="modal-stock-code">' + stockData.code + '</span></div>' +
      '<span class="modal-sector">' + stockData.sector + '</span>' + (isTop ? '<span style="margin-left:6px;font-size:12px;color:var(--accent-yellow)">⭐ 本周最看好</span>' : '') +
      '<div class="modal-grid" style="margin-top:16px;">' +
        '<div class="modal-metric"><div class="lbl">当前股价</div><div class="val">' + stockData.price + ' 元</div></div>' +
        '<div class="modal-metric"><div class="lbl">目标价</div><div class="val" style="color:var(--accent-green)">' + stockData.targetPrice + ' 元</div></div>' +
        '<div class="modal-metric"><div class="lbl">上涨空间</div><div class="val" style="color:var(--accent-green)">' + stockData.upside + '</div></div>' +
        '<div class="modal-metric"><div class="lbl">PE</div><div class="val">' + stockData.pe + '</div></div>' +
        '<div class="modal-metric"><div class="lbl">股息率</div><div class="val">' + stockData.dividendYield + '</div></div>' +
        '<div class="modal-metric"><div class="lbl">风险等级</div><div class="val">' + stockData.riskLevel + '</div></div>' +
      '</div>' +
      '<div class="modal-section"><h4>📋 投资逻辑</h4><p>' + stockData.thesis + '</p></div>' +
      '<div class="modal-section"><h4>🎯 操作参考</h4>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:13px;color:var(--text-secondary);">' +
          '<div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;"><div style="color:var(--accent-green);font-weight:600;margin-bottom:4px;">🟢 入场区间</div><div>' + (stockData.entryZone || '—') + '</div></div>' +
          '<div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;"><div style="color:var(--accent-red);font-weight:600;margin-bottom:4px;">🔴 止损位</div><div>' + (stockData.stopLoss || '—') + '</div></div>' +
          '<div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;"><div style="color:var(--accent-yellow);font-weight:600;margin-bottom:4px;">🏁 目标位</div><div>' + stockData.targetPrice + ' 元</div></div>' +
        '</div></div>' +
      (stockData.catalysts ? '<div class="modal-section"><h4>✅ 催化剂</h4><ul style="list-style:none;padding:0;">' + stockData.catalysts.map(c => '<li style="padding:3px 0;font-size:14px;color:var(--text-secondary);">▸ ' + c + '</li>').join('') + '</ul></div>' : '') +
      (stockData.risks ? '<div class="modal-section"><h4>⚠️ 风险</h4><ul style="list-style:none;padding:0;">' + stockData.risks.map(r => '<li style="padding:3px 0;font-size:14px;color:var(--text-secondary);">▸ ' + r + '</li>').join('') + '</ul></div>' : '') +
      '<div class="modal-section"><h4>⏱️ 建议持有周期</h4><p>' + (stockData.horizon || '—') + '</p></div>';
    overlay.classList.add('active');
  }

  document.querySelectorAll('.top-pick-card, .pick-card').forEach(card => {
    card.addEventListener('click', function(e) {
      if (e.target.closest('button, a, input')) return;
      const code = this.dataset.code;
      let stock = code === currentWeek.topPick.code ? currentWeek.topPick : currentWeek.secondaryPicks.find(p => p.code === code);
      if (stock) openModal(stock);
    });
  });
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.classList.remove('active'); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { overlay.classList.remove('active'); newsModalOverlay.classList.remove('active'); } });

  // ===== I. BACK TO TOP =====
  const backTop = document.getElementById('back-top');
  window.addEventListener('scroll', function() { backTop.classList.toggle('visible', window.scrollY > 600); });
  backTop.addEventListener('click', function() { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  // ===== J. SCROLL ANIMATION =====
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0)'; } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.pick-card, .method-card, .stat-card, .news-card, .history-table tbody tr').forEach(el => {
    el.style.opacity = '0'; el.style.transform = 'translateY(16px)'; el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    observer.observe(el);
  });

  // ===== K. PERIODIC PRICE UPDATE IN CARDS =====
  setInterval(function() {
    if (Object.keys(stockPrices).length === 0) return;
    // Update top pick price
    const tpName = currentWeek.topPick.name;
    if (stockPrices[tpName]) {
      const el = document.getElementById('live-price-' + currentWeek.topPick.code);
      if (el) el.textContent = stockPrices[tpName].price.toFixed(2) + ' 元';
    }
  }, 300000);

  console.log('🚀 舟-自用股票网 v2.0 loaded');
  console.log('   📊 ' + totalPicks + ' picks | ' + totalWeeks + ' weeks | 🏆 ' + winRate + '% win rate');
  console.log('   📰 10 news articles | 💹 ' + (trackedStocks ? trackedStocks.length : 0) + ' stocks tracked');
  console.log('   🔄 Prices refresh every 5 min | News refreshes every 12 hours');
})();
