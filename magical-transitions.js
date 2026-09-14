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

  function addArchiveSparkles(){
    const btn=$('readBtn');
    if(!btn || btn.querySelector('.archive-orbit')) return;
    const orbit=document.createElement('span');
    orbit.className='archive-orbit';
    orbit.setAttribute('aria-hidden','true');
    orbit.innerHTML='<i>✦</i><i>✧</i><i>⋆</i><i>✦</i><i>✧</i><i>⋆</i><i>✦</i><i>✧</i>';
    btn.appendChild(orbit);
  }
  const observer=new MutationObserver(addArchiveSparkles);
  observer.observe($('personChoice')||personView,{childList:true,subtree:true});
  addArchiveSparkles();

  const css=document.createElement('style');
  css.id='magicalTransitionStyles';
  css.textContent=`
    .px-open-dossier{
      position:relative!important;
      isolation:isolate;
      overflow:visible!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      text-align:center!important;
      gap:4px!important;
      min-height:94px!important;
      padding:22px 28px!important;
      border-radius:30px!important;
      border:1px solid color-mix(in srgb,var(--accent) 58%,white 8%)!important;
      background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.018))!important;
      color:#fff!important;
      box-shadow:
        0 0 14px color-mix(in srgb,var(--accent) 48%,transparent),
        0 0 32px color-mix(in srgb,var(--accent) 30%,transparent),
        0 0 68px color-mix(in srgb,var(--accent) 18%,transparent),
        inset 0 0 22px color-mix(in srgb,var(--accent) 12%,transparent)!important;
      animation:archiveGlow 3.2s ease-in-out infinite;
    }
    .px-open-dossier:before{
      content:'';
      position:absolute;
      inset:-8px;
      border-radius:36px;
      border:1px solid color-mix(in srgb,var(--accent) 30%,transparent);
      box-shadow:0 0 18px color-mix(in srgb,var(--accent) 24%,transparent);
      opacity:.7;
      pointer-events:none;
      animation:archiveAura 3.4s ease-in-out infinite;
    }
    .px-open-dossier:after{
      content:'';
      position:absolute;
      inset:0;
      border-radius:inherit;
      background:linear-gradient(105deg,transparent 20%,rgba(255,255,255,.13) 46%,transparent 70%);
      transform:translateX(-115%);
      animation:archiveShimmer 4.8s ease-in-out infinite;
      pointer-events:none;
      z-index:-1;
    }
    .px-open-dossier .archive-sigil{
      font-size:18px!important;
      line-height:1!important;
      margin:0 0 2px!important;
      color:var(--accent)!important;
      text-shadow:0 0 10px currentColor,0 0 22px currentColor!important;
      animation:sigilPulse 2.4s ease-in-out infinite;
    }
    .px-open-dossier strong{
      display:block!important;
      width:100%!important;
      margin:0!important;
      padding:0!important;
      font-family:Georgia,'Times New Roman',serif!important;
      font-size:24px!important;
      line-height:1.05!important;
      letter-spacing:.035em!important;
      text-align:center!important;
      text-transform:none!important;
      color:#fff!important;
      text-shadow:0 0 10px color-mix(in srgb,var(--accent) 32%,transparent)!important;
    }
    .px-open-dossier small{
      display:block!important;
      width:100%!important;
      margin:3px 0 0!important;
      text-align:center!important;
      font-size:10px!important;
      letter-spacing:.07em!important;
      color:rgba(255,255,255,.58)!important;
    }
    .archive-orbit{
      position:absolute;
      inset:-18px;
      border-radius:40px;
      pointer-events:none;
      z-index:3;
      animation:orbitContainer 8s linear infinite;
    }
    .archive-orbit i{
      position:absolute;
      color:color-mix(in srgb,var(--accent) 78%,white 12%);
      font-style:normal;
      line-height:1;
      text-shadow:0 0 8px currentColor,0 0 16px currentColor;
      animation:sparkFloat 2.8s ease-in-out infinite;
    }
    .archive-orbit i:nth-child(1){left:8%;top:13%;font-size:15px;animation-delay:-.2s}
    .archive-orbit i:nth-child(2){left:31%;top:-3%;font-size:11px;animation-delay:-1.1s}
    .archive-orbit i:nth-child(3){right:22%;top:1%;font-size:9px;animation-delay:-2s}
    .archive-orbit i:nth-child(4){right:3%;top:35%;font-size:16px;animation-delay:-.7s}
    .archive-orbit i:nth-child(5){right:14%;bottom:0;font-size:11px;animation-delay:-1.5s}
    .archive-orbit i:nth-child(6){left:47%;bottom:-7%;font-size:9px;animation-delay:-2.3s}
    .archive-orbit i:nth-child(7){left:13%;bottom:5%;font-size:14px;animation-delay:-.9s}
    .archive-orbit i:nth-child(8){left:-1%;top:51%;font-size:10px;animation-delay:-1.8s}

    #personView{transform-style:preserve-3d;perspective:1100px;will-change:transform,opacity;backface-visibility:hidden}
    #personView.book-turn-out-left{animation:bookOutLeft .23s cubic-bezier(.55,.02,.85,.35) both}
    #personView.book-turn-out-right{animation:bookOutRight .23s cubic-bezier(.55,.02,.85,.35) both}
    #personView.book-turn-in-right{animation:bookInRight .36s cubic-bezier(.18,.78,.25,1) both}
    #personView.book-turn-in-left{animation:bookInLeft .36s cubic-bezier(.18,.78,.25,1) both}

    @keyframes archiveGlow{0%,100%{box-shadow:0 0 12px color-mix(in srgb,var(--accent) 42%,transparent),0 0 30px color-mix(in srgb,var(--accent) 24%,transparent),0 0 60px color-mix(in srgb,var(--accent) 14%,transparent),inset 0 0 18px color-mix(in srgb,var(--accent) 10%,transparent)}50%{box-shadow:0 0 18px color-mix(in srgb,var(--accent) 65%,transparent),0 0 42px color-mix(in srgb,var(--accent) 40%,transparent),0 0 82px color-mix(in srgb,var(--accent) 22%,transparent),inset 0 0 26px color-mix(in srgb,var(--accent) 16%,transparent)}}
    @keyframes archiveAura{0%,100%{opacity:.38;transform:scale(.985)}50%{opacity:.9;transform:scale(1.015)}}
    @keyframes archiveShimmer{0%,58%{transform:translateX(-115%)}78%,100%{transform:translateX(115%)}}
    @keyframes sigilPulse{0%,100%{opacity:.58;transform:scale(.9)}50%{opacity:1;transform:scale(1.1)}}
    @keyframes orbitContainer{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes sparkFloat{0%,100%{opacity:.35;transform:translateY(0) scale(.9)}50%{opacity:1;transform:translateY(-4px) scale(1.15)}}
    @keyframes bookOutLeft{0%{transform:translateX(0) rotateY(0deg) rotateZ(0deg);opacity:1;filter:blur(0)}100%{transform:translateX(-34%) rotateY(18deg) rotateZ(-1.4deg);opacity:0;filter:blur(1.2px)}}
    @keyframes bookOutRight{0%{transform:translateX(0) rotateY(0deg) rotateZ(0deg);opacity:1;filter:blur(0)}100%{transform:translateX(34%) rotateY(-18deg) rotateZ(1.4deg);opacity:0;filter:blur(1.2px)}}
    @keyframes bookInRight{0%{transform:translateX(34%) rotateY(-17deg) rotateZ(1.2deg);opacity:0;filter:blur(1px)}65%{opacity:1}100%{transform:translateX(0) rotateY(0deg) rotateZ(0deg);opacity:1;filter:blur(0)}}
    @keyframes bookInLeft{0%{transform:translateX(-34%) rotateY(17deg) rotateZ(-1.2deg);opacity:0;filter:blur(1px)}65%{opacity:1}100%{transform:translateX(0) rotateY(0deg) rotateZ(0deg);opacity:1;filter:blur(0)}}
    @media(prefers-reduced-motion:reduce){.px-open-dossier,.px-open-dossier:before,.px-open-dossier:after,.archive-orbit,.archive-orbit i,.px-open-dossier .archive-sigil,#personView.book-turn-out-left,#personView.book-turn-out-right,#personView.book-turn-in-right,#personView.book-turn-in-left{animation:none!important}}
  `;
  document.head.appendChild(css);
})();