// Chart rendering logic (Chart.js / Recharts)
(function() {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  // Create tooltip
  function createTooltip() {
    const tip = document.createElement('div');
    tip.className = 'dashboard-tooltip';
    tip.style.position = 'fixed';
    tip.style.pointerEvents = 'none';
    tip.style.padding = '6px 8px';
    tip.style.borderRadius = '6px';
    tip.style.zIndex = 9999;
    tip.style.fontSize = '0.85rem';
    tip.style.background = 'rgba(8,10,14,0.88)';
    tip.style.color = '#fff';
    tip.style.transition = 'opacity .12s ease';
    tip.style.opacity = '0';
    document.body.appendChild(tip);

    let hideTimer = null;
    return {
      show(text, x, y) {
        clearTimeout(hideTimer);
        tip.textContent = text;
        tip.style.left = (x + 12) + 'px';
        tip.style.top = (y + 12) + 'px';
        tip.style.opacity = '1';
      },
      move(x, y) {
        tip.style.left = (x + 12) + 'px';
        tip.style.top = (y + 12) + 'px';
      },
      hide(delay = 80) {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => tip.style.opacity = '0', delay);
      },
      destroy() {
        tip.remove();
      }
    };
  }

  const tooltip = createTooltip();

  // Sentiment pie chart interactions
  function initSentiment() {
    const container = document.querySelector('.sentiment-pie');
    if (!container) return;

    const pie = container.querySelector('.pie');
    const legendItems = Array.from(container.querySelectorAll('.legend li'));

    // Make legend items keyboard-focusable
    legendItems.forEach((li, i) => {
      if (!li.hasAttribute('tabindex')) li.setAttribute('tabindex', '0');
      li.dataset.index = String(i);
      li.setAttribute('role', 'button');
      li.setAttribute('aria-pressed', 'false');
    });

    // Add hover/focus handlers
    const enter = () => pie && pie.classList.add('is-hover');
    const leave = () => { pie && pie.classList.remove('is-hover'); tooltip.hide(); };

    on(container, 'mouseenter', enter);
    on(container, 'mouseleave', leave);
    on(container, 'focusin', enter);
    on(container, 'focusout', (e) => {
      if (!container.contains(e.relatedTarget)) leave();
    });

    // Legend item behavior
    legendItems.forEach((li, index) => {
      on(li, 'mouseenter', (ev) => {
        li.classList.add('hovered');
        pie.classList.add(`segment-${index}`);
        const text = li.textContent.trim() || 'item';
        tooltip.show(text, ev.clientX, ev.clientY);
      });

      on(li, 'mousemove', (ev) => tooltip.move(ev.clientX, ev.clientY));

      on(li, 'mouseleave', () => {
        li.classList.remove('hovered');
        pie.classList.remove(`segment-${index}`);
        tooltip.hide();
      });

      on(li, 'click', () => {
        const isSelected = li.classList.toggle('selected');
        li.setAttribute('aria-pressed', String(Boolean(isSelected)));
      });

      on(li, 'keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          li.click();
        }
      });
    });

    // Make pie focusable
    if (pie) {
      pie.setAttribute('tabindex', '0');
      pie.setAttribute('role', 'button');
      on(pie, 'keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          pie.classList.toggle('is-active');
        }
      });
    }
  }

  // Trend chart mouse tracking
  function initTrendChart() {
    const trendChart = $('.trend-chart');
    if (!trendChart) return;

    const svg = trendChart.querySelector('svg');
    if (!svg) return;

    on(trendChart, 'mousemove', (ev) => {
      const rect = trendChart.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const percent = (x / rect.width) * 100;
      
      trendChart.style.setProperty('--mouse-x', percent + '%');
      trendChart.classList.add('mouse-active');
    });

    on(trendChart, 'mouseleave', () => {
      trendChart.classList.remove('mouse-active');
    });
  }

  // Update sentiment chart with data
  function updateSentimentChart(data) {
    if (!data) return;

    const pie = document.querySelector('.pie');
    const legend = document.querySelector('.legend');
    
    if (pie && data.positive !== undefined && data.neutral !== undefined && data.negative !== undefined) {
      const total = data.positive + data.neutral + data.negative;
      const positivePercent = (data.positive / total) * 100;
      const neutralPercent = (data.neutral / total) * 100;
      const negativePercent = (data.negative / total) * 100;

      pie.style.background = `conic-gradient(
        #34d399 0 ${positivePercent}%,
        #fbbf24 ${positivePercent}% ${positivePercent + neutralPercent}%,
        #f87171 ${positivePercent + neutralPercent}%
      )`;

      if (legend) {
        const items = legend.querySelectorAll('li');
        if (items[0]) items[0].innerHTML = `<span class="swatch positive"></span> Positive ${Math.round(positivePercent)}%`;
        if (items[1]) items[1].innerHTML = `<span class="swatch neutral"></span> Neutral ${Math.round(neutralPercent)}%`;
        if (items[2]) items[2].innerHTML = `<span class="swatch negative"></span> Negative ${Math.round(negativePercent)}%`;
      }
    }
  }

  // Update trend chart with data
  function updateTrendChart(data) {
    if (!data || !data.points) return;

    const svg = document.querySelector('.trend-chart svg');
    if (!svg) return;

    // Generate points string from data
    const points = data.points.map((point, index) => {
      const x = (index / (data.points.length - 1)) * 380;
      const y = 180 - (point.value / 100) * 150; // Scale to 0-180
      return `${x},${y}`;
    }).join(' ');

    const polyline = svg.querySelector('polyline');
    if (polyline) {
      polyline.setAttribute('points', points);
    }

    // Update labels if provided
    if (data.labels) {
      const labelsContainer = document.querySelector('.trend-labels');
      if (labelsContainer) {
        labelsContainer.innerHTML = data.labels.map(label => `<span>${label}</span>`).join('');
      }
    }
  }

  // Initialize
  function init() {
    initSentiment();
    initTrendChart();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export
  window.charts = {
    updateSentimentChart,
    updateTrendChart,
    tooltip
  };
})();

