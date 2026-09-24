import { flattenFields } from './formRenderer.js';

// Generic engine for any `computed` field that declares `compute: { dependsOn,
// formula }` (mirrors the `reveal: { targetIds, condition }` shape already
// used elsewhere). Recomputes on blur of any dependency field — consistent
// with the app-wide "typed fields react on blur" convention — and writes
// '—' when the formula reports it can't compute yet (e.g. a dependency is
// still blank). One mechanism serves Age (date-diff) and Lobe Volume
// (l×w×h) identically; the math itself lives in the schema, not here.
//
// A computed field can also depend on another computed field's output
// (Arterial Doppler UE's WBI depends on Maximum Brachial Pressure, itself
// computed). A computed field's own control is a plain <output> element
// (see js/formRenderer.js's buildComputedControl), which is never
// focusable and so never fires a native blur event — listening for blur
// on a computed dependency the same way we do for raw inputs would
// simply never fire. Instead, after recomputing any computed field, this
// cascades directly to every other computed field that lists it in
// dependsOn, so a two-(or more-)stage chain stays correct regardless of
// DOM focus events. No existing computed field depended on another before
// WBI, so this cascade is a no-op everywhere else.
// A dependency that's itself a computed field must be read via its
// <output>'s textContent, not .value — same convention js/printHelpers.js's
// getDisplayValue already uses for type 'computed'. (A bare <output>.value
// does mirror textContent per the HTML spec as long as nothing ever sets
// .value directly, but this reads its current result explicitly rather
// than resting on that mirroring behavior.)
function readDependencyValue(id, computedIds) {
  const el = document.getElementById(id);
  if (!el) return '';
  return computedIds.has(id) ? el.textContent.trim() : el.value ?? '';
}

function recomputeField(field, dependentsById, computedIds) {
  const output = document.getElementById(field.id);
  if (!output) return;

  const values = field.compute.dependsOn.map((id) => readDependencyValue(id, computedIds));
  const result = field.compute.formula(...values);
  output.textContent = result === null || result === undefined || result === '' ? '—' : result;

  for (const dependent of dependentsById.get(field.id) ?? []) {
    recomputeField(dependent, dependentsById, computedIds);
  }
}

export function initComputedFields(schema) {
  const computedFields = flattenFields(schema).filter((field) => field.compute);
  const computedIds = new Set(computedFields.map((field) => field.id));

  const dependentsById = new Map();
  for (const field of computedFields) {
    for (const depId of field.compute.dependsOn) {
      if (!computedIds.has(depId)) continue;
      if (!dependentsById.has(depId)) dependentsById.set(depId, []);
      dependentsById.get(depId).push(field);
    }
  }

  for (const field of computedFields) {
    const evaluate = () => recomputeField(field, dependentsById, computedIds);
    for (const dependencyId of field.compute.dependsOn) {
      // A computed dependency is handled via the cascade above, not blur —
      // its <output> control never fires one.
      if (computedIds.has(dependencyId)) continue;
      document.getElementById(dependencyId)?.addEventListener('blur', evaluate);
    }
  }
}
