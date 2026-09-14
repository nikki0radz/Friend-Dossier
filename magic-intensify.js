(() => {
  function decorateTitles(){
    document.querySelectorAll('.px-dossier .character-section-title').forEach(title=>{
      if(title.querySelector('.title-spark-left')) return;
      const left=document.createElement('span');
      left.className='title-spark-pair title-spark-left';
      left.innerHTML='<i>✦</i><i>✧</i>';
      const right=document.createElement('span');
      right.className='title-spark-pair title-spark-right';
      right.innerHTML='<i>✧</i><i>✦</i>';
      title.prepend(left);
      title.append(right);
    });
  }

  function decoratePortal(){
    const btn=document.getElementById('readBtn');
    if(!btn || btn.dataset.portalDecorated==='1') return;
    btn.dataset.portalDecorated='1';
    btn.classList.add('grand-portal-button');
    const orbit=document.createElement('span');
    orbit.className='portal-orbit';
    orbit.setAttribute('aria-hidden','true');
    orbit.innerHTML='<i>✦</i><i>☾</i><i>✧</i><i>⋆</i><i>✶</i><i>⟡</i>';
    btn.appendChild(orbit);
    const veil=document.createElement('span');
    veil.className='portal-veil';
    veil.setAttribute('aria-hidden','true');
    btn.appendChild(veil);
  }

  const previousShowChoice=showChoice;
  showChoice=function(){
    previousShowChoice();
    requestAnimationFrame(decoratePortal);
  };

  const previousRenderRead=renderRead;
  renderRead=function(){
    previousRenderRead();
    requestAnimationFrame(decorateTitles);
  };

  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('#readBtn');
    if(!btn) return;
    const burst=document.createElement('div');
    burst.className='portal-burst';
    burst.innerHTML='<span>✦</span><span>✧</span><span>⋆</span><span>✶</span><span>✦</span><span>⟡</span><span>✧</span><span>⋆</span>';
    document.body.appendChild(burst);
    requestAnimationFrame(()=>burst.classList.add('active'));
    setTimeout(()=>burst.remove(),760);
  },true);

  const style=document.createElement('style');
  style.id='magicIntensifyStyles';
  style.textContent=`
    .px-dossier .character-section-title{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:8px!important;
      margin-bottom:0!important;
    }
    .px-dossier .character-section-title:before,
    .px-dossier .character-section-title:after{
      content:none!important;
      display:none!important;
    }
    .px-dossier .character-section-title strong:after{content:none!important}
    .title-spark-pair{display:inline-flex;align-items:center;gap:3px;color:var(--profile-sparkle);text-shadow:0 0 9px currentColor;flex:0 0 auto}
    .title-spark-pair i{font-style:normal;line-height:1;animation:titleSparkTwinkle 3.8s ease-in-out infinite}
    .title-spark-pair i:first-child{font-size:12px}.title-spark-pair i:last-child{font-size:9px;animation-delay:-1.1s}
    .title-spark-right i:first-child{animation-delay:-2s}.title-spark-right i:last-child{animation-delay:-.4s}

    .grand-portal-button{
      position:relative!important;
      overflow:visible!important;
      isolation:isolate!important;
      min-height:104px!important;
      padding:24px 58px!important;
      text-align:center!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      gap:5px!important;
      border-radius:28px!important;
      border:1px solid color-mix(in srgb,var(--accent) 58%,white 8%)!important;
      background:
        radial-gradient(circle at 50% 48%,color-mix(in srgb,var(--accent) 34%,transparent),transparent 34%),
        radial-gradient(circle at 50% 50%,rgba(255,255,255,.08),transparent 64%),
        linear-gradient(145deg,color-mix(in srgb,var(--accent) 14%,#100817),#09050d 72%)!important;
      box-shadow:
        0 0 0 1px color-mix(in srgb,var(--accent) 12%,transparent),
        0 0 26px color-mix(in srgb,var(--accent) 22%,transparent),
        0 0 70px color-mix(in srgb,var(--accent) 13%,transparent),
        inset 0 0 34px color-mix(in srgb,var(--accent) 10%,transparent)!important;
      animation:portalBreath 3.3s ease-in-out infinite!important;
    }
    .grand-portal-button:before{
      content:'';
      position:absolute;
      inset:-10px;
      border-radius:34px;
      border:1px solid color-mix(in srgb,var(--accent) 28%,transparent);
      box-shadow:0 0 24px color-mix(in srgb,var(--accent) 18%,transparent);
      pointer-events:none;
      animation:outerRunePulse 4.6s ease-in-out infinite;
      z-index:-1;
    }
    .grand-portal-button:after{
      content:'';
      position:absolute;
      inset:2px;
      border-radius:25px;
      background:linear-gradient(115deg,transparent 20%,rgba(255,255,255,.15) 42%,transparent 61%);
      transform:translateX(-120%);
      animation:portalShimmer 4.2s ease-in-out infinite;
      pointer-events:none;
    }
    .grand-portal-button>span:not(.portal-orbit):not(.portal-veil){
      font-size:25px!important;
      color:var(--accent)!important;
      text-shadow:0 0 12px currentColor,0 0 28px currentColor!important;
      animation:sigilFloat 2.8s ease-in-out infinite;
    }
    .grand-portal-button strong{
      font-family:Georgia,'Times New Roman',serif!important;
      font-size:24px!important;
      letter-spacing:.035em!important;
      text-align:center!important;
      text-shadow:0 0 18px color-mix(in srgb,var(--accent) 46%,transparent),0 2px 12px #000!important;
      z-index:2;
    }
    .grand-portal-button small{
      text-align:center!important;
      font-family:Georgia,'Times New Roman',serif!important;
      font-style:italic!important;
      letter-spacing:.06em!important;
      color:color-mix(in srgb,var(--accent) 45%,#eee 55%)!important;
      z-index:2;
    }
    .portal-orbit{position:absolute!important;inset:-24px!important;pointer-events:none!important;animation:portalOrbit 13s linear infinite!important;z-index:-1!important}
    .portal-orbit i{position:absolute;font-style:normal;color:color-mix(in srgb,var(--accent) 74%,white);text-shadow:0 0 10px currentColor;opacity:.9;animation:orbitTwinkle 3.2s ease-in-out infinite}
    .portal-orbit i:nth-child(1){left:8%;top:48%;font-size:14px}.portal-orbit i:nth-child(2){left:24%;top:2%;font-size:13px;animation-delay:-1s}.portal-orbit i:nth-child(3){right:21%;top:5%;font-size:17px;animation-delay:-2.1s}.portal-orbit i:nth-child(4){right:6%;top:53%;font-size:11px;animation-delay:-.7s}.portal-orbit i:nth-child(5){right:24%;bottom:1%;font-size:12px;animation-delay:-1.8s}.portal-orbit i:nth-child(6){left:18%;bottom:2%;font-size:10px;animation-delay:-2.6s}
    .portal-veil{position:absolute!important;left:50%!important;top:50%!important;width:48%!important;aspect-ratio:1!important;border-radius:50%!important;transform:translate(-50%,-50%)!important;background:radial-gradient(circle,color-mix(in srgb,var(--accent) 24%,transparent),transparent 68%)!important;filter:blur(9px)!important;opacity:.75!important;pointer-events:none!important;z-index:0!important;animation:veilPulse 2.5s ease-in-out infinite!important}

    .portal-burst{position:fixed;inset:0;z-index:99999;pointer-events:none;display:grid;place-items:center;background:radial-gradient(circle at 50% 52%,color-mix(in srgb,var(--accent) 20%,white 8%),rgba(10,5,14,.18) 28%,transparent 68%);opacity:0;transition:opacity .16s ease}
    .portal-burst.active{opacity:1;animation:burstFade .72s ease forwards}
    .portal-burst span{position:absolute;left:50%;top:50%;color:color-mix(in srgb,var(--accent) 75%,white);font-size:22px;text-shadow:0 0 14px currentColor,0 0 32px currentColor;animation:burstStar .7s cubic-bezier(.2,.8,.2,1) forwards}
    .portal-burst span:nth-child(1){--x:-120px;--y:-95px}.portal-burst span:nth-child(2){--x:118px;--y:-78px}.portal-burst span:nth-child(3){--x:-145px;--y:35px}.portal-burst span:nth-child(4){--x:145px;--y:42px}.portal-burst span:nth-child(5){--x:-84px;--y:110px}.portal-burst span:nth-child(6){--x:76px;--y:122px}.portal-burst span:nth-child(7){--x:-12px;--y:-138px}.portal-burst span:nth-child(8){--x:15px;--y:142px}

    @keyframes titleSparkTwinkle{0%,100%{opacity:.38;transform:scale(.82)}50%{opacity:1;transform:scale(1.18)}}
    @keyframes portalBreath{0%,100%{transform:translateY(0) scale(1);box-shadow:0 0 22px color-mix(in srgb,var(--accent) 18%,transparent),0 0 58px color-mix(in srgb,var(--accent) 10%,transparent),inset 0 0 30px color-mix(in srgb,var(--accent) 8%,transparent)}50%{transform:translateY(-2px) scale(1.012);box-shadow:0 0 34px color-mix(in srgb,var(--accent) 32%,transparent),0 0 92px color-mix(in srgb,var(--accent) 18%,transparent),inset 0 0 44px color-mix(in srgb,var(--accent) 15%,transparent)}}
    @keyframes outerRunePulse{0%,100%{opacity:.35;transform:scale(.99)}50%{opacity:.9;transform:scale(1.02)}}
    @keyframes portalShimmer{0%,72%{transform:translateX(-130%)}100%{transform:translateX(130%)}}
    @keyframes sigilFloat{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-3px) rotate(8deg)}}
    @keyframes portalOrbit{to{transform:rotate(360deg)}}
    @keyframes orbitTwinkle{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1.18)}}
    @keyframes veilPulse{0%,100%{opacity:.42;transform:translate(-50%,-50%) scale(.9)}50%{opacity:.9;transform:translate(-50%,-50%) scale(1.16)}}
    @keyframes burstStar{0%{transform:translate(-50%,-50%) scale(.4);opacity:0}18%{opacity:1}100%{transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(1.25) rotate(28deg);opacity:0}}
    @keyframes burstFade{0%{opacity:0}16%{opacity:1}100%{opacity:0}}

    @media(max-width:420px){.grand-portal-button{min-height:96px!important;padding:22px 42px!important}.grand-portal-button strong{font-size:22px!important}}
  `;
  document.head.appendChild(style);

  requestAnimationFrame(()=>{decoratePortal();decorateTitles();});
})();
