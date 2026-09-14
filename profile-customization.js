(() => {
  const FONT_MAP = {
    classic: "Georgia, 'Times New Roman', serif",
    elegant: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    clean: "'Trebuchet MS', Arial, sans-serif",
    typewriter: "'Courier New', Courier, monospace",
    storybook: "Garamond, 'Times New Roman', serif",
    handwritten: "'Segoe Print', 'Comic Sans MS', cursive"
  };
  const FONT_LABELS = {
    classic:'Classic serif', elegant:'Elegant', clean:'Clean', typewriter:'Typewriter', storybook:'Storybook', handwritten:'Handwritten'
  };
  const RECENT_KEY='friendDossier.recentColours.v1';
  const COLOUR_TARGETS=[
    ['friendBubbleColour','Bubble'],['friendFrameColour','Frame'],['friendProfileBg','Background'],['friendProfileText','Body text'],['friendProfileHeading','Headings'],['friendProfileSparkle','Sparkles']
  ];
  let activeColourTarget='friendProfileBg';

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
      friend.profileFont=saved.profileFont||friend.profileFont||'classic';
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
    ['friendBubbleColour','friendFrameColour'].forEach(id=>{const el=$(id);if(el){el.tabIndex=-1;el.setAttribute('aria-hidden','true');}});
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
      <div class="font-picker-wrap"><div class="font-picker-title">Font</div><div id="fontOptions" class="font-options">${Object.keys(FONT_MAP).map(key=>`<button type="button" class="font-option" data-font="${key}" style="font-family:${FONT_MAP[key]}"><span>Aa Mooncakes</span><small>${FONT_LABELS[key]}</small></button>`).join('')}</div><input id="friendProfileFont" type="hidden" value="classic"></div>`;
    if(styleEditor) styleEditor.insertAdjacentElement('afterend',box); else form.insertBefore(box,saveBtn);
    box.querySelectorAll('.colour-property').forEach(btn=>btn.onclick=()=>selectColourTarget(btn.dataset.colourTarget));
    ['colourHue','colourSat','colourVal'].forEach(id=>$(id)?.addEventListener('input',updateColourFromHSV));
    ['colourHue','colourSat','colourVal'].forEach(id=>$(id)?.addEventListener('change',()=>addRecentColour($(activeColourTarget)?.value)));
    $('colourHex')?.addEventListener('change',()=>{const hex=normalHex($('colourHex').value,$(activeColourTarget)?.value||'#ffffff');setTargetColour(activeColourTarget,hex,true);addRecentColour(hex);});
    box.querySelectorAll('.font-option').forEach(btn=>btn.onclick=()=>selectFont(btn.dataset.font));
    renderRecentColours();
  }

  function selectFont(key){if(!FONT_MAP[key])key='classic';if($('friendProfileFont'))$('friendProfileFont').value=key;document.querySelectorAll('.font-option').forEach(b=>b.classList.toggle('active',b.dataset.font===key));}
  function targetLabel(id){return COLOUR_TARGETS.find(x=>x[0]===id)?.[1]||'Colour';}
  function setTargetColour(id,hex,syncPicker=false){const el=$(id);if(!el)return;el.value=normalHex(hex);const btn=document.querySelector(`[data-colour-target="${id}"]`);if(btn)btn.querySelector('.colour-dot').style.background=el.value;if(syncPicker&&id===activeColourTarget)syncPickerToColour(el.value);}
  function selectColourTarget(id){activeColourTarget=id;document.querySelectorAll('.colour-property').forEach(b=>b.classList.toggle('active',b.dataset.colourTarget===id));if($('activeColourLabel'))$('activeColourLabel').textContent=targetLabel(id);syncPickerToColour($(id)?.value||'#ffffff');}
  function syncPickerToColour(hex){hex=normalHex(hex);const {r,g,b}=hexToRgb(hex),hsv=rgbToHsv(r,g,b);$('colourHue').value=hsv.h;$('colourSat').value=hsv.s;$('colourVal').value=hsv.v;$('colourHex').value=hex;updateSliderVisuals(hsv.h,hsv.s,hsv.v);}
  function updateColourFromHSV(){const h=Number($('colourHue').value),s=Number($('colourSat').value),v=Number($('colourVal').value),hex=hsvToHex(h,s,v);setTargetColour(activeColourTarget,hex);$('colourHex').value=hex;updateSliderVisuals(h,s,v);}
  function updateSliderVisuals(h,s,v){$('hueValue').textContent=`${h}°`;$('satValue').textContent=`${s}%`;$('valValue').textContent=`${v}%`;const pure=hsvToHex(h,100,100),satColour=hsvToHex(h,s,100);$('colourHue').style.background='linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)';$('colourSat').style.background=`linear-gradient(90deg,${pure},#fff)`;$('colourVal').style.background=`linear-gradient(90deg,${satColour},#000)`;}
  function renderRecentColours(){const box=$('recentColours');if(!box)return;const colours=recentColours();box.innerHTML=colours.length?colours.map(c=>`<button type="button" class="recent-colour" data-colour="${c}" style="background:${c}" aria-label="Use ${c}"></button>`).join(''):'<span class="recent-empty">Colours you choose will appear here.</span>';box.querySelectorAll('.recent-colour').forEach(btn=>btn.onclick=()=>setTargetColour(activeColourTarget,btn.dataset.colour,true));}

  function setThemeFields(friend){
    ensureProfileThemeEditor();
    const values={friendBubbleColour:friend?.bubbleColor||settings.bubble,friendFrameColour:friend?.frameColor||settings.accent,friendProfileBg:friend?.profileBg||'#1b1326',friendProfileText:friend?.profileText||'#f4edf7',friendProfileHeading:friend?.profileHeading||friend?.frameColor||'#f6d5ff',friendProfileSparkle:friend?.profileSparkle||friend?.frameColor||settings.accent};
    Object.entries(values).forEach(([id,val])=>setTargetColour(id,val));
    selectFont(friend?.profileFont||'classic');selectColourTarget('friendProfileBg');
  }

  const previousOpenFriendDialog=openFriendDialog;
  openFriendDialog=function(friend=null){previousOpenFriendDialog(friend);setThemeFields(friend);};
  function ensureIdBeforeSave(){if($('friendId')&&!$('friendId').value)$('friendId').value=uid();}
  const saveBtn=$('friendForm')?.querySelector('.primary-button');
  saveBtn?.addEventListener('click',ensureIdBeforeSave,{capture:true});
  saveBtn?.addEventListener('click',()=>{queueMicrotask(()=>{const id=$('friendId')?.value,friend=state.friends.find(f=>f.id===id);if(!friend)return;friend.profileBg=$('friendProfileBg')?.value||'#1b1326';friend.profileText=$('friendProfileText')?.value||'#f4edf7';friend.profileHeading=$('friendProfileHeading')?.value||friend.frameColor||'#f6d5ff';friend.profileSparkle=$('friendProfileSparkle')?.value||friend.frameColor||settings.accent;friend.profileFont=$('friendProfileFont')?.value||'classic';COLOUR_TARGETS.forEach(([target])=>{const v=$(target)?.value;if(v)addRecentColour(v)});persistFriends();});});

  function fallbackEmojis(friend){if(Array.isArray(friend?.frameEmojis)&&friend.frameEmojis.filter(Boolean).length)return friend.frameEmojis.filter(Boolean).slice(0,3);if(friend?.frameStyle==='flowers')return['🌸'];if(friend?.frameStyle==='shards')return['💎'];return[];}
  function wreathMarkup(emojis,count=24){const list=(emojis||[]).filter(Boolean).slice(0,3);if(!list.length)return'';const sizes=[1,.78,1.13,.88,1.02,.72,1.18,.84],nudges=[0,-3,2,-1,3,-2,1,-3];let html='';for(let i=0;i<count;i++){const angle=(360/count)*i-90,rad=angle*Math.PI/180,radius=43+nudges[i%nudges.length],x=50+Math.cos(rad)*radius,y=50+Math.sin(rad)*radius,size=sizes[i%sizes.length],rotate=((i*37)%48)-24;html+=`<span class="emoji-wreath-piece" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;--emoji-size:${size};transform:translate(-50%,-50%) rotate(${rotate}deg)">${esc(list[i%list.length])}</span>`;}return html;}
  function entryMarkup(e){if(e.type==='date'){const d=formatPartialDate(e.day,e.month,e.year),main=e.title||'Important date';return`<li><span class="entry-main">${esc(main)}</span>${d?`<span class="entry-detail">(${esc(d)})</span>`:''}</li>`;}const hasTitle=Boolean(e.title?.trim()),main=hasTitle?e.title:(e.value||''),detail=hasTitle&&e.value?e.value:'';return`<li><span class="entry-main">${esc(main)}</span>${detail?`<span class="entry-detail">(${esc(detail)})</span>`:''}</li>`;}

  renderRead=function(){
    const f=selected(),p=$('readPanel');if(!f||!p)return;
    const emojis=fallbackEmojis(f),style=f.frameStyle==='plain'||!emojis.length?'plain':'emoji';
    const frameColor=f.frameColor||settings.accent,bubbleColor=f.bubbleColor||settings.bubble,profileBg=f.profileBg||'#1b1326',profileText=f.profileText||'#f4edf7',heading=f.profileHeading||frameColor,sparkle=f.profileSparkle||frameColor,fontKey=FONT_MAP[f.profileFont]?f.profileFont:'classic';
    const face=f.imageData?`<img class="read-profile-photo" src="${f.imageData}" alt="">`:`<div class="read-profile-initials">${esc(initials(f.name))}</div>`,bd=formatPartialDate(f.birthdayDay,f.birthdayMonth,f.birthdayYear),portraitFrame=style==='emoji'?`<span class="frame-layer emoji-wreath">${wreathMarkup(emojis,24)}</span>`:`<span class="frame-layer"></span>`;
    p.innerHTML=`<section class="character-sheet character-frame-${style} profile-font-${fontKey}" style="--profile-frame:${esc(frameColor)};--profile-bubble:${esc(bubbleColor)};--profile-bg:${esc(profileBg)};--profile-text:${esc(profileText)};--profile-heading:${esc(heading)};--profile-sparkle:${esc(sparkle)}"><div class="character-card-actions"><button class="character-back" id="backToChoices">‹ Back</button><span>FRIEND DOSSIER</span><button class="character-edit" id="editReadBtn">Edit</button></div><span class="sheet-corner corner-a">✦</span><span class="sheet-corner corner-b">✦</span><span class="sheet-corner corner-c">✦</span><span class="sheet-corner corner-d">✦</span><div class="character-title-rule"><span></span><b>✧</b><span></span></div><div class="character-profile-head"><div class="character-portrait-wrap frame-${style}">${portraitFrame}${face}</div><div class="character-name-block"><div class="character-name">${esc(f.name)}</div>${f.relationship?`<div class="character-role">${esc(f.relationship)}</div>`:''}${bd?`<div class="character-birthday">🎂 ${esc(bd)}</div>`:''}</div></div><div class="character-divider"><span></span><b>◆</b><span></span></div><div id="readStory" class="character-sections"></div><div class="character-footer-ornament">✦ · ✧ · ✦</div></section>`;
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
    .font-picker-wrap{margin-top:15px}.font-options{display:grid;grid-template-columns:1fr 1fr;gap:8px}.font-option{min-height:68px;border-radius:13px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);color:var(--text);padding:8px;display:grid;place-items:center;gap:3px}.font-option span{font-size:17px}.font-option small{font-family:system-ui,sans-serif!important;font-size:9px;color:var(--muted)}.font-option.active{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent)}
    .character-choice-panel{grid-template-columns:1fr 1fr!important;gap:10px!important}.read-primary-choice{grid-column:1/-1!important;min-height:150px!important;position:relative!important;overflow:hidden!important;border:1px solid color-mix(in srgb,var(--accent) 48%,transparent)!important;background:radial-gradient(circle at 80% 20%,color-mix(in srgb,var(--accent) 20%,transparent),transparent 35%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.025))!important}.read-primary-choice .choice-book{font-size:38px!important}.read-primary-choice strong{font-size:22px!important;font-family:Georgia,serif}.read-primary-choice small{font-size:11px!important;letter-spacing:.04em}.read-primary-choice i{position:absolute;right:18px;top:14px;color:var(--accent);font-style:normal;opacity:.75}.secondary-person-choice{grid-column:auto!important;min-height:64px!important;padding:10px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important}.secondary-person-choice span{font-size:16px!important}.secondary-person-choice strong{font-size:12px!important}.secondary-person-choice small{display:none!important}.edit-person-choice{margin-top:0!important}.swipe-pop{animation:swipePop .22s ease}@keyframes swipePop{from{opacity:.65;transform:translateX(8px)}to{opacity:1;transform:none}}
  `;document.head.appendChild(css);

  cleanEntryDialog();ensureProfileThemeEditor();hydrateProfileThemes();persistFriends();decorateChoice();bindSwipe();renderHome();
})();