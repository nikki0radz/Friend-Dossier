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

  const previousShowChoice=showChoice;
  showChoice=function(){
    previousShowChoice();
    requestAnimationFrame(syncReadBackdrop);
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
    .border-sparkle-track{display:none!important}

    .grand-portal-button{
      box-shadow:0 0 6px color-mix(in srgb,var(--person-accent,var(--accent)) 12%,transparent),inset 0 0 12px color-mix(in srgb,var(--person-accent,var(--accent)) 5%,transparent)!important;
      animation:archiveGlow 3.2s ease-in-out infinite!important;
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

    @keyframes archiveGlow{
      0%,100%{border-color:color-mix(in srgb,var(--person-accent,var(--accent)) 42%,white 5%);box-shadow:0 0 5px color-mix(in srgb,var(--person-accent,var(--accent)) 10%,transparent),inset 0 0 10px color-mix(in srgb,var(--person-accent,var(--accent)) 4%,transparent)}
      50%{border-color:color-mix(in srgb,var(--person-accent,var(--accent)) 78%,white 12%);box-shadow:0 0 14px color-mix(in srgb,var(--person-accent,var(--accent)) 24%,transparent),0 0 24px color-mix(in srgb,var(--person-accent,var(--accent)) 10%,transparent),inset 0 0 18px color-mix(in srgb,var(--person-accent,var(--accent)) 9%,transparent)}
    }
    @media(prefers-reduced-motion:reduce){.border-sparkle-track i,.grand-portal-button{animation:none!important}}
  `;
  document.head.appendChild(style);
})();
