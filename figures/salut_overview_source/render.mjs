import {chromium} from 'playwright';
import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
import { palettes } from './palettes.mjs';
import { greenAccents } from './green-accents.mjs';
import { redSchemes } from './red-schemes.mjs';
import { theoryAccents } from './theory-accents.mjs';
import { supportBlues } from './support-blues.mjs';
import { dualYellows } from './dual-yellows.mjs';

// CN: 配色预览单独导出，默认命令继续生成当前论文版本。
// EN: Export the color preview separately; the default command still renders the current paper version.
const emphasis = process.argv.includes('--variant=emphasis');
const paper = process.argv.length === 2;
const initCard = paper || process.argv.includes('--init-card');
const solverNote = process.argv.includes('--solver-note');
const solverComponents = paper || process.argv.includes('--solver-components');
if (solverComponents && solverNote) throw new Error('Choose either an external note or internal components');
const paletteName = paper ? 'color-filled' : process.argv.find(arg => arg.startsWith('--palette='))?.slice('--palette='.length);
if (paletteName && !palettes[paletteName]) throw new Error('Unknown palette: ' + paletteName);
const palette = paletteName ? palettes[paletteName] : null;
const layout = paper ? 'compact-support' : process.argv.find(arg => arg.startsWith('--layout='))?.slice('--layout='.length);
if (layout && (!['enclosed','solver-card','solver-marker','solver-handwritten','compact-support'].includes(layout) || !paletteName)) throw new Error('Use a supported layout with a preview palette');
const green = paper ? 'teal' : process.argv.find(arg => arg.startsWith('--green='))?.slice('--green='.length);
if (green && (!greenAccents[green] || !layout)) throw new Error('Use a supported green accent with a preview layout');
const red = process.argv.find(arg => arg.startsWith('--red='))?.slice('--red='.length);
if (red && (!redSchemes[red] || !layout || green)) throw new Error('Use a supported red scheme with a preview layout and no green accent');
if (!paper && !paletteName && !emphasis) throw new Error('Preview requires --palette or --variant=emphasis');
const accent = green ? greenAccents[green] : red ? redSchemes[red] : null;
const theory = paper ? 'teal' : process.argv.find(arg => arg.startsWith('--theory='))?.slice('--theory='.length);
if (theory && (!theoryAccents[theory] || layout!=='compact-support')) throw new Error('Use a supported theory accent with the compact-support layout');
const supportBlue = paper ? 'mixed' : process.argv.find(arg => arg.startsWith('--support-blue='))?.slice('--support-blue='.length);
if (supportBlue && (!supportBlues[supportBlue] || !solverComponents)) throw new Error('Use a supported blue with the component layout');
const dualYellow = paper ? 'lighter' : process.argv.find(arg => arg.startsWith('--dual-yellow='))?.slice('--dual-yellow='.length);
if (dualYellow && !dualYellows[dualYellow]) throw new Error('Unknown dual yellow: '+dualYellow);
const suffix = (layout ? '-'+layout : '') + (green ? '-'+green : '') + (red ? '-red-'+red : '') + (initCard ? '-init-card' : '') + (theory ? '-theory-'+theory : '') + (solverNote ? '-solver-note' : '') + (solverComponents ? '-solver-components' : '') + (supportBlue ? '-blue-'+supportBlue : '') + (dualYellow ? '-yellow-'+dualYellow : '');
const outputName = paper ? 'salut_overview_whiteboard' : paletteName ? 'salut_overview_'+paletteName+suffix+'_preview' : 'salut_overview_emphasis_preview';
const layoutName = paper ? 'salut-layout.excalidraw' : paletteName ? 'salut-layout-'+paletteName+suffix+'.excalidraw' : 'salut-layout-emphasis.excalidraw';
const screenshotName = paper ? 'salut-scaling-uot-with-linear-memory.png' : paletteName ? 'salut-'+paletteName+suffix+'-preview.png' : 'salut-emphasis-preview.png';
const server = await createServer({server:{host:'127.0.0.1',port:4179}});
await server.listen();
let browser;
try {
 browser=await chromium.launch({channel:process.env.SALUT_CHROME_CHANNEL || undefined,executablePath:process.env.SALUT_CHROME_EXECUTABLE || undefined,headless:true});
 const page=await browser.newPage({viewport:{width:1220,height:1350}});
 await page.goto(server.resolvedUrls.local[0] + (paletteName ? '?palette='+paletteName+(layout ? '&layout='+layout : '')+(green ? '&green='+green : '')+(red ? '&red='+red : '')+(initCard ? '&init-card=1' : '')+(theory ? '&theory='+theory : '')+(solverNote ? '&solver-note=1' : '')+(solverComponents ? '&solver-components=1' : '')+(supportBlue ? '&support-blue='+supportBlue : '')+(dualYellow ? '&dual-yellow='+dualYellow : '') : emphasis ? '?variant=emphasis' : ''));
 await page.waitForFunction(()=>window.failure || (window.result && window.katex));
 const failure=await page.evaluate(()=>window.failure);
 if(failure) throw new Error(failure);
 const scene = await page.evaluate(()=>window.result);
 await writeFile(layoutName,JSON.stringify(scene,null,2)+'\n');
 await page.evaluate(async ({emphasis,palette,layout,accent,redScheme,solverComponents})=>{
  const fonts=[['Kalam','Kalam-Regular.ttf','400'],['Kalam','Kalam-Bold.ttf','700']];
  await Promise.all(fonts.map(async ([name,file,weight])=>document.fonts.add(await new FontFace(name,'url(/'+file+')',{weight}).load())));
  for(const [file,unicodeRange] of [['latin','U+20-7E'],['greek','U+370-3FF']]){
    document.fonts.add(await new FontFace('SketchMath','url(/excal-'+file+'.woff2)',{unicodeRange}).load());
  }
  document.fonts.add(await new FontFace('Paper Mono','url(/NimbusMonoPS-Bold.otf)',{weight:'700'}).load());
  const source=document.querySelector('#out svg');
  const main=document.createElement('main');
  main.style.cssText='display:grid;grid-template-columns:1fr;gap:16px;padding:16px;background:#edf0f4';
  for(const name of ['Kalam']){
    const svg=source.cloneNode(true);
    svg.style.cssText='width:100%;height:auto;display:block';
    // CN: 轻微模糊偏移色块，保持轮廓和文字清晰；不改变图形布局。
    // EN: Slightly blur the offset shadow, keeping outlines and text sharp without changing the layout.
    if(palette) for(const path of svg.querySelectorAll('[fill]')) {
      if(path.getAttribute('fill') === palette.shadow) path.style.filter='blur(3px)';
    }
    svg.querySelectorAll('text').forEach(t=>{
      t.style.fontFamily='"'+name+'", "STIX Two Math", serif';
      const title=/^(Salut: Scaling UOT with Linear Memory|PDUOT|Initialization|Updates|Pricing|Prune|Spar)$/.test(t.textContent);
      if(title&&name==='Kalam') t.style.fontWeight='700';
      if(/^(PDUOT|Pricing|Prune|Spar|Init)$/.test(t.textContent)){
        t.style.fontFamily='"Paper Mono"';
        t.style.fontWeight='700';
      }
      if(emphasis && /^(KKT convergence|Finite termination)$/.test(t.textContent)) t.style.fontWeight='700';
      if(t.textContent.startsWith('Salut:')){
        const suffix=t.textContent.slice(5);
        const brand=document.createElementNS(svg.namespaceURI,'tspan');
        brand.style.fontFamily='"Paper Mono"';
        brand.style.fontWeight='700';
        if(solverComponents) brand.style.fontSize='1.18em';
        if(accent) brand.style.fill=accent.ink;
        // CN: 在现有粗体字形外增加同色细描边，进一步加粗 Salut。
        // EN: Add a thin matching outline to further embolden the existing bold Salut glyphs.
        brand.style.stroke=accent?.ink || '#242326';
        brand.style.strokeWidth='0.8px';
        brand.style.strokeLinejoin='round';
        brand.style.paintOrder='stroke fill';
        brand.textContent='Salut';
        t.replaceChildren(brand,document.createTextNode(suffix));
      }
      // CN: 对偶相关词使用当前方案指定的文字颜色。
      // EN: Use the current scheme's specified text color for the dual-related word.
      if(layout==='compact-support' && t.textContent==='Dual-score top-k'){
        const dual=document.createElementNS(svg.namespaceURI,'tspan');
        dual.style.fill=redScheme?.dualInk || '#ad8527';
        dual.textContent='Dual';
        t.replaceChildren(dual,document.createTextNode('-score top-k'));
      }
    });
    const formulas=new Map([
      ['Restricted UOT support-focused',String.raw`{\scriptstyle\min\limits_{X\ge0}\,\Phi(X)}\,{\scriptstyle\text{s.t.}}\,\operatorname{supp}(X)\subseteq\mathcal N`],
      ['Restricted UOT compact',String.raw`\min\limits_{X\ge0}\,\Phi(X)\,{\scriptstyle\text{s.t.}}\,\operatorname{supp}(X)\subseteq\mathcal N`],
      ['Restricted UOT objective',String.raw`\min\nolimits_{X\ge0}\,\Phi(X)\quad\text{s.t.}\quad\operatorname{supp}(X)\subseteq\mathcal N`],
      ['min  Φ(X)', String.raw`\textstyle\min\nolimits_{X\ge 0}\;\Phi\mkern1mu(X)`],
      ['X ≥ 0,   supp(X) ⊆ 𝒩',String.raw`\operatorname{supp}\mkern2mu(X)\subseteq\mathcal N`],
      ['𝒵 = (X, f, g)',String.raw`\mathcal Z=(X,f,g)`],
      ['KKT ≤ ε ?',String.raw`\mathrm{KKT}\le\varepsilon\,?`],
      ['𝒩₀',String.raw`\mathcal N_0`],
      ['𝒩₊',String.raw`\mathcal N_+`],
      ['Topₖ (σ⁰)',String.raw`\operatorname{Top}_{k}(\sigma^0)`],
      ['𝒱 = Topᵧ(σ)',String.raw`\mathcal V=\operatorname{Top}_{\gamma}(\sigma)`],
      ['∩ {σ > 0}',String.raw`\cap\,\{\sigma>0\}`],
      ['supp(X) ∪ ℬ ∪ 𝒱',String.raw`\operatorname{supp}\mkern2mu(X)\cup\mathcal B\cup\mathcal V`],
      ['𝒩₊ ⊇ supp(X) ∪ ℬ ∪ 𝒱',String.raw`\mathcal N_+\supseteq\operatorname{supp}\mkern2mu(X)\cup\mathcal B\cup\mathcal V`],
      ['𝒩 ⊇ supp(X) ∪ ℬ ∪ 𝒱',String.raw`\mathcal N\supseteq\operatorname{supp}\mkern2mu(X)\cup\mathcal B\cup\mathcal V`],
      ['|𝒩₊| ≤ ⌈β(m + n)⌉',String.raw`|\mathcal N_+|\le\lceil\beta(m+n)\rceil`],
      ['|𝒩| ≤ ⌈β(m + n)⌉',String.raw`|\mathcal N|\le\lceil\beta(m+n)\rceil`],
      ['σᵢⱼ = fᵢ + gⱼ − Cᵢⱼ',String.raw`\sigma_{ij}=f_i+g_j-C_{ij}`],
      ['f̃',String.raw`\tilde f`],['g̃',String.raw`\tilde g`],['f','f'],['g','g'],
      ['Active support 𝒩', String.raw`\mathcal N`],
      ['Memory O(m + n)',String.raw`O(m+n)`],
      ['Output (X, f, g)',String.raw`(X,f,g)`],
    ]);
    for(const t of svg.querySelectorAll('text')){
      const key=t.textContent;
      if(['X','keep'].includes(key)){t.remove();continue;}
      if(!formulas.has(key)) continue;
      const size=key==='supp(X) ∪ ℬ ∪ 𝒱' && layout!=='compact-support'?34:parseFloat(t.getAttribute('font-size'));
      const align=t.getAttribute('text-anchor');
      const x=Number(t.getAttribute('x'));
      const y=Number(t.getAttribute('y'))+({'supp(X) ∪ ℬ ∪ 𝒱':-8,'𝒩₊ ⊇ supp(X) ∪ ℬ ∪ 𝒱':-8,'𝒩 ⊇ supp(X) ∪ ℬ ∪ 𝒱':-8,'|𝒩₊| ≤ ⌈β(m + n)⌉':-9,'|𝒩| ≤ ⌈β(m + n)⌉':-9}[key]??0);
      const prefix={'Memory O(m + n)':'Memory','Active support 𝒩':'Active support','Output (X, f, g)':'Output','supp(X) ∪ ℬ ∪ 𝒱':'keep'}[key];
      const wide=520;
      const foreign=document.createElementNS(svg.namespaceURI,'foreignObject');
      foreign.dataset.formulaKey=key;
      foreign.setAttribute('x',align==='middle'?x-wide/2:x);
      foreign.setAttribute('y',y-size*.88-36);
      foreign.setAttribute('width',wide);
      foreign.setAttribute('height',size*2.2+72);
      const content=document.createElement('div');
      content.style.cssText='position:relative;top:36px;display:flex;align-items:center;gap:.35em;height:'+size+'px;justify-content:'+(align==='middle'?'center':'flex-start')+';color:#242326;font-size:'+size+'px';
      if(emphasis && key==='Memory O(m + n)') content.style.color='#245982';
      if(palette && !palette.original && key==='Memory O(m + n)') content.style.color=palette.memoryInk;
      if(prefix){
        const span=document.createElement('span');
        span.style.fontFamily='Kalam';
        if(prefix==='keep' && layout==='compact-support'){
          span.style.fontSize='34px';
          content.style.gap='.18em';
        }
        span.textContent=prefix;
        content.append(span);
      }
      const math=document.createElement('span');
      math.style.fontSize='0.83em';
      math.innerHTML=window.katex.renderToString(formulas.get(key),{output:'html',throwOnError:true});
      for(const glyph of math.querySelectorAll('.mord, .mop')){
        if(glyph.childElementCount===0 && !glyph.closest(".mathcal, .katex-accent") && /^[A-Za-z0-9]+$/.test(glyph.textContent) && !(glyph.closest('.msupsub') && /^\d+$/.test(glyph.textContent))){
          glyph.style.fontFamily='Kalam';
          glyph.style.fontStyle='normal';
        }
      }
      {
        for (const glyph of math.querySelectorAll('.mord, .mop')){
          if(glyph.childElementCount===0 && /^[Φβγεσ]$/.test(glyph.textContent)){
            glyph.style.fontFamily='SketchMath, KaTeX_Math, KaTeX_Main';
            glyph.style.fontStyle='normal';
          }
        }
      }
      if(!emphasis && key==='X ≥ 0,   supp(X) ⊆ 𝒩'){
        math.style.color=palette && !palette.original ? palette.ink : '#1c4e79';
        const letters=math.querySelectorAll('.mord, .mop, .mrel');
        for(const letter of letters) if(!letter.childElementCount) letter.style.fontWeight='700';
      }
      content.append(math);
      foreign.append(content);
      t.replaceWith(foreign);
    }
    const figure=document.createElement('figure');
    figure.style.cssText='margin:0;background:white;overflow:hidden;border-radius:10px';
    const heading=document.createElement('figcaption');
    heading.style.cssText='font:600 23px system-ui;padding:12px 18px 0';
    heading.textContent=name;
    figure.append(svg);
    main.append(figure);
  }
  document.body.style.margin=0;
  document.body.replaceChildren(main);
  await document.fonts.ready;
  // CN: 按最终等宽字体的实际字形边界，将 PDUOT 标题居中于色带。
  // EN: Center PDUOT in its header using the final monospace font's actual glyph bounds.
  if(layout && window.result.elements.some(e=>e.id==='pduot-title-band')){
    const svg=document.querySelector('main figure svg');
    const band=window.result.elements.find(e=>e.id==='pduot-title-band');
    const title=[...svg.querySelectorAll('text')].find(e=>e.textContent==='PDUOT');
    const [minX,minY]=window.resultBounds;
    const center=new DOMPoint(band.x+band.width/2-minX+20,band.y+band.height/2-minY+20)
      .matrixTransform(svg.getCTM())
      .matrixTransform(title.parentElement.getCTM().inverse());
    const style=getComputedStyle(title);
    const context=document.createElement('canvas').getContext('2d');
    context.font=style.fontWeight+' '+style.fontSize+' '+style.fontFamily;
    const metrics=context.measureText('PDUOT');
    title.setAttribute('text-anchor','middle');
    title.setAttribute('x',center.x);
    title.setAttribute('y',center.y+(metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2);
  }
  // CN: 以输出框的几何中心定位整组文字和公式，不依赖原文本的基线偏移。
  // EN: Center the combined output label/formula on the box geometry rather than the original text baseline.
  if(layout){
    const svg=document.querySelector('main figure svg');
    const box=window.result.elements.find(e=>e.type==='rectangle' && e.groupIds.includes('output'));
    const foreign=[...svg.querySelectorAll('foreignObject')].find(e=>e.dataset.formulaKey==='Output (X, f, g)');
    const [minX,minY]=window.resultBounds;
    const center=new DOMPoint(box.x+box.width/2-minX+20,box.y+box.height/2-minY+20)
      .matrixTransform(svg.getCTM())
      .matrixTransform(foreign.parentElement.getCTM().inverse());
    foreign.setAttribute('x',center.x-box.width/2);
    foreign.setAttribute('y',center.y-box.height/2);
    foreign.setAttribute('width',box.width);
    foreign.setAttribute('height',box.height);
    const content=foreign.firstElementChild;
    Object.assign(content.style,{top:'0',height:'100%',justifyContent:'center',alignItems:'center'});
  }
 }, {emphasis,palette:red ? {...palette,memoryInk:redSchemes[red].theoryInk} : palette,layout,accent,redScheme:red ? redSchemes[red] : null,solverComponents});
 await page.locator('main').screenshot({path:screenshotName});
 // CN: 论文导出仅包含图形，保留浏览器排版的字体、公式和矢量路径。
 // EN: Export only the figure for the paper, retaining browser-typeset fonts, formulas and vector paths.
 const size=await page.evaluate(async ()=>{
  const svg=document.querySelector('main figure svg');
  const {width,height}=svg.viewBox.baseVal;
  document.body.replaceChildren(svg);
  document.body.style.cssText='margin:0;padding:0;background:white';
  svg.style.cssText='display:block;width:'+width+'px;height:'+height+'px';
  const style=document.createElement('style');
  style.textContent='@page{size:'+width+'px '+height+'px;margin:0}html,body{margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}';
  document.head.append(style);
  await document.fonts.ready;
  return {width,height};
 });
 await page.setViewportSize({width:Math.ceil(size.width),height:Math.ceil(size.height)});
 await page.screenshot({path:'../'+outputName+'.png',fullPage:true});
 await page.pdf({path:'../'+outputName+'.pdf',preferCSSPageSize:true,printBackground:true,margin:{top:0,right:0,bottom:0,left:0}});
 console.log('Wrote the PNG previews, paper PDF and Excalidraw layout.');
} finally {
 await browser?.close();
 await server.close();
}
