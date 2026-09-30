(() => {
  const demoScene = document.getElementById('hero-demo-scene');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let demoVisible = false;
  let pageVisible = !document.hidden;
  const visibilityListeners = new Set();
  const isDemoActive = () => demoVisible && pageVisible;
  function notifyVisibility(){
    const active=isDemoActive();
    demoScene.classList.toggle('demo-is-paused', !active);
    for(const listener of visibilityListeners) listener(active);
  }
  function onVisibilityChange(listener){
    visibilityListeners.add(listener);
    return () => visibilityListeners.delete(listener);
  }
  demoScene.classList.add('demo-is-paused');
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(([entry]) => {
      demoVisible=entry.isIntersecting;
      notifyVisibility();
    }, { threshold: .1 });
    observer.observe(demoScene);
  }else{
    demoVisible=true;
    notifyVisibility();
  }
  document.addEventListener('visibilitychange', () => {
    pageVisible=!document.hidden;
    notifyVisibility();
  });

(() => {
  const scene = demoScene;
  const card = document.getElementById('hero-demo-cardWrap');
  let hovering = false;
  let targetX = 3.8, targetY = -7.0;
  let currentX = targetX, currentY = targetY;
  const startedAt = performance.now();
  let tiltFrame=0;
  let tiltRunning=false;
  scene.addEventListener('pointerenter', () => hovering = true);
  scene.addEventListener('pointermove', e => {
    hovering = true;
    const r = scene.getBoundingClientRect();
    const px = (e.clientX-r.left)/r.width;
    const py = (e.clientY-r.top)/r.height;
    targetY = (px-.5)*19;
    targetX = (.5-py)*12;
  });
  scene.addEventListener('pointerleave', () => hovering = false);
  function animateTilt(now){
    if(!isDemoActive()){
      tiltRunning=false;
      tiltFrame=0;
      return;
    }
    if(!reduceMotion){
      if(!hovering){
        const t=(now-startedAt)/1000;
        targetX=3.7+Math.sin(t*.45)*.75;
        targetY=-7+Math.sin(t*.34)*1.25;
      }
      currentX += (targetX-currentX)*.07;
      currentY += (targetY-currentY)*.07;
      card.style.transform=`rotateX(${currentX.toFixed(3)}deg) rotateY(${currentY.toFixed(3)}deg)`;
    }
    tiltFrame=requestAnimationFrame(animateTilt);
  }
  function startTilt(){
    if(!isDemoActive() || tiltRunning) return;
    tiltRunning=true;
    tiltFrame=requestAnimationFrame(animateTilt);
  }
  function stopTilt(){
    if(!tiltRunning) return;
    tiltRunning=false;
    cancelAnimationFrame(tiltFrame);
    tiltFrame=0;
  }
  onVisibilityChange(active => active ? startTilt() : stopTilt());
  startTilt();
})();

(() => {
  const STAGE_W=1910, STAGE_H=932;
  const shell=document.getElementById('hero-demo-stageShell');
  const stage=document.getElementById('hero-demo-stage');
  function fit(){
    const scale=Math.min(shell.clientWidth/STAGE_W,shell.clientHeight/STAGE_H);
    stage.style.transform=`scale(${scale})`;
  }
  new ResizeObserver(fit).observe(shell); fit();
})();

const PROMPT='create an image of a beach at sunset in pixel art style';

const els={
  intro:document.getElementById('hero-demo-intro'),
  typed:document.getElementById('hero-demo-typedPrompt'),
  heroComposer:document.getElementById('hero-demo-heroComposer'),
  composerCount:document.getElementById('hero-demo-composerCount'),
  composerMenu:document.getElementById('hero-demo-composerMenu'),
  composerPanel:document.getElementById('hero-demo-composerPanel'),
  sizeCards:Array.from(document.querySelectorAll('.hero-demo-size-card')),
  heroStatus:document.getElementById('hero-demo-heroStatus'),
  conversation:document.getElementById('hero-demo-conversation'),
  userRow:document.getElementById('hero-demo-genUserRow'),
  resultCard:document.getElementById('hero-demo-resultCard'),
  resultStage:document.getElementById('hero-demo-resultStage'),
  resultImageWrap:document.getElementById('hero-demo-resultImageWrap'),
  resultActions:document.getElementById('hero-demo-resultActions'),
  resultStamp:document.getElementById('hero-demo-resultStamp'),
  resultWork:document.getElementById('hero-demo-resultWork'),
  bottomStatus:document.getElementById('hero-demo-bottomStatus'),
  chatComposer:document.getElementById('hero-demo-chatComposer'),
  pageScroll:document.getElementById('hero-demo-pageScroll')
};

const TL={
  idleEnd:1.2,
  composeOpen:2.1,
  menuOpen:2.8,
  menuClose:3.9,
  panelOpen:4.1,
  panelPick1:4.9,
  panelPick2:5.7,
  panelPick3:6.5,
  panelClose:7.4,
  typeStart:8.05,
  typeEnd:11.6,
  send:12.0,
  heroStatusEnd:13.9,
  chatShow:13.2,
  cardShow:14.2,
  revealStart:15.15,
  revealEnd:15.18,
  footerShow:15.45,
  bottomStatusEnd:15.9,
  composerReturn:15.7
};

function promptCountAt(t){
  if(t<=TL.typeStart)return 0;
  if(t>=TL.typeEnd)return PROMPT.length;
  const p=(t-TL.typeStart)/(TL.typeEnd-TL.typeStart);
  const eased=1-Math.pow(1-p,1.18);
  return Math.max(0,Math.min(PROMPT.length,Math.floor(eased*PROMPT.length)));
}
function setActiveSize(key){
  els.sizeCards.forEach(card=>card.classList.toggle('hero-demo-active',card.dataset.size===key));
}
function escapePrompt(str){
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function smoothstep(a,b,x){const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)}
function renderTimeline(t){
  const active=t>=TL.composeOpen && t<TL.send;
  const menuVisible=t>=TL.menuOpen && t<TL.menuClose;
  const panelVisible=t>=TL.panelOpen && t<TL.panelClose;
  const hasPrep=t>=TL.panelClose && t<TL.send;
  els.heroComposer.classList.toggle('hero-demo-active',active);
  els.heroComposer.classList.toggle('hero-demo-has-prep',hasPrep);
  els.composerMenu.classList.toggle('hero-demo-show',menuVisible);
  els.composerPanel.classList.toggle('hero-demo-show',panelVisible);

  let sizeKey='11';
  if(t>=TL.panelPick3 || t>=TL.panelClose) sizeKey='34';
  else if(t>=TL.panelPick2) sizeKey='45';
  else if(t>=TL.panelPick1) sizeKey='11';
  setActiveSize(sizeKey);

  const count=promptCountAt(t);
  els.composerCount.textContent=`${count}/4000`;
  els.typed.innerHTML=escapePrompt(PROMPT.slice(0,count));
  els.typed.classList.toggle('hero-demo-typed',t>=TL.typeStart && t<TL.typeEnd+.18);

  const sending=t>=TL.send;
  els.heroComposer.style.opacity=sending?'0':'1';
  els.heroStatus.textContent='Generating image...';
  els.bottomStatus.textContent='Generating image...';
  els.heroStatus.classList.toggle('hero-demo-show',sending && t<TL.heroStatusEnd);
  els.intro.classList.toggle('hero-demo-hidden',t>=TL.chatShow);

  const chatShow=t>=TL.chatShow;
  els.conversation.classList.toggle('hero-demo-show',chatShow);
  els.pageScroll.classList.remove('hero-demo-show');
  els.bottomStatus.classList.toggle('hero-demo-show',chatShow && t<TL.bottomStatusEnd);
  els.chatComposer.classList.toggle('hero-demo-show',t>=TL.composerReturn);

  const cardShow=t>=TL.cardShow;
  els.resultCard.classList.toggle('hero-demo-show',cardShow);

  const reveal=t>=TL.revealStart?1:0;
  const meta=smoothstep(TL.footerShow,TL.footerShow+.35,t);
  const shimmer=(Math.sin(t*1.3)+1)*.5;
  els.resultCard.style.setProperty('--hero-demo-reveal',reveal.toFixed(4));
  els.resultCard.style.setProperty('--hero-demo-meta',meta.toFixed(4));
  els.resultCard.style.setProperty('--hero-demo-shimmer',shimmer.toFixed(4));
  els.resultWork.innerHTML=t>=TL.footerShow ? 'Worked for 0m 2s&nbsp;&nbsp;<b>Tokens unavailable for image generation</b>' : 'Working on image generation...';
}

// Morph engine adapted from the supplied standby / thinking particle exports.
// Only the particle behavior is replaced; the surrounding UI and copy remain untouched.
(() => {
  const canvas=document.getElementById('hero-demo-particleCanvas');
  const ctx=canvas.getContext('2d',{alpha:true});
  const W=1910,H=932,N=1500;
  const golden=Math.PI*(3-Math.sqrt(5));

  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const ease=t=>.5-.5*Math.cos(clamp(t)*Math.PI);
  const hexToRgb=hex=>({r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16)});
  const rgbToCss=(a,b,t,alpha)=>{
    const c1=hexToRgb(a),c2=hexToRgb(b);
    const r=Math.round(lerp(c1.r,c2.r,t)),g=Math.round(lerp(c1.g,c2.g,t)),bb=Math.round(lerp(c1.b,c2.b,t));
    return `rgba(${r},${g},${bb},${alpha})`;
  };
  const lerpHex=(a,b,t)=>{
    const c1=hexToRgb(a),c2=hexToRgb(b);
    const n=(r,g,bb)=>'#'+[r,g,bb].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
    return n(lerp(c1.r,c2.r,t),lerp(c1.g,c2.g,t),lerp(c1.b,c2.b,t));
  };
  const noise=(i,s=0)=>{const v=Math.sin(i*127.1+s*311.7)*43758.5453;return v-Math.floor(v)};
  const moveZScale=v=>Math.pow(25,Math.max(-100,Math.min(100,Number(v)||0))/100);

  function makeShape(shape){
    const arr=[];
    for(let i=0;i<N;i++){
      const y=1-(i/(N-1))*2;
      const rs=Math.sqrt(Math.max(0,1-y*y));
      const th=golden*i;
      const dx=Math.cos(th)*rs,dy=y,dz=Math.sin(th)*rs;
      let k=1;
      if(shape==='cube') k=1/Math.max(Math.abs(dx),Math.abs(dy),Math.abs(dz));
      const x=dx*k, yy=dy*k, z=dz*k;
      const r=Math.sqrt(x*x+yy*yy+z*z)||1;
      arr.push({x,y:yy,z,theta:Math.atan2(z,x),phi:Math.acos(clamp(yy/r,-1,1))});
    }
    return arr;
  }
  const shapes={sphere:makeShape('sphere'),cube:makeShape('cube')};

  // Exact state values from stanby 02(1).html.
  const standby=[
    {d:1/3,shape:'sphere',c1:'#00ff91',c2:'#096672',moveZ:-27.59,speed:.03,morph:.25,rotX:-.3,rotY:.3,size:2},
    {d:1/3,shape:'sphere',c1:'#2b00ff',c2:'#52cddd',moveZ:-33.79,speed:.037,morph:.33,rotX:-.3,rotY:.3,size:2},
    {d:1/3,shape:'sphere',c1:'#00ff91',c2:'#096672',moveZ:-27.59,speed:.03,morph:.25,rotX:-.3,rotY:.3,size:2}
  ];

  // Exact form / depth / morph values from think .3.html.
  const thinking=[
    {d:.25,shape:'cube',  c1:'#00ff91',c2:'#096672',moveZ:-27.59,speed:.03,morph:.05,rotX:-.3,rotY:.3,size:2},
    {d:.25,shape:'sphere',c1:'#00ff91',c2:'#096672',moveZ:-27.59,speed:.03,morph:.11,rotX:-.3,rotY:.3,size:2},
    {d:.25,shape:'cube',  c1:'#00ff91',c2:'#096672',moveZ:-42.76,speed:.03,morph:.26,rotX:-.3,rotY:.3,size:2},
    {d:.25,shape:'sphere',c1:'#00ff91',c2:'#096672',moveZ:-24.14,speed:.03,morph:.26,rotX:-.3,rotY:.3,size:2}
  ];

  function sampleStates(states,total,t){
    let local=((t%total)+total)%total;
    let acc=0;
    for(let i=0;i<states.length;i++){
      const seg=states[i].d*total;
      if(local<=acc+seg || i===states.length-1){
        const a=states[i],b=states[(i+1)%states.length],p=ease((local-acc)/seg);
        return {a,b,p};
      }
      acc+=seg;
    }
    return {a:states[0],b:states[1],p:0};
  }

  function blendState(pair){
    const {a,b,p}=pair;
    return {
      fromShape:a.shape,toShape:b.shape,shapeMix:p,
      c1:lerpHex(a.c1,b.c1,p),c2:lerpHex(a.c2,b.c2,p),
      moveZ:lerp(a.moveZ,b.moveZ,p),speed:lerp(a.speed,b.speed,p),morph:lerp(a.morph,b.morph,p),
      rotX:lerp(a.rotX,b.rotX,p),rotY:lerp(a.rotY,b.rotY,p),size:lerp(a.size,b.size,p)
    };
  }

  function samplePoint(state,i){
    const a=shapes[state.fromShape][i],b=shapes[state.toShape][i],p=state.shapeMix;
    return {x:lerp(a.x,b.x,p),y:lerp(a.y,b.y,p),z:lerp(a.z,b.z,p),theta:lerp(a.theta,b.theta,p),phi:lerp(a.phi,b.phi,p)};
  }

  function renderParticles(globalT){
    const t=Math.max(0,globalT);
    // Standby follows its 5 s loop. Thinking follows its 3 s loop and begins as the prompt is submitted.
    const stand=blendState(sampleStates(standby,5,t));
    const thinkT=Math.max(0,t-TL.send);
    const think=blendState(sampleStates(thinking,3,thinkT));
    const mode=ease(clamp((t-(TL.send-.15))/2.1));

    // Keep the richer cyan/violet chromatic breathing seen in the reference video
    // while using the supplied thinking file for the geometry and depth motion.
    const colorCycle=blendState(sampleStates(standby,5,t+.55));
    think.c1=colorCycle.c1; think.c2=colorCycle.c2;

    const anchorX=985;
    const lift=ease(clamp((t-(TL.send-.2))/2.25));

    // Match the reference video more closely: the morph grows as it moves into
    // the upper thinking position, then settles slightly instead of staying
    // permanently enlarged. Keeping the final center a little lower also gives
    // the expanded particles enough breathing room at the top edge.
    const anchorY=lerp(168,94,lift);
    const grow=ease(clamp((t-(TL.send+.05))/1.45));
    const settle=ease(clamp((t-(TL.chatShow+1.8))/2.7));
    const sizeBreath=mode*Math.sin((t-TL.send)*2.05)*.018;
    const visualScale=.64 + .14*grow - .055*settle + sizeBreath;
    const GLOBAL_MORPH_SCALE=.7225;
    const desiredBaseSphere=Math.min(W,H)*.25*visualScale*GLOBAL_MORPH_SCALE;

    ctx.clearRect(0,0,W,H);

    // Derive the exported animation's frame-based phase from timeline time.
    const speed=lerp(stand.speed,think.speed,mode);
    const phase=t*60*speed;
    const state={
      moveZ:lerp(stand.moveZ,think.moveZ,mode),
      morph:lerp(stand.morph,think.morph,mode),
      rotX:lerp(stand.rotX,think.rotX,mode),
      rotY:lerp(stand.rotY,think.rotY,mode),
      size:lerp(stand.size,think.size,mode),
      c1:lerpHex(stand.c1,think.c1,mode),c2:lerpHex(stand.c2,think.c2,mode)
    };
    const rz=moveZScale(state.moveZ);
    const rx=phase*state.rotX, ry=phase*state.rotY;
    const crx=Math.cos(rx),srx=Math.sin(rx),cry=Math.cos(ry),sry=Math.sin(ry);

    // Short, controlled opening-up motion at submission, matching the video's transition into thinking.
    const burstCenter=TL.chatShow+.15;
    const burst=Math.exp(-Math.pow((t-burstCenter)/1.15,2))*mode;

    const out=[];
    let minProjectedY=Infinity;
    for(let i=0;i<N;i++){
      const ps=samplePoint(stand,i), pt=samplePoint(think,i);
      const p={
        x:lerp(ps.x,pt.x,mode),y:lerp(ps.y,pt.y,mode),z:lerp(ps.z,pt.z,mode),
        theta:lerp(ps.theta,pt.theta,mode),phi:lerp(ps.phi,pt.phi,mode)
      };
      const deformation=Math.sin(p.theta*4+phase*2)*Math.cos(p.phi*3-phase)*state.morph;
      const radius=1+deformation;
      let x=p.x*radius,y=p.y*radius,z=p.z*radius;

      if(burst>.015){
        const nx=noise(i,2)*2-1,ny=noise(i,3)*2-1,nz=noise(i,4)*2-1;
        const amp=burst*(.09+.16*noise(i,5));
        x+=nx*amp; y+=ny*amp; z+=nz*amp;
      }

      let y1=y*crx-z*srx,z1=y*srx+z*crx;y=y1;z=z1;
      let x1=x*cry-z*sry,z2=x*sry+z*cry;x=x1;z=z2;
      const persp=(3/(3+z))*rz;
      const projectedX=x*persp;
      const projectedY=y*persp;
      minProjectedY=Math.min(minProjectedY,projectedY);
      const gradient=clamp((-p.y+1)/2);
      out.push({projectedX,projectedY,z,persp,gradient});
    }

    // Edge-aware scale guard. It only intervenes when the current deformation
    // would touch the top of the 1910x932 stage, so normal size breathing stays
    // intact while the expanded state never gets visibly clipped.
    const topMargin=18;
    const safeBaseSphere=minProjectedY<-.0001
      ? Math.max(1,(anchorY-topMargin)/(-minProjectedY))
      : desiredBaseSphere;
    const baseSphere=Math.min(desiredBaseSphere,safeBaseSphere);

    for(const p of out){
      p.px=anchorX+p.projectedX*baseSphere;
      p.py=anchorY+p.projectedY*baseSphere;
    }
    out.sort((a,b)=>b.z-a.z);
    for(const p of out){
      const size=Math.max(.47,p.persp*state.size*.93*GLOBAL_MORPH_SCALE);
      const alpha=clamp(.62+p.persp*.34,.38,.98);
      ctx.fillStyle=rgbToCss(state.c1,state.c2,p.gradient,alpha);
      ctx.beginPath();ctx.arc(p.px,p.py,size,0,Math.PI*2);ctx.fill();
    }
  }
  window.__renderParticles=renderParticles;
})();
(() => {
  const params=new URLSearchParams(location.search);
  const debug=params.get('t');
  const speed=Math.max(.1,Number(params.get('speed')||1.3));
  const loop=params.get('loop')!=='0';
  const cycle=18.0;
  let start=performance.now();
  let pausedAt=null;
  let timelineFrame=0;
  let timelineRunning=false;
  function frame(now){
    if(!isDemoActive()){
      timelineRunning=false;
      pausedAt=pausedAt===null?now:pausedAt;
      timelineFrame=0;
      return;
    }
    let t=debug!==null?Number(debug):((now-start)/1000)*speed;
    if(loop && debug===null)t%=cycle;
    renderTimeline(t);
    window.__renderParticles(t);
    if(debug===null)timelineFrame=requestAnimationFrame(frame);
  }
  function startTimeline(){
    if(debug!==null || !isDemoActive() || timelineRunning) return;
    if(pausedAt!==null){
      start+=performance.now()-pausedAt;
      pausedAt=null;
    }
    timelineRunning=true;
    timelineFrame=requestAnimationFrame(frame);
  }
  function stopTimeline(){
    if(debug!==null || !timelineRunning) return;
    timelineRunning=false;
    pausedAt=performance.now();
    cancelAnimationFrame(timelineFrame);
    timelineFrame=0;
  }
  onVisibilityChange(active => active ? startTimeline() : stopTimeline());
  if(debug!==null){
    const debugTime=Number(debug);
    renderTimeline(debugTime);
    window.__renderParticles(debugTime);
  }else{
    startTimeline();
  }
})();
})();
