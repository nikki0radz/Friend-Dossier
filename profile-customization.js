(() => {
  const FONT_MAP = {
    default:'',
    classic:"'Libre Baskerville', Georgia, serif",
    elegant:"'Dancing Script', cursive",
    clean:"'Nunito Sans', Arial, sans-serif",
    typewriter:"'Special Elite', 'Courier New', monospace",
    storybook:"'UnifrakturCook', 'Old English Text MT', cursive",
    handwritten:"'Caveat', cursive"
  };
  const FONT_LABELS = {
    default:'Default',
    classic:'Classic serif',
    elegant:'Script handwriting',
    clean:'Clean',
    typewriter:'Typewriter',
    storybook:'Gothic',
    handwritten:'Handwritten'
  };
  const RECENT_KEY='friendDossier.recentColours.v1';
  const COLOUR_TARGETS=[
['friendFrameColour','Frame'],['friendProfileBg','Background'],['friendProfileText','Body text'],['friendProfileHeading','Headings'],['friendProfileSparkle','Sparkles']
  ];
  const SPARKLE_OPTIONS=[
    '✦','✧','⋆','★','☆','✶','✷','✸','✹','✺','✵','✴','✳','✲','✱','※',
    '⟡','◇','◆','◈','♢','♦','⬥','⬦','⬧','❖',
    '♡','♥','❤','❣','❥','❦','❧','ღ',
    '♠','♤','♣','♧',
    '○','●','◌','◎','◉',
    '☾','☽',
    '❀','✿','❁'
  ];
  const DEFAULT_SPARKLES=['✦','✧','⋆','✶','☾','⟡'];
  const CUSTOM_SPARKLE_KEY='friendDossier.customSparkles.v1';
  let sparkleDrawingStrokes=[];
  let activeSparkleStroke=null;
  let activeColourTarget='friendProfileBg';
  let sparkleLayoutDrafts={};
  let activeSparkleLayoutDensity='constellation';
  let sparkleLayoutWorking=null;

  function readCustomSparkles(){
    try{
      const parsed=JSON.parse(localStorage.getItem(CUSTOM_SPARKLE_KEY)||'[]');
      if(!Array.isArray(parsed))return[];
      return parsed.map(x=>{
        if(!x||typeof x.id!=='string')return null;
        if(!x.type&&Array.isArray(x.strokes))return{...x,type:'draw'};
        if(x.type==='draw'&&Array.isArray(x.strokes))return x;
        if(x.type==='emoji'&&typeof x.value==='string'&&x.value.trim())return x;
        if(x.type==='png'&&typeof x.data==='string'&&x.data.startsWith('data:image/'))return x;
        return null;
      }).filter(Boolean).slice(0,24);
    }catch{return [];}
  }
  function writeCustomSparkles(items){
    try{localStorage.setItem(CUSTOM_SPARKLE_KEY,JSON.stringify((items||[]).slice(0,24)));return true;}catch{return false;}
  }
  function customSparkleById(id){return readCustomSparkles().find(x=>x.id===id)||null;}
  function sparkleVectorSvg(strokes,cls='custom-sparkle-svg'){
    const lines=(Array.isArray(strokes)?strokes:[]).map(stroke=>{
      const pts=(Array.isArray(stroke)?stroke:[]).map(p=>Array.isArray(p)?`${Number(p[0]).toFixed(1)},${Number(p[1]).toFixed(1)}`:'').filter(Boolean).join(' ');
      return pts?`<polyline points="${pts}"></polyline>`:'';
    }).join('');
    return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${lines}</svg>`;
  }
  function sparkleChoiceMarkup(icon){
    if(String(icon).startsWith('custom:')){
      const custom=customSparkleById(icon);
      if(!custom)return'✦';
      if(custom.type==='emoji')return`<span class="custom-sparkle-emoji">${esc(custom.value)}</span>`;
      if(custom.type==='png')return`<img class="custom-sparkle-image" src="${esc(custom.data)}" alt="">`;
      return sparkleVectorSvg(custom.strokes);
    }
    return esc(icon);
  }
  function allSparkleChoices(){
    return [...SPARKLE_OPTIONS,...readCustomSparkles().map(x=>x.id)];
  }
  function sparkleOptionsMarkup(){
    const tiles=allSparkleChoices().map(icon=>`<label class="profile-sparkle-icon${String(icon).startsWith('custom:')?' custom-sparkle-tile':''}"><input type="checkbox" value="${esc(icon)}"><span>${sparkleChoiceMarkup(icon)}</span></label>`).join('');
    return tiles+`<button type="button" class="profile-sparkle-add" id="addCustomSparkle"><span>＋</span><small>Add sparkle</small></button>`;
  }
  function readStoredFriends(){
    try{const parsed=JSON.parse(localStorage.getItem(DATA_KEY)||'[]');return Array.isArray(parsed)?parsed:(Array.isArray(parsed?.friends)?parsed.friends:[]);}catch{return [];}
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
  function addRecentColour(hex){hex=normalHex(hex);const next=[hex,...recentColours().filter(c=>c!==hex)].slice(0,14);localStorage.setItem(RECENT_KEY,JSON.stringify(next));renderRecentColours();}

  function hydrateProfileThemes(){
    const stored=new Map(readStoredFriends().map(f=>[f.id,f]));
    state.friends.forEach(friend=>{
      const saved=stored.get(friend.id)||{};
      friend.profileBg=saved.profileBg||friend.profileBg||'#1b1326';
      friend.profileText=saved.profileText||friend.profileText||'#f4edf7';
      friend.profileHeading=saved.profileHeading||friend.profileHeading||friend.frameColor||'#f6d5ff';
      friend.profileSparkle=saved.profileSparkle||friend.profileSparkle||friend.frameColor||settings.accent;
      friend.profileFont=saved.profileFont||friend.profileFont||'default';
    });
  }

  function cleanEntryDialog(){
    const row=document.querySelector('.emoji-value-row');
    if(row && !$('entryTitle')?.closest('.entry-title-only')){
      const titleValue=$('entryTitle')?.value||'';
      row.innerHTML=`<input id="entryEmoji" type="hidden" value=""><label class="grow entry-title-only">Title<input id="entryTitle" maxlength="80" value="${esc(titleValue)}"></label>`;
    }
    const infoLabel=$('entryValueLabel');
    if(infoLabel && !infoLabel.querySelector('.entry-info-label')){
      const value=$('entryValue')?.value||'';
      infoLabel.innerHTML=`<span class="entry-info-label">Info <small>secondary detail shown in grey brackets</small></span><textarea id="entryValue" rows="3" maxlength="800">${esc(value)}</textarea>`;
    }
  }

  function ensureProfileThemeEditor(){
    const form=$('friendForm'),styleEditor=$('personStyleEditor'),saveBtn=form?.querySelector('.primary-button');
    if(!form||!saveBtn) return;
    styleEditor?.querySelector('.person-colours')?.classList.add('native-colours-hidden');
    ['friendFrameColour'].forEach(id=>{const el=$(id);if(el){el.tabIndex=-1;el.setAttribute('aria-hidden','true');}});
    if($('profileThemeEditor')) return;
    const box=document.createElement('div');box.id='profileThemeEditor';box.className='profile-theme-editor';
    box.innerHTML=`
      <div class="profile-theme-heading"><strong>Character profile</strong><small>Make every detail theirs</small></div>
      <input id="friendProfileBg" type="hidden"><input id="friendProfileText" type="hidden"><input id="friendProfileHeading" type="hidden"><input id="friendProfileSparkle" type="hidden">
      <div class="colour-studio">
        <div class="colour-property-grid">${COLOUR_TARGETS.map(([id,label])=>`<button type="button" class="colour-property" data-colour-target="${id}"><span class="colour-dot"></span><b>${label}</b></button>`).join('')}</div>
        <div class="colour-editor">
          <div class="colour-editor-head"><strong id="activeColourLabel">Background</strong><input id="colourHex" maxlength="7" spellcheck="false" value="#ffffff"></div>
          <label>Hue <span id="hueValue">0°</span><input id="colourHue" type="range" min="0" max="359" value="0"></label>
          <label>Saturation <span id="satValue">100%</span><input id="colourSat" class="reverse-range" type="range" min="0" max="100" value="100"></label>
          <label>Brightness <span id="valValue">100%</span><input id="colourVal" class="reverse-range" type="range" min="0" max="100" value="100"></label>
        </div>
        <div class="recent-colours-wrap"><div class="recent-colours-title">Recently used colours</div><div id="recentColours" class="recent-colours"></div></div>
      </div>
      <div class="font-picker-wrap"><div class="font-picker-title">Font</div><div id="fontOptions" class="font-options">${Object.keys(FONT_MAP).map(key=>`<button type="button" class="font-option" data-font="${key}" style="font-family:${FONT_MAP[key]}"><span>Aa Mooncakes</span><small>${FONT_LABELS[key]}</small></button>`).join('')}</div><input id="friendProfileFont" type="hidden" value="default"></div>
      <div class="profile-text-size-wrap"><div class="font-picker-title">Text size <span id="friendProfileTextScaleValue">100%</span></div><input id="friendProfileTextScale" type="range" min="80" max="200" step="5" value="100"></div>
      <div class="profile-sparkle-picker">
        <div class="profile-theme-heading"><strong>Sparkle constellation</strong><small>Choose their symbols</small></div>
        <div id="profileSparkleIcons" class="profile-sparkle-icons">${sparkleOptionsMarkup()}</div>
        <div class="sparkle-density-title">Sparkle mood</div>
        <div id="profileSparkleDensity" class="sparkle-density-options">
          <button type="button" data-density="whisper"><b>Whisper</b><small>A delicate dusting</small></button>
          <button type="button" data-density="constellation"><b>Constellation</b><small>Balanced & twinkly</small></button>
          <button type="button" data-density="starfall"><b>Starfall</b><small>Maximum celestial drama</small></button>
        </div>
        <input id="friendProfileSparkleDensity" type="hidden" value="constellation">
      </div>`;
    if(styleEditor) styleEditor.insertAdjacentElement('afterend',box); else form.insertBefore(box,saveBtn);
    box.querySelectorAll('.colour-property').forEach(btn=>btn.onclick=()=>selectColourTarget(btn.dataset.colourTarget));
    ['colourHue','colourSat','colourVal'].forEach(id=>$(id)?.addEventListener('input',updateColourFromHSV));
    ['colourHue','colourSat','colourVal'].forEach(id=>$(id)?.addEventListener('change',()=>addRecentColour($(activeColourTarget)?.value)));
    $('colourHex')?.addEventListener('change',()=>{const hex=normalHex($('colourHex').value,$(activeColourTarget)?.value||'#ffffff');setTargetColour(activeColourTarget,hex,true);addRecentColour(hex);});
    box.querySelectorAll('.font-option').forEach(btn=>btn.onclick=()=>selectFont(btn.dataset.font));
    $('friendProfileTextScale')?.addEventListener('input',syncTextScaleSlider);
    box.querySelectorAll('#profileSparkleDensity [data-density]').forEach(btn=>btn.onclick=()=>selectSparkleDensity(btn.dataset.density,true));
    bindSparklePicker(box);
    renderRecentColours();
  }

  function bindSparklePicker(root=document){
    root.querySelectorAll('#profileSparkleIcons input').forEach(input=>input.addEventListener('change',()=>{
      input.closest('.profile-sparkle-icon')?.classList.toggle('selected',input.checked);
    }));
    root.querySelector('#addCustomSparkle')?.addEventListener('click',openSparkleDrawer);
  }
  function refreshSparklePicker(extraSelected=[]){
    const grid=$('profileSparkleIcons'); if(!grid)return;
    const selected=new Set([...selectedSparkleIcons(),...extraSelected]);
    grid.innerHTML=sparkleOptionsMarkup();
    bindSparklePicker(document);
    setSparkleIcons([...selected]);
  }
  function ensureSparkleDrawer(){
    let modal=$('sparkleDrawModal');
    if(modal)return modal;
    modal=document.createElement('dialog');
    modal.id='sparkleDrawModal';
    modal.className='sparkle-draw-modal';
    modal.innerHTML=`
      <section class="sparkle-draw-sheet" role="dialog" aria-modal="true" aria-label="Add your own sparkle">
        <div class="sparkle-draw-head"><button type="button" id="sparkleDrawCancel">‹ Back</button><strong id="sparkleMakerTitle">Add a sparkle</strong><span></span></div>

        <div id="sparkleCreateHome" class="sparkle-create-home">
          <p>Make your own little floating symbol.</p>
          <div class="sparkle-create-choices">
            <button type="button" data-sparkle-maker="draw"><span>✎</span><b>Draw it</b><small>Sketch with your finger</small></button>
            <button type="button" data-sparkle-maker="emoji"><span>☺</span><b>Emoji</b><small>Paste or type any emoji</small></button>
            <button type="button" data-sparkle-maker="png"><span>▧</span><b>PNG image</b><small>Use a tiny transparent image</small></button>
          </div>
        </div>

        <div id="sparkleDrawPanel" class="sparkle-maker-panel hidden">
          <p>Draw one little symbol with your finger. It’ll inherit each person’s sparkle colour.</p>
          <div class="sparkle-canvas-wrap"><canvas id="sparkleDrawCanvas"></canvas></div>
          <div class="sparkle-draw-tools">
            <button type="button" id="sparkleUndo">Undo</button>
            <button type="button" id="sparkleClear">Clear</button>
            <button type="button" id="sparkleSave" class="sparkle-save-drawing">Save sparkle ✦</button>
          </div>
        </div>

        <div id="sparkleEmojiPanel" class="sparkle-maker-panel hidden">
          <p>Paste an emoji below. Colour emoji keep their normal colours when they float.</p>
          <div class="sparkle-emoji-entry">
            <div id="sparkleEmojiPreview" class="sparkle-maker-preview">✨</div>
            <input id="sparkleEmojiInput" type="text" maxlength="12" inputmode="text" autocomplete="off" placeholder="🐟">
          </div>
          <button type="button" id="sparkleEmojiSave" class="sparkle-maker-save">Save emoji</button>
        </div>

        <div id="sparklePngPanel" class="sparkle-maker-panel hidden">
          <p>Choose a simple PNG. Transparent backgrounds work best.</p>
          <label class="sparkle-png-picker">
            <input id="sparklePngInput" type="file" accept="image/png">
            <span>Choose PNG</span>
          </label>
          <div id="sparklePngPreview" class="sparkle-maker-preview sparkle-png-preview"><span>PNG</span></div>
          <button type="button" id="sparklePngSave" class="sparkle-maker-save">Save PNG sparkle</button>
        </div>
      </section>`;
    document.body.appendChild(modal);
    modal.addEventListener('cancel',e=>{e.preventDefault();closeSparkleDrawer();});

    $('sparkleDrawCancel').onclick=()=>{
      if(!$('sparkleCreateHome')?.classList.contains('hidden'))closeSparkleDrawer();
      else showSparkleMaker('home');
    };
    modal.querySelectorAll('[data-sparkle-maker]').forEach(btn=>btn.onclick=()=>showSparkleMaker(btn.dataset.sparkleMaker));
    $('sparkleUndo').onclick=()=>{sparkleDrawingStrokes.pop();redrawSparkleCanvas();};
    $('sparkleClear').onclick=()=>{sparkleDrawingStrokes=[];redrawSparkleCanvas();};
    $('sparkleSave').onclick=saveSparkleDrawing;
    $('sparkleEmojiInput').addEventListener('input',()=>{
      const value=$('sparkleEmojiInput').value.trim();
      $('sparkleEmojiPreview').textContent=value||'✨';
    });
    $('sparkleEmojiSave').onclick=saveSparkleEmoji;
    $('sparklePngInput').addEventListener('change',previewSparklePng);
    $('sparklePngSave').onclick=saveSparklePng;

    const canvas=$('sparkleDrawCanvas');
    const pointFromEvent=e=>{
      const r=canvas.getBoundingClientRect();
      return [Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))];
    };
    canvas.addEventListener('pointerdown',e=>{
      e.preventDefault();canvas.setPointerCapture?.(e.pointerId);
      activeSparkleStroke=[pointFromEvent(e)];sparkleDrawingStrokes.push(activeSparkleStroke);redrawSparkleCanvas();
    });
    canvas.addEventListener('pointermove',e=>{
      if(!activeSparkleStroke)return;e.preventDefault();
      const p=pointFromEvent(e),last=activeSparkleStroke[activeSparkleStroke.length-1];
      if(!last||Math.hypot(p[0]-last[0],p[1]-last[1])>.65){activeSparkleStroke.push(p);redrawSparkleCanvas();}
    });
    const endStroke=()=>{activeSparkleStroke=null;};
    canvas.addEventListener('pointerup',endStroke);canvas.addEventListener('pointercancel',endStroke);canvas.addEventListener('pointerleave',e=>{if(e.buttons===0)endStroke();});
    window.addEventListener('resize',()=>{if(modal.classList.contains('open')&&!$('sparkleDrawPanel')?.classList.contains('hidden'))sizeSparkleCanvas();});
    return modal;
  }
  function showSparkleMaker(mode='home'){
    const home=$('sparkleCreateHome'),draw=$('sparkleDrawPanel'),emoji=$('sparkleEmojiPanel'),png=$('sparklePngPanel');
    [home,draw,emoji,png].forEach(el=>el?.classList.add('hidden'));
    const titles={home:'Add a sparkle',draw:'Draw a sparkle',emoji:'Add an emoji',png:'Add a PNG'};
    if($('sparkleMakerTitle'))$('sparkleMakerTitle').textContent=titles[mode]||titles.home;
    if(mode==='draw'){
      sparkleDrawingStrokes=[];activeSparkleStroke=null;draw?.classList.remove('hidden');requestAnimationFrame(sizeSparkleCanvas);
    }else if(mode==='emoji'){
      if($('sparkleEmojiInput'))$('sparkleEmojiInput').value='';
      if($('sparkleEmojiPreview'))$('sparkleEmojiPreview').textContent='✨';
      emoji?.classList.remove('hidden');
    }else if(mode==='png'){
      if($('sparklePngInput'))$('sparklePngInput').value='';
      if($('sparklePngPreview'))$('sparklePngPreview').innerHTML='<span>PNG</span>';
      png?.classList.remove('hidden');
    }else home?.classList.remove('hidden');
  }
  function sizeSparkleCanvas(){
    const canvas=$('sparkleDrawCanvas'); if(!canvas)return;
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
    const w=Math.max(240,Math.round(rect.width*dpr)),h=Math.max(240,Math.round(rect.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    redrawSparkleCanvas();
  }
  function redrawSparkleCanvas(){
    const canvas=$('sparkleDrawCanvas');if(!canvas)return;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();ctx.scale(canvas.width/100,canvas.height/100);
    ctx.strokeStyle='#ffffff';ctx.lineWidth=2.3;ctx.lineCap='round';ctx.lineJoin='round';
    sparkleDrawingStrokes.forEach(stroke=>{
      if(!stroke?.length)return;
      ctx.beginPath();ctx.moveTo(stroke[0][0],stroke[0][1]);
      for(let i=1;i<stroke.length;i++)ctx.lineTo(stroke[i][0],stroke[i][1]);
      if(stroke.length===1)ctx.lineTo(stroke[0][0]+.01,stroke[0][1]+.01);
      ctx.stroke();
    });
    ctx.restore();
  }
  function openSparkleDrawer(){
    const modal=ensureSparkleDrawer();
    if(!modal.open) modal.showModal();
    modal.classList.add('open');
    document.body.classList.add('sparkle-drawing-open');
    showSparkleMaker('home');
  }
  function closeSparkleDrawer(){
    const modal=$('sparkleDrawModal');
    modal?.classList.remove('open');
    if(modal?.open) modal.close();
    document.body.classList.remove('sparkle-drawing-open');
    activeSparkleStroke=null;
  }
  function addCustomSparkle(item){
    const items=readCustomSparkles();
    items.push(item);
    if(!writeCustomSparkles(items)){alert('Couldn’t save that sparkle. Your browser storage may be full.');return false;}
    refreshSparklePicker([item.id]);closeSparkleDrawer();return true;
  }
  function saveSparkleDrawing(){
    const useful=sparkleDrawingStrokes.filter(s=>Array.isArray(s)&&s.length);
    if(!useful.length){alert('Draw something first ✦');return;}
    const cleaned=useful.map(stroke=>stroke.map(([x,y])=>[Math.round(x*10)/10,Math.round(y*10)/10]));
    addCustomSparkle({id:'custom:'+Date.now().toString(36),type:'draw',strokes:cleaned});
  }
  function saveSparkleEmoji(){
    const value=$('sparkleEmojiInput')?.value.trim()||'';
    if(!value){alert('Add an emoji first ✦');return;}
    addCustomSparkle({id:'custom:'+Date.now().toString(36),type:'emoji',value:value.slice(0,12)});
  }
  function previewSparklePng(){
    const file=$('sparklePngInput')?.files?.[0],preview=$('sparklePngPreview');
    if(!file||!preview)return;
    if(file.type!=='image/png'){alert('Please choose a PNG image.');$('sparklePngInput').value='';return;}
    const reader=new FileReader();
    reader.onload=()=>{preview.innerHTML=`<img src="${reader.result}" alt="PNG preview">`;};
    reader.readAsDataURL(file);
  }
  function resizeSparklePng(file){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=reject;
      reader.onload=()=>{
        const img=new Image();
        img.onerror=reject;
        img.onload=()=>{
          const size=160,canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
          const ctx=canvas.getContext('2d');ctx.clearRect(0,0,size,size);
          const scale=Math.min(size/img.width,size/img.height),w=img.width*scale,h=img.height*scale;
          ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src=reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  async function saveSparklePng(){
    const file=$('sparklePngInput')?.files?.[0];
    if(!file){alert('Choose a PNG first ✦');return;}
    if(file.type!=='image/png'){alert('Please choose a PNG image.');return;}
    try{
      const data=await resizeSparklePng(file);
      addCustomSparkle({id:'custom:'+Date.now().toString(36),type:'png',data});
    }catch{alert('I couldn’t read that PNG. Try another image.');}
  }
  function applyTextScalePreview(value){
    const root=$('personView');if(!root)return;
    const textScale=Math.max(80,Math.min(200,Number(value)||100));
    const scale=textScale/100;
    const headingScale=1+(scale-1)*1.08;
    const bodyScale=1+(scale-1)*.55;
    const vw=window.innerWidth||390;
    root.style.setProperty('--person-text-scale',String(scale));
    root.style.setProperty('--person-name-size',`${Math.min(104,Math.min(56,Math.max(38,vw*.11))*headingScale)}px`);
    root.style.setProperty('--person-meta-size',`${12*bodyScale}px`);
    root.style.setProperty('--person-archive-title-size',`${Math.min(58,24*headingScale)}px`);
    root.style.setProperty('--person-archive-sub-size',`${10*bodyScale}px`);
    root.style.setProperty('--person-action-size',`${12*bodyScale}px`);
    root.style.setProperty('--person-dossier-name-size',`${Math.min(92,Math.min(48,Math.max(34,vw*.10))*headingScale)}px`);
    root.style.setProperty('--person-dossier-role-size',`${12*bodyScale}px`);
    root.style.setProperty('--person-dossier-birthday-size',`${11*bodyScale}px`);
    root.style.setProperty('--person-section-title-size',`${17*bodyScale}px`);
    root.style.setProperty('--person-entry-size',`${13*bodyScale}px`);
    root.style.setProperty('--person-entry-detail-size',`${11*bodyScale}px`);
  }
  function syncTextScaleSlider(){
    const range=$('friendProfileTextScale');if(!range)return;
    const min=Number(range.min)||80,max=Number(range.max)||200,value=Number(range.value)||100;
    const pct=Math.max(0,Math.min(100,((value-min)/(max-min))*100));
    const fill=pct>=99.5?'100%':pct+'%';
    range.style.setProperty('--text-scale-fill',fill);
    const bg=pct>=99.5
      ? 'var(--accent)'
      : `linear-gradient(90deg,var(--accent) 0 ${fill},rgba(255,255,255,.13) ${fill} 100%)`;
    range.style.setProperty('background',bg,'important');
    if($('friendProfileTextScaleValue'))$('friendProfileTextScaleValue').textContent=value+'%';
    applyTextScalePreview(value);
  }
  function layoutHash(seed=''){
    let h=2166136261;
    for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619);}
    return ()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
  }
  function defaultSparkleAmount(density){
    return density==='whisper'?7:(density==='starfall'?80:44);
  }
  function makeDefaultSparklePoints(seed,density,amount=defaultSparkleAmount(density)){
    const rand=layoutHash(String(seed||'friend')+'|sparkle-layout|'+density+'|'+amount);
    const points=[];
    for(let i=0;i<amount;i++){
      const y=Math.max(1,Math.min(99,1+((i+.18+rand()*.64)/amount)*98));
      let x;
      if(y>9&&y<43){
        x=rand()<.5 ? 1+rand()*15 : 84+rand()*15;
      }else{
        x=1+rand()*98;
      }
      points.push([Math.round(x*10)/10,Math.round(y*10)/10]);
    }
    // Shuffle storage order so adding/removing amount never looks like a top-to-bottom fill.
    for(let i=points.length-1;i>0;i--){
      const j=Math.floor(rand()*(i+1));
      [points[i],points[j]]=[points[j],points[i]];
    }
    return points;
  }
  function normalizeSparkleLayout(layout,density,seed){
    const fallbackAmount=defaultSparkleAmount(density);
    const amount=Math.max(1,Math.min(100,Number(layout?.amount)||fallbackAmount));
    const size=Math.max(60,Math.min(200,Number(layout?.size)||100));
    let points=Array.isArray(layout?.points)
      ? layout.points.filter(p=>Array.isArray(p)&&Number.isFinite(Number(p[0]))&&Number.isFinite(Number(p[1]))).map(p=>[
          Math.max(1,Math.min(99,Number(p[0]))),
          Math.max(1,Math.min(99,Number(p[1])))
        ]).slice(0,100)
      : [];
    if(points.length<amount){
      const generated=makeDefaultSparklePoints(seed,density,amount);
      points=points.concat(generated.slice(points.length,amount));
    }
    return{amount,size,points};
  }
  function normalizeSparkleLayouts(layouts,seed){
    return{
      whisper:normalizeSparkleLayout(layouts?.whisper,'whisper',seed),
      constellation:normalizeSparkleLayout(layouts?.constellation,'constellation',seed),
      starfall:normalizeSparkleLayout(layouts?.starfall,'starfall',seed)
    };
  }
  function layoutSeed(){
    return $('friendId')?.value||$('friendName')?.value||'draft';
  }
  function ensureSparkleLayoutEditor(){
    let modal=$('sparkleLayoutModal');
    if(modal)return modal;
    modal=document.createElement('dialog');
    modal.id='sparkleLayoutModal';
    modal.className='sparkle-layout-modal';
    modal.innerHTML=`
      <section class="sparkle-layout-sheet" role="dialog" aria-modal="true">
        <div class="sparkle-layout-head">
          <button type="button" id="sparkleLayoutCancel">‹ Back</button>
          <strong id="sparkleLayoutTitle">Sparkle layout</strong>
          <span></span>
        </div>
        <p class="sparkle-layout-help">Drag the × markers wherever you want them. The real sparkles will still randomise their symbol, transparency and floating movement.</p>
        <div id="sparkleLayoutStage" class="sparkle-layout-stage"></div>
        <div class="sparkle-layout-controls">
          <label><span>Amount <b id="sparkleLayoutAmountValue">7</b></span><input id="sparkleLayoutAmount" type="range" min="1" max="100" step="1" value="7"></label>
          <label><span>Overall size <b id="sparkleLayoutSizeValue">100%</b></span><input id="sparkleLayoutSize" type="range" min="60" max="200" step="5" value="100"></label>
        </div>
        <div class="sparkle-layout-actions">
          <button type="button" id="sparkleLayoutReset">Reset scatter</button>
          <button type="button" id="sparkleLayoutSave">Use this layout ✦</button>
        </div>
      </section>`;
    document.body.appendChild(modal);
    modal.addEventListener('cancel',e=>{e.preventDefault();closeSparkleLayoutEditor();});
    $('sparkleLayoutCancel').onclick=closeSparkleLayoutEditor;
    $('sparkleLayoutReset').onclick=()=>{
      sparkleLayoutWorking=normalizeSparkleLayout(null,activeSparkleLayoutDensity,layoutSeed());
      syncSparkleLayoutControls();
      renderSparkleLayoutStage();
    };
    $('sparkleLayoutSave').onclick=()=>{
      if(!sparkleLayoutWorking)return;
      sparkleLayoutDrafts[activeSparkleLayoutDensity]=JSON.parse(JSON.stringify(sparkleLayoutWorking));
      closeSparkleLayoutEditor();
    };
    $('sparkleLayoutAmount').addEventListener('input',()=>{
      if(!sparkleLayoutWorking)return;
      const amount=Math.max(1,Math.min(100,Number($('sparkleLayoutAmount').value)||1));
      if(sparkleLayoutWorking.points.length<amount){
        const generated=makeDefaultSparklePoints(layoutSeed()+'|extra|'+Date.now(),activeSparkleLayoutDensity,amount);
        sparkleLayoutWorking.points=sparkleLayoutWorking.points.concat(generated.slice(sparkleLayoutWorking.points.length,amount));
      }
      sparkleLayoutWorking.amount=amount;
      syncSparkleLayoutControls();
      renderSparkleLayoutStage();
    });
    $('sparkleLayoutSize').addEventListener('input',()=>{
      if(!sparkleLayoutWorking)return;
      sparkleLayoutWorking.size=Math.max(60,Math.min(200,Number($('sparkleLayoutSize').value)||100));
      syncSparkleLayoutControls();
      renderSparkleLayoutStage();
    });
    const stage=$('sparkleLayoutStage');
    let dragIndex=-1;
    const movePoint=e=>{
      if(dragIndex<0||!sparkleLayoutWorking)return;
      const rect=stage.getBoundingClientRect();
      const x=Math.max(1,Math.min(99,((e.clientX-rect.left)/rect.width)*100));
      const y=Math.max(1,Math.min(99,((e.clientY-rect.top)/rect.height)*100));
      sparkleLayoutWorking.points[dragIndex]=[Math.round(x*10)/10,Math.round(y*10)/10];
      const dot=stage.querySelector(`[data-layout-index="${dragIndex}"]`);
      if(dot){dot.style.left=x+'%';dot.style.top=y+'%';}
    };
    stage.addEventListener('pointerdown',e=>{
      const dot=e.target.closest?.('.sparkle-layout-dot');if(!dot)return;
      e.preventDefault();dragIndex=Number(dot.dataset.layoutIndex);
      stage.setPointerCapture?.(e.pointerId);movePoint(e);
    });
    stage.addEventListener('pointermove',e=>{if(dragIndex>=0){e.preventDefault();movePoint(e);}});
    const stop=()=>{dragIndex=-1;};
    stage.addEventListener('pointerup',stop);stage.addEventListener('pointercancel',stop);
    return modal;
  }
  function syncSparkleLayoutControls(){
    if(!sparkleLayoutWorking)return;
    if($('sparkleLayoutAmount'))$('sparkleLayoutAmount').value=sparkleLayoutWorking.amount;
    if($('sparkleLayoutSize'))$('sparkleLayoutSize').value=sparkleLayoutWorking.size;
    if($('sparkleLayoutAmountValue'))$('sparkleLayoutAmountValue').textContent=sparkleLayoutWorking.amount;
    if($('sparkleLayoutSizeValue'))$('sparkleLayoutSizeValue').textContent=sparkleLayoutWorking.size+'%';
  }
  function renderSparkleLayoutStage(){
    const stage=$('sparkleLayoutStage');if(!stage||!sparkleLayoutWorking)return;
    const amount=Math.min(sparkleLayoutWorking.amount,sparkleLayoutWorking.points.length);
    const sizeScale=sparkleLayoutWorking.size/100;
    stage.innerHTML=sparkleLayoutWorking.points.slice(0,amount).map((p,i)=>{
      const s=Math.max(14,Math.min(34,18*sizeScale));
      return `<button type="button" class="sparkle-layout-dot" data-layout-index="${i}" style="left:${p[0]}%;top:${p[1]}%;font-size:${s}px">×</button>`;
    }).join('');
  }
  function openSparkleLayoutEditor(density){
    activeSparkleLayoutDensity=['whisper','constellation','starfall'].includes(density)?density:'constellation';
    const current=sparkleLayoutDrafts[activeSparkleLayoutDensity]||normalizeSparkleLayout(null,activeSparkleLayoutDensity,layoutSeed());
    sparkleLayoutWorking=JSON.parse(JSON.stringify(current));
    const modal=ensureSparkleLayoutEditor();
    if($('sparkleLayoutTitle'))$('sparkleLayoutTitle').textContent=activeSparkleLayoutDensity.charAt(0).toUpperCase()+activeSparkleLayoutDensity.slice(1)+' layout';
    syncSparkleLayoutControls();
    renderSparkleLayoutStage();
    if(!modal.open)modal.showModal();
  }
  function closeSparkleLayoutEditor(){
    const modal=$('sparkleLayoutModal');if(modal?.open)modal.close();
    sparkleLayoutWorking=null;
  }
  function selectFont(key){if(!(key in FONT_MAP))key='default';if($('friendProfileFont'))$('friendProfileFont').value=key;document.querySelectorAll('.font-option').forEach(b=>b.classList.toggle('active',b.dataset.font===key));}
  function selectSparkleDensity(value,openEditor=false){
    const density=['whisper','constellation','starfall'].includes(value)?value:'constellation';
    if($('friendProfileSparkleDensity')) $('friendProfileSparkleDensity').value=density;
    document.querySelectorAll('#profileSparkleDensity [data-density]').forEach(btn=>btn.classList.toggle('active',btn.dataset.density===density));
    if(openEditor)openSparkleLayoutEditor(density);
  }
  function selectedSparkleIcons(){
    return [...document.querySelectorAll('#profileSparkleIcons input:checked')].map(input=>input.value).slice(0,100);
  }
  function setSparkleIcons(icons){
    const chosen=new Set(Array.isArray(icons)&&icons.length?icons:DEFAULT_SPARKLES);
    document.querySelectorAll('#profileSparkleIcons input').forEach(input=>{
      input.checked=chosen.has(input.value);
      input.closest('.profile-sparkle-icon')?.classList.toggle('selected',input.checked);
    });
  }
  function targetLabel(id){return COLOUR_TARGETS.find(x=>x[0]===id)?.[1]||'Colour';}
  function setTargetColour(id,hex,syncPicker=false){const el=$(id);if(!el)return;el.value=normalHex(hex);const btn=document.querySelector(`[data-colour-target="${id}"]`);if(btn)btn.querySelector('.colour-dot').style.background=el.value;if(syncPicker&&id===activeColourTarget)syncPickerToColour(el.value);}
  function selectColourTarget(id){activeColourTarget=id;document.querySelectorAll('.colour-property').forEach(b=>b.classList.toggle('active',b.dataset.colourTarget===id));if($('activeColourLabel'))$('activeColourLabel').textContent=targetLabel(id);syncPickerToColour($(id)?.value||'#ffffff');}
  function syncPickerToColour(hex){hex=normalHex(hex);const {r,g,b}=hexToRgb(hex),hsv=rgbToHsv(r,g,b);$('colourHue').value=hsv.h;$('colourSat').value=hsv.s;$('colourVal').value=hsv.v;$('colourHex').value=hex;updateSliderVisuals(hsv.h,hsv.s,hsv.v);}
  function updateColourFromHSV(){const h=Number($('colourHue').value),s=Number($('colourSat').value),v=Number($('colourVal').value),hex=hsvToHex(h,s,v);setTargetColour(activeColourTarget,hex);$('colourHex').value=hex;updateSliderVisuals(h,s,v);}
  function updateSliderVisuals(h,s,v){$('hueValue').textContent=`${h}°`;$('satValue').textContent=`${s}%`;$('valValue').textContent=`${v}%`;const pure=hsvToHex(h,100,100),satColour=hsvToHex(h,s,100);$('colourHue').style.background='linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)';$('colourSat').style.background=`linear-gradient(90deg,${pure},#fff)`;$('colourVal').style.background=`linear-gradient(90deg,${satColour},#000)`;}
  function renderRecentColours(){const box=$('recentColours');if(!box)return;const colours=recentColours();box.innerHTML=colours.length?colours.map(c=>`<button type="button" class="recent-colour" data-colour="${c}" style="background:${c}" aria-label="Use ${c}"></button>`).join(''):'<span class="recent-empty">Colours you choose will appear here.</span>';box.querySelectorAll('.recent-colour').forEach(btn=>btn.onclick=()=>setTargetColour(activeColourTarget,btn.dataset.colour,true));}

  function setThemeFields(friend){
    ensureProfileThemeEditor();
    const values={friendFrameColour:friend?.frameColor||settings.accent,friendProfileBg:friend?.profileBg||'#1b1326',friendProfileText:friend?.profileText||'#f4edf7',friendProfileHeading:friend?.profileHeading||friend?.frameColor||'#f6d5ff',friendProfileSparkle:friend?.profileSparkle||friend?.frameColor||settings.accent};
    Object.entries(values).forEach(([id,val])=>setTargetColour(id,val));
    selectFont(friend?.profileFont||'default');
    const textScale=Math.max(80,Math.min(200,Number(friend?.profileTextScale)||100));
    if($('friendProfileTextScale')) $('friendProfileTextScale').value=textScale;
    syncTextScaleSlider();
    setSparkleIcons(friend?.profileSparkleIcons);
    sparkleLayoutDrafts=normalizeSparkleLayouts(friend?.profileSparkleLayouts,friend?.id||friend?.name||'draft');
    selectSparkleDensity(friend?.profileSparkleDensity||'constellation');
    selectColourTarget('friendProfileBg');
  }

  const previousOpenFriendDialog=openFriendDialog;
  openFriendDialog=function(friend=null){previousOpenFriendDialog(friend);setThemeFields(friend);};
  $('friendDialog')?.addEventListener('close',()=>{if(state.selectedId){renderPersonHero();showChoice();}});
  function ensureIdBeforeSave(){if($('friendId')&&!$('friendId').value)$('friendId').value=uid();}
  const saveBtn=$('friendForm')?.querySelector('.primary-button');
  saveBtn?.addEventListener('click',ensureIdBeforeSave,{capture:true});
  saveBtn?.addEventListener('click',()=>{queueMicrotask(()=>{const id=$('friendId')?.value,friend=state.friends.find(f=>f.id===id);if(!friend)return;friend.profileBg=$('friendProfileBg')?.value||'#1b1326';friend.profileText=$('friendProfileText')?.value||'#f4edf7';friend.profileHeading=$('friendProfileHeading')?.value||friend.frameColor||'#f6d5ff';friend.profileSparkle=$('friendProfileSparkle')?.value||friend.frameColor||settings.accent;friend.profileFont=$('friendProfileFont')?.value||'default';friend.profileTextScale=Math.max(80,Math.min(200,Number($('friendProfileTextScale')?.value)||100));friend.profileSparkleIcons=selectedSparkleIcons().length?selectedSparkleIcons():DEFAULT_SPARKLES.slice();friend.profileSparkleDensity=$('friendProfileSparkleDensity')?.value||'constellation';friend.profileSparkleLayouts=JSON.parse(JSON.stringify(sparkleLayoutDrafts));COLOUR_TARGETS.forEach(([target])=>{const v=$(target)?.value;if(v)addRecentColour(v)});persistFriends();if(state.selectedId===friend.id){renderPersonHero();showChoice();}});});

  function fallbackEmojis(friend){if(Array.isArray(friend?.frameEmojis)&&friend.frameEmojis.filter(Boolean).length)return friend.frameEmojis.filter(Boolean).slice(0,3);if(friend?.frameStyle==='flowers')return['🌸'];if(friend?.frameStyle==='shards')return['💎'];return[];}
  function wreathMarkup(emojis,count=24){const list=(emojis||[]).filter(Boolean).slice(0,3);if(!list.length)return'';const sizes=[1,.78,1.13,.88,1.02,.72,1.18,.84],nudges=[0,-3,2,-1,3,-2,1,-3];let html='';for(let i=0;i<count;i++){const angle=(360/count)*i-90,rad=angle*Math.PI/180,radius=43+nudges[i%nudges.length],x=50+Math.cos(rad)*radius,y=50+Math.sin(rad)*radius,size=sizes[i%sizes.length],rotate=((i*37)%48)-24;html+=`<span class="emoji-wreath-piece" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;--emoji-size:${size};transform:translate(-50%,-50%) rotate(${rotate}deg)">${esc(list[i%list.length])}</span>`;}return html;}
  function entryMarkup(e){if(e.type==='date'){const d=formatPartialDate(e.day,e.month,e.year),main=e.title||'Important date';return`<li><span class="entry-main">${esc(main)}</span>${d?`<span class="entry-detail">(${esc(d)})</span>`:''}</li>`;}const hasTitle=Boolean(e.title?.trim()),main=hasTitle?e.title:(e.value||''),detail=hasTitle&&e.value?e.value:'';return`<li><span class="entry-main">${esc(main)}</span>${detail?`<span class="entry-detail">(${esc(detail)})</span>`:''}</li>`;}

  renderRead=function(){
    const f=selected(),p=$('readPanel');if(!f||!p)return;
    const emojis=fallbackEmojis(f),style=f.frameStyle==='plain'||!emojis.length?'plain':'emoji';
    const frameColor=f.frameColor||settings.accent,profileBg=f.profileBg||'#1b1326',profileText=f.profileText||'#f4edf7',heading=f.profileHeading||frameColor,sparkle=f.profileSparkle||frameColor,fontKey=FONT_MAP[f.profileFont]?f.profileFont:'classic';
    const face=f.imageData?`<img class="read-profile-photo" src="${f.imageData}" alt="">`:`<div class="read-profile-initials">${esc(initials(f.name))}</div>`,bd=formatPartialDate(f.birthdayDay,f.birthdayMonth,f.birthdayYear),portraitFrame=style==='emoji'?`<span class="frame-layer emoji-wreath">${wreathMarkup(emojis,24)}</span>`:`<span class="frame-layer"></span>`;
    p.innerHTML=`<section class="character-sheet character-frame-${style} profile-font-${fontKey}" style="--profile-frame:${esc(frameColor)};--profile-bg:${esc(profileBg)};--profile-text:${esc(profileText)};--profile-heading:${esc(heading)};--profile-sparkle:${esc(sparkle)}"><div class="character-card-actions"><button class="character-back" id="backToChoices">‹ Back</button><span>FRIEND DOSSIER</span><button class="character-edit" id="editReadBtn">Edit</button></div><span class="sheet-corner corner-a">✦</span><span class="sheet-corner corner-b">✦</span><span class="sheet-corner corner-c">✦</span><span class="sheet-corner corner-d">✦</span><div class="character-title-rule"><span></span><b>✧</b><span></span></div><div class="character-profile-head"><div class="character-portrait-wrap frame-${style}">${portraitFrame}${face}</div><div class="character-name-block"><div class="character-name">${esc(f.name)}</div>${f.relationship?`<div class="character-role">${esc(f.relationship)}</div>`:''}${bd?`<div class="character-birthday">🎂 ${esc(bd)}</div>`:''}</div></div><div class="character-divider"><span></span><b>◆</b><span></span></div><div id="readStory" class="character-sections"></div><div class="character-footer-ornament">✦ · ✧ · ✦</div></section>`;
    $('backToChoices').onclick=showChoice;$('editReadBtn').onclick=renderReadEdit;const story=$('readStory');if(!f.entries.length){story.innerHTML='<div class="read-empty">No lore recorded yet ✦</div>';return;}const groups=new Map();f.entries.forEach(e=>{if(!groups.has(e.type))groups.set(e.type,[]);groups.get(e.type).push(e);});for(const[type,entries]of groups){const c=categoryFor(type),usable=entries.filter(e=>e.type==='date'||e.title||e.value);if(!usable.length)continue;const section=document.createElement('section');section.className='character-section';section.innerHTML=`<div class="character-section-title"><strong>${esc(c.name)}</strong></div><ul>${usable.map(entryMarkup).join('')}</ul>`;story.appendChild(section);}
  };

  const originalOpenEntryDialog=openEntryDialog;
  openEntryDialog=function(type,entry=null){cleanEntryDialog();originalOpenEntryDialog(type,entry);if($('entryEmoji'))$('entryEmoji').value='';if($('entryDialogTitle'))$('entryDialogTitle').textContent=categoryFor(type).name;};

  function decorateChoice(){
    const panel=$('personChoice'),read=$('readBtn'),add=$('addInfoBtn'),edit=$('editPersonBtn');if(!panel||!read)return;
    panel.classList.add('character-choice-panel');read.classList.add('read-primary-choice');read.innerHTML='<span class="choice-book">📖</span><strong>Open dossier</strong><small>Read their character profile</small><i>✦</i>';
    if(add){add.classList.add('secondary-person-choice');add.innerHTML='<span>＋</span><strong>Add info</strong>';}
    if(edit){edit.classList.add('secondary-person-choice');edit.innerHTML='<span>✦</span><strong>Edit person</strong>';}
  }
  const previousShowChoice=showChoice;
  showChoice=function(){previousShowChoice();decorateChoice();};

  function sortedFriends(){return [...state.friends].sort((a,b)=>a.name.localeCompare(b.name));}
  function switchPerson(delta){const list=sortedFriends();if(list.length<2||!state.selectedId)return;const i=list.findIndex(f=>f.id===state.selectedId);if(i<0)return;const next=list[(i+delta+list.length)%list.length];const wasRead=$('personView')?.classList.contains('read-mode');state.selectedId=next.id;renderPersonHero();if(wasRead){$('personChoice')?.classList.add('hidden');$('addInfoPanel')?.classList.add('hidden');$('personHero')?.classList.add('hidden');$('personBackBtn')?.classList.add('hidden');$('readPanel')?.classList.remove('hidden');renderRead();}else showChoice();const view=$('personView');view?.classList.remove('swipe-pop');requestAnimationFrame(()=>view?.classList.add('swipe-pop'));}
  function bindSwipe(){const view=$('personView');if(!view||view.dataset.swipeBound)return;view.dataset.swipeBound='1';let startX=0,startY=0,tracking=false;view.addEventListener('touchstart',e=>{if(e.touches.length!==1||e.target.closest('input,textarea,select,button,label,dialog'))return;startX=e.touches[0].clientX;startY=e.touches[0].clientY;tracking=true;},{passive:true});view.addEventListener('touchend',e=>{if(!tracking)return;tracking=false;const t=e.changedTouches[0],dx=t.clientX-startX,dy=t.clientY-startY;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.25)switchPerson(dx<0?1:-1);},{passive:true});}

  const css=document.createElement('style');css.id='profileCustomizationStyles';css.textContent=`
    .emoji-value-row{grid-template-columns:1fr!important}.entry-title-only{width:100%}.entry-info-label{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.entry-info-label small{font-size:10px!important;font-weight:500;color:var(--muted);text-transform:none;letter-spacing:0}
    #entryDialogTitle{text-align:center;width:100%;font-size:25px!important;letter-spacing:.02em}.character-section-title{justify-content:center!important;text-align:center;margin-bottom:10px!important}.character-section-title strong{font-size:19px!important;letter-spacing:.07em!important;text-transform:uppercase;color:var(--profile-heading)!important}.character-section li{display:grid;gap:2px;padding:5px 0 5px 2px;color:var(--profile-text)!important}.entry-main{font-weight:780;color:var(--profile-heading)!important}.entry-detail{display:block;font-size:11px;color:color-mix(in srgb,var(--profile-text) 58%,transparent)!important;font-weight:500;margin-top:1px}
    .character-sheet{background:radial-gradient(circle at 50% -15%,color-mix(in srgb,var(--profile-sparkle) 18%,transparent),transparent 42%),linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.015)),var(--profile-bg)!important;color:var(--profile-text)!important}.character-name{color:var(--profile-heading)!important}.character-role{color:color-mix(in srgb,var(--profile-heading) 72%,var(--profile-text))!important}.character-birthday,.character-card-actions button,.read-empty{color:var(--profile-text)!important}.sheet-corner,.character-title-rule,.character-divider,.character-footer-ornament,.character-card-actions span{color:var(--profile-sparkle)!important}.character-title-rule span,.character-divider span{background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--profile-sparkle) 72%,transparent))!important}.character-title-rule span:last-child,.character-divider span:last-child{background:linear-gradient(90deg,color-mix(in srgb,var(--profile-sparkle) 72%,transparent),transparent)!important}
    ${Object.entries(FONT_MAP).map(([k,v])=>`.profile-font-${k}{font-family:${v}}.profile-font-${k} .character-name,.profile-font-${k} .character-section-title strong{font-family:${v}}`).join('')}
    .native-colours-hidden{display:none!important}.profile-theme-editor{margin-top:15px;padding:15px;border-radius:18px;border:1px solid rgba(255,255,255,.09);background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))}.profile-theme-heading{display:flex;justify-content:space-between;gap:12px;align-items:baseline;margin-bottom:12px}.profile-theme-heading strong{font-size:16px}.profile-theme-heading small{color:var(--muted);font-size:10px;text-align:right}
    .colour-property-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.colour-property{border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.035);border-radius:14px;padding:9px 5px;color:var(--text);display:grid;place-items:center;gap:5px;font-size:10px}.colour-property.active{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 16%,transparent)}.colour-dot{width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,.55);box-shadow:0 3px 10px rgba(0,0,0,.3)}
    .colour-editor{margin-top:12px;padding:12px;border-radius:15px;background:rgba(0,0,0,.12);display:grid;gap:10px}.colour-editor-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.colour-editor-head input{width:92px;text-transform:uppercase;padding:7px 8px;border-radius:9px;font-family:monospace}.colour-editor label{display:grid;grid-template-columns:1fr auto;gap:5px 8px;font-size:11px;color:var(--muted)}.colour-editor label input[type=range]{grid-column:1/-1;width:100%;height:14px;border-radius:999px;appearance:none;border:0;padding:0}.colour-editor input[type=range]::-webkit-slider-thumb{appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;border:2px solid #4b3c55;box-shadow:0 2px 6px rgba(0,0,0,.35)}.reverse-range{direction:rtl}
    .recent-colours-wrap{margin-top:12px}.recent-colours-title,.font-picker-title{font-size:11px;color:var(--muted);margin-bottom:7px}.recent-colours{display:flex;gap:7px;flex-wrap:wrap;min-height:30px}.recent-colour{width:29px;height:29px;border-radius:50%;border:2px solid rgba(255,255,255,.48);box-shadow:0 2px 8px rgba(0,0,0,.28)}.recent-empty{font-size:10px;color:var(--muted)}
    .profile-text-size-wrap{margin-top:15px}.profile-text-size-wrap input[type=range]{--text-scale-fill:16.667%;display:block!important;width:100%!important;height:8px!important;margin:8px 0 4px!important;padding:0!important;border:0!important;border-radius:999px!important;appearance:none!important;-webkit-appearance:none!important;background:linear-gradient(90deg,var(--accent) 0 var(--text-scale-fill),rgba(255,255,255,.13) var(--text-scale-fill) 100%)!important;box-sizing:border-box!important;overflow:visible!important;outline:none!important}.profile-text-size-wrap input[type=range]::-webkit-slider-runnable-track{height:8px!important;border:0!important;border-radius:999px!important;background:transparent!important}.profile-text-size-wrap input[type=range]::-webkit-slider-thumb{-webkit-appearance:none!important;appearance:none!important;width:22px!important;height:22px!important;margin-top:-7px!important;border-radius:50%!important;background:#fff!important;border:2px solid color-mix(in srgb,var(--accent) 60%,#4b3c55)!important;box-shadow:0 2px 8px rgba(0,0,0,.35)!important}.profile-text-size-wrap input[type=range]::-moz-range-track{height:8px!important;border:0!important;border-radius:999px!important;background:rgba(255,255,255,.13)!important}.profile-text-size-wrap input[type=range]::-moz-range-progress{height:8px!important;border-radius:999px!important;background:var(--accent)!important}.profile-text-size-wrap input[type=range]::-moz-range-thumb{width:22px!important;height:22px!important;border-radius:50%!important;background:#fff!important;border:2px solid var(--accent)!important}
        .font-picker-wrap{margin-top:15px}.font-options{display:grid;grid-template-columns:1fr 1fr;gap:8px}.font-option{min-height:68px;border-radius:13px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);color:var(--text);padding:8px;display:grid;place-items:center;gap:3px}.font-option span{font-size:17px}.font-option small{font-family:system-ui,sans-serif!important;font-size:9px;color:var(--muted)}.font-option.active{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent)}
    .profile-sparkle-picker{margin-top:16px;padding:14px;border-radius:18px;border:1px solid rgba(255,255,255,.09);background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))}
    .profile-sparkle-picker .profile-theme-heading{margin-bottom:10px}
    .profile-sparkle-icons{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:8px!important;width:100%!important;margin:8px 0 0!important}
    .profile-sparkle-icon{display:grid!important;place-items:center!important;position:relative!important;aspect-ratio:1!important;min-width:0!important;width:100%!important;padding:0!important;margin:0!important;border:1px solid rgba(255,255,255,.11)!important;border-radius:13px!important;background:rgba(255,255,255,.025)!important;cursor:pointer!important;overflow:hidden!important;transition:border-color .16s ease,background .16s ease,box-shadow .16s ease,transform .12s ease!important}
    .profile-sparkle-icon:active{transform:scale(.95)!important}
    .profile-sparkle-icon input{position:absolute!important;opacity:0!important;width:1px!important;height:1px!important;pointer-events:none!important;margin:0!important;padding:0!important}
    .profile-sparkle-icon span{display:grid!important;place-items:center!important;width:100%!important;height:100%!important;font-size:22px!important;line-height:1!important;color:color-mix(in srgb,var(--text) 82%,var(--accent) 18%)!important;text-shadow:0 0 9px color-mix(in srgb,var(--accent) 22%,transparent)!important}
    .profile-sparkle-icon.selected{border-color:color-mix(in srgb,var(--accent) 82%,white 8%)!important;background:color-mix(in srgb,var(--accent) 13%,transparent)!important;box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 26%,transparent),0 0 15px color-mix(in srgb,var(--accent) 16%,transparent)!important}
    .profile-sparkle-icon.selected span{color:color-mix(in srgb,var(--accent) 72%,white 28%)!important;text-shadow:0 0 10px currentColor!important}
    .sparkle-density-title{margin:16px 0 8px!important;font-size:10px!important;text-transform:uppercase!important;letter-spacing:.1em!important;color:var(--muted)!important}
    .sparkle-density-options{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}
    .sparkle-density-options button{appearance:none!important;-webkit-appearance:none!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;min-width:0!important;min-height:74px!important;padding:9px 7px!important;border:1px solid rgba(255,255,255,.1)!important;border-radius:14px!important;background:rgba(255,255,255,.025)!important;color:var(--text)!important;box-shadow:none!important;text-align:center!important;white-space:normal!important;transition:border-color .16s ease,background .16s ease,box-shadow .16s ease,transform .12s ease!important}
    .sparkle-density-options button:active{transform:scale(.97)!important}
    .sparkle-density-options button b{display:block!important;font-size:11px!important;line-height:1.15!important;color:var(--text)!important}
    .sparkle-density-options button small{display:block!important;margin-top:5px!important;font-size:8px!important;line-height:1.25!important;color:var(--muted)!important;font-weight:500!important}
    .sparkle-density-options button.active{border-color:color-mix(in srgb,var(--accent) 78%,white 8%)!important;background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 16%,transparent),rgba(255,255,255,.025))!important;box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 22%,transparent),0 0 16px color-mix(in srgb,var(--accent) 13%,transparent)!important}
    .sparkle-density-options button.active b{color:color-mix(in srgb,var(--accent) 72%,white 28%)!important}
    .sparkle-density-options button:after{content:'tap to arrange';display:block;margin-top:5px;font-size:7px;letter-spacing:.05em;text-transform:uppercase;color:color-mix(in srgb,var(--muted) 72%,transparent)}
    .sparkle-layout-modal{position:fixed;inset:0;width:100vw;max-width:none;height:100dvh;max-height:none;margin:0;border:0;background:rgba(10,7,14,.96);color:#f7f2fb;padding:max(14px,env(safe-area-inset-top)) 14px max(14px,env(safe-area-inset-bottom));box-sizing:border-box}
    .sparkle-layout-modal::backdrop{background:rgba(4,3,8,.68);backdrop-filter:blur(4px)}
    .sparkle-layout-sheet{width:min(100%,520px);height:100%;margin:auto;display:flex;flex-direction:column;align-items:center;overflow:auto}
    .sparkle-layout-head{width:100%;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin-bottom:4px}.sparkle-layout-head button{justify-self:start;border:0;background:transparent;color:#f7f2fb;padding:8px 0;font-weight:800}.sparkle-layout-head strong{font:700 20px Georgia,serif}
    .sparkle-layout-help{max-width:360px;margin:2px auto 10px;text-align:center;color:rgba(247,242,251,.58);font:11px/1.4 system-ui}
    .sparkle-layout-stage{position:relative;flex:0 0 auto;width:min(62vw,280px);aspect-ratio:9/16;border-radius:25px;border:1px solid color-mix(in srgb,var(--accent) 38%,rgba(255,255,255,.12));background:linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.012));box-shadow:inset 0 0 38px rgba(255,255,255,.018);overflow:hidden;touch-action:none}
    .sparkle-layout-stage:before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 24.8%,rgba(255,255,255,.045) 25%,transparent 25.2%,transparent 49.8%,rgba(255,255,255,.035) 50%,transparent 50.2%,transparent 74.8%,rgba(255,255,255,.045) 75%,transparent 75.2%);pointer-events:none}
    .sparkle-layout-dot{position:absolute;transform:translate(-50%,-50%);width:1.35em;height:1.35em;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--accent) 55%,white 8%);border-radius:50%;background:color-mix(in srgb,var(--accent) 13%,#120d19);color:color-mix(in srgb,var(--accent) 65%,white 35%);font-family:system-ui,sans-serif;line-height:1;box-shadow:0 0 9px color-mix(in srgb,var(--accent) 20%,transparent);padding:0;touch-action:none}
    .sparkle-layout-controls{width:min(92vw,420px);margin:13px auto 0;display:grid;gap:10px}.sparkle-layout-controls label{display:grid;grid-template-columns:1fr;gap:6px;color:rgba(247,242,251,.68);font:11px system-ui}.sparkle-layout-controls label span{display:flex;justify-content:space-between}.sparkle-layout-controls input[type=range]{width:100%;accent-color:var(--accent)}
    .sparkle-layout-actions{width:min(92vw,420px);display:grid;grid-template-columns:1fr 1.35fr;gap:8px;margin:12px auto 0}.sparkle-layout-actions button{min-height:46px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035);color:#f7f2fb;font-weight:800}.sparkle-layout-actions #sparkleLayoutSave{border-color:color-mix(in srgb,var(--accent) 60%,transparent);background:color-mix(in srgb,var(--accent) 14%,transparent);color:color-mix(in srgb,var(--accent) 72%,white 28%)}

    .profile-sparkle-icon .custom-sparkle-svg{width:72%!important;height:72%!important;overflow:visible!important}
    .profile-sparkle-icon .custom-sparkle-svg polyline{fill:none;stroke:currentColor;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
    .profile-sparkle-add{aspect-ratio:1!important;border:1px dashed color-mix(in srgb,var(--accent) 48%,rgba(255,255,255,.12))!important;border-radius:13px!important;background:color-mix(in srgb,var(--accent) 6%,transparent)!important;color:var(--text)!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;padding:4px!important}
    .profile-sparkle-add span{font-size:22px!important;line-height:1!important;color:var(--accent)!important}.profile-sparkle-add small{font:700 8px/1.05 system-ui,sans-serif!important;color:var(--muted)!important}
    .sparkle-draw-modal{position:fixed;inset:0;width:100vw;max-width:none;height:100dvh;max-height:none;margin:0;border:0;display:none;align-items:stretch;justify-content:center;background:rgba(9,6,14,.94);color:#f7f2fb;backdrop-filter:blur(18px);padding:max(16px,env(safe-area-inset-top)) 14px max(16px,env(safe-area-inset-bottom));box-sizing:border-box}
    .sparkle-draw-modal::backdrop{background:rgba(5,3,9,.58);backdrop-filter:blur(4px)}
    .sparkle-draw-modal.open{display:flex}.sparkle-draw-sheet{width:min(100%,520px);min-height:100%;display:flex;flex-direction:column;justify-content:center;color:#f7f2fb}
    .sparkle-draw-head{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin-bottom:8px}.sparkle-draw-head button{justify-self:start;border:0;background:transparent;color:#f7f2fb;font:700 14px system-ui;padding:8px 0}.sparkle-draw-head strong{font:700 22px Georgia,serif}.sparkle-draw-sheet>p{text-align:center;margin:4px auto 18px;max-width:330px;color:rgba(247,242,251,.62);font:12px/1.45 system-ui}
    .sparkle-canvas-wrap{width:min(82vw,360px);aspect-ratio:1;margin:0 auto;border-radius:24px;border:1px solid color-mix(in srgb,var(--accent) 42%,transparent);background:radial-gradient(circle at 50% 40%,color-mix(in srgb,var(--accent) 10%,transparent),transparent 65%),rgba(255,255,255,.025);box-shadow:inset 0 0 40px rgba(255,255,255,.025),0 18px 50px rgba(0,0,0,.28);overflow:hidden}
    #sparkleDrawCanvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}
    .sparkle-draw-tools{width:min(82vw,360px);margin:14px auto 0;display:grid;grid-template-columns:1fr 1fr;gap:8px}.sparkle-draw-tools button{min-height:44px;border-radius:13px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.035);color:#f7f2fb;font-weight:800}.sparkle-draw-tools .sparkle-save-drawing{grid-column:1/-1;border-color:color-mix(in srgb,var(--accent) 58%,transparent);background:color-mix(in srgb,var(--accent) 14%,transparent);color:color-mix(in srgb,var(--accent) 70%,white 30%)}
    .profile-sparkle-icon .custom-sparkle-emoji{font-size:1em!important;line-height:1!important}.profile-sparkle-icon .custom-sparkle-image{display:block!important;width:78%!important;height:78%!important;object-fit:contain!important}
    .sparkle-create-home,.sparkle-maker-panel{width:min(86vw,380px);margin:0 auto}.sparkle-create-home>p,.sparkle-maker-panel>p{text-align:center;margin:4px auto 18px;max-width:330px;color:rgba(247,242,251,.62);font:12px/1.45 system-ui}
    .sparkle-create-choices{display:grid;grid-template-columns:1fr;gap:10px}.sparkle-create-choices button{min-height:84px;border-radius:18px;border:1px solid rgba(255,255,255,.10);background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 10%,transparent),rgba(255,255,255,.025));color:#f7f2fb;display:grid;grid-template-columns:46px 1fr;grid-template-rows:auto auto;column-gap:10px;align-items:center;text-align:left;padding:12px 15px}.sparkle-create-choices button>span{grid-row:1/3;display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:color-mix(in srgb,var(--accent) 13%,transparent);font-size:24px;color:var(--accent)}.sparkle-create-choices button b{font-size:14px}.sparkle-create-choices button small{font-size:10px;color:rgba(247,242,251,.55)}
    .sparkle-emoji-entry{display:grid;place-items:center;gap:14px}.sparkle-emoji-entry input{width:min(220px,70vw);height:52px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#fff;text-align:center;font-size:24px;outline:none}.sparkle-maker-preview{width:112px;height:112px;border-radius:24px;border:1px solid color-mix(in srgb,var(--accent) 34%,transparent);background:rgba(255,255,255,.025);display:grid;place-items:center;font-size:50px;margin:4px auto 16px;overflow:hidden}.sparkle-png-preview img{max-width:82%;max-height:82%;object-fit:contain}.sparkle-png-preview span{font:800 12px system-ui;color:rgba(247,242,251,.42)}
    .sparkle-png-picker{display:flex!important;justify-content:center!important;margin:4px auto 14px!important}.sparkle-png-picker input{position:absolute!important;opacity:0!important;pointer-events:none!important}.sparkle-png-picker span{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:13px;border:1px dashed color-mix(in srgb,var(--accent) 52%,transparent);background:color-mix(in srgb,var(--accent) 7%,transparent);color:#f7f2fb;font-weight:800}
    .sparkle-maker-save{display:block;width:min(82vw,360px);min-height:48px;margin:14px auto 0;border-radius:14px;border:1px solid color-mix(in srgb,var(--accent) 58%,transparent);background:color-mix(in srgb,var(--accent) 14%,transparent);color:color-mix(in srgb,var(--accent) 70%,white 30%);font-weight:850}.sparkle-maker-panel.hidden,.sparkle-create-home.hidden{display:none!important}
        body.sparkle-drawing-open{overflow:hidden!important}
    .character-choice-panel{grid-template-columns:1fr 1fr!important;gap:10px!important}.read-primary-choice{grid-column:1/-1!important;min-height:150px!important;position:relative!important;overflow:hidden!important;border:1px solid color-mix(in srgb,var(--accent) 48%,transparent)!important;background:radial-gradient(circle at 80% 20%,color-mix(in srgb,var(--accent) 20%,transparent),transparent 35%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.025))!important}.read-primary-choice .choice-book{font-size:38px!important}.read-primary-choice strong{font-size:22px!important;font-family:Georgia,serif}.read-primary-choice small{font-size:11px!important;letter-spacing:.04em}.read-primary-choice i{position:absolute;right:18px;top:14px;color:var(--accent);font-style:normal;opacity:.75}.secondary-person-choice{grid-column:auto!important;min-height:64px!important;padding:10px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important}.secondary-person-choice span{font-size:16px!important}.secondary-person-choice strong{font-size:12px!important}.secondary-person-choice small{display:none!important}.edit-person-choice{margin-top:0!important}.swipe-pop{animation:swipePop .22s ease}@keyframes swipePop{from{opacity:.65;transform:translateX(8px)}to{opacity:1;transform:none}}
  `;document.head.appendChild(css);

  cleanEntryDialog();ensureProfileThemeEditor();hydrateProfileThemes();persistFriends();decorateChoice();bindSwipe();renderHome();
})();