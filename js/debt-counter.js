// National student debt counter
// Seeded from Federal Reserve data: total U.S. student loan debt (federal + private)
// was $1.841 trillion as of Q4 2025 (Dec 31, 2025).
// Growth rate is an estimate (~$2,854/sec) extrapolated from the recent
// quarterly growth trend. This is a client-side projection from the seed value,
// not a live API feed.

(function() {
  const KNOWN_TOTAL = 1_841_000_000_000; // $1.841T as of Dec 31, 2025 (Federal Reserve)
  const KNOWN_DATE = new Date('2025-12-31T00:00:00Z');
  const GROWTH_PER_SECOND = 2853.88;

  function getCurrentDebt() {
    const secondsElapsed = (Date.now() - KNOWN_DATE.getTime()) / 1000;
    return KNOWN_TOTAL + (secondsElapsed * GROWTH_PER_SECOND);
  }

  function formatCurrency(num) {
    return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  const el = document.getElementById('debt-counter-value');
  if (el) {
    el.textContent = formatCurrency(getCurrentDebt());
    setInterval(() => {
      el.textContent = formatCurrency(getCurrentDebt());
    }, 87); // ~11.5fps for smooth ticking
  }
})();
