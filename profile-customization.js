(() => {
  const FONT_MAP = {
    classic: "Georgia, 'Times New Roman', serif",
    elegant: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    clean: "'Trebuchet MS', Arial, sans-serif",
    typewriter: "'Courier New', Courier, monospace"
  };

  function readStoredFriends(){
    try{
      const raw=localStorage.getItem(DATA_KEY);
      const parsed=JSON.parse(raw||'[]');
      return Array.isArray(parsed)?parsed:(Array.isArray(parsed?.friends)?parsed.friends:[]);
    }catch{return [];}
  }

  function hydrateProfileThemes(){
    const stored=new Map(readStoredFriends().map(f=>[f.id,f]));
    state.friends.forEach(friend=>{
      const saved=stored.get(friend.id)||{};
      friend.profileBg=saved.profileBg||friend.profileBg||'#1b1326';
      friend.profileText=saved.profileText||friend.profileText||'#f4edf7';
      friend.profileFont=saved.profileFont||friend.profileFont||'classic';
    });
  }

  function cleanEntryDialog(){
    const row=document.querySelector('.emoji-value-row');
    if(row && !$('entryTitle')?.closest('.entry-title-only')){
      const existingTitle=$('entryTitle');
      const titleValue=existingTitle?.value||'';
      row.innerHTML=`<input id="entryEmoji" type="hidden" value=""><label class="grow entry-title-only">Title<input id="entryTitle" maxlength="80" value="${esc(titleValue)}"></label>`;
    }
    const infoLabel=$('entryValueLabel');
    if(infoLabel && !infoLabel.querySelector('.entry-info-label')){
      const old=$('entryValue');
      const value=old?.value||'';
      infoLabel.innerHTML=`<span class="entry-info-label">Info <small>shown in grey brackets beneath the title</small></span><textarea id="entryValue" rows="3" maxlength="800">${esc(value)}</textarea>`;
    }
  }

  function ensureProfileThemeEditor(){
    const form=$('friendForm');
    const styleEditor=$('personStyleEditor');
    const saveBtn=form?.querySelector('.primary-button');
    if(!form||!saveBtn||$('profileThemeEditor')) return;
    const box=document.createElement('div');
    box.id='profileThemeEditor';
    box.className='profile-theme-editor';
    box.innerHTML=`
      <div class="profile-theme-heading"><strong>Character profile</strong><small>Make each person feel different</small></div>
      <div class="profile-theme-colours">
        <label>Background colour<input id="friendProfileBg" type="color" value="#1b1326"></label>
        <label>Text colour<input id="friendProfileText" type="color" value="#f4edf7"></label>
      </div>
      <label class="profile-font-label">Font
        <select id="friendProfileFont">
          <option value="classic">Classic serif</option>
          <option value="elegant">Elegant</option>
          <option value="clean">Clean</option>
          <option value="typewriter">Typewriter</option>
        </select>
      </label>`;
    if(styleEditor) styleEditor.insertAdjacentElement('afterend',box);
    else form.insertBefore(box,saveBtn);
  }

  function setThemeFields(friend){
    ensureProfileThemeEditor();
    if($('friendProfileBg')) $('friendProfileBg').value=friend?.profileBg||'#1b1326';
    if($('friendProfileText')) $('friendProfileText').value=friend?.profileText||'#f4edf7';
    if($('friendProfileFont')) $('friendProfileFont').value=friend?.profileFont||'classic';
  }

  const previousOpenFriendDialog=openFriendDialog;
  openFriendDialog=function(friend=null){
    previousOpenFriendDialog(friend);
    setThemeFields(friend);
  };

  function ensureIdBeforeSave(){
    if($('friendId') && !$('friendId').value) $('friendId').value=uid();
  }

  const saveBtn=$('friendForm')?.querySelector('.primary-button');
  saveBtn?.addEventListener('click',ensureIdBeforeSave,{capture:true});
  saveBtn?.addEventListener('click',()=>{
    queueMicrotask(()=>{
      const id=$('friendId')?.value;
      const friend=state.friends.find(f=>f.id===id);
      if(!friend) return;
      friend.profileBg=$('friendProfileBg')?.value||'#1b1326';
      friend.profileText=$('friendProfileText')?.value||'#f4edf7';
      friend.profileFont=$('friendProfileFont')?.value||'classic';
      persistFriends();
    });
  });

  function fallbackEmojis(friend){
    if(Array.isArray(friend?.frameEmojis)&&friend.frameEmojis.filter(Boolean).length) return friend.frameEmojis.filter(Boolean).slice(0,3);
    if(friend?.frameStyle==='flowers') return ['🌸'];
    if(friend?.frameStyle==='shards') return ['💎'];
    return ['🌸'];
  }

  function wreathMarkup(emojis,count=24){
    const list=(emojis||[]).filter(Boolean).slice(0,3);
    if(!list.length) return '';
    const sizes=[1,.78,1.13,.88,1.02,.72,1.18,.84];
    const nudges=[0,-3,2,-1,3,-2,1,-3];
    let html='';
    for(let i=0;i<count;i++){
      const angle=(360/count)*i-90;
      const rad=angle*Math.PI/180;
      const radius=43+nudges[i%nudges.length];
      const x=50+Math.cos(rad)*radius;
      const y=50+Math.sin(rad)*radius;
      const size=sizes[i%sizes.length];
      const rotate=((i*37)%48)-24;
      html+=`<span class="emoji-wreath-piece" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;--emoji-size:${size};transform:translate(-50%,-50%) rotate(${rotate}deg)">${esc(list[i%list.length])}</span>`;
    }
    return html;
  }

  function entryMarkup(e){
    if(e.type==='date'){
      const d=formatPartialDate(e.day,e.month,e.year);
      const main=e.title||'Important date';
      return `<li><span class="entry-main">${esc(main)}</span>${d?`<span class="entry-detail">(${esc(d)})</span>`:''}</li>`;
    }
    const hasTitle=Boolean(e.title?.trim());
    const main=hasTitle?e.title:(e.value||'');
    const detail=hasTitle&&e.value?e.value:'';
    return `<li><span class="entry-main">${esc(main)}</span>${detail?`<span class="entry-detail">(${esc(detail)})</span>`:''}</li>`;
  }

  renderRead=function(){
    const f=selected(),p=$('readPanel');
    if(!f||!p) return;
    const style=f.frameStyle==='plain'?'plain':'emoji';
    const frameColor=f.frameColor||settings.accent;
    const bubbleColor=f.bubbleColor||settings.bubble;
    const profileBg=f.profileBg||'#1b1326';
    const profileText=f.profileText||'#f4edf7';
    const fontKey=FONT_MAP[f.profileFont]?f.profileFont:'classic';
    const face=f.imageData?`<img class="read-profile-photo" src="${f.imageData}" alt="">`:`<div class="read-profile-initials">${esc(initials(f.name))}</div>`;
    const bd=formatPartialDate(f.birthdayDay,f.birthdayMonth,f.birthdayYear);
    const portraitFrame=style==='emoji'?`<span class="frame-layer emoji-wreath">${wreathMarkup(fallbackEmojis(f),24)}</span>`:`<span class="frame-layer"></span>`;
    p.innerHTML=`<section class="character-sheet character-frame-${style} profile-font-${fontKey}" style="--profile-frame:${esc(frameColor)};--profile-bubble:${esc(bubbleColor)};--profile-bg:${esc(profileBg)};--profile-text:${esc(profileText)}"><div class="character-card-actions"><button class="character-back" id="backToChoices">‹ Back</button><span>FRIEND DOSSIER</span><button class="character-edit" id="editReadBtn">Edit</button></div><span class="sheet-corner corner-a">✦</span><span class="sheet-corner corner-b">✦</span><span class="sheet-corner corner-c">✦</span><span class="sheet-corner corner-d">✦</span><div class="character-title-rule"><span></span><b>✧</b><span></span></div><div class="character-profile-head"><div class="character-portrait-wrap frame-${style}">${portraitFrame}${face}</div><div class="character-name-block"><div class="character-name">${esc(f.name)}</div>${f.relationship?`<div class="character-role">${esc(f.relationship)}</div>`:''}${bd?`<div class="character-birthday">🎂 ${esc(bd)}</div>`:''}</div></div><div class="character-divider"><span></span><b>◆</b><span></span></div><div id="readStory" class="character-sections"></div><div class="character-footer-ornament">✦ · ✧ · ✦</div></section>`;
    $('backToChoices').onclick=showChoice;
    $('editReadBtn').onclick=renderReadEdit;
    const story=$('readStory');
    if(!f.entries.length){story.innerHTML='<div class="read-empty">No lore recorded yet ✦</div>';return;}
    const groups=new Map();
    f.entries.forEach(e=>{if(!groups.has(e.type))groups.set(e.type,[]);groups.get(e.type).push(e);});
    for(const [type,entries] of groups){
      const c=categoryFor(type);
      const usable=entries.filter(e=>e.type==='date'||e.title||e.value);
      if(!usable.length) continue;
      const section=document.createElement('section');
      section.className='character-section';
      section.innerHTML=`<div class="character-section-title"><strong>${esc(c.name)}</strong></div><ul>${usable.map(entryMarkup).join('')}</ul>`;
      story.appendChild(section);
    }
  };

  const originalOpenEntryDialog=openEntryDialog;
  openEntryDialog=function(type,entry=null){
    cleanEntryDialog();
    originalOpenEntryDialog(type,entry);
    if($('entryEmoji')) $('entryEmoji').value='';
  };

  const css=document.createElement('style');
  css.id='profileCustomizationStyles';
  css.textContent=`
    .emoji-value-row{grid-template-columns:1fr!important}.entry-title-only{width:100%}
    .entry-info-label{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.entry-info-label small{font-size:10px!important;font-weight:500;color:var(--muted);text-transform:none;letter-spacing:0}
    .character-section-title{justify-content:center!important;text-align:center;margin-bottom:10px!important}
    .character-section-title strong{font-size:18px!important;letter-spacing:.065em!important;text-transform:uppercase}
    .character-section li{display:grid;gap:2px;padding:5px 0 5px 2px}
    .entry-main{font-weight:750;color:var(--profile-text)}
    .entry-detail{display:block;font-size:11px;color:color-mix(in srgb,var(--profile-text) 58%,transparent);font-weight:500;margin-top:1px}
    .character-sheet{background:radial-gradient(circle at 50% -15%,color-mix(in srgb,var(--profile-frame) 16%,transparent),transparent 42%),linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.015)),var(--profile-bg)!important;color:var(--profile-text)!important}
    .character-name,.character-card-actions button,.character-section li,.read-empty{color:var(--profile-text)!important}
    .character-birthday{color:color-mix(in srgb,var(--profile-text) 86%,transparent)!important}
    .profile-font-classic{font-family:${FONT_MAP.classic}}.profile-font-classic .character-name,.profile-font-classic .character-section-title strong{font-family:${FONT_MAP.classic}}
    .profile-font-elegant{font-family:${FONT_MAP.elegant}}.profile-font-elegant .character-name,.profile-font-elegant .character-section-title strong{font-family:${FONT_MAP.elegant}}
    .profile-font-clean{font-family:${FONT_MAP.clean}}.profile-font-clean .character-name,.profile-font-clean .character-section-title strong{font-family:${FONT_MAP.clean}}
    .profile-font-typewriter{font-family:${FONT_MAP.typewriter}}.profile-font-typewriter .character-name,.profile-font-typewriter .character-section-title strong{font-family:${FONT_MAP.typewriter}}
    .profile-theme-editor{margin-top:15px;padding:15px;border-radius:18px;border:1px solid rgba(255,255,255,.09);background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))}
    .profile-theme-heading{display:flex;justify-content:space-between;gap:12px;align-items:baseline;margin-bottom:12px}.profile-theme-heading strong{font-size:15px}.profile-theme-heading small{color:var(--muted);font-size:10px;text-align:right}
    .profile-theme-colours{display:grid;grid-template-columns:1fr 1fr;gap:10px}.profile-theme-colours label,.profile-font-label{display:grid;gap:6px;color:var(--muted);font-size:11px}.profile-theme-colours input[type=color]{width:100%;height:44px;border-radius:12px;padding:4px}
    .profile-font-label{margin-top:11px}.profile-font-label select{width:100%;padding:11px 12px;border-radius:12px}
  `;
  document.head.appendChild(css);

  cleanEntryDialog();
  ensureProfileThemeEditor();
  hydrateProfileThemes();
  persistFriends();
  renderHome();
})();
