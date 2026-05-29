(function() {
  const data = typeof STOCK_DATA !== 'undefined' ? STOCK_DATA : null;
  if (!data) {
    document.body.innerHTML = '<div style="text-align:center;padding:100px;color:#ef4444;">数据加载失败</div>';
    return;
  }

  const { currentWeek, history } = data;

  // ===== Utility =====
  function formatRelativeTime(isoStr) {
    const now = new Date();
    const then = new Date(isoStr.replace('Z', ''));
    const diffMin = Math.floor((now - then) / 60000);
    if (diffMin < 1) return '刚刚更新';
    if (diffMin < 60) return `${diffMin} 分钟前更新`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} 小时前更新`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD} 天前更新`;
  }

  function parsePerf(perfStr) {
    return parseFloat(perfStr.replace('%', '').replace('+', '')) || 0;
  }

  // ===== Meta Info =====
  const updateTime = new Date(data.lastUpdated).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit'
  });
  document.getElementById('update-time').textContent = updateTime;
  document.getElementById('relative-time').textContent = formatRelativeTime(data.lastUpdated);
  document.getElementById('week-tag').textContent = currentWeek.weekLabel;

  // ===== Sector Filters =====
  const allSectors = new Set();
  allSectors.add(currentWeek.topPick.sector);
  currentWeek.secondaryPicks.forEach(p => allSectors.add(p.sector));
  history.forEach(h => h.picks.forEach(p => { if (p.sector) allSectors.add(p.sector); }));

  const filterContainer = document.getElementById('sector-filters');
  allSectors.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.sector = s;
    btn.textContent = s;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterCards(s);
    });
    filterContainer.appendChild(btn);
  });

  document.querySelector('.filter-btn[data-sector="all"]').addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.filter-btn[data-sector="all"]').classList.add('active');
    filterCards('all');
  });

  function filterCards(sector) {
    const topPickEl = document.getElementById('top-pick');
    const secondaryEl = document.getElementById('secondary-picks');
    const tp = currentWeek.topPick;

    if (sector === 'all' || tp.sector === sector) {
      topPickEl.style.display = '';
    } else {
      topPickEl.style.display = 'none';
    }

    const cards = secondaryEl.querySelectorAll('.pick-card');
    cards.forEach((card, i) => {
      if (sector === 'all' || currentWeek.secondaryPicks[i].sector === sector) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // ===== Render Top Pick =====
  const tp = currentWeek.topPick;
  const topEl = document.getElementById('top-pick');
  topEl.innerHTML = `
    <div class="top-pick-card" data-code="${tp.code}" data-name="${tp.name}">
      <div class="top-pick-badge">⭐ 本周最看好</div>
      <div class="top-pick-header">
        <div>
          <span class="top-pick-name">${tp.name}</span>
          <span class="top-pick-code">${tp.code}</span>
        </div>
        <span class="top-pick-sector">${tp.sector}</span>
      </div>
      <div class="top-pick-grid">
        <div class="metric-card"><div class="metric-label">当前股价</div><div class="metric-value">${tp.price} 元</div></div>
        <div class="metric-card"><div class="metric-label">目标价</div><div class="metric-value up">${tp.targetPrice} 元</div></div>
        <div class="metric-card"><div class="metric-label">上涨空间</div><div class="metric-value up">${tp.upside}</div></div>
        <div class="metric-card"><div class="metric-label">市值</div><div class="metric-value">${tp.marketCap}</div></div>
        <div class="metric-card"><div class="metric-label">PE / PB</div><div class="metric-value">${tp.pe} / ${tp.pb}</div></div>
        <div class="metric-card"><div class="metric-label">风险等级</div><div class="metric-value warn">${tp.riskLevel}</div></div>
      </div>
      <div class="top-pick-thesis">
        <h4>📋 投资逻辑</h4>
        <p>${tp.thesis}</p>
      </div>
      <div style="display:flex;gap:20px;margin-top:14px;flex-wrap:wrap;">
        <div style="flex:1;min-width:180px;">
          <h4 style="font-size:13px;color:var(--accent-green);margin-bottom:6px;">✅ 催化剂</h4>
          <ul style="list-style:none;font-size:13px;color:var(--text-secondary);">
            ${tp.catalysts.map(c => `<li style="padding:2px 0;">▸ ${c}</li>`).join('')}
          </ul>
        </div>
        <div style="flex:1;min-width:180px;">
          <h4 style="font-size:13px;color:var(--accent-red);margin-bottom:6px;">⚠️ 风险</h4>
          <ul style="list-style:none;font-size:13px;color:var(--text-secondary);">
            ${tp.risks.map(r => `<li style="padding:2px 0;">▸ ${r}</li>`).join('')}
          </ul>
        </div>
        <div style="flex:1;min-width:180px;">
          <h4 style="font-size:13px;color:var(--accent-yellow);margin-bottom:6px;">🎯 操作参考</h4>
          <div style="font-size:13px;color:var(--text-secondary);">
            <div style="padding:2px 0;">入场区：${tp.entryZone || '—'}</div>
            <div style="padding:2px 0;">止损位：${tp.stopLoss || '—'}</div>
            <div style="padding:2px 0;">目标价：${tp.targetPrice} 元</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ===== Render Secondary Picks =====
  const badgeMap = { buy: 'badge-buy', hold: 'badge-hold', watch: 'badge-watch' };
  const ratingLabel = { buy: '买入', hold: '持有', watch: '关注' };
  document.getElementById('secondary-picks').innerHTML = currentWeek.secondaryPicks.map(p => `
    <div class="pick-card" data-code="${p.code}" data-name="${p.name}">
      <div class="pick-card-header">
        <div>
          <span class="pick-card-name">${p.name}</span>
          <span class="pick-card-code"> ${p.code}</span>
        </div>
        <span class="pick-card-badge ${badgeMap[p.badge] || 'badge-watch'}">${ratingLabel[p.badge] || '关注'}</span>
      </div>
      <div class="pick-card-metrics">
        <div><div class="pick-metric-label">现价 / 目标</div><div class="pick-metric-value">${p.price} / <span style="color:var(--accent-green)">${p.targetPrice}</span></div></div>
        <div><div class="pick-metric-label">上涨空间</div><div class="pick-metric-value" style="color:var(--accent-green)">${p.upside}</div></div>
        <div><div class="pick-metric-label">PE / 股息率</div><div class="pick-metric-value">${p.pe} / ${p.dividendYield}</div></div>
        <div><div class="pick-metric-label">风险 / 周期</div><div class="pick-metric-value" style="font-size:13px">${p.riskLevel} / ${p.horizon}</div></div>
      </div>
      <div class="pick-card-thesis">${p.thesis}</div>
      <div class="pick-card-extra">
        <span>🟢 入场：${p.entryZone || '—'}</span>
        <span>🔴 止损：${p.stopLoss || '—'}</span>
      </div>
    </div>
  `).join('');

  // ===== Dashboard =====
  const allHistPicks = [];
  history.forEach(h => {
    h.picks.forEach(p => {
      allHistPicks.push({ ...p, week: h.weekLabel });
    });
  });

  const totalPicks = allHistPicks.length;
  const winningPicks = allHistPicks.filter(p => parsePerf(p.perf) > 0).length;
  const winRate = totalPicks > 0 ? ((winningPicks / totalPicks) * 100).toFixed(0) : 0;
  const avgReturn = totalPicks > 0 ? (allHistPicks.reduce((s, p) => s + parsePerf(p.perf), 0) / totalPicks).toFixed(1) : 0;
  const bestPick = allHistPicks.length > 0 ? allHistPicks.reduce((a, b) => parsePerf(a.perf) > parsePerf(b.perf) ? a : b) : null;
  const worstPick = allHistPicks.length > 0 ? allHistPicks.reduce((a, b) => parsePerf(a.perf) < parsePerf(b.perf) ? a : b) : null;
  const totalWeeks = history.length;

  document.getElementById('dashboard-content').innerHTML = `
    <div class="dashboard-grid">
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-value">${totalWeeks}</div>
        <div class="stat-label">跟踪周数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-value">${totalPicks}</div>
        <div class="stat-label">累计推荐</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-value" style="color:var(--accent-green)">${winRate}%</div>
        <div class="stat-label">胜率</div>
        <div class="stat-sub">${winningPicks}/${totalPicks} 只盈利</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-value" style="color:${avgReturn >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">${avgReturn >= 0 ? '+' : ''}${avgReturn}%</div>
        <div class="stat-label">平均收益</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🥇</div>
        <div class="stat-value" style="font-size:20px;color:var(--accent-green)">${bestPick ? bestPick.name : '—'}</div>
        <div class="stat-label">最佳表现</div>
        <div class="stat-sub">${bestPick ? bestPick.perf : ''}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚠️</div>
        <div class="stat-value" style="font-size:20px;color:var(--accent-red)">${worstPick && parsePerf(worstPick.perf) < 0 ? worstPick.name : '暂无'}</div>
        <div class="stat-label">最大回撤</div>
        <div class="stat-sub">${worstPick && parsePerf(worstPick.perf) < 0 ? worstPick.perf : '全部盈利'}</div>
      </div>
    </div>
    <div class="chart-container">
      <div class="chart-title">📊 历史推荐表现分布</div>
      <div class="chart-bars" id="chart-bars"></div>
    </div>
  `;

  // Chart
  const chartBars = document.getElementById('chart-bars');
  allHistPicks.forEach(p => {
    const perfNum = parsePerf(p.perf);
    const group = document.createElement('div');
    group.className = 'chart-bar-group';
    const bar = document.createElement('div');
    const height = Math.max(4, Math.abs(perfNum) * 6);
    bar.className = 'chart-bar ' + (perfNum >= 0 ? 'up' : 'down');
    bar.style.height = height + 'px';
    bar.title = `${p.name}: ${p.perf}`;
    const name = document.createElement('span');
    name.className = 'chart-bar-label';
    name.textContent = p.name.length > 4 ? p.name.slice(0, 4) + '..' : p.name;
    const value = document.createElement('span');
    value.className = 'chart-bar-value';
    value.textContent = p.perf;
    value.style.color = perfNum >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    group.appendChild(bar);
    group.appendChild(value);
    group.appendChild(name);
    chartBars.appendChild(group);
  });

  // ===== History Table =====
  document.getElementById('history-tbody').innerHTML = history.map(h => {
    const avgPerf = (h.picks.reduce((s, p) => s + parsePerf(p.perf), 0) / h.picks.length);
    const avgStr = (avgPerf >= 0 ? '+' : '') + avgPerf.toFixed(1) + '%';
    const avgClass = avgPerf >= 0 ? 'pos' : 'neg';
    return `
      <tr>
        <td class="hist-week">${h.weekLabel}</td>
        <td class="hist-top">${h.topPick}</td>
        <td class="hist-picks-td">
          ${h.picks.map(p => `
            <span class="hist-tag">
              <span class="n">${p.name}</span>
              <span style="color:var(--text-muted);font-size:11px">${p.code}</span>
              <span style="color:${parsePerf(p.perf)>=0?'var(--accent-green)':'var(--accent-red)'};font-weight:600;font-size:12px">${p.perf}</span>
            </span>
          `).join('')}
        </td>
        <td class="hist-avg ${avgClass}">${avgStr}</td>
      </tr>
    `;
  }).join('');

  // ===== Modal =====
  const overlay = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-content');

  function openModal(stockData) {
    const isTop = stockData.rating === '强烈推荐';
    modalContent.innerHTML = `
      <button class="modal-close" onclick="document.getElementById('modal-overlay').classList.remove('active')">&times;</button>
      <div style="margin-bottom:8px;">
        <span class="modal-stock-name">${stockData.name}</span>
        <span class="modal-stock-code">${stockData.code}</span>
      </div>
      <span class="modal-sector">${stockData.sector}</span>
      ${isTop ? '<span style="margin-left:6px;font-size:12px;color:var(--accent-yellow)">⭐ 本周最看好</span>' : ''}
      <div class="modal-grid" style="margin-top:16px;">
        <div class="modal-metric"><div class="lbl">当前股价</div><div class="val">${stockData.price} 元</div></div>
        <div class="modal-metric"><div class="lbl">目标价</div><div class="val" style="color:var(--accent-green)">${stockData.targetPrice} 元</div></div>
        <div class="modal-metric"><div class="lbl">上涨空间</div><div class="val" style="color:var(--accent-green)">${stockData.upside}</div></div>
        <div class="modal-metric"><div class="lbl">PE</div><div class="val">${stockData.pe}</div></div>
        <div class="modal-metric"><div class="lbl">股息率</div><div class="val">${stockData.dividendYield}</div></div>
        <div class="modal-metric"><div class="lbl">风险等级</div><div class="val">${stockData.riskLevel}</div></div>
      </div>
      <div class="modal-section">
        <h4>📋 投资逻辑</h4>
        <p>${stockData.thesis}</p>
      </div>
      <div class="modal-section">
        <h4>🎯 操作参考</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:13px;color:var(--text-secondary);">
          <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;">
            <div style="color:var(--accent-green);font-weight:600;margin-bottom:4px;">🟢 入场区间</div>
            <div>${stockData.entryZone || '—'}</div>
          </div>
          <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;">
            <div style="color:var(--accent-red);font-weight:600;margin-bottom:4px;">🔴 止损位</div>
            <div>${stockData.stopLoss || '—'}</div>
          </div>
          <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;">
            <div style="color:var(--accent-yellow);font-weight:600;margin-bottom:4px;">🏁 目标位</div>
            <div>${stockData.targetPrice} 元</div>
          </div>
        </div>
      </div>
      ${stockData.catalysts ? `
      <div class="modal-section">
        <h4>✅ 催化剂</h4>
        <ul style="list-style:none;padding:0;">
          ${stockData.catalysts.map(c => `<li style="padding:3px 0;font-size:14px;color:var(--text-secondary);">▸ ${c}</li>`).join('')}
        </ul>
      </div>` : ''}
      ${stockData.risks ? `
      <div class="modal-section">
        <h4>⚠️ 风险</h4>
        <ul style="list-style:none;padding:0;">
          ${stockData.risks.map(r => `<li style="padding:3px 0;font-size:14px;color:var(--text-secondary);">▸ ${r}</li>`).join('')}
        </ul>
      </div>` : ''}
      <div class="modal-section">
        <h4>⏱️ 建议持有周期</h4>
        <p>${stockData.horizon || '—'}</p>
      </div>
    `;
    overlay.classList.add('active');
  }

  // Click handlers for cards
  document.querySelectorAll('.top-pick-card, .pick-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't open modal if clicking on interactive elements
      if (e.target.closest('button, a, input')) return;
      const code = card.dataset.code;
      let stock;
      if (code === currentWeek.topPick.code) {
        stock = currentWeek.topPick;
      } else {
        stock = currentWeek.secondaryPicks.find(p => p.code === code);
      }
      if (stock) openModal(stock);
    });
  });

  // Close modal on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });

  // ESC to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.classList.remove('active');
  });

  // ===== Back to Top =====
  const backTop = document.getElementById('back-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 600) {
      backTop.classList.add('visible');
    } else {
      backTop.classList.remove('visible');
    }
  });
  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ===== Scroll Animation =====
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.pick-card, .method-card, .stat-card, .history-table tbody tr').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    observer.observe(el);
  });

  console.log('🚀 舟-自用股票网 loaded successfully');
  console.log(`   📊 ${totalPicks} picks tracked over ${totalWeeks} weeks`);
  console.log(`   🏆 Win rate: ${winRate}% | Avg return: ${avgReturn >= 0 ? '+' : ''}${avgReturn}%`);
})();
