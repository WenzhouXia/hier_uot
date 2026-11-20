// CN: 核心名称沿用 scientific 调色板中 proposed 的珊瑚红 #EE6A5F；配套颜色按语义统一调整。
// EN: Core names retain scientific.proposed coral #EE6A5F; supporting colors are adjusted consistently by role.
const core = { ink: '#ee6a5f', fill: '#fbe7e4', border: '#dda9a2', underline: '#f3c9c3' };
export const redSchemes = {
  // CN: 复用论文的珊瑚红、杏橙和黄色，浅色标题带搭配更鲜明的格子与标记。
  // EN: Reuse the paper's coral, apricot and yellow, pairing pale headers with brighter cells and markers.
  'coral-apricot': { ink: '#ee6a5f', fill: '#f9cbc5', border: '#e7a49a', underline: '#f5aaa0', title: 'Coral / apricot / yellow', auxiliary: '#ffe1bd', sectionLine: '#f7c38b', hatch: '#f4a261', supportFill: '#fff3e5', flow: '#f4a261', dual: '#f2c75e', dualInk: '#f2c75e', theory: '#ffd68a', theoryInk: '#3d3d3a', output: '#ffffff', frame: '#b8b4ae', supportArrow: '#f4a261' },
  // CN: 用奶油和暖沙色替代绿色，使珊瑚红成为主要彩色强调。
  // EN: Replace green with cream and warm sand so coral remains the main color accent.
  'coral-sand': { ink: '#ee6a5f', fill: '#fbe0db', border: '#dcb0a8', underline: '#f3c0b7', title: 'Coral / cream / warm sand', auxiliary: '#f3eddf', sectionLine: '#e6d7c2', hatch: '#aa927a', supportFill: '#f6f0e8', flow: '#d8c4af', dual: '#f3ebce', dualInk: '#9b824b', theory: '#e9dbc8', theoryInk: '#8c7158', output: '#fbf8f1', frame: '#b9b1a7', supportArrow: '#aa927a' },
  // CN: 整图采用 A 色盘的红、鼠尾草绿、奶油和驼色，并将红色对齐论文。
  // EN: Recolor the complete figure with palette A's coral, sage, cream and camel, anchoring coral to the paper.
  'coral-sage': { ink: '#ee6a5f', fill: '#f8d2cc', border: '#d8a39b', underline: '#f3b7ad', title: 'A · Coral / sage / cream / camel', auxiliary: '#cee5d0', sectionLine: '#cee5d0', hatch: '#80a889', supportFill: '#eef5ee', flow: '#cee5d0', dual: '#f3f0d7', dualInk: '#938344', theory: '#e0c097', theoryInk: '#8b6b40', output: '#faf8ef', frame: '#b6afa3', supportArrow: '#80a889' },
  classic: { ...core, title: 'A · Coral / blue / gold', auxiliary: '#e0edfa', sectionLine: '#c3d9ee', hatch: '#4c9df0', flow: '#bcd9f2', dual: '#ffe6a4', dualInk: '#ad8527', theory: '#e6d4ed', theoryInk: '#766183' },
  slate: { ...core, title: 'B · Coral / slate / sand', auxiliary: '#e7edf4', sectionLine: '#cbd7e4', hatch: '#7895b3', flow: '#c8d8e8', dual: '#f2e2bb', dualInk: '#a18542', theory: '#e6e0ec', theoryInk: '#7b6e89' },
  teal: { ...core, title: 'C · Coral / soft teal / gold', auxiliary: '#e1efec', sectionLine: '#c3dcd6', hatch: '#6ba69d', flow: '#bedbd4', dual: '#f5e4b5', dualInk: '#a48a3e', theory: '#e8dfee', theoryInk: '#7c6b8c' },
};

export function applyRedScheme(scene, name) {
  const scheme = redSchemes[name];
  if (!scheme) throw new Error('Unknown red scheme: ' + name);
  for (const e of scene.elements) {
    const groups = e.groupIds;
    const cell = e.type === 'rectangle' && e.strokeColor === 'transparent';
    if (scheme.frame && e.strokeColor === '#a5a9b5') e.strokeColor = scheme.frame;
    if (scheme.supportArrow && e.strokeColor === '#397dcc') e.strokeColor = scheme.supportArrow;
    if (scheme.supportFill && groups.includes('support') && cell) e.backgroundColor = scheme.supportFill;
    if (scheme.output && groups.includes('output') && e.type === 'rectangle') e.backgroundColor = scheme.output;
    if (['PDUOT', 'Spar'].includes(e.text)) e.strokeColor = scheme.ink;
    if (e.id === 'pduot-title-band') e.backgroundColor = scheme.fill;
    if (groups.includes('pduot') && e.type === 'rectangle' && !cell) e.strokeColor = scheme.border;
    if (groups.includes('spar') && e.type === 'rectangle') e.backgroundColor = scheme.fill;
    if (e.type === 'line' && e.strokeWidth === 12) e.strokeColor = e.y === 90 ? scheme.underline : scheme.sectionLine;
    if (groups.includes('support') && e.type === 'line') {
      if (e.strokeColor === '#4c9df0') e.strokeColor = scheme.hatch;
    }
    if (groups.includes('result') && cell) e.backgroundColor = e.y < 190 || e.x < 930 ? scheme.dual : scheme.flow;
    if (groups.includes('coarse') && cell) e.backgroundColor = scheme.dual;
    if (e.type === 'rectangle' && (
      groups.includes('coarse') && e.width === 147 ||
      (groups.includes('pricing') || groups.includes('prune')) && cell
    )) e.backgroundColor = scheme.auxiliary;
    if (groups.includes('solver-guarantees') || groups.includes('termination-annotation') || e.text === 'Finite termination') {
      if (e.type === 'rectangle') e.backgroundColor = scheme.theory;
      else e.strokeColor = scheme.theoryInk;
    }
  }
  return scene;
}
