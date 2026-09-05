import { el, flattenFields } from './formRenderer.js';

// One independent instance per `type: 'dynamic-table'` field, keyed by field
// id, so js/clearForm.js can reset a specific table without this module
// needing to know about schemas/sections itself (mirrors js/diagramMarkup.js).
const instances = new Map();

function buildCell(col) {
  const td = el('td');
  if (col.type === 'score-select') {
    const select = el('select', { class: 'dt-cell', 'data-col': col.id });
    select.appendChild(el('option', { value: '', text: 'Select…' }));
    for (const opt of col.options) {
      select.appendChild(el('option', { value: String(opt.points), text: `${opt.label} (${opt.points} pts)` }));
    }
    td.appendChild(select);
  } else {
    td.appendChild(el('input', { type: 'text', class: 'dt-cell', 'data-col': col.id, placeholder: col.placeholder }));
  }
  return td;
}

function setUpTable(field) {
  const tbody = document.getElementById(`dt-body-${field.id}`);
  const addBtn = document.getElementById(`${field.id}-add-row`);
  const hiddenInput = document.getElementById(field.id);
  if (!tbody || !addBtn || !hiddenInput) return;

  function renumber() {
    Array.from(tbody.children).forEach((tr, index) => {
      tr.querySelector('.nodule-num').textContent = String(index + 1);
    });
  }

  // Total Points is a literal running sum (0 is a valid, honest starting
  // value); TIRADS Level is a clinical categorization, so it stays '—' until
  // at least one of the five is actually selected, rather than defaulting to
  // "Benign" before any real assessment has been made.
  function recomputeRow(tr) {
    let total = 0;
    let anySelected = false;
    for (const colId of field.scoreColumnIds) {
      const select = tr.querySelector(`[data-col="${colId}"]`);
      if (select && select.value !== '') {
        anySelected = true;
        total += parseInt(select.value, 10) || 0;
      }
    }
    tr.querySelector('.dt-total').textContent = String(total);
    tr.querySelector('.dt-tirads').textContent = anySelected ? field.deriveTirads(total) : '—';
  }

  // Serializes current row data into the hidden input purely so this table
  // can be read by the generic snapshot/print value logic (js/printHelpers.js)
  // the same way a text field would be — print itself reads the live rows
  // directly (see this sheet's printRender), not this mirror.
  function syncHiddenInput() {
    const rows = Array.from(tbody.children).map((tr) => {
      const data = {};
      for (const col of field.columns) {
        data[col.id] = tr.querySelector(`[data-col="${col.id}"]`)?.value ?? '';
      }
      return data;
    });
    const hasAnyData = rows.some((row) => Object.values(row).some((value) => value !== ''));
    hiddenInput.value = hasAnyData ? JSON.stringify(rows) : '';
  }

  function addRow() {
    const tr = el('tr');
    tr.appendChild(el('td', { class: 'nodule-num' }));
    for (const col of field.columns) tr.appendChild(buildCell(col));
    tr.appendChild(el('td', { class: 'dt-total', text: '0' }));
    tr.appendChild(el('td', { class: 'dt-tirads', text: '—' }));

    const deleteBtn = el('button', { type: 'button', class: 'btn btn-danger', text: 'Delete Row' });
    // No confirmation — deleting a mis-entered row should be faster than
    // clearing it field-by-field (DESIGN.md §9), unlike clearing the sheet.
    deleteBtn.addEventListener('click', () => {
      tr.remove();
      renumber();
      syncHiddenInput();
    });
    tr.appendChild(el('td', {}, [deleteBtn]));

    tbody.appendChild(tr);
    renumber();
  }

  tbody.addEventListener('input', () => syncHiddenInput());
  tbody.addEventListener('change', (event) => {
    const tr = event.target.closest('tr');
    if (!tr) return;
    const colId = event.target.dataset?.col;
    if (colId && field.scoreColumnIds.includes(colId)) recomputeRow(tr);
    syncHiddenInput();
  });

  addBtn.addEventListener('click', addRow);

  function reset() {
    tbody.innerHTML = '';
    addRow();
    syncHiddenInput();
  }

  addRow(); // "Starts with a single blank row" (DESIGN.md §9)
  syncHiddenInput();

  instances.set(field.id, { reset });
}

export function initDynamicTables(schema) {
  for (const field of flattenFields(schema)) {
    if (field.type === 'dynamic-table') setUpTable(field);
  }
}

export function resetDynamicTable(fieldId) {
  instances.get(fieldId)?.reset();
}
