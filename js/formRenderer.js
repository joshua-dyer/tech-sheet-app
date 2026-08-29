function el(tag, attrs = {}, children = []) {
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

function renderSimpleInput(field) {
  const inputAttrs = { type: field.type, id: field.id, name: field.id };
  if (field.type === 'number') inputAttrs.step = '0.1';
  const input = el('input', inputAttrs);
  const label = el('label', { for: field.id, text: labelText(field) });
  return el('div', { class: 'field' }, [label, input]);
}

function renderSelect(field) {
  const select = el('select', { id: field.id, name: field.id });
  select.appendChild(el('option', { value: '', text: 'Select…' }));
  for (const opt of field.options) {
    select.appendChild(el('option', { value: opt, text: opt }));
  }
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
  const output = el('output', { id: field.id, text: '—' });
  const label = el('label', { for: field.id, text: labelText(field) });
  return el('div', { class: 'field' }, [label, output]);
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

function renderSection(section) {
  const sectionEl = el('section', { class: 'card', id: `section-${section.id}` });
  sectionEl.appendChild(el('h2', { text: section.title }));
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
