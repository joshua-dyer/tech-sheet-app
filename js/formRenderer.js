// Exported for reuse by js/dynamicTable.js, which builds/rebuilds table rows
// dynamically at runtime rather than at initial schema-render time.
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'text') node.textContent = value;
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    if (child) node.appendChild(child);
  }
  return node;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function labelText(field) {
  return field.unit ? `${field.label} (${field.unit})` : field.label;
}

// Bare control-builders, split from their label-wrapping callers below so
// js/formRenderer.js's own renderSectionTable (bare cells, labeled instead by
// the table's column headers) can reuse the exact same control construction
// — including things like number's step="0.1" — without duplicating it.
function buildInputControl(field) {
  const inputAttrs = { type: field.type, id: field.id, name: field.id };
  if (field.type === 'number') inputAttrs.step = '0.1';
  return el('input', inputAttrs);
}

function buildSelectControl(field) {
  const select = el('select', { id: field.id, name: field.id });
  select.appendChild(el('option', { value: '', text: 'Select…' }));
  for (const opt of field.options) {
    select.appendChild(el('option', { value: opt, text: opt }));
  }
  if (field.defaultValue !== undefined) select.value = field.defaultValue;
  return select;
}

function buildComputedControl(field) {
  return el('output', { id: field.id, text: '—' });
}

function renderSimpleInput(field) {
  const input = buildInputControl(field);
  const label = el('label', { for: field.id, text: labelText(field) });
  return el('div', { class: 'field' }, [label, input]);
}

function renderSelect(field) {
  const select = buildSelectControl(field);
  const label = el('label', { for: field.id, text: labelText(field) });
  return el('div', { class: 'field' }, [label, select]);
}

function renderRadioGroup(field) {
  const fieldset = el('fieldset', { class: 'field radio-group' });
  fieldset.appendChild(el('legend', { text: labelText(field) }));
  for (const opt of field.options) {
    const optId = `${field.id}-${slugify(opt)}`;
    const input = el('input', { type: 'radio', id: optId, name: field.id, value: opt });
    const label = el('label', { for: optId, class: 'option-label' }, [
      input,
      document.createTextNode(` ${opt}`),
    ]);
    fieldset.appendChild(label);
  }
  return fieldset;
}

function renderCheckbox(field) {
  const input = el('input', { type: 'checkbox', id: field.id, name: field.id });
  const label = el('label', { class: 'option-label' }, [input, document.createTextNode(` ${field.label}`)]);
  return el('div', { class: 'field checkbox-field' }, [label]);
}

function renderCheckboxGroup(field) {
  const fieldset = el('fieldset', { class: 'field checkbox-group' });
  fieldset.appendChild(el('legend', { text: labelText(field) }));
  for (const opt of field.options) {
    const optId = `${field.id}-${slugify(opt)}`;
    const input = el('input', { type: 'checkbox', id: optId, name: field.id, value: opt });
    const label = el('label', { for: optId, class: 'option-label' }, [
      input,
      document.createTextNode(` ${opt}`),
    ]);
    fieldset.appendChild(label);
  }
  return fieldset;
}

function renderTextarea(field) {
  const textarea = el('textarea', { id: field.id, name: field.id, rows: field.large ? 6 : 3 });
  const label = el('label', { for: field.id, text: labelText(field) });
  return el('div', { class: 'field field-wide' }, [label, textarea]);
}

function renderComputed(field) {
  const output = buildComputedControl(field);
  const label = el('label', { for: field.id, text: labelText(field) });
  return el('div', { class: 'field' }, [label, output]);
}

// Canvas holds both the base reference image (drawn via drawImage) and the
// freehand strokes on top — no separate overlaid <img>, so no positioning
// tricks needed. js/diagramMarkup.js does all the drawing/interaction wiring
// after render; this just lays out the static shell it hooks into by id. The
// hidden input mirrors the current strokes as a JSON string (empty when
// none) purely so this non-form-control widget can participate in the
// existing generic snapshot/print value-reading (js/printHelpers.js) without
// any special-casing there beyond treating it like a text field.
function renderDiagram(field) {
  const canvas = el('canvas', { id: `diagram-canvas-${field.id}`, class: 'diagram-canvas' });
  const canvasWrap = el('div', { class: 'diagram-canvas-wrap' }, [canvas]);

  const enableId = `${field.id}-enable`;
  const enableInput = el('input', { type: 'checkbox', id: enableId });
  const enableLabel = el('label', { class: 'option-label', for: enableId }, [
    enableInput,
    document.createTextNode(' Enable Markup'),
  ]);
  const undoBtn = el('button', { type: 'button', id: `${field.id}-undo`, class: 'btn', text: 'Undo' });
  const clearBtn = el('button', { type: 'button', id: `${field.id}-clear`, class: 'btn', text: 'Clear' });
  const controls = el('div', { class: 'diagram-controls' }, [enableLabel, undoBtn, clearBtn]);

  const container = el('div', { class: 'diagram-container', id: `diagram-${field.id}` }, [
    canvasWrap,
    controls,
  ]);
  const hiddenInput = el('input', { type: 'hidden', id: field.id, name: field.id });

  const fieldset = el('fieldset', { class: 'field diagram-field' });
  fieldset.appendChild(el('legend', { text: field.label }));
  fieldset.appendChild(container);
  fieldset.appendChild(hiddenInput);
  return fieldset;
}

// Static shell only (header + empty body + Add Row + a scoring key built
// from the same `columns` data the dropdowns use, so it can't drift out of
// sync) — js/dynamicTable.js owns all row creation, including the initial
// blank row, so that logic lives in exactly one place rather than being
// duplicated between render-time and add-row-time.
function renderDynamicTable(field) {
  const table = el('table', { class: 'dynamic-table' });
  const headRow = el('tr');
  headRow.appendChild(el('th', { text: 'Nodule #' }));
  for (const col of field.columns) headRow.appendChild(el('th', { text: col.label }));
  headRow.appendChild(el('th', { text: 'Total Points' }));
  headRow.appendChild(el('th', { text: 'TIRADS Level' }));
  headRow.appendChild(el('th', { text: '' }));
  table.appendChild(el('thead', {}, [headRow]));
  table.appendChild(el('tbody', { id: `dt-body-${field.id}` }));

  const addBtn = el('button', { type: 'button', id: `${field.id}-add-row`, class: 'btn', text: 'Add Row' });

  const keyRows = field.columns
    .filter((col) => col.type === 'score-select')
    .map((col) =>
      el('div', { class: 'scoring-key-row' }, [
        el('span', { class: 'scoring-key-label', text: col.label }),
        el('span', {
          class: 'scoring-key-values',
          text: col.options.map((opt) => `${opt.label}: ${opt.points}`).join(', '),
        }),
      ])
    );
  const scoringKey = el('div', { class: 'scoring-key' }, [
    el('div', { class: 'scoring-key-title', text: 'Scoring Key' }),
    ...keyRows,
  ]);

  const hiddenInput = el('input', { type: 'hidden', id: field.id, name: field.id });
  const tableScroll = el('div', { class: 'dynamic-table-scroll' }, [table]);

  return el('div', { class: 'field field-wide dynamic-table-field' }, [
    tableScroll,
    addBtn,
    scoringKey,
    hiddenInput,
  ]);
}

// Pure read-only reference display — not tied to any form field, so it's
// deliberately absent from getDisplayValue/hasValue/clearSheet: their
// existing `default` branches already treat an unrecognized type as "no
// value, nothing to clear," which is exactly "on-screen only, never
// printed" with no extra code anywhere else.
function renderStaticTable(field) {
  const table = el('table', { class: 'dynamic-table' });
  const headRow = el('tr');
  for (const col of field.columns) headRow.appendChild(el('th', { text: col }));
  table.appendChild(el('thead', {}, [headRow]));

  const tbody = el('tbody');
  for (const rowValues of field.rows) {
    const tr = el('tr');
    for (const cellText of rowValues) tr.appendChild(el('td', { text: cellText }));
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  const tableScroll = el('div', { class: 'dynamic-table-scroll' }, [table]);
  return el('div', { class: 'field field-wide' }, [tableScroll]);
}

const RENDERERS = {
  text: renderSimpleInput,
  number: renderSimpleInput,
  date: renderSimpleInput,
  select: renderSelect,
  radio: renderRadioGroup,
  checkbox: renderCheckbox,
  'checkbox-group': renderCheckboxGroup,
  textarea: renderTextarea,
  computed: renderComputed,
  diagram: renderDiagram,
  'dynamic-table': renderDynamicTable,
  'static-table': renderStaticTable,
};

function renderField(field) {
  const renderer = RENDERERS[field.type];
  if (!renderer) throw new Error(`Unknown field type: ${field.type}`);
  const contentEl = renderer(field);

  if (!field.hiddenByDefault) return contentEl;

  const wrapper = el('div', {
    class: 'field reveal-target',
    id: `field-wrap-${field.id}`,
    hidden: true,
  });
  wrapper.appendChild(el('div', { class: 'reveal-inner' }, [contentEl]));
  return wrapper;
}

// A fixed (non-repeatable) table of otherwise-ordinary fields — e.g. Right/
// Left vessel panels, where each "row" is really just a normal set of
// individually-declared fields with resolved ids, laid out as a real
// <table> instead of the default card/field-grid because the row headers
// (Right/Left) already label each field, making per-field labels redundant.
// Reuses the bare control-builders above, not js/dynamicTable.js — that
// module's add/delete-row and per-row scoring logic doesn't apply to a
// fixed two-row table.
function buildTableCell(field) {
  const td = el('td');
  if (!field) return td;
  if (field.type === 'select') td.appendChild(buildSelectControl(field));
  else if (field.type === 'computed') td.appendChild(buildComputedControl(field));
  else td.appendChild(buildInputControl(field));
  return td;
}

function renderSectionTable(section) {
  const table = el('table', { class: 'dynamic-table' });
  const headRow = el('tr');
  headRow.appendChild(el('th', { text: '' }));
  for (const heading of section.tableColumns) headRow.appendChild(el('th', { text: heading }));
  table.appendChild(el('thead', {}, [headRow]));

  const fieldsById = new Map(section.fields.map((field) => [field.id, field]));
  const tbody = el('tbody');
  for (const row of section.tableRows) {
    const tr = el('tr');
    tr.appendChild(el('th', { text: row.label, scope: 'row' }));
    for (const fieldId of row.fieldIds) {
      tr.appendChild(buildTableCell(fieldsById.get(fieldId)));
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  const tableScroll = el('div', { class: 'dynamic-table-scroll' }, [table]);
  return el('div', { class: 'field-wide' }, [tableScroll]);
}

function renderSection(section) {
  const sectionEl = el('section', { class: 'card', id: `section-${section.id}` });
  sectionEl.appendChild(el('h2', { text: section.title }));

  if (section.layout === 'table') {
    sectionEl.appendChild(renderSectionTable(section));
    return sectionEl;
  }

  const body = el('div', { class: 'field-grid' });

  let rowBuffer = [];
  const flushRow = () => {
    if (rowBuffer.length === 0) return;
    const rowFieldset = el('fieldset', { class: 'field row-group' });
    if (section.rowLabel) rowFieldset.appendChild(el('legend', { text: section.rowLabel }));
    const rowInner = el('div', { class: 'row' });
    for (const f of rowBuffer) rowInner.appendChild(renderField(f));
    rowFieldset.appendChild(rowInner);
    body.appendChild(rowFieldset);
    rowBuffer = [];
  };

  for (const field of section.fields) {
    if (field.row) {
      rowBuffer.push(field);
    } else {
      flushRow();
      body.appendChild(renderField(field));
    }
  }
  flushRow();

  sectionEl.appendChild(body);
  return sectionEl;
}

export function renderSheet(schema, mountEl) {
  mountEl.innerHTML = '';
  for (const section of schema.sections) {
    mountEl.appendChild(renderSection(section));
  }
}

export function flattenFields(schema) {
  return schema.sections.flatMap((section) =>
    section.fields.map((field) => ({ ...field, sectionId: section.id }))
  );
}
