export const elements = [];
let group = [];
const ink='#242326', gray='#a5a9b5', blue='#d0e7fc', yellow='#ffe6a4', pink='#eed5ed';
function add(type,x,y,width,height,props={}){
  const n=elements.length+1;
  elements.push({id:'diagram-'+n,type,x,y,width,height,angle:0,strokeColor:ink,backgroundColor:'transparent',fillStyle:'solid',strokeWidth:2.6,strokeStyle:'solid',roughness:0.7,opacity:100,groupIds:group,frameId:null,roundness:null,seed:41401+n*137,version:1,versionNonce:12417+n,isDeleted:false,boundElements:null,updated:1,link:null,locked:false,...props});
}
function grouped(id,draw){group=[id]; draw(); group=[];}
function box(x,y,w,h,backgroundColor='transparent',strokeColor=ink,r=24){
  add('rectangle',x,y,w,h,{backgroundColor,strokeColor,roundness:r?{type:3,value:r}:null});
}
function path(points,{arrow=false,strokeColor=ink,strokeWidth=2.7,strokeStyle='solid',round=false,roughness=0.45}={}){
  const [x,y]=points[0];
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  add(arrow?'arrow':'line',x,y,Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys),{strokeColor,strokeWidth,strokeStyle,roughness:round?0:roughness,points:points.map(([a,b])=>[a-x,b-y]),roundness:null,startBinding:null,endBinding:null,startArrowhead:null,endArrowhead:arrow?'arrow':null});
}
const arrow=(points,opts={})=>path(points,{arrow:true,...opts});
function label(text,x,y,fontSize,center=false){
  const width=text.length*fontSize*.55;
  add('text',center?x-width/2:x,y,width,fontSize*1.25,{text,originalText:text,fontSize,fontFamily:6,textAlign:center?'center':'left',verticalAlign:'top',containerId:null,autoResize:true,lineHeight:1.25,roughness:0});
  elements.at(-1).customData={anchor:x};
}
function grid(x,y,c,r,cols,rows,marks=[],fill=yellow,hatch=false){
  for(const [i,j] of marks){
    const a=x+i*c,b=y+j*r;
    add('rectangle',a,b,c,r,{strokeColor:'transparent',backgroundColor:fill,roughness:0});
    if(hatch) for(let d=8;d<c+r;d+=10){
      const u=Math.max(0,d-r),v=Math.min(c,d);
      if(v-u>2) path([[a+u,b+d-u],[a+v,b+d-v]],{strokeColor:'#4c9df0',strokeWidth:4,roughness:0});
    }
  }
  box(x,y,c*cols,r*rows,'transparent',ink,0);
  for(let i=1;i<cols;i++) path([[x+i*c,y],[x+i*c,y+r*rows]],{strokeWidth:2});
  for(let j=1;j<rows;j++) path([[x,y+j*r],[x+c*cols,y+j*r]],{strokeWidth:2});
}
const cells=(n,vertical=false)=>Array.from({length:n},(_,i)=>vertical?[0,i]:[i,0]);
const underline=(x,y,w)=>path([[x,y],[x+w*.55,y-2],[x+w,y-4]],{strokeColor:'#ead0e9',strokeWidth:12,round:true});
box(45,22,1128,673,'transparent',gray,32);
box(46,724,359,368,'transparent',gray,25);
box(424,724,744,370,'transparent',gray,26);
underline(76,90,690); underline(75,787,267); underline(451,780,164);
label('Salut: Scaling UOT with Linear Memory',78,25,40);
grouped('memory',()=>{box(831,33,323,52,blue);label('Memory O(m + n)',993,38,33,true);});
grouped('support',()=>{
  label('Active support 𝒩',83,123,34);
  grid(123,187,36,36,5,5,[[0,0],[3,0],[1,1],[0,2],[4,2],[2,3],[3,4]],'#e6f4ff',true);
});
grouped('pduot',()=>{
  box(366,161,418,229,blue);
  label('PDUOT',575,174,43,true);
  label('min  Φ(X)',574,232,36,true);
  label('X',520,269,25,true);
  label('X ≥ 0,   supp(X) ⊆ 𝒩',575,307,35,true);
});
grouped('convergence',()=>{box(419,405,312,47,'#f7f8fb','#9398a4',16);label('KKT convergence',575,409,29,true);});
grouped('result',()=>{
  label('𝒵 = (X, f, g)',995,97,36,true);
  box(846,144,301,239,'transparent',ink,20);
  label('g',916,149,34,true);label('f',876,255,34,true);
  grid(943,158,34,26,5,1,cells(5));
  grid(897,199,28,32.7,1,5,cells(5,true),blue);
  grid(942,198,34.5,33.2,5,5,[[0,0],[1,1],[4,2],[2,3],[3,4]]);
});
grouped('spar',()=>{box(907,415,162,60,blue);label('Spar',988,420,39,true);});
grouped('test',()=>{
  add('diamond',841,508,284,121,{backgroundColor:pink});
  label('KKT ≤ ε ?',983,541,38,true);
});
grouped('output',()=>{
  box(313,527,326,76,yellow);label('Output (X, f, g)',476,539,36,true);
  label('Finite termination',545,612,31,true);
});
label('Yes',715,518,32);label('No',1007,641,30);
label('𝒩₀',224,430,36);
label('Initialization',75,731,42);
label('Updates',453,728,42);
grouped('coarse',()=>{
  label('Coarse UOT',229,806,34,true);
  label('f̃',92,860,35,true);label('g̃',259,860,35,true);
  grid(117,875,24.25,30,4,1,cells(4),blue);
  grid(280,875,24.25,30,4,1,cells(4));
  path([[116,918],[118,929],[137,930],[229,930],[241,938],[253,930],[357,930],[374,927],[378,918]],{round:true,strokeWidth:2});
  arrow([[241,938],[241,954]],{strokeWidth:2});
  box(165,960,147,58,yellow);label('Init',238,967,37,true);
  label('Topₖ (σ⁰)',239,1031,34,true);
});
function card(id,x,w,title,body){
  grouped(id,()=>{
    box(x+4,833,w-8,57,blue,'transparent',23);
    box(x,830,w,246);
    label(title,x+w/2,836,41,true);
    body(x+w/2);
  });
}
card('pricing',441,275,'Pricing',cx=>{
  label('𝒱 = Topᵧ(σ)',cx,910,38,true);
  label('∩ {σ > 0}',cx,976,38,true);
});
card('prune',764,382,'Prune',cx=>{
  label('keep',cx,900,33,true);
  label('supp(X) ∪ ℬ ∪ 𝒱',cx,944,34,true);
  label('|𝒩₊| ≤ ⌈β(m + n)⌉',cx,1005,34,true);
});
grouped('dual-score',()=>{
  path([[110,1114],[114,1125],[132,1125],[409,1124],[424,1126],[432,1136],[441,1126],[458,1124],[722,1125],[736,1123],[741,1114]],{round:true,strokeWidth:2.7});
  label('Dual-score top-k',456,1138,36,true);
  label('σᵢⱼ = fᵢ + gⱼ − Cᵢⱼ',444,1187,37,true);
});
arrow([[303,278],[362,278]]);
arrow([[784,276],[840,276]]);
arrow([[989,383],[989,413]]);
arrow([[989,476],[989,506]]);
arrow([[841,566],[645,566]]);
arrow([[989,629],[989,776],[985,787],[976,792],[966,793],[602,793],[589,795],[581,801],[578,811],[578,823]],{round:true});
arrow([[716,956],[759,956]]);
arrow([[212,724],[212,373]],{strokeColor:'#397dcc',strokeStyle:'dashed',strokeWidth:3});
arrow([[955,1077],[955,1242],[953,1253],[947,1261],[936,1265],[924,1266],[42,1266],[31,1264],[23,1259],[19,1250],[18,1238],[18,303],[20,292],[25,285],[34,281],[45,279],[116,279]],{round:true});
label('𝒩₊',975,1214,38);
export const scene={type:'excalidraw',version:2,source:'https://excalidraw.com',elements,appState:{viewBackgroundColor:'#ffffff',gridSize:null},files:{}};
