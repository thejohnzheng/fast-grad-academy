(function() {
  const CLEP_COST = 97;
  const CREDITS_PER_EXAM = 3;
  const CREDITS_PER_SEMESTER = 15;

  const schoolType = document.getElementById('school-type');
  const customWrap = document.getElementById('custom-credit-wrap');
  const creditCost = document.getElementById('credit-cost');
  const creditsRemaining = document.getElementById('credits-remaining');
  const clepExams = document.getElementById('clep-exams');
  const examLabel = document.getElementById('clep-exam-label');
  const creditLabel = document.getElementById('clep-credit-label');
  const savingsOutput = document.getElementById('savings-output');
  const timeOutput = document.getElementById('time-output');
  const traditionalOutput = document.getElementById('traditional-output');
  const acceleratedOutput = document.getElementById('accelerated-output');
  const savingsField = document.getElementById('estimated-savings-field');
  const semestersField = document.getElementById('estimated-semesters-field');

  function money(value) {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    });
  }

  function numeric(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }

  function getCreditCost() {
    if (!schoolType) return 400;
    if (schoolType.value === 'custom') return numeric(creditCost?.value, 400);
    return numeric(schoolType.value, 400);
  }

  function calculate() {
    const perCredit = getCreditCost();
    const remaining = Math.max(0, numeric(creditsRemaining?.value, 60));
    const exams = Math.max(0, numeric(clepExams?.value, 0));
    const potentialClepCredits = exams * CREDITS_PER_EXAM;
    const earnedCredits = Math.min(remaining, potentialClepCredits);
    const traditionalCost = remaining * perCredit;
    const examCost = exams * CLEP_COST;
    const acceleratedCost = Math.max(0, (remaining - earnedCredits) * perCredit) + examCost;
    const savings = Math.max(0, traditionalCost - acceleratedCost);
    const semestersSaved = earnedCredits / CREDITS_PER_SEMESTER;

    if (customWrap) customWrap.hidden = schoolType?.value !== 'custom';
    if (examLabel) examLabel.textContent = String(exams);
    if (creditLabel) creditLabel.textContent = String(earnedCredits);
    if (savingsOutput) savingsOutput.textContent = money(savings);
    if (timeOutput) timeOutput.textContent = semestersSaved.toFixed(1);
    if (traditionalOutput) traditionalOutput.textContent = money(traditionalCost);
    if (acceleratedOutput) acceleratedOutput.textContent = money(acceleratedCost);
    if (savingsField) savingsField.value = String(Math.round(savings));
    if (semestersField) semestersField.value = semestersSaved.toFixed(1);
  }

  [schoolType, creditCost, creditsRemaining, clepExams].forEach((element) => {
    element?.addEventListener('input', calculate);
    element?.addEventListener('change', calculate);
  });

  calculate();
})();
