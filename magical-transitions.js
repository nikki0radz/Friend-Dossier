(() => {
  const personView = $('personView');
  if(!personView) return;

  function currentMode(){
    if(personView.classList.contains('read-mode') && !$('readPanel')?.classList.contains('hidden')) return 'read';
    if(!$('addInfoPanel')?.classList.contains('hidden')) return 'add';
    return 'profile';
  }

  function orderedFriends(){
    return [...state.friends].sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  }

  function switchFriend(direction){
    const list=orderedFriends();
    if(list.length<2) return;
    const index=list.findIndex(f=>f.id===state.selectedId);
    if(index<0) return;
    const nextIndex=(index + direction + list.length) % list.length;
    const mode=currentMode();
    const outClass=direction>0?'book-turn-out-left':'book-turn-out-right';
    const inClass=direction>0?'book-turn-in-right':'book-turn-in-left';

    personView.classList.remove('book-turn-out-left','book-turn-out-right','book-turn-in-left','book-turn-in-right');
    personView.classList.add(outClass);

    window.setTimeout(()=>{
      state.selectedId=list[nextIndex].id;
      if(mode==='read'){
        $('personHero')?.classList.add('hidden');
        $('personChoice')?.classList.add('hidden');
        $('addInfoPanel')?.classList.add('hidden');
        $('personBackBtn')?.classList.add('hidden');
        personView.classList.add('read-mode');
        $('readPanel')?.classList.remove('hidden');
        renderRead();
      }else if(mode==='add'){
        renderPersonHero();
        showAddInfo();
      }else{
        renderPersonHero();
        showChoice();
      }
      personView.classList.remove(outClass);
      personView.classList.add(inClass);
      window.setTimeout(()=>personView.classList.remove(inClass),360);
    },230);
  }

  let sx=0, sy=0, st=0;
  personView.addEventListener('touchstart',e=>{
    if(e.touches.length!==1) return;
    sx=e.touches[0].clientX; sy=e.touches[0].clientY; st=Date.now();
  },{passive:true,capture:true});

  personView.addEventListener('touchend',e=>{
    if(!sx || !e.changedTouches?.length) return;
    if(e.target.closest('button,input,textarea,select,label,dialog')){sx=sy=0;return;}
    const dx=e.changedTouches[0].clientX-sx, dy=e.changedTouches[0].clientY-sy, dt=Date.now()-st;
    sx=sy=0;
    if(dt>900 || Math.abs(dx)<58 || Math.abs(dx)<Math.abs(dy)*1.25) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    switchFriend(dx<0?1:-1);
  },{passive:false,capture:true});

  function roundedRectPoint(progress,w,h,r){
    r=Math.max(8,Math.min(r,w/2,h/2));
    const top=w-2*r, side=h-2*r, arc=Math.PI*r/2;
    const total=2*top+2*side+4*arc;
    let d=((progress%1)+1)%1*total;
    if(d<top) return {x:r+d,y:0}; d-=top;
    if(d<arc){const a=-Math.PI/2+(d/arc)*(Math.PI/2);return{x:w-r+Math.cos(a)*r,y:r+Math.sin(a)*r};} d-=arc;
    if(d<side) return{x:w,y:r+d}; d-=side;
    if(d<arc){const a=(d/arc)*(Math.PI/2);return{x:w-r+Math.cos(a)*r,y:h-r+Math.sin(a)*r};} d-=arc;
    if(d<top) return{x:w-r-d,y:h}; d-=top;
    if(d<arc){const a=Math.PI/2+(d/arc)*(Math.PI/2);return{x:r+Math.cos(a)*r,y:h-r+Math.sin(a)*r};} d-=arc;
    if(d<side) return{x:0,y:h-r-d}; d-=side;
    const a=Math.PI+(d/arc)*(Math.PI/2);
    return{x:r+Math.cos(a)*r,y:r+Math.sin(a)*r};
  }

  function animateArchiveSparkles(btn,track){
    const sparks=[...track.querySelectorAll('i')];
    const duration=7600;
    function frame(now){
      if(!btn.isConnected || !track.isConnected) return;
      // Use untransformed layout dimensions. getBoundingClientRect() changes while
      // the button's glow animation scales it, which made the sparkle path drift.
      const w=btn.offsetWidth;
      const h=btn.offsetHeight;
      const computed=getComputedStyle(btn);
      const r=Math.min(parseFloat(computed.borderTopLeftRadius)||30,w/2,h/2);
      sparks.forEach((spark,i)=>{
        const p=(now/duration + i/sparks.length)%1;
        const pt=roundedRectPoint(p,w,h,r);
        const twinkle=.82+.22*Math.sin((now/420)+(i*1.7));
        spark.style.left=`${pt.x}px`;
        spark.style.top=`${pt.y}px`;
        spark.style.transform=`translate(-50%,-50%) scale(${twinkle})`;
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function addArchiveSparkles(){
    const btn=$('readBtn');
    if(!btn) return;
    btn.querySelectorAll('.archive-orbit,.portal-orbit,.border-sparkle-track').forEach(el=>el.remove());
    if(btn.querySelector('.archive-border-sparkles')) return;
    const track=document.createElement('span');
    track.className='archive-border-sparkles';
    track.setAttribute('aria-hidden','true');
    track.innerHTML='<i>✦</i><i>✧</i><i>⋆</i><i>✦</i><i>✧</i><i>⋆</i><i>✦</i><i>✧</i>';
    btn.appendChild(track);
    animateArchiveSparkles(btn,track);
  }

  const observer=new MutationObserver(addArchiveSparkles);
  observer.observe($('personChoice')||personView,{childList:true,subtree:true});
  addArchiveSparkles();

  const css=document.createElement('style');
  css.id='magicalTransitionStyles';
  css.textContent=`
    .px-open-dossier{
      position:relative!important;isolation:isolate;overflow:visible!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important;gap:4px!important;min-height:94px!important;padding:22px 28px!important;border-radius:30px!important;border:1px solid color-mix(in srgb,var(--accent) 58%,white 8%)!important;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.018))!important;color:#fff!important;box-shadow:0 0 14px color-mix(in srgb,var(--accent) 48%,transparent),0 0 32px color-mix(in srgb,var(--accent) 30%,transparent),0 0 68px color-mix(in srgb,var(--accent) 18%,transparent),inset 0 0 22px color-mix(in srgb,var(--accent) 12%,transparent)!important;animation:archiveGlow 3.2s ease-in-out infinite;
    }
    .px-open-dossier:before{content:'';position:absolute;inset:-8px;border-radius:36px;border:1px solid color-mix(in srgb,var(--accent) 30%,transparent);box-shadow:0 0 18px color-mix(in srgb,var(--accent) 24%,transparent);opacity:.7;pointer-events:none;animation:archiveAura 3.4s ease-in-out infinite}
    .px-open-dossier:after{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(105deg,transparent 20%,rgba(255,255,255,.13) 46%,transparent 70%);transform:translateX(-115%);animation:archiveShimmer 4.8s ease-in-out infinite;pointer-events:none;z-index:-1}
    .px-open-dossier .archive-sigil{font-size:18px!important;line-height:1!important;margin:0 0 2px!important;color:var(--accent)!important;text-shadow:0 0 10px currentColor,0 0 22px currentColor!important;animation:sigilPulse 2.4s ease-in-out infinite}
    .px-open-dossier strong{display:block!important;width:100%!important;margin:0!important;padding:0!important;font-family:Georgia,'Times New Roman',serif!important;font-size:24px!important;line-height:1.05!important;letter-spacing:.035em!important;text-align:center!important;text-transform:none!important;color:#fff!important;text-shadow:0 0 10px color-mix(in srgb,var(--accent) 32%,transparent)!important}
    .px-open-dossier small{display:block!important;width:100%!important;margin:3px 0 0!important;text-align:center!important;font-size:10px!important;letter-spacing:.07em!important;color:rgba(255,255,255,.58)!important}

    .archive-orbit,.portal-orbit,.border-sparkle-track{display:none!important;animation:none!important}
    .archive-border-sparkles{position:absolute;left:-1px;top:-1px;width:calc(100% + 2px);height:calc(100% + 2px);pointer-events:none;z-index:5;overflow:visible}
    .archive-border-sparkles i{position:absolute;font-style:normal;line-height:1;color:color-mix(in srgb,var(--accent) 80%,white 20%);text-shadow:0 0 8px currentColor,0 0 16px currentColor;will-change:left,top,transform}
    .archive-border-sparkles i:nth-child(1),.archive-border-sparkles i:nth-child(4),.archive-border-sparkles i:nth-child(7){font-size:15px}
    .archive-border-sparkles i:nth-child(2),.archive-border-sparkles i:nth-child(5),.archive-border-sparkles i:nth-child(8){font-size:10px;opacity:.8}
    .archive-border-sparkles i:nth-child(3),.archive-border-sparkles i:nth-child(6){font-size:12px;opacity:.9}

    #personView{transform-style:preserve-3d;perspective:1100px;will-change:transform,opacity;backface-visibility:hidden}
    #personView.book-turn-out-left{animation:bookOutLeft .23s cubic-bezier(.55,.02,.85,.35) both}
    #personView.book-turn-out-right{animation:bookOutRight .23s cubic-bezier(.55,.02,.85,.35) both}
    #personView.book-turn-in-right{animation:bookInRight .36s cubic-bezier(.18,.78,.25,1) both}
    #personView.book-turn-in-left{animation:bookInLeft .36s cubic-bezier(.18,.78,.25,1) both}

    @keyframes archiveGlow{0%,100%{box-shadow:0 0 12px color-mix(in srgb,var(--accent) 42%,transparent),0 0 30px color-mix(in srgb,var(--accent) 24%,transparent),0 0 60px color-mix(in srgb,var(--accent) 14%,transparent),inset 0 0 18px color-mix(in srgb,var(--accent) 10%,transparent)}50%{box-shadow:0 0 18px color-mix(in srgb,var(--accent) 65%,transparent),0 0 42px color-mix(in srgb,var(--accent) 40%,transparent),0 0 82px color-mix(in srgb,var(--accent) 22%,transparent),inset 0 0 26px color-mix(in srgb,var(--accent) 16%,transparent)}}
    @keyframes archiveAura{0%,100%{opacity:.38;transform:scale(.985)}50%{opacity:.9;transform:scale(1.015)}}
    @keyframes archiveShimmer{0%,58%{transform:translateX(-115%)}78%,100%{transform:translateX(115%)}}
    @keyframes sigilPulse{0%,100%{opacity:.58;transform:scale(.9)}50%{opacity:1;transform:scale(1.1)}}
    @keyframes bookOutLeft{0%{transform:translateX(0) rotateY(0deg) rotateZ(0deg);opacity:1;filter:blur(0)}100%{transform:translateX(-34%) rotateY(18deg) rotateZ(-1.4deg);opacity:0;filter:blur(1.2px)}}
    @keyframes bookOutRight{0%{transform:translateX(0) rotateY(0deg) rotateZ(0deg);opacity:1;filter:blur(0)}100%{transform:translateX(34%) rotateY(-18deg) rotateZ(1.4deg);opacity:0;filter:blur(1.2px)}}
    @keyframes bookInRight{0%{transform:translateX(34%) rotateY(-17deg) rotateZ(1.2deg);opacity:0;filter:blur(1px)}65%{opacity:1}100%{transform:translateX(0) rotateY(0deg) rotateZ(0deg);opacity:1;filter:blur(0)}}
    @keyframes bookInLeft{0%{transform:translateX(-34%) rotateY(17deg) rotateZ(-1.2deg);opacity:0;filter:blur(1px)}65%{opacity:1}100%{transform:translateX(0) rotateY(0deg) rotateZ(0deg);opacity:1;filter:blur(0)}}
    @media(prefers-reduced-motion:reduce){.px-open-dossier,.px-open-dossier:before,.px-open-dossier:after,.px-open-dossier .archive-sigil,#personView.book-turn-out-left,#personView.book-turn-out-right,#personView.book-turn-in-right,#personView.book-turn-in-left{animation:none!important}}
  `;
  document.head.appendChild(css);
})();