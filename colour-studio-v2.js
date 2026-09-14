(() => {
  const RECENT_KEY='friendDossier.recentColours.v1';
  const PERSON_TARGETS=[
    ['friendBubbleColour','Bubble'],
    ['friendFrameColour','Frame'],
    ['friendProfileBg','Background'],
    ['friendProfileText','Body text'],
    ['friendProfileHeading','Headings'],
    ['friendProfileSparkle','Sparkles']
  ];
  const GLOBAL_TARGETS=[
    ['bgColour','Background'],
    ['accentColour','Accent'],
    ['bubbleColour','Bubble tint']
  ];

  const personDraft={};
  const globalDraft={};

  function normalHex(v,fallback='#ffffff'){
    const s=String(v||'').trim();
    if(/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
    if(/^#[0-9a-f]{3}$/i.test(s)) return '#'+s.slice(1).split('').map(x=>x+x).join('').toLowerCase();
    return fallback;
  }
  function hexToRgb(hex){hex=normalHex(hex);return{r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16)};}
  function rgbToHex(r,g,b){return '#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');}
  function rgbToHsv(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0;if(d){if(max===r)h=60*(((g-b)/d)%6);else if(max===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4);}if(h<0)h+=360;return{h:Math.round(h),s:Math.round(max?d/max*100:0),v:Math.round(max*100)};}
  function hsvToHex(h,s,v){s/=100;v/=100;const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;let r=0,g=0,b=0;if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}return rgbToHex((r+m)*255,(g+m)*255,(b+m)*255);}
  function recentColours(){try{const a=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');return Array.isArray(a)?a.map(c=>normalHex(c)).slice(0,14):[];}catch{return [];}}
  function saveRecent(colours){
    let list=recentColours();
    colours.filter(Boolean).map(c=>normalHex(c)).forEach(c=>{list=[c,...list.filter(x=>x!==c)];});
    localStorage.setItem(RECENT_KEY,JSON.stringify(list.slice(0,14)));
  }

  function studioMarkup(prefix,targets){
    return `<div class="v2-colour-studio" data-studio="${prefix}">
      <div class="v2-colour-properties">${targets.map(([id,label])=>`<button type="button" class="v2-colour-property" data-v2-target="${id}"><span class="v2-colour-dot"></span><b>${label}</b></button>`).join('')}</div>
      <div class="v2-preview-wrap">
        <div class="v2-preview" data-v2-preview>
          <span class="v2-preview-orb"></span>
          <div><strong>Preview</strong><small>Nothing saves until you press Save</small></div>
        </div>
      </div>
      <div class="v2-colour-editor">
        <div class="v2-editor-head"><strong data-v2-label>Colour</strong><input data-v2-hex maxlength="7" spellcheck="false" value="#ffffff"></div>
        <label>Hue <span data-v2-hue-value>0°</span><input data-v2-hue type="range" min="0" max="359" value="0"></label>
        <label>Saturation <span data-v2-sat-value>100%</span><input data-v2-sat type="range" min="0" max="100" value="100"></label>
        <label>Brightness <span data-v2-val-value>100%</span><input data-v2-val type="range" min="0" max="100" value="100"></label>
      </div>
      <div class="v2-recent-wrap"><div class="v2-recent-title">Recently used colours</div><div class="v2-recents"></div></div>
    </div>`;
  }

  function initialiseStudio(root,targets,draft,sourceValues,onPreview){
    if(!root) return;
    let active=targets[0][0];
    targets.forEach(([id])=>draft[id]=normalHex(sourceValues[id]||'#ffffff'));

    const propertyButtons=[...root.querySelectorAll('[data-v2-target]')];
    const label=root.querySelector('[data-v2-label]');
    const hex=root.querySelector('[data-v2-hex]');
    const hue=root.querySelector('[data-v2-hue]');
    const sat=root.querySelector('[data-v2-sat]');
    const val=root.querySelector('[data-v2-val]');

    function targetLabel(id){return targets.find(x=>x[0]===id)?.[1]||'Colour';}
    function refreshDots(){propertyButtons.forEach(b=>{const dot=b.querySelector('.v2-colour-dot');if(dot)dot.style.background=draft[b.dataset.v2Target]||'#fff';});}
    function sliderVisuals(h,s,v){
      root.querySelector('[data-v2-hue-value]').textContent=`${h}°`;
      root.querySelector('[data-v2-sat-value]').textContent=`${s}%`;
      root.querySelector('[data-v2-val-value]').textContent=`${v}%`;
      hue.style.background='linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)';
      const pure=hsvToHex(h,100,100),satColour=hsvToHex(h,s,100);
      sat.style.background=`linear-gradient(90deg,#fff,${pure})`;
      val.style.background=`linear-gradient(90deg,#000,${satColour})`;
    }
    function syncPicker(){
      const colour=normalHex(draft[active]);
      const {r,g,b}=hexToRgb(colour),hsv=rgbToHsv(r,g,b);
      label.textContent=targetLabel(active); hex.value=colour; hue.value=hsv.h; sat.value=hsv.s; val.value=hsv.v;
      sliderVisuals(hsv.h,hsv.s,hsv.v);
      propertyButtons.forEach(b=>b.classList.toggle('active',b.dataset.v2Target===active));
      refreshDots();
      onPreview?.(draft,active);
    }
    function updateDraft(colour){draft[active]=normalHex(colour,draft[active]);refreshDots();onPreview?.(draft,active);}
    function fromSliders(){const h=Number(hue.value),s=Number(sat.value),v=Number(val.value),colour=hsvToHex(h,s,v);hex.value=colour;updateDraft(colour);sliderVisuals(h,s,v);}

    propertyButtons.forEach(b=>b.onclick=()=>{active=b.dataset.v2Target;syncPicker();});
    [hue,sat,val].forEach(el=>el.addEventListener('input',fromSliders));
    hex.addEventListener('input',()=>{if(/^#[0-9a-f]{6}$/i.test(hex.value)){updateDraft(hex.value);const {r,g,b}=hexToRgb(hex.value),hsv=rgbToHsv(r,g,b);hue.value=hsv.h;sat.value=hsv.s;val.value=hsv.v;sliderVisuals(hsv.h,hsv.s,hsv.v);}});
    hex.addEventListener('change',()=>{hex.value=normalHex(hex.value,draft[active]);syncPicker();});

    function renderRecents(){const box=root.querySelector('.v2-recents'),colours=recentColours();box.innerHTML=colours.length?colours.map(c=>`<button type="button" class="v2-recent" data-colour="${c}" style="background:${c}" aria-label="Preview ${c}"></button>`).join(''):'<span class="v2-recent-empty">Saved colours will appear here.</span>';box.querySelectorAll('.v2-recent').forEach(b=>b.onclick=()=>{updateDraft(b.dataset.colour);syncPicker();});}
    renderRecents(); syncPicker();
    root._v2Refresh=()=>{renderRecents();syncPicker();};
  }

  function personSource(friend){
    return {
      friendBubbleColour: friend?.bubbleColor||settings.bubble,
      friendFrameColour: friend?.frameColor||settings.accent,
      friendProfileBg: friend?.profileBg||'#1b1326',
      friendProfileText: friend?.profileText||'#f4edf7',
      friendProfileHeading: friend?.profileHeading||friend?.frameColor||'#f6d5ff',
      friendProfileSparkle: friend?.profileSparkle||friend?.frameColor||settings.accent
    };
  }

  function mountPersonStudio(friend){
    const editor=document.getElementById('profileThemeEditor');
    if(!editor) return;
    editor.querySelector('.colour-studio')?.classList.add('v2-hidden-old-studio');
    let holder=editor.querySelector('#personColourStudioV2');
    if(!holder){holder=document.createElement('div');holder.id='personColourStudioV2';holder.innerHTML=studioMarkup('person',PERSON_TARGETS);const old=editor.querySelector('.colour-studio');old?.insertAdjacentElement('afterend',holder);if(!old)editor.prepend(holder);}
    initialiseStudio(holder.querySelector('.v2-colour-studio'),PERSON_TARGETS,personDraft,personSource(friend),(draft,active)=>{
      const preview=holder.querySelector('[data-v2-preview]');
      preview.style.setProperty('--p-bg',draft.friendProfileBg);
      preview.style.setProperty('--p-text',draft.friendProfileText);
      preview.style.setProperty('--p-head',draft.friendProfileHeading);
      preview.style.setProperty('--p-frame',draft.friendFrameColour);
      preview.style.setProperty('--p-bubble',draft.friendBubbleColour);
      preview.style.setProperty('--p-spark',draft.friendProfileSparkle);
      preview.querySelector('.v2-preview-orb').style.background=draft[active];
    });
  }

  function mountGlobalStudio(){
    const dialog=document.getElementById('settingsDialog'),grid=dialog?.querySelector('.colour-grid');
    if(!dialog||!grid) return;
    grid.classList.add('v2-hidden-old-studio');
    let holder=dialog.querySelector('#globalColourStudioV2');
    if(!holder){holder=document.createElement('div');holder.id='globalColourStudioV2';holder.innerHTML=studioMarkup('global',GLOBAL_TARGETS);grid.insertAdjacentElement('afterend',holder);}
    const source={bgColour:settings.bg,accentColour:settings.accent,bubbleColour:settings.bubble};
    initialiseStudio(holder.querySelector('.v2-colour-studio'),GLOBAL_TARGETS,globalDraft,source,(draft,active)=>{
      const preview=holder.querySelector('[data-v2-preview]');
      preview.style.setProperty('--p-bg',draft.bgColour);
      preview.style.setProperty('--p-text','#f4edf7');
      preview.style.setProperty('--p-head',draft.accentColour);
      preview.style.setProperty('--p-frame',draft.accentColour);
      preview.style.setProperty('--p-bubble',draft.bubbleColour);
      preview.style.setProperty('--p-spark',draft.accentColour);
      preview.querySelector('.v2-preview-orb').style.background=draft[active];
    });
  }

  const previousOpenFriendDialog=openFriendDialog;
  openFriendDialog=function(friend=null){
    previousOpenFriendDialog(friend);
    requestAnimationFrame(()=>mountPersonStudio(friend));
  };

  document.getElementById('settingsBtn')?.addEventListener('click',()=>requestAnimationFrame(mountGlobalStudio),true);

  // Commit drafts only when the actual Save buttons are pressed.
  document.getElementById('friendForm')?.querySelector('.primary-button')?.addEventListener('click',()=>{
    PERSON_TARGETS.forEach(([id])=>{const el=document.getElementById(id);if(el&&personDraft[id])el.value=personDraft[id];});
    saveRecent(PERSON_TARGETS.map(([id])=>personDraft[id]));
  },true);

  document.getElementById('saveSettingsBtn')?.addEventListener('click',()=>{
    GLOBAL_TARGETS.forEach(([id])=>{const el=document.getElementById(id);if(el&&globalDraft[id])el.value=globalDraft[id];});
    saveRecent(GLOBAL_TARGETS.map(([id])=>globalDraft[id]));
  },true);

  const style=document.createElement('style');
  style.id='colourStudioV2Styles';
  style.textContent=`
    .v2-hidden-old-studio{display:none!important}
    .v2-colour-studio{margin:12px 0 18px;padding:14px;border:1px solid rgba(255,255,255,.1);border-radius:18px;background:rgba(255,255,255,.025)}
    .v2-colour-properties{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
    .v2-colour-property{border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.025);color:inherit;border-radius:12px;padding:8px 6px;display:flex;align-items:center;justify-content:flex-start;gap:7px;min-width:0}
    .v2-colour-property.active{border-color:color-mix(in srgb,var(--accent) 58%,transparent);background:color-mix(in srgb,var(--accent) 10%,transparent);box-shadow:0 0 14px color-mix(in srgb,var(--accent) 10%,transparent)}
    .v2-colour-property b{font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .v2-colour-dot{width:18px;height:18px;border-radius:50%;border:1px solid rgba(255,255,255,.28);box-shadow:0 0 9px rgba(0,0,0,.3);flex:0 0 auto}
    .v2-preview-wrap{margin:9px 0 13px}
    .v2-preview{min-height:76px;border-radius:16px;padding:12px 14px;display:flex;align-items:center;gap:12px;background:radial-gradient(circle at 18% 15%,color-mix(in srgb,var(--p-spark) 14%,transparent),transparent 36%),var(--p-bg);border:1px solid color-mix(in srgb,var(--p-frame) 42%,transparent);box-shadow:inset 0 0 24px color-mix(in srgb,var(--p-spark) 5%,transparent);color:var(--p-text);transition:background .15s,border-color .15s}
    .v2-preview-orb{width:46px;height:46px;border-radius:50%;box-shadow:0 0 0 4px color-mix(in srgb,var(--p-frame) 18%,transparent),0 0 20px color-mix(in srgb,var(--p-spark) 30%,transparent);flex:0 0 auto}
    .v2-preview strong{display:block;font-family:Georgia,'Times New Roman',serif;color:var(--p-head);font-size:16px}.v2-preview small{display:block;margin-top:4px;opacity:.58;font-size:10px}
    .v2-colour-editor{padding:12px;border-radius:14px;background:rgba(0,0,0,.14);border:1px solid rgba(255,255,255,.055)}
    .v2-editor-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px}.v2-editor-head strong{font-size:12px}.v2-editor-head input{width:92px!important;padding:6px 7px!important;font-family:'Courier New',monospace;text-align:center;text-transform:lowercase}
    .v2-colour-editor label{display:grid;grid-template-columns:1fr auto;gap:6px;font-size:10px;margin:10px 0}.v2-colour-editor label input{grid-column:1/-1;width:100%;height:6px;padding:0!important;border:0!important;border-radius:999px;appearance:none}.v2-colour-editor input[type=range]::-webkit-slider-thumb{appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;border:2px solid rgba(0,0,0,.45);box-shadow:0 2px 8px rgba(0,0,0,.35)}
    .v2-recent-title{font-size:10px;opacity:.6;margin:11px 0 7px}.v2-recents{display:flex;flex-wrap:wrap;gap:7px}.v2-recent{width:25px;height:25px;border-radius:50%;border:1px solid rgba(255,255,255,.22);box-shadow:0 2px 7px rgba(0,0,0,.25)}.v2-recent-empty{font-size:10px;opacity:.45}
    @media(max-width:420px){.v2-colour-properties{grid-template-columns:repeat(2,1fr)}}
  `;
  document.head.appendChild(style);

  requestAnimationFrame(mountGlobalStudio);
})();
