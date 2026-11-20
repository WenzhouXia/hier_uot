// CN: 独立预览在增高的 PDUOT 框内列出组件，并重新对齐两侧示意图与流程箭头。
// EN: A separate preview lists components inside a taller PDUOT card and realigns the adjacent glyphs and flow arrows.
export function applySolverComponents(scene) {
  const inheritedBlue = scene.elements.find(e => e.id === 'diagram-157').backgroundColor;
  const frame = scene.elements.find(e => e.type === 'rectangle' && e.x === -6 && e.y === 22);
  const moveLower = y => y >= 400 ? y + 65 : y;
  const topArrows = new Set(['diagram-171', 'diagram-172', 'diagram-173', 'diagram-178', 'diagram-179']);
  for (const e of scene.elements) {
    if (e === frame) { e.height += 65; continue; }
    const oldY = e.y;
    const glyph = e.groupIds.includes('support') || e.groupIds.includes('result');
    // CN: 支撑斜线与正流量格子复用 Pricing/Prune 标题的浅蓝色，斜线底色保持白色。
    // EN: Reuse the Pricing/Prune header blue for support hatching and flow cells, with white behind the hatch lines.
    if (e.groupIds.includes('support')) {
      if (e.type === 'line' && e.strokeColor === '#4c9df0') e.strokeColor = inheritedBlue;
      if (e.type === 'rectangle' && e.strokeColor === 'transparent') e.backgroundColor = '#ffffff';
    }
    if (e.groupIds.includes('result') && e.type === 'rectangle' && e.strokeColor === 'transparent' && e.width === 34.5) e.backgroundColor = inheritedBlue;
    const shiftX = e.groupIds.includes('support') ? -20 : e.groupIds.includes('result') ? 20 : e.groupIds.includes('spar') ? 21 : e.groupIds.includes('test') ? 26 : e.text === 'No' ? 20 : 0;
    e.x += shiftX;
    if (e.customData) e.customData.anchor += shiftX;
    const transform = y => glyph ? y + 40 : e.type === 'arrow' && topArrows.has(e.id) && y < 400 ? y + 40 : moveLower(y);
    e.y = transform(oldY);
    if (e.text?.startsWith('Salut:')) e.y += 8;
    if (e.points) {
      e.points = e.points.map(([x, y]) => [x, transform(oldY+y)-e.y]);
      const ys = e.points.map(([,y]) => y);
      e.height = Math.max(...ys)-Math.min(...ys);
    }
    if (e.id === 'diagram-76') Object.assign(e, { x: 306, y: 145, width: 508, height: 326 });
    if (e.id === 'pduot-title-band') Object.assign(e, { x: 310, y: 149, width: 500 });
    if (e.id === 'diagram-171') { e.x = 253; e.width = 49; e.points = [[0,0],[49,0]]; }
    if (e.id === 'diagram-172') { e.x = 814; e.width = 46; e.points = [[0,0],[46,0]]; }
    if (e.id === 'diagram-173') {
      e.x += 20;
      e.points = [[0,0],[0,55]];
      e.width = 0;
      e.roundness = null;
    }
    if (e.id === 'diagram-174') e.x += 20;
    if (e.id === 'diagram-175') {
      e.x += 26;
      e.points[e.points.length-1][0] -= 26;
      e.width += 26;
    }
    if (e.id === 'diagram-176') {
      e.x = 1009;
      e.points = [[0,0],[0,67],[-4,78],[-13,83],[-23,84],[-441.5,84],[-445.5,88],[-445.5,118]];
      e.width = 445.5;
      e.height = 118;
      e.roundness = null;
    }
    if (e.id === 'diagram-178') e.x -= 20;
    if (e.id === 'diagram-179') {
      e.points[e.points.length-1][0] -= 20;
      const xs = [18,18,18,20,26,66];
      e.points.slice(-6).forEach((point, i) => { point[0] = xs[i]-e.x; });
    }
    if (e.id === 'finite-termination-curved-arrow') {
      e.points[e.points.length-1][0] += 26;
      e.width += 26;
    }
    if (['diagram-173','diagram-176','diagram-179'].includes(e.id)) {
      e.endArrowhead = 'arrow';
      e.startArrowhead = null;
      e.strokeWidth = 2.7;
    }
    if (e.text === 'Restricted UOT support-focused') { e.y = 230; e.x += 10; e.customData.anchor += 10; }
    if (e.groupIds.includes('solver-guarantees')) {
      e.y += 81;
      e.x += 10;
      if (e.customData) e.customData.anchor += 10;
    }
  }
  // CN: 用轻微起伏、宽度变化的实心笔触替代规则粗线，保留三处下划线的长度与颜色。
  // EN: Replace uniform thick lines with subtly uneven filled strokes, preserving the three underlines' lengths and colors.
  for (const id of ['diagram-4','diagram-5','diagram-6']) {
    const line = scene.elements.find(e => e.id === id);
    const w = line.width;
    const color = line.strokeColor;
    Object.assign(line, {
      points: [[0,0],[2,-4],[8,-6],[w*.15,-5],[w*.32,-6.7],[w*.5,-6],
        [w*.68,-8],[w*.84,-7],[w-6,-9],[w,-7],[w+2,-3],[w,1],
        [w-7,3],[w*.83,4],[w*.66,3.2],[w*.49,5.5],[w*.31,5],
        [w*.14,7],[5,6],[0,3],[0,0]],
      backgroundColor: color, strokeColor: 'transparent', strokeWidth: 0,
      fillStyle: 'solid', roughness: .9, roundness: null, height: 16,
    });
  }
  // CN: 折线路径的短末段会缩小原生箭头头部；用固定尺寸的开放箭头保持一致。
  // EN: Short final polyline segments shrink native arrowheads; fixed-size open heads keep them consistent.
  for (const id of ['diagram-173','diagram-176','diagram-179']) {
    const arrow = scene.elements.find(e => e.id === id);
    arrow.endArrowhead = null;
    const end = arrow.points.at(-1), before = arrow.points.at(-2);
    const length = Math.hypot(end[0]-before[0], end[1]-before[1]);
    const dx = (end[0]-before[0])/length, dy = (end[1]-before[1])/length;
    const points = [[end[0]-18*dx-8*dy,end[1]-18*dy+8*dx],end,[end[0]-18*dx+8*dy,end[1]-18*dy-8*dx]];
    const minX = Math.min(...points.map(p=>p[0])), minY = Math.min(...points.map(p=>p[1]));
    const head = structuredClone(arrow);
    Object.assign(head, {
      id: id+'-consistent-head', type: 'line', x: arrow.x+minX, y: arrow.y+minY,
      points: points.map(([x,y])=>[x-minX,y-minY]),
      width: Math.max(...points.map(p=>p[0]))-minX,
      height: Math.max(...points.map(p=>p[1]))-minY,
      roughness: .45, roundness: null,
    });
    scene.elements.push(head);
  }
  const template = scene.elements.find(e => e.id === 'pduot-global-label');
  ['Reflected Halpern', 'Preconditioning', 'Adaptive restart', 'Adaptive weight'].forEach((label, i) => {
    const x = i%2 === 0 ? 322 : 572;
    const text = structuredClone(template);
    Object.assign(text, {
      id: 'pduot-inside-component-'+i, text: '• '+label, originalText: '• '+label,
      x, y: 310+Math.floor(i/2)*42, width: 216, height: 37, fontSize: 29,
      textAlign: 'left', strokeColor: '#3d786d', groupIds: ['pduot-components'],
      customData: { anchor: x },
    });
    scene.elements.push(text);
  });
  return scene;
}
