(() => {
  const personView = $('personView');
  if(!personView) return;

  const themeMeta=document.querySelector('meta[name="theme-color"]');
  function syncSystemThemeColour(){
    if(!themeMeta) return;
    const splash=$('splash');
    const splashVisible=splash && !splash.classList.contains('done');
    const homeVisible=!$('homeView')?.classList.contains('hidden');
    const inRead=personView.classList.contains('read-mode') && !$('readPanel')?.classList.contains('hidden');
    let colour=settings?.bg||'#171124';
    if(splashVisible) colour='#120d19';
    else if(inRead) colour='#000000';
    else if(!homeVisible){
      const friend=selected?.();
      colour=friend?.profileBg || '#111111';
    }
    themeMeta.setAttribute('content',colour);
    document.documentElement.style.setProperty('--system-bar-colour',colour);

    // Chrome/Samsung edge-to-edge navigation can sample the actual page
    // background beneath fixed overlays, not only the theme-color meta tag.
    document.documentElement.style.backgroundColor=colour;
    document.body.style.backgroundColor=colour;
  }

  const screenThemeObserver=new MutationObserver(()=>requestAnimationFrame(syncSystemThemeColour));
  [$('splash'),$('homeView'),personView,$('readPanel')].filter(Boolean).forEach(el=>screenThemeObserver.observe(el,{attributes:true,attributeFilter:['class']}));
  window.addEventListener('pageshow',syncSystemThemeColour);

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
      syncSystemThemeColour();
      personView.classList.remove(outClass);
      personView.classList.add(inClass);
      window.setTimeout(()=>personView.classList.remove(inClass),360);
    },230);
  }

  let sx=0, sy=0, st=0;
  personView.addEventListener('touchstart',e=>{
    if(document.body.classList.contains('sparkle-live-editing')){sx=sy=st=0;return;}
    if(e.touches.length!==1) return;
    sx=e.touches[0].clientX; sy=e.touches[0].clientY; st=Date.now();
  },{passive:true,capture:true});

  personView.addEventListener('touchend',e=>{
    if(document.body.classList.contains('sparkle-live-editing')){sx=sy=st=0;return;}
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
    const duration=36000;
    function frame(now){
      if(!btn.isConnected || !track.isConnected) return;
      const w=btn.offsetWidth;
      const h=btn.offsetHeight;
      const computed=getComputedStyle(btn);
      const r=Math.min(parseFloat(computed.borderTopLeftRadius)||30,w/2,h/2);
      sparks.forEach((spark,i)=>{
        const p=(now/duration + i/sparks.length)%1;
        const pt=roundedRectPoint(p,w,h,r);
        const twinkle=.82+.22*Math.sin((now/900)+(i*1.7));
        spark.style.left=`${pt.x}px`;
        spark.style.top=`${pt.y}px`;
        spark.style.transform=`translate(-50%,-50%) scale(${twinkle})`;
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function archiveSparkleIcons(){
    return ['✦','✧','⋆','✶'];
  }
  function archiveSparkleCount(){
    const density=selected?.()?.profileSparkleDensity||'constellation';
    return density==='whisper'?2:(density==='starfall'?3:2);
  }
  function addArchiveSparkles(){
    const btn=$('readBtn');
    if(!btn) return;

    btn.querySelectorAll('.archive-orbit,.portal-orbit,.border-sparkle-track').forEach(el=>el.remove());

    const icons=archiveSparkleIcons();
    const count=archiveSparkleCount();
    const signature=(selected?.()?.id||'none')+'|'+count+'|'+icons.join('');
    const existing=btn.querySelector('.archive-border-sparkles');

    if(existing?.dataset.sparkleSignature===signature) return;
    existing?.remove();

    const track=document.createElement('span');
    track.className='archive-border-sparkles';
    track.dataset.sparkleSignature=signature;
    track.setAttribute('aria-hidden','true');
    let seed=0;
    for(const ch of signature) seed=((seed*31)+ch.charCodeAt(0))>>>0;
    const pick=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    track.innerHTML=Array.from({length:count},()=>'<i>'+esc(icons[Math.floor(pick()*icons.length)]||icons[0])+'</i>').join('');
    btn.appendChild(track);
    animateArchiveSparkles(btn,track);
  }

  const observer=new MutationObserver(addArchiveSparkles);
  observer.observe($('personChoice')||personView,{childList:true,subtree:true});
  addArchiveSparkles();
  requestAnimationFrame(syncSystemThemeColour);

  const css=document.createElement('style');
  css.id='magicalTransitionStyles';
  css.textContent=`
    .px-open-dossier{
      position:relative!important;isolation:isolate;overflow:visible!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important;gap:4px!important;height:94px!important;min-height:94px!important;padding:10px 28px!important;border-radius:30px!important;border:1px solid color-mix(in srgb,var(--person-accent,var(--accent)) 48%,white 6%)!important;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.018))!important;color:var(--person-text)!important;box-shadow:0 0 6px color-mix(in srgb,var(--person-accent,var(--accent)) 12%,transparent),inset 0 0 12px color-mix(in srgb,var(--person-accent,var(--accent)) 5%,transparent)!important;animation:archiveGlow 3.2s ease-in-out infinite!important;
    }
    .px-open-dossier:before{content:none!important}
    .px-open-dossier:after{content:none!important}
    .px-open-dossier .archive-sigil{font-size:18px!important;line-height:1!important;margin:0 0 2px!important;color:var(--person-accent,var(--accent))!important;text-shadow:0 0 10px currentColor,0 0 22px currentColor!important;animation:sigilPulse 2.4s ease-in-out infinite}
    .px-open-dossier strong{display:block!important;width:100%!important;margin:0!important;padding:0!important;font-family:var(--person-font,Georgia,'Times New Roman',serif)!important;font-size:var(--person-archive-title-size,24px)!important;line-height:1.05!important;letter-spacing:.035em!important;text-align:center!important;text-transform:none!important;color:var(--person-heading,var(--person-text))!important;text-shadow:0 0 10px color-mix(in srgb,var(--person-accent,var(--accent)) 32%,transparent)!important}
    .px-open-dossier small{display:block!important;width:100%!important;margin:3px 0 0!important;text-align:center!important;font-size:var(--person-archive-sub-size,10px)!important;letter-spacing:.07em!important;color:color-mix(in srgb,var(--person-text) 58%,transparent)!important}

    .archive-orbit,.portal-orbit,.border-sparkle-track{display:none!important;animation:none!important}
    .archive-border-sparkles{position:absolute;left:-1px;top:-1px;width:calc(100% + 2px);height:calc(100% + 2px);pointer-events:none;z-index:5;overflow:visible}
    .archive-border-sparkles i{position:absolute;font-style:normal;line-height:1;color:color-mix(in srgb,var(--person-accent,var(--accent)) 80%,white 20%);text-shadow:0 0 8px currentColor,0 0 16px currentColor;will-change:left,top,transform}
    .archive-border-sparkles i:nth-child(3n+1){font-size:12px;opacity:.72}
    .archive-border-sparkles i:nth-child(3n+2){font-size:7px;opacity:.34}
    .archive-border-sparkles i:nth-child(3n){font-size:9px;opacity:.52}

    #personView{transform-style:preserve-3d;perspective:1100px;will-change:transform,opacity;backface-visibility:hidden}
    #personView.book-turn-out-left{animation:bookOutLeft .23s cubic-bezier(.55,.02,.85,.35) both}
    #personView.book-turn-out-right{animation:bookOutRight .23s cubic-bezier(.55,.02,.85,.35) both}
    #personView.book-turn-in-right{animation:bookInRight .36s cubic-bezier(.18,.78,.25,1) both}
    #personView.book-turn-in-left{animation:bookInLeft .36s cubic-bezier(.18,.78,.25,1) both}

    @keyframes archiveGlow{0%,100%{border-color:color-mix(in srgb,var(--person-accent,var(--accent)) 42%,white 5%);box-shadow:0 0 5px color-mix(in srgb,var(--person-accent,var(--accent)) 10%,transparent),inset 0 0 10px color-mix(in srgb,var(--person-accent,var(--accent)) 4%,transparent)}50%{border-color:color-mix(in srgb,var(--person-accent,var(--accent)) 78%,white 12%);box-shadow:0 0 14px color-mix(in srgb,var(--person-accent,var(--accent)) 24%,transparent),0 0 24px color-mix(in srgb,var(--person-accent,var(--accent)) 10%,transparent),inset 0 0 18px color-mix(in srgb,var(--person-accent,var(--accent)) 9%,transparent)}}
    @keyframes archiveAura{0%,100%{opacity:.38;transform:scale(.985)}50%{opacity:.9;transform:scale(1.015)}}
    78%,100%{transform:translateX(115%)}}
    @keyframes sigilPulse{0%,100%{opacity:.58;transform:scale(.9)}50%{opacity:1;transform:scale(1.1)}}
    @keyframes bookOutLeft{0%{transform:translateX(0) rotateY(0deg) rotateZ(0deg);opacity:1;filter:blur(0)}100%{transform:translateX(-34%) rotateY(18deg) rotateZ(-1.4deg);opacity:0;filter:blur(1.2px)}}
    @keyframes bookOutRight{0%{transform:translateX(0) rotateY(0deg) rotateZ(0deg);opacity:1;filter:blur(0)}100%{transform:translateX(34%) rotateY(-18deg) rotateZ(1.4deg);opacity:0;filter:blur(1.2px)}}
    @keyframes bookInRight{0%{transform:translateX(34%) rotateY(-17deg) rotateZ(1.2deg);opacity:0;filter:blur(1px)}65%{opacity:1}100%{transform:translateX(0) rotateY(0deg) rotateZ(0deg);opacity:1;filter:blur(0)}}
    @keyframes bookInLeft{0%{transform:translateX(-34%) rotateY(17deg) rotateZ(-1.2deg);opacity:0;filter:blur(1px)}65%{opacity:1}100%{transform:translateX(0) rotateY(0deg) rotateZ(0deg);opacity:1;filter:blur(0)}}
    @media(prefers-reduced-motion:reduce){.px-open-dossier,.px-open-dossier:before,.px-open-dossier:after,.px-open-dossier .archive-sigil,#personView.book-turn-out-left,#personView.book-turn-out-right,#personView.book-turn-in-right,#personView.book-turn-in-left{animation:none!important}}
  `;
  document.head.appendChild(css);
})();