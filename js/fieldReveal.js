import { flattenFields } from './formRenderer.js';

const REVEAL_EVENT_BY_TYPE = {
  text: 'blur',
  number: 'blur',
  date: 'blur',
  select: 'change',
  radio: 'change',
  checkbox: 'change',
  'checkbox-group': 'change',
};

export function revealElement(wrapper) {
  if (!wrapper.hidden) return;
  wrapper.hidden = false;
  requestAnimationFrame(() => wrapper.classList.add('is-visible'));
}

export function hideElement(wrapper) {
  if (wrapper.hidden) return;
  wrapper.classList.remove('is-visible');
  const finish = () => {
    wrapper.hidden = true;
    wrapper.removeEventListener('transitionend', finish);
  };
  wrapper.addEventListener('transitionend', finish);
  // Fallback in case transitionend never fires (e.g. reduced-motion settings).
  setTimeout(finish, 350);
}

// Reveal targets are flat siblings, not DOM-nested under their trigger, so a
// target that itself declares a `reveal` (e.g. a dropdown defaulted to a
// value that should already show its own dependent) needs that nested rule
// synced right when the target becomes visible/hidden — otherwise a defaulted
// value's dependent wouldn't appear until the user touched the field once,
// and hiding a branch could leave one of its own targets orphaned visible.
function applyReveal(targetIds, isVisible, fieldsById) {
  for (const targetId of targetIds) {
    const wrapper = document.getElementById(`field-wrap-${targetId}`);
    if (wrapper) {
      if (isVisible) revealElement(wrapper);
      else hideElement(wrapper);
    }

    const field = fieldsById.get(targetId);
    if (!field?.reveal) continue;
    const nestedVisible = isVisible && field.reveal.condition(getFieldValue(field));
    applyReveal(field.reveal.targetIds, nestedVisible, fieldsById);
  }
}

function getFieldValue(field) {
  switch (field.type) {
    case 'text':
    case 'number':
    case 'date':
    case 'select':
      return document.getElementById(field.id)?.value ?? '';
    case 'radio': {
      const checked = document.querySelector(`input[name="${field.id}"]:checked`);
      return checked ? checked.value : '';
    }
    case 'checkbox':
      return document.getElementById(field.id)?.checked ?? false;
    default:
      return null;
  }
}

function wireFieldReveal(field, fieldsById) {
  const evaluate = () =>
    applyReveal(field.reveal.targetIds, field.reveal.condition(getFieldValue(field)), fieldsById);
  const eventName = REVEAL_EVENT_BY_TYPE[field.type];

  if (field.type === 'radio') {
    document.querySelectorAll(`input[name="${field.id}"]`).forEach((input) => {
      input.addEventListener(eventName, evaluate);
    });
  } else {
    document.getElementById(field.id)?.addEventListener(eventName, evaluate);
  }
}

function wireGroupReveal(group, fieldsById) {
  const evaluate = () => {
    const values = group.triggerFieldIds.map((id) => document.getElementById(id)?.value ?? '');
    applyReveal(group.targetIds, group.condition(values), fieldsById);
  };
  for (const id of group.triggerFieldIds) {
    document.getElementById(id)?.addEventListener('blur', evaluate);
  }
}

export function initReveals(schema) {
  const fields = flattenFields(schema);
  const fieldsById = new Map(fields.map((field) => [field.id, field]));

  for (const field of fields) {
    if (field.reveal) wireFieldReveal(field, fieldsById);
  }
  for (const group of schema.groupReveals || []) {
    wireGroupReveal(group, fieldsById);
  }
}
