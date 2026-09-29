(() => {
  let activeResolve=null;

  function ensurePrompt(){
    let dialog=document.getElementById('friendDossierPrompt');
    if(dialog)return dialog;

    const style=document.createElement('style');
    style.id='friendDossierPromptStyles';
    style.textContent=`
      .fd-prompt{border:0;padding:0;background:transparent;width:min(88vw,390px);max-width:390px;color:var(--text)}
      .fd-prompt::backdrop{background:rgba(7,5,12,.74);backdrop-filter:blur(8px)}
      .fd-prompt-card{position:relative;overflow:hidden;padding:22px 20px 18px;border-radius:26px;border:1px solid color-mix(in srgb,var(--accent) 30%,rgba(255,255,255,.09));background:radial-gradient(circle at 50% -18%,color-mix(in srgb,var(--accent) 16%,transparent),transparent 46%),color-mix(in srgb,var(--bg) 94%,#24182f 6%);box-shadow:0 26px 80px rgba(0,0,0,.52),inset 0 1px rgba(255,255,255,.06);text-align:center}
      .fd-prompt-card:before{content:'✦';position:absolute;left:16px;top:13px;color:color-mix(in srgb,var(--accent) 38%,transparent);font-size:10px}
      .fd-prompt-card:after{content:'✧';position:absolute;right:18px;bottom:14px;color:color-mix(in srgb,var(--accent) 30%,transparent);font-size:11px}
      .fd-prompt-icon{width:48px;height:48px;margin:0 auto 11px;border-radius:50%;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--accent) 30%,transparent);background:color-mix(in srgb,var(--accent) 8%,transparent);color:var(--accent);font-size:22px;text-shadow:0 0 12px color-mix(in srgb,var(--accent) 54%,transparent)}
      .fd-prompt.danger .fd-prompt-icon{color:#ff9daf;border-color:rgba(255,110,135,.24);background:rgba(120,25,45,.11);text-shadow:none}
      .fd-prompt-title{margin:0;font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:700;color:color-mix(in srgb,var(--accent) 56%,white 44%)}
      .fd-prompt.danger .fd-prompt-title{color:#ffd7df}
      .fd-prompt-message{margin:8px auto 0;max-width:310px;color:color-mix(in srgb,var(--text) 72%,transparent);font-size:12px;line-height:1.5;white-space:pre-line}
      .fd-prompt-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:18px}.fd-prompt-actions.single{grid-template-columns:1fr}
      .fd-prompt-actions button{min-height:44px;border-radius:14px;font-weight:800;font-size:12px}
      .fd-prompt-cancel{border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.035);color:color-mix(in srgb,var(--text) 70%,transparent)}
      .fd-prompt-confirm{border:1px solid color-mix(in srgb,var(--accent) 34%,transparent);background:color-mix(in srgb,var(--accent) 12%,transparent);color:color-mix(in srgb,var(--accent) 72%,white 28%)}
      .fd-prompt.danger .fd-prompt-confirm{border-color:rgba(255,115,140,.28);background:rgba(120,25,45,.16);color:#ffb4c2}
    `;
    document.head.appendChild(style);

    dialog=document.createElement('dialog');
    dialog.id='friendDossierPrompt';
    dialog.className='fd-prompt';
    dialog.innerHTML=`
      <div class="fd-prompt-card">
        <div class="fd-prompt-icon" id="fdPromptIcon">✦</div>
        <h2 class="fd-prompt-title" id="fdPromptTitle">Friend Dossier</h2>
        <p class="fd-prompt-message" id="fdPromptMessage"></p>
        <div class="fd-prompt-actions" id="fdPromptActions">
          <button type="button" class="fd-prompt-cancel" id="fdPromptCancel">Cancel</button>
          <button type="button" class="fd-prompt-confirm" id="fdPromptConfirm">Okay</button>
        </div>
      </div>`;
    document.body.appendChild(dialog);

    const finish=value=>{
      const resolve=activeResolve;
      activeResolve=null;
      try{if(dialog.open)dialog.close();}catch{}
      resolve?.(value);
    };
    dialog.querySelector('#fdPromptCancel').onclick=()=>finish(false);
    dialog.querySelector('#fdPromptConfirm').onclick=()=>finish(true);
    dialog.addEventListener('cancel',e=>{e.preventDefault();finish(false);});
    dialog.addEventListener('click',e=>{if(e.target===dialog)finish(false);});
    return dialog;
  }

  window.fdPrompt=function({
    title='Friend Dossier',
    message='',
    confirmLabel='Okay',
    cancelLabel='Cancel',
    icon='✦',
    danger=false,
    cancel=true
  }={}){
    const dialog=ensurePrompt();
    if(activeResolve){activeResolve(false);activeResolve=null;}
    dialog.classList.toggle('danger',Boolean(danger));
    dialog.querySelector('#fdPromptIcon').textContent=icon;
    dialog.querySelector('#fdPromptTitle').textContent=title;
    dialog.querySelector('#fdPromptMessage').textContent=message;
    dialog.querySelector('#fdPromptConfirm').textContent=confirmLabel;
    dialog.querySelector('#fdPromptCancel').textContent=cancelLabel;
    const actions=dialog.querySelector('#fdPromptActions');
    dialog.querySelector('#fdPromptCancel').hidden=!cancel;
    actions.classList.toggle('single',!cancel);
    return new Promise(resolve=>{
      activeResolve=resolve;
      try{dialog.showModal();}catch{dialog.setAttribute('open','');}
    });
  };

  window.fdAlert=(message,options={})=>window.fdPrompt({
    title:options.title||'Just a note',
    message,
    confirmLabel:options.confirmLabel||'Got it',
    icon:options.icon||'✦',
    danger:Boolean(options.danger),
    cancel:false
  });

  window.fdConfirm=(message,options={})=>window.fdPrompt({
    title:options.title||'Are you sure?',
    message,
    confirmLabel:options.confirmLabel||'Yes',
    cancelLabel:options.cancelLabel||'Cancel',
    icon:options.icon||'✦',
    danger:Boolean(options.danger),
    cancel:true
  });
})();