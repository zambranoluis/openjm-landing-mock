(() => {
  const demoScene = document.getElementById('request-demo-scene');
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
  const card = document.getElementById('request-demo-cardWrap');
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
  const shell=document.getElementById('request-demo-stageShell');
  const stage=document.getElementById('request-demo-stage');
  function fit(){
    const scale=Math.min(shell.clientWidth/STAGE_W,shell.clientHeight/STAGE_H);
    stage.style.transform=`scale(${scale})`;
  }
  new ResizeObserver(fit).observe(shell); fit();
})();

const PROMPT='Analyze this brief and turn it into an action plan with priorities and next steps.';
const answerBlocks = [
  `<p>Here is an <b>action plan</b> derived from the attached <em>General Project Brief</em>, organized for clarity, prioritization, and immediate execution. It focuses on the highest-impact work first, then sequences the dependencies needed to move the initiative forward.</p>`,
  `<h3>1. Executive Summary</h3>`,
  `<p><b>Project:</b> Digital transformation of the InduSync B2B portal.<br><b>Primary objective:</b> Redesign the ordering, inventory, and logistics workflow into a centralized B2B portal that reduces manual work and gives customers clearer real-time information.</p>`,
  `<p><b>Recommended focus:</b> Deliver the core ordering experience first, then connect real-time inventory and quote automation, and finally strengthen adoption through pilot customers, training, and operational reporting.</p>`,
  `<h3>2. Priority Matrix</h3>`,
  `<div class="request-demo-table-wrap"><table><thead><tr><th>PRIORITY</th><th>INITIATIVE</th><th>WHY IT MATTERS</th></tr></thead><tbody>
    <tr><td><b>P0</b></td><td>Portal architecture and access</td><td>Foundation for every customer-facing workflow.</td></tr>
    <tr><td><b>P0</b></td><td>Automated quotations</td><td>Removes a major manual bottleneck and creates immediate operational value.</td></tr>
    <tr><td><b>P1</b></td><td>Real-time inventory</td><td>Reduces stock uncertainty and prevents avoidable order failures.</td></tr>
    <tr><td><b>P1</b></td><td>Logistics integrations</td><td>Connects dispatch, shipment visibility, and delivery updates.</td></tr>
    <tr><td><b>P2</b></td><td>Customer dashboard and analytics</td><td>Improves transparency, adoption, and ongoing account management.</td></tr>
  </tbody></table></div>`,
  `<h3>3. Phase 1 &#8212; Foundation &amp; Alignment</h3>`,
  `<p><b>Duration:</b> 2 weeks<br><b>Objective:</b> Confirm scope, ownership, technical architecture, and measurable success criteria.</p>`,
  `<p class="request-demo-indent"><b>Actions:</b><br>&#8226; Confirm the portal's must-have workflows with Operations, Sales, Logistics, Finance, and IT.<br>&#8226; Map the current quote-to-order process and identify manual handoffs.<br>&#8226; Define access roles, SSO requirements, and security constraints.<br>&#8226; Establish baseline KPIs for quote time, order processing, inventory accuracy, and adoption.</p>`,
  `<p><b>Exit criteria:</b> Approved scope, architecture, owners, delivery plan, and agreed success metrics.</p>`,
  `<h3>4. Phase 2 &#8212; Core Portal Experience</h3>`,
  `<p><b>Duration:</b> 4 weeks<br><b>Objective:</b> Build the first usable B2B ordering experience.</p>`,
  `<div class="request-demo-table-wrap"><table><thead><tr><th>TASK</th><th>OWNER</th><th>DELIVERABLE</th></tr></thead><tbody>
    <tr><td>Customer authentication and roles</td><td>IT + Security</td><td>SSO-enabled access with role-based permissions.</td></tr>
    <tr><td>Product catalog and ordering flow</td><td>Frontend + Backend</td><td>Searchable catalog, cart, and order submission.</td></tr>
    <tr><td>Quote request workflow</td><td>Development + Finance</td><td>Structured quote request with pricing rules.</td></tr>
    <tr><td>Customer account area</td><td>Web team</td><td>Order history, quote status, and account information.</td></tr>
  </tbody></table></div>`,
  `<p><b>Next milestones:</b><br><b>Week 4:</b> Technical prototype review with Sales.<br><b>Week 6:</b> Load testing for the catalog and ordering flow.<br><b>Week 7:</b> Initial support-team training.</p>`,
  `<h3>5. Phase 3 &#8212; Automation &amp; Logistics</h3>`,
  `<p><b>Duration:</b> 4 weeks<br><b>Objective:</b> Connect the portal to real-time inventory and automate quotations.</p>`,
  `<div class="request-demo-table-wrap"><table><thead><tr><th>TASK</th><th>OWNER</th><th>DELIVERABLE</th></tr></thead><tbody>
    <tr><td>Connect real-time inventory</td><td>IT + Warehouse</td><td>Live inventory API with availability status.</td></tr>
    <tr><td>Automate quotations</td><td>Development + Finance</td><td>Dynamic pricing rules, discounts, and approval thresholds.</td></tr>
    <tr><td>Integrate freight gateways</td><td>Logistics + IT</td><td>Carrier API connections and shipment updates.</td></tr>
    <tr><td>Build customer dashboard</td><td>Web team</td><td>Shipment monitoring, dispatch notes, and order status.</td></tr>
  </tbody></table></div>`,
  `<h3>6. Phase 4 &#8212; Pilot, Adoption &amp; Launch</h3>`,
  `<p><b>Duration:</b> 3 weeks<br><b>Objective:</b> Validate the solution with real customers before wider rollout.</p>`,
  `<p class="request-demo-indent"><b>Actions:</b><br>&#8226; Select a small pilot group with Sales.<br>&#8226; Run guided onboarding sessions and collect structured feedback.<br>&#8226; Track quote turnaround, inventory accuracy, order completion, and support requests.<br>&#8226; Resolve critical usability and integration issues before broader release.</p>`,
  `<h3>7. Risks &amp; Mitigations</h3>`,
  `<div class="request-demo-table-wrap"><table><thead><tr><th>RISK</th><th>IMPACT</th><th>MITIGATION</th></tr></thead><tbody>
    <tr><td>Unreliable inventory data</td><td>High</td><td>Validate source systems and define synchronization/error handling.</td></tr>
    <tr><td>Pricing-rule complexity</td><td>High</td><td>Start with the most common quotation scenarios, then expand rules iteratively.</td></tr>
    <tr><td>Integration delays</td><td>Medium</td><td>Confirm API owners and technical dependencies during Phase 1.</td></tr>
    <tr><td>Low customer adoption</td><td>Medium</td><td>Use pilot customers, onboarding, training, and clear success metrics.</td></tr>
  </tbody></table></div>`,
  `<h3>8. Resources Needed</h3>`,
  `<div class="request-demo-table-wrap"><table><thead><tr><th>RESOURCE</th><th>DETAIL</th></tr></thead><tbody>
    <tr><td><b>Technical team</b></td><td>2 frontend developers, 1 backend developer, 1 cloud architect, and 1 data specialist.</td></tr>
    <tr><td><b>Tools</b></td><td>Version control, task management, Figma for UI, and the approved cloud platform.</td></tr>
    <tr><td><b>Budget</b></td><td>Allocate budget for development, licenses, integration work, consulting, and training.</td></tr>
    <tr><td><b>Core stakeholders</b></td><td>Operations, IT, Logistics, Finance, Sales, HR, and the executive sponsor.</td></tr>
  </tbody></table></div>`,
  `<h3>9. Weekly Follow-up Template</h3>`,
  `<p><b>Progress:</b> Completed work / in progress / blockers.<br><b>Risks:</b> New risks and corrective actions.<br><b>Next steps:</b> Tasks planned for the following week.<br><b>Metrics:</b> Quote time, order completion time, inventory accuracy, adoption, and support volume.</p>`,
  `<h3>Final Summary</h3>`,
  `<p>This action plan turns the project brief into an executable sequence by prioritizing <b>quotation automation</b>, <b>real-time inventory</b>, and <b>early customer adoption</b> while protecting the technical foundations that those capabilities depend on.</p>`,
  `<p><b>Immediate next action:</b> Confirm the Phase 1 owners, validate the technical dependencies, and schedule the architecture/scope review so implementation can begin with a shared definition of success.</p>`
];

const els={
  intro:document.getElementById('request-demo-intro'), typed:document.getElementById('request-demo-typedPrompt'), heroComposer:document.getElementById('request-demo-heroComposer'), heroStatus:document.getElementById('request-demo-heroStatus'),
  uploadChip:document.getElementById('request-demo-uploadChip'), filePicker:document.getElementById('request-demo-filePicker'), pickerFile:document.getElementById('request-demo-pickerFile'), pickerOpenBtn:document.getElementById('request-demo-pickerOpenBtn'),
  conversation:document.getElementById('request-demo-conversation'), inner:document.getElementById('request-demo-conversationInner'), analysisTimer:document.getElementById('request-demo-analysisTimer'), thinking:document.getElementById('request-demo-thinkingBox'), answer:document.getElementById('request-demo-answer'),
  bottomStatus:document.getElementById('request-demo-bottomStatus'), chatComposer:document.getElementById('request-demo-chatComposer'), workline:document.getElementById('request-demo-workline'), tokenline:document.getElementById('request-demo-tokenline'),
  pageScroll:document.getElementById('request-demo-pageScroll'), pageThumb:document.getElementById('request-demo-pageThumb'), assistantMeta:document.getElementById('request-demo-assistantMeta')
};

const TL={
  pickerIn:1.45,
  pickerSelect:2.25,
  pickerPress:3.65,
  pickerOut:4.10,
  attachmentIn:4.18,
  idleEnd:5.10,
  focusEnd:5.55,
  typeStart:5.60,
  typeEnd:12.60,
  send:13.10,
  heroStatusEnd:15.10,
  chatShow:14.65,
  scrollShow:20.85,
  thinkingEnd:20.75,
  streamStart:20.80,
  streamEnd:29.75,
  bottomStatusEnd:30.35,
  composerReturn:30.15,
  reviewScrollStart:37.15,
  reviewScrollEnd:42.15
};

function promptCountAt(t){
  if(t<=TL.typeStart)return 0;
  if(t>=TL.typeEnd)return PROMPT.length;
  const p=(t-TL.typeStart)/(TL.typeEnd-TL.typeStart);
  const eased=1-Math.pow(1-p,1.08);
  return Math.max(0,Math.min(PROMPT.length,Math.floor(eased*PROMPT.length)));
}
function escapePrompt(str){
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function smoothstep(a,b,x){const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)}
function mix(a,b,t){return a+(b-a)*t}
let lastBlocks=-1;
let cachedTotalHeight=0;
function renderTimeline(t){
  const pickerVisible=t>=TL.pickerIn && t<TL.pickerOut;
  els.filePicker.classList.toggle('request-demo-show',pickerVisible);
  els.pickerFile.classList.toggle('request-demo-selected',t>=TL.pickerSelect && t<TL.pickerOut);
  els.pickerOpenBtn.classList.toggle('request-demo-press',t>=TL.pickerPress && t<TL.pickerOut);
  const hasAttachment=t>=TL.attachmentIn && t<TL.send;
  els.uploadChip.classList.toggle('request-demo-show',hasAttachment);
  els.heroComposer.classList.toggle('request-demo-has-attachment',hasAttachment);

  const active=t>=TL.idleEnd && t<TL.send;
  els.heroComposer.classList.toggle('request-demo-active',active);

  const count=promptCountAt(t);
  els.typed.innerHTML=escapePrompt(PROMPT.slice(0,count));
  els.typed.classList.toggle('request-demo-typed',active && t<TL.typeEnd+.18);

  const sending=t>=TL.send;
  els.heroStatus.textContent=t<TL.chatShow?'Uploading attachment...':'Generating a response...';
  els.heroComposer.style.opacity=sending?'0':'1';
  els.heroStatus.classList.toggle('request-demo-show',sending && t<TL.heroStatusEnd);
  els.intro.classList.toggle('request-demo-hidden',t>=TL.chatShow);

  const chatShow=t>=TL.chatShow;
  els.conversation.classList.toggle('request-demo-show',chatShow);
  els.pageScroll.classList.toggle('request-demo-show',chatShow && t>=TL.scrollShow);
  els.bottomStatus.classList.toggle('request-demo-show',chatShow && t<TL.bottomStatusEnd);
  els.chatComposer.classList.toggle('request-demo-show',t>=TL.composerReturn);

  els.thinking.style.display=t<TL.thinkingEnd?'block':'none';

  const streamStart=TL.streamStart, streamEnd=TL.streamEnd;
  let blockCount=0;
  if(t>=streamStart){
    const p=Math.max(0,Math.min(1,(t-streamStart)/(streamEnd-streamStart)));
    blockCount=Math.floor(p*answerBlocks.length);
    if(t>=streamEnd)blockCount=answerBlocks.length;
  }
  if(blockCount!==lastBlocks){
    els.answer.innerHTML=answerBlocks.slice(0,blockCount).join('');
    lastBlocks=blockCount;
    cachedTotalHeight=els.inner.scrollHeight;
  }

  const responseStarted=t>=TL.streamStart;
  const workSecs=Math.min(12,Math.max(1,Math.floor((t-TL.chatShow)*1.55)));
  els.analysisTimer.style.display=chatShow && !responseStarted?'block':'none';
  els.analysisTimer.textContent=`Working for 0m ${workSecs}s`;
  els.assistantMeta.style.display=responseStarted?'flex':'none';
  els.workline.style.display=responseStarted?'block':'none';
  els.workline.textContent=t>=TL.composerReturn ? 'Worked for 0m 12s' : `Working for 0m ${workSecs}s`;
  els.tokenline.textContent=t>=TL.composerReturn?'Entry: 2,787 tokens &#183; Output: 3,841 tokens &#183; Total: 6,628 tokens':'';

  if(chatShow){
    const viewH=els.conversation.clientHeight || 690;
    const total=els.inner.scrollHeight;
    const streamP=Math.max(0,Math.min(1,(t-(streamStart+.65))/(streamEnd-(streamStart+.65))));
    let desired=0;
    if(total>viewH){
      const maxScroll=total-viewH+12;
      const delayed=Math.max(0,Math.min(1,(streamP-.10)/.90));
      desired=maxScroll*smoothstep(0,1,delayed);
      // After generation completes, gently review the response by moving back toward
      // the upper-middle portion, mirroring the reference recording's final scroll.
      if(t>=TL.reviewScrollStart){
        const review=smoothstep(TL.reviewScrollStart,TL.reviewScrollEnd,t);
        desired=mix(desired,maxScroll*.36,review);
      }
    }
    els.inner.style.transform=`translateY(${-desired}px)`;
    const maxScroll=Math.max(1,total-viewH+12);
    const ratio=Math.max(0,Math.min(1,desired/maxScroll));
    const track=738-110;
    els.pageThumb.style.top=`${ratio*track}px`;
  } else {
    els.inner.style.transform='translateY(0)';
  }
}

// Morph engine adapted from the supplied standby / thinking particle exports.
// Only the particle behavior is replaced; the surrounding UI and copy remain untouched.
(() => {
  const canvas=document.getElementById('request-demo-particleCanvas');
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
  const speed=Math.max(.1,Number(params.get('speed')||1));
  const loop=params.get('loop')!=='0';
  const cycle=44.0;
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
