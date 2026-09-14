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
        <button id="readBtn" class="px-open-dossier">
          <span>✦</span>
          <strong>Open dossier</strong>
          <small>Enter ${esc(f?.name||'their')} archive</small>
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
  `;
  document.head.appendChild(style);
})();