// CN: 白底便签以两列列出组件，并以手写箭头指向求解器；不修改论文默认布局。
// EN: A white two-column note lists components and points to the solver with a handwritten arrow, leaving the default paper layout unchanged.
export function applySolverNote(scene) {
  const shift = 100;
  const moveY = y => y >= 400 ? y + shift : y;
  const frame = scene.elements.find(e => e.type === 'rectangle' && e.x === -6 && e.y === 22);
  for (const e of scene.elements) {
    if (e === frame) { e.height += shift; continue; }
    const oldY = e.y;
    e.y = moveY(oldY);
    if (e.points) {
      e.points = e.points.map(([x, y]) => [x, moveY(oldY + y) - e.y]);
      const ys = e.points.map(([, y]) => y);
      e.height = Math.max(...ys) - Math.min(...ys);
    }
  }
  const box = structuredClone(scene.elements.find(e => e.id === 'diagram-76'));
  Object.assign(box, {
    id: 'pduot-components-note', x: 316, y: 425, width: 468, height: 100,
    strokeColor: '#9fa9a4', backgroundColor: '#ffffff', strokeWidth: 1.4,
    roughness: 1.1, groupIds: ['pduot-components'],
  });
  const template = scene.elements.find(e => e.id === 'pduot-global-label');
  const labels = ['Reflected Halpern', 'Preconditioning', 'Adaptive restart', 'Adaptive weight'];
  scene.elements.push(box);
  labels.forEach((label, i) => {
    const text = structuredClone(template);
    const x = 334+(i%2)*234;
    Object.assign(text, {
      id: 'pduot-component-'+i, text: '• '+label, originalText: '• '+label,
      x, y: 437+Math.floor(i/2)*40, width: 216, height: 32, fontSize: 25,
      textAlign: 'left', strokeColor: '#242326', groupIds: ['pduot-components'],
      customData: { anchor: x },
    });
    scene.elements.push(text);
  });
  const arrow = structuredClone(scene.elements.find(e => e.id === 'finite-termination-curved-arrow'));
  Object.assign(arrow, {
    id: 'pduot-components-arrow', x: 314, y: 453, width: 43, height: 78,
    points: [[0,0],[-35,-10],[-39,-50],[2,-78]],
    strokeColor: '#5b7369', strokeWidth: 2, roughness: .8,
    startBinding: null, endBinding: null, groupIds: ['pduot-components'],
  });
  scene.elements.push(arrow);
  return scene;
}
