import { scene as original } from './draw.mjs';
import { palettes } from './palettes.mjs';

export function paletteScene(name) {
  const palette = palettes[name];
  if (!palette) throw new Error('Unknown palette: ' + name);
  const scene = structuredClone(original);
  if (palette.semantic) {
    applySemanticColors(scene, palette);
    return scene;
  }
  for (const element of scene.elements) {
    const groups = element.groupIds;
    if (palette.original) continue;
    if (groups.includes('pduot') && element.type === 'rectangle') {
      element.backgroundColor = palette.fill;
      element.strokeColor = palette.border;
    }
    if (element.text === 'PDUOT') element.strokeColor = palette.ink;
    if (groups.includes('convergence')) {
      if (element.type === 'rectangle') element.backgroundColor = palette.guaranteeFill;
      element.strokeColor = element.type === 'text' ? palette.ink : palette.border;
    }
    if (element.text === 'Finite termination') element.strokeColor = palette.ink;
    if (element.type === 'rectangle' && (
      groups.includes('spar') ||
      ((groups.includes('pricing') || groups.includes('prune')) && element.backgroundColor === '#d0e7fc')
    )) element.backgroundColor = palette.auxiliary;
  }
  // CN: 仅给 PDUOT 添加固定偏移的阴影；其余元素保持原图的坐标与随机种子。
  // EN: Add a fixed-offset shadow only to PDUOT; retain all other coordinates and random seeds.
  const index = scene.elements.findIndex(e => e.type === 'rectangle' && e.groupIds.includes('pduot'));
  const shadow = structuredClone(scene.elements[index]);
  Object.assign(shadow, {
    id: 'pduot-shadow-' + name, x: shadow.x + 6, y: shadow.y + 8,
    strokeColor: 'transparent', backgroundColor: palette.shadow,
    strokeWidth: 0, roughness: 0, opacity: 28,
  });
  scene.elements.splice(index, 0, shadow);
  return scene;
}

// CN: 蓝色编码原始求解与支撑；对偶向量统一配色；紫色仅用于保证与复杂度性质。
// EN: Blue encodes primal solving/support; dual vectors share a color; purple is reserved for guarantees and complexity.
function applySemanticColors(scene, palette) {
  for (const element of scene.elements) {
    const groups = element.groupIds;
    const isFilledCell = element.type === 'rectangle' && element.strokeColor === 'transparent';
    if (element.backgroundColor !== 'transparent') element.backgroundColor = '#ffffff';
    if (element.strokeColor === '#ead0e9') element.strokeColor = palette.underline || '#e0e2e7';
    // CN: 辅助操作统一用更淡的蓝色；卡片只填标题区，避免削弱核心求解器的层级。
    // EN: Give auxiliary operations a lighter blue; fill only card headers to preserve the core solver's emphasis.
    if (palette.auxiliaryFill && element.type === 'rectangle' && (
      groups.includes('spar') ||
      (groups.includes('coarse') && element.width === 147) ||
      ((groups.includes('pricing') || groups.includes('prune')) && isFilledCell)
    )) element.backgroundColor = palette.auxiliaryFill;
    if (palette.outputFill && groups.includes('output') && element.type === 'rectangle') {
      element.backgroundColor = palette.outputFill;
    }
    if (groups.includes('pduot')) {
      if (element.type === 'rectangle') {
        element.backgroundColor = palette.fill;
        element.strokeColor = palette.border;
      }
      if (element.text === 'PDUOT') element.strokeColor = palette.ink;
    }
    if (groups.includes('convergence') || groups.includes('memory')) {
      element.strokeColor = element.type === 'text' ? palette.guaranteeInk : palette.guaranteeBorder;
      if (element.type === 'rectangle') element.backgroundColor = palette.guaranteeFill;
    }
    if (element.text === 'Finite termination') element.strokeColor = palette.guaranteeInk;
    if (groups.includes('support') && isFilledCell) element.backgroundColor = '#e6f4ff';
    if (groups.includes('result') && isFilledCell) {
      element.backgroundColor = element.y < 190 || element.x < 930 ? palette.dualFill : palette.flowFill;
    }
    if (groups.includes('coarse') && isFilledCell) element.backgroundColor = palette.dualFill;
  }
}
