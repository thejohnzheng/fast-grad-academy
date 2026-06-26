const LAUNCH_DATE = new Date('2026-06-24T00:00:00-05:00');
const REVENUE_TARGET = 1970;
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

let charts = [];

function $(id) {
  return document.getElementById(id);
}

function dayKey(dateString) {
  return new Date(dateString).toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function destroyCharts() {
  charts.forEach((chart) => chart.destroy());
  charts = [];
}

function chart(id, type, labels, data, label) {
  const ctx = $(id);
  charts.push(new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: ['#c4a97d', '#2ecc71', '#5dade2', '#f5b041', '#af7ac5', '#ec7063'],
        borderColor: '#c4a97d',
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#fff' } } },
      scales: type === 'pie' ? {} : {
        x: { ticks: { color: 'rgba(255,255,255,.62)' }, grid: { color: 'rgba(255,255,255,.06)' } },
        y: { ticks: { color: 'rgba(255,255,255,.62)' }, grid: { color: 'rgba(255,255,255,.06)' } },
      },
    },
  }));
}

function render(data) {
  const sales = data.sales || [];
  const totalRevenue = data.total_revenue || 0;
  const totalSales = data.total_sales || sales.length;
  const progress = Math.min(100, Math.round((totalRevenue / REVENUE_TARGET) * 100));
  const days = Math.max(0, Math.ceil((Date.now() - LAUNCH_DATE.getTime()) / 86400000));

  $('totalRevenue').textContent = currency.format(totalRevenue);
  $('totalSales').textContent = totalSales.toLocaleString();
  $('daysSinceLaunch').textContent = days.toLocaleString();
  $('targetProgress').textContent = `${progress}%`;
  $('targetBar').style.width = `${progress}%`;
  $('updated').textContent = `Updated ${new Date().toLocaleString()}`;

  $('salesTable').innerHTML = sales.map((sale) => `
    <tr>
      <td>${escapeHtml(new Date(sale.created_at).toLocaleString())}</td>
      <td>${escapeHtml(sale.email)}</td>
      <td>${currency.format((sale.amount_cents || 0) / 100)}</td>
      <td>${escapeHtml(sale.source || 'direct')}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" class="muted">No purchases logged yet.</td></tr>';

  const byDay = {};
  const bySource = {};
  sales.slice().reverse().forEach((sale) => {
    const day = dayKey(sale.created_at);
    byDay[day] = byDay[day] || { count: 0, revenue: 0 };
    byDay[day].count += 1;
    byDay[day].revenue += (sale.amount_cents || 0) / 100;
    const source = sale.source || 'direct';
    bySource[source] = (bySource[source] || 0) + 1;
  });

  const dayLabels = Object.keys(byDay).sort();
  let running = 0;
  const cumulative = dayLabels.map((day) => {
    running += byDay[day].revenue;
    return Math.round(running);
  });

  destroyCharts();
  chart('dailySales', 'bar', dayLabels, dayLabels.map((day) => byDay[day].count), 'Sales');
  chart('cumulativeRevenue', 'line', dayLabels, cumulative, 'Revenue');
  chart('sourceBreakdown', 'pie', Object.keys(bySource), Object.values(bySource), 'Sources');
}

async function loadDashboard() {
  const password = $('password').value;
  $('error').textContent = '';

  try {
    const res = await fetch(`/api/dashboard?password=${encodeURIComponent(password)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Unable to load dashboard.');
    $('gate').classList.add('hidden');
    $('dashboard').classList.remove('hidden');
    render(data);
  } catch (err) {
    $('error').textContent = err.message;
  }
}

$('login').addEventListener('click', loadDashboard);
$('password').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') loadDashboard();
});
