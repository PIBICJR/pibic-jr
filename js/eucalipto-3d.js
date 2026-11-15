/* Eucalipto — estudo botânico tridimensional inspirado na fotografia fornecida.
   Geometria 3D procedural, projeção em Canvas; não é escaneamento nem modelo taxonômico.
   Folhas lanceoladas curvadas, veias centrais, galhos dourados, flores e estames delicados. */
(() => {
  'use strict';
  const canvas = document.getElementById('plant3d');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const V=(x,y,z)=>[x,y,z], add=(a,b)=>a.map((c,i)=>c+b[i]), sub=(a,b)=>a.map((c,i)=>c-b[i]), mul=(a,s)=>a.map(c=>c*s);
  const mix=(a,b,t)=>add(mul(a,1-t),mul(b,t));
  const cross=(a,b)=>V(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]);
  const normalize=a=>mul(a,1/(Math.hypot(...a)||1));
  const shapes=[]; let seed=6738;
  const rnd=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
  const jitter=(s)=> (rnd()-.5)*s;
  const line=(a,b,width,color,detail=false)=>shapes.push({kind:'line',a,b,width,color,detail});
  const twig=(start,end,thick=.014)=>{
    const mid=mix(start,end,.52);mid[1]+=.075;mid[2]+=.03;
    line(start,mid,thick,'#a78b41');line(mid,end,thick*.76,'#c4a052');
    return {start,end,mid};
  };
  // Eixo principal e ramos de ligação. Composição de um ramo (não árvore inteira).
  const axis=[V(-1.75,-1.22,-.02),V(-1.15,-.76,.08),V(-.44,-.32,.01),V(.27,.12,.03),V(.95,.65,.01),V(1.64,1.24,-.04)];
  axis.slice(1).forEach((p,i)=>line(axis[i],p,.036-i*.003,i%2?'#b39951':'#aa8543'));
  const baseBranches=[
    [1, V(-1.95,.42,.10),.016],[1,V(-1.65,-1.65,-.16),.015],
    [2,V(-.90,.88,-.11),.015],[2,V(-.72,-1.72,.18),.016],
    [3,V(.25,-1.75,-.11),.015],[3,V(.62,1.34,.12),.014],
    [4,V(1.40,-.95,.18),.014],[4,V(1.92,.30,-.14),.013],
    [4,V(.85,-.36,-.09),.014]
  ];
  for(const [idx,tip,r] of baseBranches) twig(axis[idx],tip,r);
  function leaf(base,tip,width,shade,index){
    const d=sub(tip,base); const tangent=normalize(d);
    let normal=normalize(cross(tangent,[0,0,1]));
    if(Math.hypot(...normal)<.2)normal=[1,0,0];
    // Curvatura tridimensional controlada pela profundidade.
    const curve=(index%2?-1:1)*(.10+rnd()*.10);
    const out=[];
    const segments=18;
    for(let i=0;i<=segments;i++){
      const t=i/segments;
      const mid=add(mix(base,tip,t),V(Math.sin(t*Math.PI)*curve*.32,-Math.sin(Math.PI*t)*(.11+rnd()*.003),Math.sin(t*Math.PI)*curve));
      const profile=Math.pow(Math.sin(Math.PI*t),.95)*(1-.18*t);
      const breadth=width*profile;
      out.push([sub(mid,mul(normal,breadth)),mid,add(mid,mul(normal,breadth))]);
    }
    shapes.push({kind:'leaf',out,shade});
    line(base,add(base,mul(d,.12)),.009,'#c9b162');
  }
  // Folhas estreitas e alongadas, crescendo nos dois lados dos ramos.
  const configs=[
    [-1.60,-.88,.2, 1.10,1.12,.10], [-1.65,-1.55,-.02,-.24,1.08,.11],
    [-1.18,-.80,.08,-1.72,-1.15,.14], [-1.15,-.74,.03,-1.35,.28,.14],
    [-.85,-.59,.01,-2.14,-.27,-.16], [-.83,-.57,.02,-.60,-1.72,.15],
    [-.51,-.37,-.04,-.70,.79,-.16], [-.50,-.38,.04,-1.45,-1.04,.20],
    [-.20,-.15,.02,.02,-1.95,-.15], [-.16,-.10,-.05,.04,.89,-.12],
    [.06,-.02,.01,-.72,.68,.09], [.10,.00,-.02,.41,-1.75,.12],
    [.36,.18,.03,.98,1.37,-.16], [.43,.23,-.02,.13,-1.41,.14],
    [.58,.39,.04,1.35,-.57,-.10], [.70,.48,-.04,.74,1.65,.16],
    [1.00,.67,.03,1.95,.14,-.12],[1.18,.82,-.02,1.37,-.41,.15],
    [.94,.54,.09,.01,1.29,.04], [1.43,1.05,-.05,1.85,1.73,.10]
  ];
  for(let i=0;i<configs.length;i++){
    const [bx,by,bz,tx,ty,tz]=configs[i];
    const base=V(bx,by,bz),end=V(tx,ty,tz);
    leaf(base,end,.095+(i%4)*.018,.20+(i%7)*.095,i);
  }
  // Flores com estames: pequenos tufos branco-creme e centros mel.
  const blossoms=[V(-.32,-.26,.28),V(-.16,-.48,.32),V(.10,-.37,.24),V(.18,-.17,.33),V(.36,-.28,.19),V(-.04,-.08,.24)];
  for(let k=0;k<blossoms.length;k++){
    const p=blossoms[k];
    const from=axis[2+k%2];twig(from,p,.008);
    shapes.push({kind:'bud',p,r:.068,color:k%3===0?'#c18f4b':'#d6b26e'});
    const n=72;
    for(let i=0;i<n;i++){
      const phi=i*2.39996; const theta=Math.acos(1-2*(i+.5)/n);
      const l=.10+rnd()*.095;
      const d=V(Math.cos(phi)*Math.sin(theta),Math.sin(phi)*Math.sin(theta),Math.cos(theta));
      const start=add(p,mul(d,.015));const end=add(p,mul(d,l));
      shapes.push({kind:'stamen',a:start,b:end,color:(i%6===0?'#fbf1d5':'#f9fff0'),width:.65});
      if(i%3===0)shapes.push({kind:'pollen',p:end,r:.0055,color:i%2?'#eac36d':'#fff6e3'});
    }
  }
  // Capulhos discretos junto das inflorescências.
  for(let i=0;i<5;i++){
    const a=V(-.55+i*.2,-.45+jitter(.24),.14+jitter(.16));
    shapes.push({kind:'bud',p:a,r:.035,color:'#bd8f4c'});
  }
  let yaw=-.18,pitch=-.13,zoom=.96,auto=true,dragging=false,px=0,py=0,w=0,h=0,dpr=1,raf=0;
  const origin=V(0,-.02,0);
  function proj(q){
    const p=sub(q,origin),c=Math.cos(yaw),s=Math.sin(yaw);
    const x=p[0]*c-p[2]*s,z=p[0]*s+p[2]*c;
    const cp=Math.cos(pitch),sp=Math.sin(pitch);
    const y=p[1]*cp-z*sp,depth=p[1]*sp+z*cp;
    const f=4.9/(5.6-depth);
    const scale=Math.min(w*.28,h*.35)*zoom*f;
    return {x:w/2+x*scale,y:h*.53-y*scale,z:depth,s:scale};
  }
  function pathTo(points){ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);}
  function renderLeaf(o){
    const rows=o.out.map(row=>row.map(proj));
    const first=rows.map(r=>r[0]),center=rows.map(r=>r[1]),last=rows.map(r=>r[2]);
    const g=ctx.createLinearGradient(first[8].x,first[8].y,last[8].x,last[8].y);
    const greens=[['#91ad8c','#386956'],['#b1bc89','#477254'],['#90ab87','#346457'],['#93b7a0','#3d766c']];
    const c=greens[Math.round(o.shade*3)%4];
    g.addColorStop(0,c[0]);g.addColorStop(.48,'#709878');g.addColorStop(1,c[1]);
    ctx.beginPath();ctx.moveTo(first[0].x,first[0].y);
    for(let i=1;i<first.length;i++)ctx.lineTo(first[i].x,first[i].y);
    for(let i=last.length-1;i>=0;i--)ctx.lineTo(last[i].x,last[i].y);
    ctx.closePath();ctx.fillStyle=g;ctx.fill();
    ctx.strokeStyle='rgba(18,48,34,.43)';ctx.lineWidth=.75;ctx.stroke();
    pathTo(center);ctx.strokeStyle='rgba(226,224,153,.83)';ctx.lineWidth=1.0;ctx.stroke();
    // Nervuras diagonais leves, distribuídas ao longo da folha.
    for(let i=3;i<rows.length-2;i+=3){
      for(const side of [0,2]){
        ctx.beginPath();ctx.moveTo(center[i].x,center[i].y);ctx.lineTo(rows[Math.min(i+2,rows.length-1)][side].x,rows[Math.min(i+2,rows.length-1)][side].y);
        ctx.strokeStyle='rgba(209,216,161,.29)';ctx.lineWidth=.5;ctx.stroke();
      }
    }
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    const all=shapes.map(o=>{
      let z;
      if(o.kind==='leaf') z=o.out[9][1][2];
      else if(o.a) z=(o.a[2]+o.b[2])/2;
      else z=o.p[2];
      // Depth via camera transformation
      const q=o.kind==='leaf'?o.out[9][1]:o.a?mix(o.a,o.b,.5):o.p;
      return {o,z:proj(q).z};
    }).sort((a,b)=>a.z-b.z);
    for(const {o} of all){
      if(o.kind==='leaf'){renderLeaf(o);continue;}
      if(o.kind==='line'||o.kind==='stamen'){
        const a=proj(o.a),b=proj(o.b);
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
        ctx.strokeStyle=o.color;ctx.lineCap='round';ctx.lineWidth=o.kind==='stamen'?Math.max(.55,.8*zoom):Math.max(.6,o.width*(a.s+b.s)*.5);
        ctx.stroke();continue;
      }
      const p=proj(o.p),r=Math.max(1,o.r*p.s);
      const g=ctx.createRadialGradient(p.x-r*.35,p.y-r*.35,.2,p.x,p.y,r);
      g.addColorStop(0,o.kind==='bud'?'#f1d798':o.color);g.addColorStop(1,o.color);
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,2*Math.PI);ctx.fill();
    }
  }
  function resize(){
    const rect=canvas.getBoundingClientRect();w=rect.width||520;h=rect.height||570;
    dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);draw();
  }
  const motion=()=>!document.documentElement.classList.contains('effects-off')&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last=0;
  function tick(t){
    if(auto&&motion()&&!dragging&&document.visibilityState==='visible')yaw+=(Math.min(40,t-last||16)/1000)*.10;
    last=t;draw();raf=requestAnimationFrame(tick);
  }
  function setAuto(value){auto=value;document.getElementById('autoRotate')?.setAttribute('aria-pressed',String(auto));document.getElementById('rotationState').textContent=auto?'ATIVA':'PAUSADA';}
  canvas.addEventListener('pointerdown',e=>{dragging=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId);setAuto(false);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw+=(e.clientX-px)*.008;pitch=Math.max(-.65,Math.min(.65,pitch+(e.clientY-py)*.004));px=e.clientX;py=e.clientY;draw();});
  canvas.addEventListener('pointerup',()=>dragging=false);
  canvas.addEventListener('pointercancel',()=>dragging=false);
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.60,Math.min(1.8,zoom-e.deltaY*.001));draw();},{passive:false});
  document.getElementById('autoRotate')?.addEventListener('click',()=>setAuto(!auto));
  document.getElementById('resetCamera')?.addEventListener('click',()=>{yaw=-.18;pitch=-.13;zoom=.96;setAuto(true);draw();});
  document.getElementById('zoomIn')?.addEventListener('click',()=>{zoom=Math.min(1.8,zoom+.12);draw();});
  document.getElementById('zoomOut')?.addEventListener('click',()=>{zoom=Math.max(.60,zoom-.12);draw();});
  new ResizeObserver(resize).observe(canvas);resize();raf=requestAnimationFrame(tick);
  document.addEventListener('visibilitychange',()=>{last=0;});
})();
