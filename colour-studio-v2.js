(() => {
  const RECENT_KEY='friendDossier.recentColours.v1';
  const PERSON_TARGETS=[
    ['friendFrameColour','Frame'],
    ['friendProfileBg','Background'],
    ['friendProfileText','Body text'],
    ['friendProfileHeading','Headings'],
    ['friendProfileSparkle','Sparkles']
  ];
  const GLOBAL_TARGETS=[
    ['bg','Main background'],
    ['accent','Accent'],
    ['text','Main text'],
    ['sparkle','Floating sparkles'],
    ['searchBg','Search box'],
    ['searchText','Search text'],
    ['searchPlaceholder','Search placeholder'],
    ['addBg','Add friend button'],
    ['addText','Add friend text'],
    ['gearBg','Settings button'],
    ['gearText','Settings icon'],
    ['nameText','Friend names']
  ];

  const personDraft={};
  const globalDraft={};
  const GLOBAL_FONT_MAP={
    classic:"Georgia, 'Times New Roman', serif",
    elegant:"'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    clean:"'Trebuchet MS', Arial, sans-serif",
    typewriter:"'Courier New', Courier, monospace",
    storybook:"Garamond, 'Times New Roman', serif",
    handwritten:"'Segoe Print', 'Comic Sans MS', cursive"
  };
  const GLOBAL_FONT_LABELS={
    classic:'Classic serif',elegant:'Elegant',clean:'Clean',typewriter:'Typewriter',storybook:'Storybook',handwritten:'Handwritten'
  };
  const opacityKey=id=>id+'Opacity';
  function rgba(hex,pct=100){
    const {r,g,b}=hexToRgb(hex);
    const a=Math.max(0,Math.min(100,Number(pct)||0))/100;
    return `rgba(${r},${g},${b},${a})`;
  }

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
        <label class="v2-opacity-row">Transparency <span data-v2-opacity-value>0%</span><input data-v2-opacity type="range" min="0" max="100" value="0"></label>
      </div>
      <div class="v2-recent-wrap"><div class="v2-recent-title">Recently used colours</div><div class="v2-recents"></div></div>
    </div>`;
  }

  function initialiseStudio(root,targets,draft,sourceValues,onPreview){
    if(!root) return;
    let active=targets[0][0];
    targets.forEach(([id])=>{
      draft[id]=normalHex(sourceValues[id]||'#ffffff');
      if(Object.prototype.hasOwnProperty.call(sourceValues,opacityKey(id))) draft[opacityKey(id)]=Math.max(0,Math.min(100,Number(sourceValues[opacityKey(id)])||0));
    });

    const propertyButtons=[...root.querySelectorAll('[data-v2-target]')];
    const label=root.querySelector('[data-v2-label]');
    const hex=root.querySelector('[data-v2-hex]');
    const hue=root.querySelector('[data-v2-hue]');
    const sat=root.querySelector('[data-v2-sat]');
    const val=root.querySelector('[data-v2-val]');
    const opacity=root.querySelector('[data-v2-opacity]');
    const opacityValue=root.querySelector('[data-v2-opacity-value]');

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
      const hasOpacity=Object.prototype.hasOwnProperty.call(draft,opacityKey(active));
      const opaque=hasOpacity?(draft[opacityKey(active)]??100):100;
      if(opacity){opacity.closest('.v2-opacity-row')?.classList.toggle('hidden-opacity',!hasOpacity);opacity.value=100-opaque;}
      if(opacityValue)opacityValue.textContent=`${100-opaque}%`;
      sliderVisuals(hsv.h,hsv.s,hsv.v);
      propertyButtons.forEach(b=>b.classList.toggle('active',b.dataset.v2Target===active));
      refreshDots();
      onPreview?.(draft,active);
    }
    function updateDraft(colour){draft[active]=normalHex(colour,draft[active]);refreshDots();onPreview?.(draft,active);}
    function fromSliders(){const h=Number(hue.value),s=Number(sat.value),v=Number(val.value),colour=hsvToHex(h,s,v);hex.value=colour;updateDraft(colour);sliderVisuals(h,s,v);}

    propertyButtons.forEach(b=>b.onclick=()=>{active=b.dataset.v2Target;syncPicker();});
    [hue,sat,val].forEach(el=>el.addEventListener('input',fromSliders));
    opacity?.addEventListener('input',()=>{
      const transparency=Number(opacity.value);
      draft[opacityKey(active)]=100-transparency;
      if(opacityValue)opacityValue.textContent=`${transparency}%`;
      onPreview?.(draft,active);
    });
    hex.addEventListener('input',()=>{if(/^#[0-9a-f]{6}$/i.test(hex.value)){updateDraft(hex.value);const {r,g,b}=hexToRgb(hex.value),hsv=rgbToHsv(r,g,b);hue.value=hsv.h;sat.value=hsv.s;val.value=hsv.v;sliderVisuals(hsv.h,hsv.s,hsv.v);}});
    hex.addEventListener('change',()=>{hex.value=normalHex(hex.value,draft[active]);syncPicker();});

    function renderRecents(){const box=root.querySelector('.v2-recents'),colours=recentColours();box.innerHTML=colours.length?colours.map(c=>`<button type="button" class="v2-recent" data-colour="${c}" style="background:${c}" aria-label="Preview ${c}"></button>`).join(''):'<span class="v2-recent-empty">Saved colours will appear here.</span>';box.querySelectorAll('.v2-recent').forEach(b=>b.onclick=()=>{updateDraft(b.dataset.colour);syncPicker();});}
    renderRecents(); syncPicker();
    root._v2Refresh=()=>{renderRecents();syncPicker();};
  }

  function personSource(friend){
    return {
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
    if(!holder){holder=document.createElement('div');holder.id='personColourStudioV2';const old=editor.querySelector('.colour-studio');old?.insertAdjacentElement('afterend',holder);if(!old)editor.prepend(holder);}
    // Rebuild the studio each time it opens so slider/input listeners cannot stack.
    holder.innerHTML=studioMarkup('person',PERSON_TARGETS);
    initialiseStudio(holder.querySelector('.v2-colour-studio'),PERSON_TARGETS,personDraft,personSource(friend),(draft,active)=>{
      const preview=holder.querySelector('[data-v2-preview]');
      preview.style.setProperty('--p-bg',draft.friendProfileBg);
      preview.style.setProperty('--p-text',draft.friendProfileText);
      preview.style.setProperty('--p-head',draft.friendProfileHeading);
      preview.style.setProperty('--p-frame',draft.friendFrameColour);
      preview.style.setProperty('--p-spark',draft.friendProfileSparkle);
      preview.querySelector('.v2-preview-orb').style.background=draft[active];
    });
  }

  function applyGlobalDraft(draft){
    const vars={
      '--bg':rgba(draft.bg,draft.bgOpacity??100),
      '--accent':rgba(draft.accent,draft.accentOpacity??100),
      '--text':rgba(draft.text,draft.textOpacity??100),
      '--home-sparkle':rgba(draft.sparkle,draft.sparkleOpacity??100),
      '--search-bg':rgba(draft.searchBg,draft.searchBgOpacity??100),
      '--search-text':rgba(draft.searchText,draft.searchTextOpacity??100),
      '--search-placeholder':rgba(draft.searchPlaceholder,draft.searchPlaceholderOpacity??100),
      '--add-bg':rgba(draft.addBg,draft.addBgOpacity??100),
      '--add-text':rgba(draft.addText,draft.addTextOpacity??100),
      '--gear-bg':rgba(draft.gearBg,draft.gearBgOpacity??100),
      '--gear-text':rgba(draft.gearText,draft.gearTextOpacity??100),
      '--name-text':rgba(draft.nameText,draft.nameTextOpacity??100),
      '--home-font':GLOBAL_FONT_MAP[draft.homeFont]||GLOBAL_FONT_MAP.clean
    };
    Object.entries(vars).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));

    if(draft.bg){
      const pageBg=rgba(draft.bg,draft.bgOpacity??100);
      document.documentElement.style.backgroundColor='#000000';
      document.body.style.backgroundColor=pageBg;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content',draft.bg);
    }
  }

  function closeGlobalStudio(commit=false){
    const holder=document.getElementById('globalColourStudioV2');
    if(!holder)return;
    if(commit){
      GLOBAL_TARGETS.forEach(([key])=>{
        if(globalDraft[key])settings[key]=globalDraft[key];
        if(globalDraft[opacityKey(key)]!==undefined) settings[opacityKey(key)]=globalDraft[opacityKey(key)];
      });
      settings.homeFont=globalDraft.homeFont||settings.homeFont||'clean';
      persistSettings();
      saveRecent(GLOBAL_TARGETS.map(([key])=>globalDraft[key]));
      renderHome();
      showToast('Home colours saved');
    }else{
      applySettings();
      document.documentElement.style.backgroundColor='#000000';
      document.body.style.backgroundColor=rgba(settings.bg,settings.bgOpacity??100);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content',settings.bg);
    }
    if(commit){
      document.documentElement.style.backgroundColor='#000000';
      document.body.style.backgroundColor=rgba(settings.bg,settings.bgOpacity??100);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content',settings.bg);
    }
    holder.classList.remove('show');
  }

  function mountGlobalStudio(){
    const dialog=document.getElementById('settingsDialog'),grid=dialog?.querySelector('.colour-grid');
    if(!dialog||!grid) return;
    grid.classList.add('v2-hidden-old-studio');
    let launch=dialog.querySelector('#openHomeColourStudio');
    if(!launch){
      launch=document.createElement('button');
      launch.id='openHomeColourStudio';
      launch.type='button';
      launch.className='soft-button full home-colour-launch';
      launch.textContent='🎨 Customize home screen colours';
      grid.insertAdjacentElement('afterend',launch);
    }
    launch.onclick=()=>{
      safeClose(dialog);
      let holder=document.getElementById('globalColourStudioV2');
      if(!holder){
        holder=document.createElement('div');
        holder.id='globalColourStudioV2';
        holder.className='floating-home-colour-studio';
        document.body.appendChild(holder);
      }
      holder.innerHTML=`
        <div class="floating-studio-head"><div><strong>Home screen colours</strong><small>Changes below are only a preview until you save.</small></div><button type="button" data-v2-close>×</button></div>
        ${studioMarkup('global',GLOBAL_TARGETS)}
        <div class="floating-studio-actions"><button type="button" class="soft-button" data-v2-cancel>Cancel</button><button type="button" class="primary-button" data-v2-save>Save colours</button></div>`;
      const studio=holder.querySelector('.v2-colour-studio');
      studio.querySelector('.v2-preview-wrap')?.remove();
      const source={};
      GLOBAL_TARGETS.forEach(([key])=>{
        source[key]=settings[key];
        source[opacityKey(key)]=settings[opacityKey(key)]??100;
      });
      globalDraft.homeFont=settings.homeFont||'clean';
      initialiseStudio(studio,GLOBAL_TARGETS,globalDraft,source,(draft)=>applyGlobalDraft(draft));

      const fontWrap=document.createElement('div');
      fontWrap.className='v2-home-font-picker';
      fontWrap.innerHTML=`<div class="v2-recent-title">Home font</div><div class="v2-font-options">${Object.keys(GLOBAL_FONT_MAP).map(key=>`<button type="button" class="v2-font-option" data-home-font="${key}" style="font-family:${GLOBAL_FONT_MAP[key]}"><span>Aa Mooncakes</span><small>${GLOBAL_FONT_LABELS[key]}</small></button>`).join('')}</div>`;
      studio.appendChild(fontWrap);
      const syncFontButtons=()=>fontWrap.querySelectorAll('[data-home-font]').forEach(btn=>btn.classList.toggle('active',btn.dataset.homeFont===globalDraft.homeFont));
      fontWrap.querySelectorAll('[data-home-font]').forEach(btn=>btn.onclick=()=>{globalDraft.homeFont=btn.dataset.homeFont;syncFontButtons();applyGlobalDraft(globalDraft);});
      syncFontButtons();
      holder.querySelector('[data-v2-close]').onclick=()=>closeGlobalStudio(false);
      holder.querySelector('[data-v2-cancel]').onclick=()=>closeGlobalStudio(false);
      holder.querySelector('[data-v2-save]').onclick=()=>closeGlobalStudio(true);
      holder.classList.add('show');
    };
  }

  const previousOpenFriendDialog=openFriendDialog;
  openFriendDialog=function(friend=null){
    previousOpenFriendDialog(friend);
    requestAnimationFrame(()=>mountPersonStudio(friend));
  };

  document.getElementById('settingsBtn')?.addEventListener('click',()=>requestAnimationFrame(mountGlobalStudio),true);
  requestAnimationFrame(mountGlobalStudio);

  // Commit drafts only when the actual Save buttons are pressed.
  document.getElementById('friendForm')?.querySelector('.primary-button')?.addEventListener('click',()=>{
    PERSON_TARGETS.forEach(([id])=>{const el=document.getElementById(id);if(el&&personDraft[id])el.value=personDraft[id];});
    saveRecent(PERSON_TARGETS.map(([id])=>personDraft[id]));
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
    .v2-opacity-row.hidden-opacity{display:none!important}
    .v2-recent-title{font-size:10px;opacity:.6;margin:11px 0 7px}.v2-recents{display:flex;flex-wrap:wrap;gap:7px}.v2-recent{width:25px;height:25px;border-radius:50%;border:1px solid rgba(255,255,255,.22);box-shadow:0 2px 7px rgba(0,0,0,.25)}.v2-recent-empty{font-size:10px;opacity:.45}
    .v2-home-font-picker{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.07)}
    .v2-font-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .v2-font-option{min-height:58px;border-radius:13px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.03);color:var(--text);padding:8px;text-align:left}
    .v2-font-option span{display:block;font-size:15px}.v2-font-option small{display:block;margin-top:3px;font:10px Inter,system-ui,sans-serif;opacity:.58}
    .v2-font-option.active{border-color:color-mix(in srgb,var(--accent) 62%,transparent);box-shadow:0 0 14px color-mix(in srgb,var(--accent) 14%,transparent)}
    .home-colour-launch{margin:4px 0 12px}
    .floating-home-colour-studio{position:fixed;z-index:100001;right:14px;bottom:max(14px,env(safe-area-inset-bottom));width:min(360px,calc(100vw - 28px));max-height:min(76vh,680px);overflow:auto;padding:14px;border-radius:22px;background:color-mix(in srgb,var(--bg) 94%,black 6%);border:1px solid color-mix(in srgb,var(--accent) 42%,transparent);box-shadow:0 22px 70px rgba(0,0,0,.56);backdrop-filter:blur(18px);transform:translateY(calc(100% + 40px));opacity:0;pointer-events:none;transition:.28s ease}
    .floating-home-colour-studio.show{transform:none;opacity:1;pointer-events:auto}
    .floating-studio-head{position:sticky;top:-14px;z-index:3;display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin:-14px -14px 10px;padding:14px;background:color-mix(in srgb,var(--bg) 96%,black 4%);border-bottom:1px solid rgba(255,255,255,.07)}
    .floating-studio-head strong{display:block;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:var(--text)}.floating-studio-head small{display:block;margin-top:3px;font-size:10px;color:var(--search-placeholder);line-height:1.35}.floating-studio-head button{width:34px;height:34px;border-radius:50%;border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);background:var(--bg);color:var(--accent);font-size:20px}
    .floating-home-colour-studio .v2-colour-studio{margin:0;padding:0;border:0;background:transparent}
    .floating-home-colour-studio .v2-colour-properties{grid-template-columns:repeat(2,minmax(0,1fr));max-height:190px;overflow:auto;padding-right:2px}
    .floating-home-colour-studio .v2-colour-property{color:var(--text);background:rgba(255,255,255,.035)}
    .floating-studio-actions{display:grid;grid-template-columns:1fr 1.3fr;gap:8px;margin-top:12px;position:sticky;bottom:-14px;padding:10px 0 14px;background:linear-gradient(transparent,color-mix(in srgb,var(--bg) 98%,black 2%) 24%)}
    .floating-studio-actions .primary-button{background:var(--accent)!important;color:var(--bg)!important}
    @media(max-width:420px){.v2-colour-properties{grid-template-columns:repeat(2,1fr)}.floating-home-colour-studio{left:10px;right:10px;width:auto;max-height:72vh}}
  `;
  document.head.appendChild(style);

})();
