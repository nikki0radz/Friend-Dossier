(() => {
  showChoice=function(){
    $('readPanel')?.classList.add('hidden');
    $('addInfoPanel')?.classList.add('hidden');
    $('personHero')?.classList.remove('hidden');
    $('personBackBtn')?.classList.remove('hidden');
    $('personView')?.classList.remove('read-mode');
    const panel=$('personChoice');
    panel?.classList.remove('hidden');
    if(panel){
      const f=selected();
      panel.innerHTML=`
        <button id="readBtn" class="px-open-dossier" aria-label="Enter Archives">
          <span class="archive-sigil">✦</span>
          <strong>Enter Archives</strong>
          <small>Step into ${esc(f?.name||'their')} archive</small>
        </button>
        <div class="px-secondary-actions">
          <button id="landingAddInfo"><span>＋</span><strong>Add info</strong></button>
          <button id="landingEditPerson"><span>✎</span><strong>Edit person</strong></button>
        </div>`;
      $('readBtn').onclick=showRead;
      $('landingAddInfo').onclick=showAddInfo;
      $('landingEditPerson').onclick=()=>openFriendDialog(f);
    }
  };

  const style=document.createElement('style');
  style.id='personLandingActionsStyles';
  style.textContent=`
    .px-secondary-actions{width:min(88vw,520px);margin:10px auto 0;display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .px-secondary-actions button{min-height:48px;border-radius:15px;border:1px solid color-mix(in srgb,var(--accent) 24%,transparent);background:rgba(255,255,255,.035);color:#f5edf8;display:flex;align-items:center;justify-content:center;gap:7px;font-size:12px;font-weight:800;box-shadow:0 8px 20px rgba(0,0,0,.12)}
    .px-secondary-actions button span{font-size:16px;color:var(--accent);text-shadow:0 0 9px color-mix(in srgb,var(--accent) 55%,transparent)}
    #personChoice{display:flex;flex-direction:column;align-items:center;width:100%}
    @media(max-width:420px){.px-secondary-actions{gap:8px}.px-secondary-actions button{font-size:11px;min-height:46px}}

    .px-dossier .character-sections{gap:16px!important;padding-top:14px!important}
    .px-dossier .character-section{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--profile-frame) 24%,transparent)!important;border-radius:20px!important;padding:16px 16px 15px!important;background:radial-gradient(circle at 12% 0%,color-mix(in srgb,var(--profile-sparkle) 10%,transparent),transparent 34%),linear-gradient(145deg,color-mix(in srgb,var(--profile-frame) 7%,transparent),rgba(255,255,255,.018))!important;box-shadow:inset 0 1px rgba(255,255,255,.035),0 8px 26px rgba(0,0,0,.12)!important}
    .px-dossier .character-section:before,.px-dossier .character-section:after{position:absolute;color:var(--profile-sparkle);opacity:.42;font-size:10px;text-shadow:0 0 9px currentColor;pointer-events:none}
    .px-dossier .character-section:before{content:'✦';top:10px;left:11px}.px-dossier .character-section:after{content:'✧';bottom:9px;right:11px}
    .px-dossier .character-section-title{display:grid!important;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;margin:0 4px 13px!important;text-align:center!important}
    .px-dossier .character-section-title:before,.px-dossier .character-section-title:after{content:'';height:1px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--profile-heading) 55%,transparent))}
    .px-dossier .character-section-title:after{background:linear-gradient(90deg,color-mix(in srgb,var(--profile-heading) 55%,transparent),transparent)}
    .px-dossier .character-section-title strong{font-family:var(--px-font)!important;font-size:17px!important;font-weight:700!important;letter-spacing:.02em!important;text-transform:none!important;color:var(--profile-heading)!important;text-shadow:0 0 13px color-mix(in srgb,var(--profile-sparkle) 20%,transparent);white-space:nowrap}
    .px-dossier .character-section-title strong:after{content:'  ✦';font-size:.62em;vertical-align:middle;color:var(--profile-sparkle);opacity:.72}
    .px-dossier .character-section ul{margin:0!important;padding-left:22px!important;display:block!important}
    .px-dossier .character-section li{display:list-item!important;padding:4px 0!important;line-height:1.55!important;color:var(--profile-text)!important}
    .px-dossier .character-section li::marker{color:var(--profile-sparkle)!important;font-size:.75em!important}
    .px-dossier .entry-main{display:inline!important;font-weight:700!important;color:var(--profile-text)!important}
    .px-dossier .entry-detail{display:inline!important;margin-left:5px!important;margin-top:0!important;font-size:11px!important;color:color-mix(in srgb,var(--profile-text) 56%,transparent)!important;font-weight:500!important;white-space:normal}
    .px-dossier .character-divider b,.px-dossier .character-footer-ornament{color:var(--profile-sparkle)!important;text-shadow:0 0 11px color-mix(in srgb,var(--profile-sparkle) 55%,transparent)}
  `;
  document.head.appendChild(style);
})();

(() => {
  if(document.querySelector('script[data-final-polish]')) return;
  const s=document.createElement('script');
  s.src='final-polish.js?v=1.0.0';
  s.dataset.finalPolish='1';
  document.body.appendChild(s);
})();
