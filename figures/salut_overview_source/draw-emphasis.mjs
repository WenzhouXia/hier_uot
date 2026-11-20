import { scene as original } from './draw.mjs';

// CN: 独立配色变体保留当前论文图的几何、文字与固定随机种子。
// EN: This separate color variant preserves the paper figure's geometry, labels and fixed seeds.
export const scene = structuredClone(original);
const warmFill = '#f9ddd4';
const warmInk = '#8b3c2d';
const neutralFill = '#f3f4f6';
const memoryInk = '#245982';

for (const element of scene.elements) {
  const groups = element.groupIds;
  if (groups.includes('pduot') && element.type === 'rectangle') {
    element.backgroundColor = warmFill;
    element.strokeColor = warmInk;
  }
  if (element.text === 'PDUOT') element.strokeColor = warmInk;
  if (groups.includes('convergence')) {
    if (element.type === 'rectangle') element.backgroundColor = '#fff2ed';
    element.strokeColor = warmInk;
  }
  if (element.text === 'Finite termination') element.strokeColor = warmInk;
  if (groups.includes('memory')) element.strokeColor = memoryInk;
  if (element.type === 'rectangle' && (
    groups.includes('spar') ||
    (groups.includes('coarse') && element.backgroundColor === '#ffe6a4' && element.width === 147) ||
    ((groups.includes('pricing') || groups.includes('prune')) && element.backgroundColor === '#d0e7fc')
  )) element.backgroundColor = neutralFill;
  if (element.type === 'diamond' && groups.includes('test')) element.backgroundColor = '#f7f7f9';
}
