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
  let base=v(0,-1.5,0);
  let top=v(0,1.30,0);
  const trunkPoints=[base,v(.08,-.6,0),v(.01,.12,.02),v(-.04,.7,0),top];
  for (let i=0;i<trunkPoints.length-1;i++) branch(trunkPoints[i],trunkPoints[i+1],.08-i*.01,"trunk");
  const limbs=[];
  for(let n=0;n<13;n++) {
    const a=n/13*Math.PI*2+random()*.25;
    const level=-.15+n*.095;
    const origin=v((random()-.5)*.08,level,(random()-.5)*.08);
    const spread=.62+random()*.38;
    const bend=v(Math.cos(a)*spread,level+.40+random()*.35,Math.sin(a)*spread);
    branch(origin,bend,.028,"branch");
    limbs.push({start:origin,end:bend,angle:a});
    for(let j=0;j<3;j++) {
      let angle=a+(j-1)*.45;
      const end=add(bend,v(Math.cos(angle)*(.22+random()*.22),.05+random()*.35,Math.sin(angle)*(.22+random()*.22)));
      branch(bend,end,.013,"twig");
      // Em cada ramo terminal surgem folhas compostas: pares de folíolos.
      const axis=norm(sub(end,bend));
      const lateral=norm(cross(axis,[0,1,0]));
      for(let k=0;k<5;k++) {
        const pos=add(bend,mul(sub(end,bend),(.25+k*.16)));
        for(const sign of [-1,1]) {
          const dir=norm(add(mul(lateral,sign),v(0,(random()-.4)*.55,0)));
          leaf(add(pos,mul(dir,.045)),dir,.04+random()*.018,.16+random()*.085,random());
        }
      }
      leaf(end,axis,.048,.16,random());
      if (random()>.46) {
        for(let k=0;k<5;k++) berry(add(end,[(random()-.5)*.14,(random()-.5)*.12,(random()-.5)*.14]),.025+random()*.014);
      }
    }
  }
  // Copa complementar, com pequenos ramos ao redor do eixo central.
  for(let n=0;n<9;n++) {
    const a=random()*Math.PI*2;
    const start=v(0,.35+random()*.6,0);
    const end=v(Math.cos(a)*(.24+random()*.55),1.35+random()*.43,Math.sin(a)*(.24+random()*.55));
    branch(start,end,.017,"twig");
    const axis=norm(sub(end,start));
    const side=norm(cross(axis,[0,1,0]));
    for(let k=1;k<6;k++) for(const sign of [-1,1]) {
      const p=add(start,mul(sub(end,start),k/6));
      leaf(p,norm(add(mul(side,sign),v(0,.38,0))),.042,.18,random());
    }
    if(random()>.5) for(let k=0;k<4;k++) berry(add(end,[(random()-.5)*.1,(random()-.5)*.1,(random()-.5)*.1]),.029);
  }
  let yaw=.35, pitch=.14, zoom=1, auto=true, dragging=false, px=0,py=0;
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
        const colors=o.shade>.6?["#4d9c5e","#224b32"]:o.shade>.28?["#6bb174","#316d45"]:["#98c77b","#45774c"];
        ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);ctx.quadraticCurveTo(pts[1].x,pts[1].y,pts[2].x,pts[2].y);ctx.quadraticCurveTo(pts[3].x,pts[3].y,pts[0].x,pts[0].y);
        const g=ctx.createLinearGradient(pts[1].x,pts[1].y,pts[3].x,pts[3].y);
        g.addColorStop(0,colors[0]);g.addColorStop(1,colors[1]);ctx.fillStyle=g;ctx.fill();
        ctx.strokeStyle="rgba(189,235,166,.27)";ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);ctx.lineTo(pts[2].x,pts[2].y);ctx.stroke();
      } else {
        const p=project(o.center); const r=Math.max(1.2,o.r*p.scale);
        radial(p.x,p.y,r,"#e9957b","#8e342e");
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
  document.getElementById("resetCamera").addEventListener("click",()=>{yaw=.35;pitch=.14;zoom=1;setAuto(true);render();});
  document.getElementById("zoomIn").addEventListener("click",()=>{zoom=Math.min(1.85,zoom+.14);render();});
  document.getElementById("zoomOut").addEventListener("click",()=>{zoom=Math.max(.65,zoom-.14);render();});
  const ro=new ResizeObserver(resize);ro.observe(canvas);resize();rafId=requestAnimationFrame(tick);
  document.addEventListener("visibilitychange",()=>{last=0;});
})();
