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
    if(!btn.querySelector('.portal-orbit')){
      const orbit=document.createElement('span');
      orbit.className='portal-orbit';
      orbit.setAttribute('aria-hidden','true');
      orbit.innerHTML='<i>✦</i><i>✧</i><i>⋆</i><i>✦</i><i>✧</i><i>⋆</i><i>✦</i><i>✧</i>';
      btn.appendChild(orbit);
    }
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
    burst.innerHTML='<span>✦</span><span>✧</span><span>⋆</span><span>✦</span><span>✧</span><span>⋆</span>';
    document.body.appendChild(burst);
    requestAnimationFrame(()=>burst.classList.add('active'));
    setTimeout(()=>burst.remove(),620);
  },true);

  const style=document.createElement('style');
  style.id='magicIntensifyStyles';
  style.textContent=`
    .px-dossier .character-section-title{display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;margin-bottom:0!important}
    .px-dossier .character-section-title:before,.px-dossier .character-section-title:after{content:none!important;display:none!important}
    .px-dossier .character-section-title strong:after{content:none!important}
    .title-spark-pair{display:inline-flex;align-items:center;gap:3px;color:var(--profile-sparkle);text-shadow:0 0 9px currentColor;flex:0 0 auto}
    .title-spark-pair i{font-style:normal;line-height:1;animation:titleSparkTwinkle 3.8s ease-in-out infinite}
    .title-spark-pair i:first-child{font-size:12px}.title-spark-pair i:last-child{font-size:9px;animation-delay:-1.1s}
    .title-spark-right i:first-child{animation-delay:-2s}.title-spark-right i:last-child{animation-delay:-.4s}

    .grand-portal-button{
      position:relative!important;
      overflow:visible!important;
      isolation:isolate!important;
      min-height:94px!important;
      padding:22px 30px!important;
      text-align:center!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      gap:4px!important;
      border-radius:30px!important;
      border:1px solid color-mix(in srgb,var(--accent) 55%,white 8%)!important;
      background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.018))!important;
      color:#fff!important;
      box-shadow:0 0 14px color-mix(in srgb,var(--accent) 46%,transparent),0 0 34px color-mix(in srgb,var(--accent) 30%,transparent),0 0 72px color-mix(in srgb,var(--accent) 17%,transparent),inset 0 0 20px color-mix(in srgb,var(--accent) 11%,transparent)!important;
      animation:portalBreath 3.2s ease-in-out infinite!important;
    }
    .grand-portal-button:before{
      content:'';
      position:absolute;
      inset:-8px;
      border-radius:36px;
      border:1px solid color-mix(in srgb,var(--accent) 30%,transparent);
      box-shadow:0 0 18px color-mix(in srgb,var(--accent) 24%,transparent);
      pointer-events:none;
      animation:outerRunePulse 3.4s ease-in-out infinite;
      z-index:-1;
    }
    .grand-portal-button:after{
      content:'';
      position:absolute;
      inset:0;
      border-radius:inherit;
      background:linear-gradient(108deg,transparent 20%,rgba(255,255,255,.12) 47%,transparent 70%);
      transform:translateX(-120%);
      animation:portalShimmer 4.8s ease-in-out infinite;
      pointer-events:none;
      z-index:0;
    }
    .grand-portal-button .archive-sigil{
      font-size:18px!important;
      color:var(--accent)!important;
      text-shadow:0 0 10px currentColor,0 0 22px currentColor!important;
      animation:sigilFloat 2.6s ease-in-out infinite;
      z-index:2;
    }
    .grand-portal-button strong{
      width:100%!important;
      margin:0!important;
      font-family:Georgia,'Times New Roman',serif!important;
      font-size:24px!important;
      line-height:1.05!important;
      letter-spacing:.035em!important;
      text-align:center!important;
      text-transform:none!important;
      color:#fff!important;
      text-shadow:0 0 12px color-mix(in srgb,var(--accent) 32%,transparent)!important;
      z-index:2;
    }
    .grand-portal-button small{
      width:100%!important;
      margin:3px 0 0!important;
      text-align:center!important;
      font-family:Georgia,'Times New Roman',serif!important;
      font-style:italic!important;
      letter-spacing:.05em!important;
      color:rgba(255,255,255,.58)!important;
      z-index:2;
    }
    .portal-orbit{position:absolute!important;inset:-18px!important;pointer-events:none!important;animation:portalOrbit 8s linear infinite!important;z-index:3!important}
    .portal-orbit i{position:absolute;font-style:normal;color:color-mix(in srgb,var(--accent) 78%,white 12%);text-shadow:0 0 8px currentColor,0 0 16px currentColor;animation:orbitTwinkle 2.8s ease-in-out infinite}
    .portal-orbit i:nth-child(1){left:8%;top:13%;font-size:15px}.portal-orbit i:nth-child(2){left:31%;top:-3%;font-size:11px;animation-delay:-1.1s}.portal-orbit i:nth-child(3){right:22%;top:1%;font-size:9px;animation-delay:-2s}.portal-orbit i:nth-child(4){right:3%;top:35%;font-size:16px;animation-delay:-.7s}.portal-orbit i:nth-child(5){right:14%;bottom:0;font-size:11px;animation-delay:-1.5s}.portal-orbit i:nth-child(6){left:47%;bottom:-7%;font-size:9px;animation-delay:-2.3s}.portal-orbit i:nth-child(7){left:13%;bottom:5%;font-size:14px;animation-delay:-.9s}.portal-orbit i:nth-child(8){left:-1%;top:51%;font-size:10px;animation-delay:-1.8s}

    .portal-burst{position:fixed;inset:0;z-index:99999;pointer-events:none;display:grid;place-items:center;background:radial-gradient(circle at 50% 52%,color-mix(in srgb,var(--accent) 15%,white 6%),transparent 58%);opacity:0;transition:opacity .12s ease}
    .portal-burst.active{opacity:1;animation:burstFade .58s ease forwards}
    .portal-burst span{position:absolute;left:50%;top:50%;color:color-mix(in srgb,var(--accent) 75%,white);font-size:20px;text-shadow:0 0 14px currentColor;animation:burstStar .55s cubic-bezier(.2,.8,.2,1) forwards}
    .portal-burst span:nth-child(1){--x:-105px;--y:-72px}.portal-burst span:nth-child(2){--x:108px;--y:-64px}.portal-burst span:nth-child(3){--x:-124px;--y:34px}.portal-burst span:nth-child(4){--x:126px;--y:38px}.portal-burst span:nth-child(5){--x:-62px;--y:98px}.portal-burst span:nth-child(6){--x:64px;--y:104px}

    @keyframes titleSparkTwinkle{0%,100%{opacity:.38;transform:scale(.82)}50%{opacity:1;transform:scale(1.18)}}
    @keyframes portalBreath{0%,100%{transform:translateY(0) scale(1);filter:brightness(1)}50%{transform:translateY(-1px) scale(1.008);filter:brightness(1.08)}}
    @keyframes outerRunePulse{0%,100%{opacity:.35;transform:scale(.99)}50%{opacity:.9;transform:scale(1.015)}}
    @keyframes portalShimmer{0%,62%{transform:translateX(-125%)}82%,100%{transform:translateX(125%)}}
    @keyframes sigilFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
    @keyframes portalOrbit{to{transform:rotate(360deg)}}
    @keyframes orbitTwinkle{0%,100%{opacity:.3;transform:scale(.86)}50%{opacity:1;transform:scale(1.16)}}
    @keyframes burstStar{0%{transform:translate(-50%,-50%) scale(.4);opacity:0}18%{opacity:1}100%{transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(1.18);opacity:0}}
    @keyframes burstFade{0%{opacity:0}16%{opacity:1}100%{opacity:0}}

    @media(max-width:420px){.grand-portal-button{min-height:90px!important;padding:20px 26px!important}.grand-portal-button strong{font-size:22px!important}}
  `;
  document.head.appendChild(style);

  requestAnimationFrame(()=>{decoratePortal();decorateTitles();});
})();