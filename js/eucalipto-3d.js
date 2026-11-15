/* Modelo botânico tridimensional procedural — sem bibliotecas externas.
   Geometria 3D calculada em JavaScript e desenhada em Canvas 2D (projeção perspectiva).
   Representação estilizada, não reconstrução científica. */
(() => {
  "use strict";
  const canvas = document.querySelector("#plant3d");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha:true });
  if (!ctx) return;
  let seed = 611;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const v = (x,y,z) => [x,y,z];
  const add = (a,b) => v(a[0]+b[0], a[1]+b[1], a[2]+b[2]);
  const sub = (a,b) => v(a[0]-b[0], a[1]-b[1], a[2]-b[2]);
  const mul = (a,s) => v(a[0]*s, a[1]*s, a[2]*s);
  const cross = (a,b) => v(a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]);
  const norm = a => { const n=Math.hypot(...a)||1;return mul(a,1/n); };
  const objects = [];
  // O tronco e seus ramos usam coordenadas espaciais reais.
  const branch = (a,b,r,color) => objects.push({type:"branch",a,b,r,color});
  const leaf = (center,direction,width,length,shade) => {
    const tangent=norm(direction);
    let side=norm(cross(tangent,[0,0,1]));
    if (Math.hypot(...side)<.1) side=[1,0,0];
    const p0=sub(center,mul(tangent,length*.43));
    const tip=add(center,mul(tangent,length*.62));
    const left=add(center,mul(side,width));
    const right=sub(center,mul(side,width));
    const peak=add(center,[0,.018,0]);
    objects.push({type:"leaf",vertices:[p0,left,tip,right],peak,shade});
  };
  const berry=(center,r)=>objects.push({type:"berry",center,r});
  // Eucalipto adulto estilizado: tronco alto e estreito; folhas simples, alongadas e pendentes.
  const trunkPoints=[v(0,-1.75,0),v(.04,-.93,0),v(-.02,-.24,.02),v(.03,.5,-.02),v(0,1.42,0),v(.01,1.83,.01)];
  for (let i=0; i<trunkPoints.length-1; i++) branch(trunkPoints[i],trunkPoints[i+1],.092-i*.013,"trunk");
  for (let n=0; n<28; n++) {
    const angle=(n/28)*Math.PI*5+(random()-.5)*.6;
    const level=-.08+(n/28)*1.8;
    const origin=v((random()-.5)*.07,level,(random()-.5)*.07);
    const radius=.55+random()*.70;
    const tip=v(Math.cos(angle)*radius,level+.38+random()*.30,Math.sin(angle)*radius);
    branch(origin,tip,.022+(1-n/28)*.011,"branch");
    const side=v(-Math.sin(angle),0,Math.cos(angle));
    for(let i=0; i<5; i++) {
      const at=add(origin,mul(sub(tip,origin),.40+i*.12));
      for(const sign of [-1,1]) {
        const b=add(at,add(mul(side,(.10+random()*.08)*sign),v(0,.04+random()*.12,0)));
        branch(at,b,.005,"twig");
        // Folhas adultas de eucalipto: lanceoladas, arqueadas, frequentemente pendentes.
        const direction=norm(v(Math.cos(angle)*.24+(random()-.5)*.2,-.68-random()*.32, Math.sin(angle)*.20+sign*.22));
        leaf(add(b,mul(direction,.025)),direction,.027+random()*.013,.25+random()*.15,random());
      }
    }
    // Cápsulas lenhosas esquemáticas, discretas.
    if(n%7===0) for(let j=0;j<3;j++) berry(add(tip,v((random()-.5)*.12,-.10-j*.045,(random()-.5)*.12)),.034);
  }
  let yaw=.35, pitch=.14, zoom=.87, auto=true, dragging=false, px=0,py=0;
  let w=1,h=1,dpr=1;
  const project = point => {
    const c=Math.cos(yaw),s=Math.sin(yaw);
    const x=point[0]*c-point[2]*s;
    const z=point[0]*s+point[2]*c;
    const cp=Math.cos(pitch),sp=Math.sin(pitch);
    const y=point[1]*cp-z*sp;
    const depth=point[1]*sp+z*cp;
    const f=3.9/(4.1-depth);
    const scale=Math.min(w*.48,h*.30)*zoom;
    return {x:w/2+x*f*scale,y:h*.54-y*f*scale,z:depth,scale:f*scale};
  };
  const radial=(x,y,r,c1,c2) => {const g=ctx.createRadialGradient(x-r*.3,y-r*.3,0,x,y,r);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
  function render() {
    ctx.clearRect(0,0,w,h);
    // Sombra oval e solo
    ctx.save();ctx.fillStyle="rgba(1,6,3,.22)";ctx.beginPath();ctx.ellipse(w/2,h*.91,Math.min(w*.24,140)*zoom,Math.min(h*.025,14),0,0,Math.PI*2);ctx.fill();ctx.restore();
    const things=objects.map(o=>{
      if(o.type==="branch")return {o,depth:(project(o.a).z+project(o.b).z)/2};
      if(o.type==="leaf") return {o,depth:o.vertices.reduce((sum,p)=>sum+project(p).z,0)/4};
      return {o,depth:project(o.center).z};
    }).sort((a,b)=>a.depth-b.depth);
    for(const {o} of things) {
      if(o.type==="branch") {
        const a=project(o.a),b=project(o.b);
        ctx.lineCap="round";ctx.lineJoin="round";
        ctx.strokeStyle=o.color==="trunk"?"#4e3223":o.color==="branch"?"#71533b":"#927451";
        ctx.lineWidth=Math.max(.8,o.r*(a.scale+b.scale));ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        ctx.strokeStyle="rgba(255,218,153,.19)";ctx.lineWidth=Math.max(.4,o.r*a.scale*.3);ctx.beginPath();ctx.moveTo(a.x-1,a.y);ctx.lineTo(b.x-1,b.y);ctx.stroke();
      } else if(o.type==="leaf") {
        const pts=o.vertices.map(project);
        const colors=o.shade>.6?["#86b5a3","#326a5f"]:o.shade>.28?["#8cbcad","#3d786d"]:["#b1d3bd","#4c8674"];
        ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);ctx.quadraticCurveTo(pts[1].x,pts[1].y,pts[2].x,pts[2].y);ctx.quadraticCurveTo(pts[3].x,pts[3].y,pts[0].x,pts[0].y);
        const g=ctx.createLinearGradient(pts[1].x,pts[1].y,pts[3].x,pts[3].y);
        g.addColorStop(0,colors[0]);g.addColorStop(1,colors[1]);ctx.fillStyle=g;ctx.fill();
        ctx.strokeStyle="rgba(189,235,166,.27)";ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);ctx.lineTo(pts[2].x,pts[2].y);ctx.stroke();
      } else {
        const p=project(o.center); const r=Math.max(1.2,o.r*p.scale);
        radial(p.x,p.y,r,"#a7a18a","#626f60");
      }
    }
  }
  function resize() {
    const rect=canvas.getBoundingClientRect();
    w=rect.width || 400;h=rect.height||500;dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    render();
  }
  const userMotionEnabled=()=>!document.documentElement.classList.contains("effects-off") && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  let last=0,rafId=0;
  function tick(t) {
    if(auto && userMotionEnabled() && !dragging) yaw+=(Math.min(40,t-last||16)/1000)*.20;
    last=t;render();rafId=requestAnimationFrame(tick);
  }
  function setAuto(value) {
    auto=value;document.getElementById("autoRotate").setAttribute("aria-pressed",String(auto));
    document.getElementById("rotationState").textContent=auto?"ATIVA":"PAUSADA";
  }
  canvas.addEventListener("pointerdown",e=>{ dragging=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId);setAuto(false); });
  canvas.addEventListener("pointermove",e=>{if(!dragging)return;yaw+=(e.clientX-px)*.009;pitch=Math.max(-.5,Math.min(.6,pitch+(e.clientY-py)*.005));px=e.clientX;py=e.clientY;render();});
  canvas.addEventListener("pointerup",()=>dragging=false);
  canvas.addEventListener("pointercancel",()=>dragging=false);
  canvas.addEventListener("wheel",e=>{e.preventDefault();zoom=Math.max(.65,Math.min(1.85,zoom-e.deltaY*.001));render();},{passive:false});
  document.getElementById("autoRotate").addEventListener("click",()=>setAuto(!auto));
  document.getElementById("resetCamera").addEventListener("click",()=>{yaw=.35;pitch=.14;zoom=.87;setAuto(true);render();});
  document.getElementById("zoomIn").addEventListener("click",()=>{zoom=Math.min(1.85,zoom+.14);render();});
  document.getElementById("zoomOut").addEventListener("click",()=>{zoom=Math.max(.65,zoom-.14);render();});
  const ro=new ResizeObserver(resize);ro.observe(canvas);resize();rafId=requestAnimationFrame(tick);
  document.addEventListener("visibilitychange",()=>{last=0;});
})();
