import { exportToSvg, loadFromBlob, getCommonBounds } from '@excalidraw/excalidraw';
const variant = new URLSearchParams(location.search).get('variant');
const palette = new URLSearchParams(location.search).get('palette');
const { scene } = palette
  ? { scene: (await import('./draw-palettes.mjs')).paletteScene(palette) }
  : variant === 'emphasis'
  ? await import('./draw-emphasis.mjs')
  : await import('./draw.mjs');
const layout = new URLSearchParams(location.search).get('layout');
if (layout) (await import('./draw-layouts.mjs')).applyLayout(scene, layout);
const green = new URLSearchParams(location.search).get('green');
if (green) (await import('./green-accents.mjs')).applyGreenAccent(scene, green);
const red = new URLSearchParams(location.search).get('red');
if (red) (await import('./red-schemes.mjs')).applyRedScheme(scene, red);
const theory = new URLSearchParams(location.search).get('theory');
if (theory) (await import('./theory-accents.mjs')).applyTheoryAccent(scene, theory);
if (new URLSearchParams(location.search).has('init-card')) (await import('./draw-layouts.mjs')).applyInitCard(scene);
if (new URLSearchParams(location.search).has('solver-note')) (await import('./solver-note.mjs')).applySolverNote(scene);
if (new URLSearchParams(location.search).has('solver-components')) (await import('./solver-components.mjs')).applySolverComponents(scene);
const supportBlue = new URLSearchParams(location.search).get('support-blue');
if (supportBlue) (await import('./support-blues.mjs')).applySupportBlue(scene, supportBlue);
const dualYellow = new URLSearchParams(location.search).get('dual-yellow');
if (dualYellow) (await import('./dual-yellows.mjs')).applyDualYellow(scene, dualYellow);
const choice = new URLSearchParams(location.search).get('font');
const [font, family] = {
  comic: ['Comic Shanns', 8],
  lilita: ['Lilita One', 7],
}[choice] ?? ['Nunito', 6];
for (const e of scene.elements) if (e.type === 'text') e.fontFamily = family;
try {
  const svg = await exportToSvg({elements:scene.elements,appState:{...scene.appState,exportBackground:true},files:{},exportPadding:20});
  document.querySelector('#out').append(svg);
  await document.fonts.ready;
  const canvas=document.createElement('canvas').getContext('2d');
  for (const e of scene.elements.filter(e=>e.type==='text')) {
    canvas.font=e.fontSize+'px "'+font+'", sans-serif';
    e.width=canvas.measureText(e.text).width;
    e.x=e.customData.anchor-(e.textAlign==='center'?e.width/2:0);
    delete e.customData;
  }
  const restored=await loadFromBlob(new Blob([JSON.stringify(scene)],{type:'application/json'}),null,null);
  if(restored.elements.length!==scene.elements.length) throw Error('Some elements did not import');
  const final=await exportToSvg({elements:restored.elements,appState:{...restored.appState,exportBackground:true},files:{},exportPadding:20});
  document.querySelector('#out').replaceChildren(final);
  window.result=scene;
  window.resultBounds=getCommonBounds(restored.elements);
} catch(e) {window.failure=e.stack;}
import katex from 'katex';
import 'katex/dist/katex.min.css';
window.katex = katex;
