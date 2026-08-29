export function initAgeCalculator() {
  const dobInput = document.getElementById('dob');
  const examDateInput = document.getElementById('examDate');
  const ageOutput = document.getElementById('age');
  if (!dobInput || !examDateInput || !ageOutput) return;

  const recompute = () => {
    const dob = dobInput.value ? new Date(dobInput.value) : null;
    const examDate = examDateInput.value ? new Date(examDateInput.value) : null;

    if (!dob || !examDate || Number.isNaN(dob.getTime()) || Number.isNaN(examDate.getTime())) {
      ageOutput.textContent = '—';
      return;
    }

    let age = examDate.getUTCFullYear() - dob.getUTCFullYear();
    const hadBirthdayByExam =
      examDate.getUTCMonth() > dob.getUTCMonth() ||
      (examDate.getUTCMonth() === dob.getUTCMonth() && examDate.getUTCDate() >= dob.getUTCDate());
    if (!hadBirthdayByExam) age -= 1;

    ageOutput.textContent = age >= 0 ? String(age) : '—';
  };

  dobInput.addEventListener('blur', recompute);
  examDateInput.addEventListener('blur', recompute);
}
