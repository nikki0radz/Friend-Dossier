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

  const css=document.createElement('style');
  css.id='magicalTransitionStyles';
  css.textContent=`
    .px-open-dossier{position:relative!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important;gap:3px!important;padding:22px 24px!important;border-radius:24px!important;background:radial-gradient(circle at 50% 18%,color-mix(in srgb,var(--accent) 22%,transparent),transparent 42%),linear-gradient(145deg,color-mix(in srgb,var(--accent) 13%,transparent),rgba(255,255,255,.025))!important;box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 18%,transparent),0 18px 42px rgba(0,0,0,.22),inset 0 0 32px color-mix(in srgb,var(--accent) 8%,transparent)!important;animation:dossierBreathe 3.8s ease-in-out infinite}
    .px-open-dossier:before{content:'✦   ✧   ✦';position:absolute;top:7px;left:50%;transform:translateX(-50%);font-size:10px;letter-spacing:.42em;color:color-mix(in srgb,var(--accent) 82%,white 10%);text-shadow:0 0 10px currentColor;opacity:.72;animation:portalTwinkle 2.4s ease-in-out infinite}
    .px-open-dossier:after{content:'';position:absolute;width:180px;height:180px;border-radius:50%;border:1px solid color-mix(in srgb,var(--accent) 30%,transparent);box-shadow:0 0 22px color-mix(in srgb,var(--accent) 16%,transparent),inset 0 0 28px color-mix(in srgb,var(--accent) 7%,transparent);left:50%;top:50%;transform:translate(-50%,-50%) scale(.82);opacity:.45;pointer-events:none;animation:portalHalo 4.6s ease-in-out infinite}
    .px-open-dossier>span{font-size:23px!important;margin-bottom:2px!important;color:var(--accent)!important;text-shadow:0 0 12px currentColor,0 0 24px color-mix(in srgb,var(--accent) 45%,transparent)!important;animation:portalTwinkle 2.8s ease-in-out infinite}
    .px-open-dossier strong{font-family:Georgia,serif!important;font-size:23px!important;letter-spacing:.025em!important;text-align:center!important;text-shadow:0 0 12px color-mix(in srgb,var(--accent) 18%,transparent)}
    .px-open-dossier small{text-align:center!important;font-size:11px!important;letter-spacing:.045em!important;color:color-mix(in srgb,var(--accent) 42%,#d8cadc)!important}

    #personView{transform-style:preserve-3d;perspective:1100px;will-change:transform,opacity;backface-visibility:hidden}
    #personView.book-turn-out-left{animation:bookOutLeft .23s cubic-bezier(.55,.02,.85,.35) both}
    #personView.book-turn-out-right{animation:bookOutRight .23s cubic-bezier(.55,.02,.85,.35) both}
    #personView.book-turn-in-right{animation:bookInRight .36s cubic-bezier(.18,.78,.25,1) both}
    #personView.book-turn-in-left{animation:bookInLeft .36s cubic-bezier(.18,.78,.25,1) both}

    @keyframes dossierBreathe{0%,100%{transform:translateY(0);filter:brightness(1)}50%{transform:translateY(-2px);filter:brightness(1.08)}}
    @keyframes portalTwinkle{0%,100%{opacity:.42;transform:scale(.96)}50%{opacity:1;transform:scale(1.06)}}
    @keyframes portalHalo{0%,100%{transform:translate(-50%,-50%) scale(.78) rotate(0deg);opacity:.24}50%{transform:translate(-50%,-50%) scale(.98) rotate(18deg);opacity:.55}}
    @keyframes bookOutLeft{0%{transform:translateX(0) rotateY(0deg) rotateZ(0deg);opacity:1;filter:blur(0)}100%{transform:translateX(-34%) rotateY(18deg) rotateZ(-1.4deg);opacity:0;filter:blur(1.2px)}}
    @keyframes bookOutRight{0%{transform:translateX(0) rotateY(0deg) rotateZ(0deg);opacity:1;filter:blur(0)}100%{transform:translateX(34%) rotateY(-18deg) rotateZ(1.4deg);opacity:0;filter:blur(1.2px)}}
    @keyframes bookInRight{0%{transform:translateX(34%) rotateY(-17deg) rotateZ(1.2deg);opacity:0;filter:blur(1px)}65%{opacity:1}100%{transform:translateX(0) rotateY(0deg) rotateZ(0deg);opacity:1;filter:blur(0)}}
    @keyframes bookInLeft{0%{transform:translateX(-34%) rotateY(17deg) rotateZ(-1.2deg);opacity:0;filter:blur(1px)}65%{opacity:1}100%{transform:translateX(0) rotateY(0deg) rotateZ(0deg);opacity:1;filter:blur(0)}}
    @media(prefers-reduced-motion:reduce){.px-open-dossier,.px-open-dossier:before,.px-open-dossier:after,.px-open-dossier>span,#personView.book-turn-out-left,#personView.book-turn-out-right,#personView.book-turn-in-right,#personView.book-turn-in-left{animation:none!important}}
  `;
  document.head.appendChild(css);
})();
