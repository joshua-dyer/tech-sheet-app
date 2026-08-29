import { abdominalSheet } from '../data/abdominalSheet.js';
import { renderSheet } from './formRenderer.js';
import { initReveals } from './fieldReveal.js';
import { initAgeCalculator } from './ageCalculator.js';
import { initClearButton } from './clearForm.js';
import { openPrintView } from './printView.js';

const mount = document.getElementById('sheetMount');
renderSheet(abdominalSheet, mount);
initReveals(abdominalSheet);
initAgeCalculator();
initClearButton(abdominalSheet);

document.getElementById('printBtn').addEventListener('click', () => {
  openPrintView(abdominalSheet);
});
