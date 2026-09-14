(() => {
  const body=document.body;
  const personView=document.getElementById('personView');
  if(!personView) return;

  function syncReadBackdrop(){
    const on=personView.classList.contains('read-mode') && !document.getElementById('readPanel')?.classList.contains('hidden');
    body.classList.toggle('dossier-reading',on);
    document.getElementById('app')?.classList.toggle('dossier-reading',on);
  }

  const observer=new MutationObserver(syncReadBackdrop);
  observer.observe(personView,{attributes:true,subtree:true,attributeFilter:['class']});
  syncReadBackdrop();

  function addBorderSparkles(){
    const btn=document.getElementById('readBtn');
    if(!btn) return;
    btn.querySelector('.portal-orbit')?.remove();
    if(btn.querySelector('.border-sparkle-track')) return;
    const track=document.createElement('span');
    track.className='border-sparkle-track';
    track.setAttribute('aria-hidden','true');
    const glyphs=['✦','✧','⋆','✶','✦','✧','⋆','✦'];
    track.innerHTML=glyphs.map((g,i)=>`<i style="--i:${i};--d:${i*-.92}s">${g}</i>`).join('');
    btn.appendChild(track);
  }

  const previousShowChoice=showChoice;
  showChoice=function(){
    previousShowChoice();
    requestAnimationFrame(()=>{addBorderSparkles();syncReadBackdrop();});
  };

  const previousShowRead=showRead;
  showRead=function(){
    previousShowRead();
    requestAnimationFrame(syncReadBackdrop);
  };

  document.addEventListener('click',e=>{
    if(e.target.closest?.('#backToChoices,#personBackBtn')) requestAnimationFrame(syncReadBackdrop);
  },true);

  const style=document.createElement('style');
  style.id='finalPolishStyles';
  style.textContent=`
    /* Keep the dossier itself themed, but make the world behind it pure black. */
    body.dossier-reading,
    body.dossier-reading #app,
    body.dossier-reading #app main,
    body.dossier-reading #personView,
    body.dossier-reading #readPanel{
      background:#000!important;
      background-color:#000!important;
    }
    body.dossier-reading .grimoire-ambience{display:none!important}
    body.dossier-reading #personView.read-mode{box-shadow:none!important}

    /* Restore the person's chosen dossier background instead of blacking the dossier itself out. */
    body.dossier-reading .px-dossier{
      background:
        radial-gradient(circle at 50% 4%,color-mix(in srgb,var(--profile-frame) 10%,transparent),transparent 30%),
        radial-gradient(circle at 14% 42%,color-mix(in srgb,var(--profile-sparkle) 5%,transparent),transparent 28%),
        var(--profile-bg)!important;
    }

    /* No editing controls inside the sacred page. */
    .px-dossier .px-dossier-tools{display:none!important}

    /* Replace the rigid rotating ring with individual lights chasing the rounded border. */
    .grand-portal-button .portal-orbit{display:none!important}
    .grand-portal-button{overflow:visible!important}
    .border-sparkle-track{position:absolute;inset:0;pointer-events:none;z-index:5;overflow:visible}
    .border-sparkle-track i{
      position:absolute;
      left:0;
      top:0;
      font-style:normal;
      color:color-mix(in srgb,var(--accent) 76%,white 24%);
      text-shadow:0 0 7px currentColor,0 0 16px currentColor,0 0 28px color-mix(in srgb,var(--accent) 60%,transparent);
      font-size:12px;
      offset-path:inset(-8px round 30px);
      offset-rotate:0deg;
      animation:borderChase 7.4s linear infinite;
      animation-delay:var(--d);
      opacity:.95;
      filter:drop-shadow(0 0 5px currentColor);
    }
    .border-sparkle-track i:nth-child(2n){font-size:9px;opacity:.72}
    .border-sparkle-track i:nth-child(3n){font-size:14px;opacity:1}
    .border-sparkle-track i:nth-child(4n){font-size:10px}

    .grand-portal-button{
      box-shadow:
        0 0 0 1px color-mix(in srgb,var(--accent) 24%,transparent),
        0 0 22px color-mix(in srgb,var(--accent) 30%,transparent),
        0 0 52px color-mix(in srgb,var(--accent) 18%,transparent),
        inset 0 0 24px color-mix(in srgb,var(--accent) 8%,transparent)!important;
      animation:archiveGlow 3.1s ease-in-out infinite!important;
    }
    .grand-portal-button strong{
      display:block!important;
      width:100%!important;
      text-align:center!important;
      margin:0!important;
      line-height:1.1!important;
    }
    .grand-portal-button small{
      width:100%!important;
      text-align:center!important;
    }

    @keyframes borderChase{
      from{offset-distance:0%}
      to{offset-distance:100%}
    }
    @keyframes archiveGlow{
      0%,100%{filter:brightness(1);transform:translateY(0);box-shadow:0 0 16px color-mix(in srgb,var(--accent) 20%,transparent),0 0 38px color-mix(in srgb,var(--accent) 12%,transparent),inset 0 0 22px color-mix(in srgb,var(--accent) 7%,transparent)}
      50%{filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 0 28px color-mix(in srgb,var(--accent) 38%,transparent),0 0 70px color-mix(in srgb,var(--accent) 24%,transparent),inset 0 0 32px color-mix(in srgb,var(--accent) 12%,transparent)}
    }
    @media(prefers-reduced-motion:reduce){.border-sparkle-track i,.grand-portal-button{animation:none!important}}
  `;
  document.head.appendChild(style);
  requestAnimationFrame(addBorderSparkles);
})();
