(function() {
  const CLEP_COST = 97; // College Board CLEP exam fee, 2025-26 (official current rate)
  const AVG_CREDIT_COST_PUBLIC = 400; // per credit, in-state public
  const AVG_CREDIT_COST_PRIVATE = 1200; // per credit, private
  const CREDITS_PER_EXAM = 3;

  const slider = document.getElementById('clep-exam-count');
  const schoolType = document.getElementById('clep-school-type');
  const resultEl = document.getElementById('clep-savings-result');
  const examCountEl = document.getElementById('clep-exam-display');
  const creditsEl = document.getElementById('clep-credits-display');

  function calculate() {
    if (!slider || !resultEl) return;
    const exams = parseInt(slider.value);
    const isPrivate = schoolType && schoolType.value === 'private';
    const creditCost = isPrivate ? AVG_CREDIT_COST_PRIVATE : AVG_CREDIT_COST_PUBLIC;

    const totalCredits = exams * CREDITS_PER_EXAM;
    const collegeCost = totalCredits * creditCost;
    const clepCost = exams * CLEP_COST;
    const savings = collegeCost - clepCost;

    if (examCountEl) examCountEl.textContent = exams;
    if (creditsEl) creditsEl.textContent = totalCredits;
    resultEl.textContent = '$' + savings.toLocaleString('en-US');
  }

  if (slider) {
    slider.addEventListener('input', calculate);
    if (schoolType) schoolType.addEventListener('change', calculate);
    calculate();
  }
})();
