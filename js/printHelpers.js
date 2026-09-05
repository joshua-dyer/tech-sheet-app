// Pure, schema-agnostic DOM-reading utilities shared by the print engine
// (js/printView.js) and any sheet-specific bespoke print logic (e.g. a
// section's `printRender`, defined in that sheet's own data file). No
// dependency on any schema/data file, so it's safe for data files to import
// this without creating a circular reference.

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getCheckedGroupValues(field) {
  return Array.from(document.querySelectorAll(`input[name="${field.id}"]:checked`)).map(
    (input) => input.value
  );
}

export function getDisplayValue(field) {
  switch (field.type) {
    case 'text':
    case 'number':
    case 'date':
    case 'textarea':
    // Both mirror their real state into a hidden input with this same id
    // (see js/diagramMarkup.js / js/dynamicTable.js) purely so these
    // non-standard widgets can be read here identically to a text field —
    // print itself reads their live DOM directly, not this hidden mirror.
    case 'diagram':
    case 'dynamic-table': {
      const el = document.getElementById(field.id);
      return el ? el.value.trim() : '';
    }
    case 'select': {
      const el = document.getElementById(field.id);
      return el ? el.value : '';
    }
    case 'radio': {
      const checked = document.querySelector(`input[name="${field.id}"]:checked`);
      return checked ? checked.value : '';
    }
    case 'checkbox': {
      const el = document.getElementById(field.id);
      return el && el.checked ? 'Yes' : '';
    }
    case 'checkbox-group':
      return getCheckedGroupValues(field).join(', ');
    case 'computed': {
      const el = document.getElementById(field.id);
      return el ? el.textContent.trim() : '';
    }
    default:
      return '';
  }
}

export function isFieldVisible(field) {
  if (!field.hiddenByDefault) return true;
  const wrapper = document.getElementById(`field-wrap-${field.id}`);
  return wrapper ? !wrapper.hidden : false;
}

export function hasValue(field) {
  const value = getDisplayValue(field);
  return value !== '' && value !== '—';
}
