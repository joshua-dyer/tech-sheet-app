import { flattenFields } from './formRenderer.js';

const STROKE_COLOR = '#ff0000';
const STROKE_WIDTH = 3;

// One independent instance per `type: 'diagram'` field — keeps a per-instance
// registry (by field id) so js/clearForm.js can reset a specific diagram
// without this module needing to know about schemas/sections itself.
const instances = new Map();

function getCanvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
}

function drawStroke(ctx, points) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
}

function setUpDiagram(field) {
  const canvas = document.getElementById(`diagram-canvas-${field.id}`);
  const container = document.getElementById(`diagram-${field.id}`);
  const enableInput = document.getElementById(`${field.id}-enable`);
  const undoBtn = document.getElementById(`${field.id}-undo`);
  const clearBtn = document.getElementById(`${field.id}-clear`);
  const hiddenInput = document.getElementById(field.id);
  if (!canvas || !container || !enableInput || !undoBtn || !clearBtn || !hiddenInput) return;

  const ctx = canvas.getContext('2d');
  const baseImage = new Image();
  let imageLoaded = false;
  let strokes = [];
  let currentStroke = [];
  let isDrawing = false;
  let enabled = false;

  function syncHiddenInput() {
    hiddenInput.value = strokes.length > 0 ? JSON.stringify(strokes) : '';
  }

  function redraw() {
    if (!imageLoaded) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const stroke of strokes) drawStroke(ctx, stroke);
    if (currentStroke.length > 1) drawStroke(ctx, currentStroke);
  }

  baseImage.onload = () => {
    canvas.width = baseImage.naturalWidth;
    canvas.height = baseImage.naturalHeight;
    imageLoaded = true;
    redraw();
  };
  baseImage.src = field.imageSrc;

  function setEnabled(next) {
    enabled = next;
    enableInput.checked = next;
    canvas.style.touchAction = next ? 'none' : '';
    canvas.style.cursor = next ? 'crosshair' : 'default';
  }

  enableInput.addEventListener('change', () => setEnabled(enableInput.checked));

  canvas.addEventListener('pointerdown', (event) => {
    if (!enabled) return;
    canvas.setPointerCapture(event.pointerId);
    isDrawing = true;
    currentStroke = [getCanvasPoint(canvas, event)];
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!isDrawing) return;
    event.preventDefault();
    currentStroke.push(getCanvasPoint(canvas, event));
    redraw();
  });
  const endStroke = () => {
    if (!isDrawing) return;
    isDrawing = false;
    if (currentStroke.length > 1) strokes.push(currentStroke);
    currentStroke = [];
    redraw();
    syncHiddenInput();
  };
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);

  undoBtn.addEventListener('click', () => {
    strokes.pop();
    redraw();
    syncHiddenInput();
  });
  clearBtn.addEventListener('click', () => {
    strokes = [];
    redraw();
    syncHiddenInput();
  });

  // Clicking/touching outside the diagram (but not its own controls) while
  // active assumes the tech is moving on to other fields (DESIGN.md §8).
  document.addEventListener('pointerdown', (event) => {
    if (!enabled || container.contains(event.target)) return;
    setEnabled(false);
  });

  function reset() {
    strokes = [];
    currentStroke = [];
    isDrawing = false;
    setEnabled(false);
    redraw();
    syncHiddenInput();
  }

  instances.set(field.id, { reset });
}

export function initDiagramMarkup(schema) {
  for (const field of flattenFields(schema)) {
    if (field.type === 'diagram') setUpDiagram(field);
  }
}

export function resetDiagram(fieldId) {
  instances.get(fieldId)?.reset();
}
