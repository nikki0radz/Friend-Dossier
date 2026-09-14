const DATA_KEY = 'friendDossier.v4';
const LEGACY_KEYS = ['friendDossier.v3', 'friendDossier.v2', 'peopleNotes.v1'];
const SETTINGS_KEY = 'friendDossier.settings.v3';
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DEFAULT_CATEGORIES = [
  {id:'allergy',name:'Allergy / avoid',emoji:'⚠️'},
  {id:'date',name:'Important date',emoji:'📅'},
  {id:'gift',name:'Gift idea',emoji:'🎁'},
  {id:'like',name:'Thing they like',emoji:'💜'},
  {id:'note',name:'Note',emoji:'✎'},
  {id:'food',name:'Food / drink',emoji:'🍜'}
];

let state = { friends: [], selectedId: null };
let settings = {
  bg:'#171124',
  accent:'#e2b5ff',
  bubble:'#b9d8ff',
  categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES))
};

const $ = id => document.getElementById(id);
const homeTools = () => document.querySelector('.home-tools');
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const esc = (v='') => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const initials = (name='') => name.trim().split(/\s+/).slice(0,2).map(x => x[0]?.toUpperCase() || '').join('') || '?';

function showToast(msg){
  const t = $('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => t.classList.remove('show'), 1700);
}

function safeOpen(dialog){
  if(!dialog) return;
  try { if(!dialog.open) dialog.showModal(); } catch { dialog.setAttribute('open',''); }
}
function safeClose(dialog){
  if(!dialog) return;
  try { if(dialog.open) dialog.close(); } catch { dialog.removeAttribute('open'); }
}

function populateMonths(){
  ['birthdayMonth','entryMonth'].forEach(id => {
    const select = $(id);
    if(!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">Month</option>' + MONTHS.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('');
    if(current) select.value = current;
  });
}

function formatPartialDate(day,month,year){
  if(!day || !month) return '';
  const base = `${Number(day)} ${MONTHS[Number(month)-1]}`;
  return year ? `${base} ${year}` : base;
}

function toArray(v){
  if(Array.isArray(v)) return v;
  if(typeof v === 'string') return v.split(/\n|,/).map(x=>x.trim()).filter(Boolean);
  return [];
}

function normalizeFriend(f={}){
  if(Array.isArray(f.entries)){
    return {
      id:f.id || uid(), name:f.name || 'Unnamed', relationship:f.relationship || '', imageData:f.imageData || '',
      birthdayDay:f.birthdayDay || '', birthdayMonth:f.birthdayMonth || '', birthdayYear:f.birthdayYear || '',
      entries:f.entries, bubbleColor:f.bubbleColor || '', frameStyle:f.frameStyle || 'plain', frameColor:f.frameColor || ''
    };
  }
  const entries=[];
  const push=(type,emoji,title,value)=>{ if(value) entries.push({id:uid(),type,emoji,title,value}); };
  toArray(f.gifts).forEach(v=>push('gift','🎁','',v));
  toArray(f.likes).forEach(v=>push('like','💜','',v));
  push('allergy','⚠️','',f.allergies || '');
  push('note','✎','',f.notes || '');
  toArray(f.custom).forEach(v=>{ if(v && typeof v==='object') push('note','✦',v.label || '',v.value || ''); });
  if(f.otherDate){
    entries.push({id:uid(),type:'date',emoji:'📅',title:f.otherDateLabel || 'Important date',value:'',day:Number(f.otherDate.slice(8,10)),month:Number(f.otherDate.slice(5,7)),year:Number(f.otherDate.slice(0,4))});
  }
  let birthdayDay='', birthdayMonth='', birthdayYear='';
  if(f.birthday){ birthdayYear=Number(f.birthday.slice(0,4)); birthdayMonth=Number(f.birthday.slice(5,7)); birthdayDay=Number(f.birthday.slice(8,10)); }
  return {id:f.id||uid(),name:f.name||'Unnamed',relationship:f.relationship||'',imageData:f.imageData||'',birthdayDay,birthdayMonth,birthdayYear,entries,bubbleColor:'',frameStyle:'plain',frameColor:''};
}

function persistFriends(){
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(state.friends));
    return true;
  } catch(err){
    console.error('Friend Dossier save failed', err);
    return false;
  }
}

function loadData(){
  let migrated = false;
  try {
    let raw = localStorage.getItem(DATA_KEY);
    if(!raw){
      for(const key of LEGACY_KEYS){
        const candidate = localStorage.getItem(key);
        if(candidate){ raw = candidate; migrated = true; break; }
      }
    }
    if(raw){
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.friends) ? parsed.friends : []);
      state.friends = arr.map(normalizeFriend);
      if(migrated) persistFriends();
    }
  } catch(err){
    console.error('Friend Dossier load failed', err);
    state.friends = [];
  }
  try {
    const rawSettings = localStorage.getItem(SETTINGS_KEY);
    if(rawSettings){
      const parsed = JSON.parse(rawSettings);
      settings = {...settings,...parsed,categories:Array.isArray(parsed.categories)?parsed.categories:settings.categories};
    }
  } catch(err){ console.warn('Settings load failed',err); }
  applySettings();
}

function persistSettings(){
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  applySettings();
}
function applySettings(){
  document.documentElement.style.setProperty('--bg',settings.bg);
  document.documentElement.style.setProperty('--accent',settings.accent);
  document.documentElement.style.setProperty('--bubble',settings.bubble);
}
function selected(){ return state.friends.find(f=>f.id===state.selectedId); }

function frameMarkup(style){
  if(style==='flowers') return `<span class="frame-flower f1">✿</span><span class="frame-flower f2">❀</span><span class="frame-flower f3">✿</span><span class="frame-flower f4">❀</span><span class="frame-flower f5">✿</span><span class="frame-flower f6">❀</span><span class="frame-flower f7">✿</span><span class="frame-flower f8">❀</span>`;
  if(style==='shards') return `<span class="frame-shard s1"></span><span class="frame-shard s2"></span><span class="frame-shard s3"></span><span class="frame-shard s4"></span><span class="frame-shard s5"></span><span class="frame-shard s6"></span><span class="frame-shard s7"></span><span class="frame-shard s8"></span>`;
  return '';
}

function renderHome(){
  const grid=$('peopleGrid');
  if(!grid) return;
  const q=($('searchInput')?.value || '').trim().toLowerCase();
  grid.innerHTML='';
  state.friends
    .filter(f=>`${f.name} ${f.relationship}`.toLowerCase().includes(q))
    .sort((a,b)=>a.name.localeCompare(b.name))
    .forEach(f=>{
      const b=document.createElement('button');
      const frame=f.frameStyle||'plain';
      b.className=`person-bubble frame-${frame}`;
      b.style.setProperty('--person-bubble',f.bubbleColor||settings.bubble);
      b.style.setProperty('--frame-color',f.frameColor||settings.accent);
      const face=f.imageData?`<img src="${f.imageData}" alt="">`:`<div class="bubble-initials">${esc(initials(f.name))}</div>`;
      b.innerHTML=`<span class="frame-layer">${frameMarkup(frame)}</span>${face}<div class="bubble-label">${esc(f.name)}${f.relationship?`<span class="bubble-relation">${esc(f.relationship)}</span>`:''}</div>`;
      b.addEventListener('click',()=>openPerson(f.id));
      grid.appendChild(b);
    });
}

function openPerson(id){
  state.selectedId=id;
  $('homeView')?.classList.add('hidden');
  $('personView')?.classList.remove('hidden');
  homeTools()?.classList.add('hidden');
  renderPersonHero();
  showChoice();
}
function goHome(){
  $('personView')?.classList.add('hidden');
  $('homeView')?.classList.remove('hidden');
  homeTools()?.classList.remove('hidden');
  state.selectedId=null;
  renderHome();
}
function renderPersonHero(){
  const f=selected(); if(!f) return;
  const face=f.imageData?`<img class="hero-photo" src="${f.imageData}" alt="">`:`<div class="hero-initials">${esc(initials(f.name))}</div>`;
  const bd=formatPartialDate(f.birthdayDay,f.birthdayMonth,f.birthdayYear);
  $('personHero').innerHTML=`${face}<h1>${esc(f.name)}</h1>${f.relationship?`<p>${esc(f.relationship)}</p>`:''}${bd?`<span class="birthday-pill">🎂 ${esc(bd)}</span>`:''}`;
}
function ensureEditChoice(){
  const panel=$('personChoice'); if(!panel || $('editPersonBtn')) return;
  const b=document.createElement('button');
  b.id='editPersonBtn'; b.className='big-choice edit-person-choice';
  b.innerHTML='<span>🎨</span><strong>Edit person</strong><small>Photo, birthday & bubble style</small>';
  b.addEventListener('click',()=>openFriendDialog(selected()));
  panel.appendChild(b);
}
function showChoice(){
  $('personChoice')?.classList.remove('hidden');
  $('readPanel')?.classList.add('hidden');
  $('addInfoPanel')?.classList.add('hidden');
  ensureEditChoice();
}
function showRead(){
  $('personChoice')?.classList.add('hidden');
  $('addInfoPanel')?.classList.add('hidden');
  $('readPanel')?.classList.remove('hidden');
  renderRead();
}
function categoryFor(type){ return settings.categories.find(c=>c.id===type)||{id:type,name:type,emoji:'✦'}; }
function naturalList(values){
  if(values.length===1) return values[0];
  if(values.length===2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0,-1).join(', ')} and ${values.at(-1)}`;
}
function sentenceForGroup(type,entries){
  const values=entries.map(e=>e.title&&e.value?`${e.title}: ${e.value}`:(e.value||e.title||'')).filter(Boolean);
  if(!values.length) return '';
  if(type==='allergy') return `Is allergic to / should avoid ${naturalList(values)}.`;
  if(type==='like') return `Likes ${naturalList(values)}.`;
  if(type==='gift') return `Gift ideas include ${naturalList(values)}.`;
  if(type==='food') return `Favourite food / drink: ${naturalList(values)}.`;
  if(type==='note') return '';
  return `${categoryFor(type).name}: ${naturalList(values)}.`;
}
function renderRead(){
  const f=selected(), p=$('readPanel'); if(!f||!p) return;
  const face=f.imageData?`<img class="read-profile-photo" src="${f.imageData}" alt="">`:`<div class="read-profile-initials">${esc(initials(f.name))}</div>`;
  const bd=formatPartialDate(f.birthdayDay,f.birthdayMonth,f.birthdayYear);
  p.innerHTML=`<div class="read-topbar"><button class="back-link" id="backToChoices">‹ Back</button><button class="read-edit-button" id="editReadBtn">Edit</button></div><section class="read-profile"><div class="read-profile-head">${face}<div><h1>${esc(f.name)}</h1>${f.relationship?`<p>${esc(f.relationship)}</p>`:''}${bd?`<div class="read-birthday">🎂 Born ${esc(bd)}</div>`:''}</div></div><div id="readStory" class="read-story"></div></section>`;
  $('backToChoices').onclick=showChoice;
  $('editReadBtn').onclick=renderReadEdit;
  const story=$('readStory');
  if(!f.entries.length){ story.innerHTML='<div class="read-empty">Nothing written here yet ✦</div>'; return; }
  const groups=new Map();
  f.entries.forEach(e=>{ if(!groups.has(e.type)) groups.set(e.type,[]); groups.get(e.type).push(e); });
  for(const [type,entries] of groups){
    if(type==='date'){
      const sec=document.createElement('div'); sec.className='profile-prose-block'; sec.innerHTML='<div class="profile-prose-label">📅 Important dates</div>';
      entries.forEach(e=>{ const d=formatPartialDate(e.day,e.month,e.year); const row=document.createElement('p'); row.innerHTML=`<span>${esc(e.emoji||'📅')}</span> <strong>${esc(e.title||'Important date')}</strong>${d?` is on ${esc(d)}`:''}.`; sec.appendChild(row); });
      story.appendChild(sec); continue;
    }
    if(type==='note'){
      const sec=document.createElement('div'); sec.className='profile-prose-block note-block'; sec.innerHTML='<div class="profile-prose-label">✎ Notes</div>';
      entries.forEach(e=>{ const row=document.createElement('p'); row.textContent=e.title?`${e.title}: ${e.value||''}`:(e.value||''); sec.appendChild(row); });
      story.appendChild(sec); continue;
    }
    const text=sentenceForGroup(type,entries); if(!text) continue;
    const c=categoryFor(type), sec=document.createElement('div'); sec.className='profile-prose-line'; sec.innerHTML=`<span class="profile-prose-emoji">${esc(c.emoji)}</span><p>${esc(text)}</p>`; story.appendChild(sec);
  }
}
function renderReadEdit(){
  const f=selected(),p=$('readPanel'); if(!f||!p) return;
  p.innerHTML=`<div class="read-topbar"><button class="back-link" id="backToRead">‹ Read</button><span class="edit-mode-title">Edit dossier</span><button class="text-button" id="addFromEdit">＋ Add</button></div><div class="edit-list" id="editList"></div>`;
  $('backToRead').onclick=renderRead; $('addFromEdit').onclick=showAddInfo;
  const list=$('editList');
  if(!f.entries.length){list.innerHTML='<div class="empty-card">Nothing to edit yet.</div>';return;}
  f.entries.forEach(e=>{
    const c=categoryFor(e.type),d=e.type==='date'?formatPartialDate(e.day,e.month,e.year):'';
    const card=document.createElement('div');card.className='edit-list-card';
    card.innerHTML=`<div class="entry-emoji">${esc(e.emoji||c.emoji)}</div><div><small>${esc(c.name)}</small>${e.title?`<strong>${esc(e.title)}</strong>`:''}${e.value?`<p>${esc(e.value)}</p>`:''}${d?`<p>${esc(d)}</p>`:''}</div><div class="edit-list-actions"><button class="soft-button edit-one">Edit</button><button class="text-button delete-one">Delete</button></div>`;
    card.querySelector('.edit-one').onclick=()=>openEntryDialog(e.type,e);
    card.querySelector('.delete-one').onclick=()=>{if(confirm('Delete this item?')){f.entries=f.entries.filter(x=>x.id!==e.id);persistFriends();renderReadEdit();}};
    list.appendChild(card);
  });
}
function showAddInfo(){
  const f=selected(); if(!f) return;
  $('personChoice')?.classList.add('hidden'); $('readPanel')?.classList.add('hidden');
  const p=$('addInfoPanel'); p.classList.remove('hidden');
  p.innerHTML=`<div class="section-top"><h2>Add to ${esc(f.name)}</h2><button class="text-button" id="cancelAddInfo">Done</button></div><div class="category-grid" id="categoryGrid"></div>`;
  $('cancelAddInfo').onclick=showChoice;
  const g=$('categoryGrid'); settings.categories.forEach(c=>{const b=document.createElement('button');b.className='category-button';b.innerHTML=`<span>${esc(c.emoji)}</span><strong>${esc(c.name)}</strong>`;b.onclick=()=>openEntryDialog(c.id);g.appendChild(b);});
}

function injectPersonStyleEditor(){
  if($('personStyleEditor')) return;
  const form=$('friendForm'),saveBtn=form?.querySelector('.primary-button'); if(!form||!saveBtn) return;
  const wrap=document.createElement('div'); wrap.id='personStyleEditor'; wrap.className='person-style-editor';
  wrap.innerHTML=`<h3>Bubble appearance</h3><div class="person-colours"><label>Bubble colour<input id="friendBubbleColour" type="color" value="#b9d8ff"></label><label>Frame colour<input id="friendFrameColour" type="color" value="#e2b5ff"></label></div><div class="frame-heading">Frame</div><div class="frame-picker"><button type="button" data-frame="plain" class="frame-option active"><span class="frame-preview preview-plain"></span><b>Plain</b></button><button type="button" data-frame="flowers" class="frame-option"><span class="frame-preview preview-flowers"></span><b>Flowers</b></button><button type="button" data-frame="shards" class="frame-option"><span class="frame-preview preview-shards"></span><b>Shards</b></button></div><input id="friendFrameStyle" type="hidden" value="plain">`;
  form.insertBefore(wrap,saveBtn);
  wrap.querySelectorAll('.frame-option').forEach(b=>b.onclick=()=>selectFrameOption(b.dataset.frame));
}
function selectFrameOption(frame){
  if($('friendFrameStyle')) $('friendFrameStyle').value=frame;
  document.querySelectorAll('.frame-option').forEach(b=>b.classList.toggle('active',b.dataset.frame===frame));
}
function openFriendDialog(friend=null){
  injectPersonStyleEditor(); populateMonths();
  const form=$('friendForm'); form.reset();
  $('friendId').value=friend?.id||''; $('friendDialogTitle').textContent=friend?'Edit person':'Add friend';
  $('friendName').value=friend?.name||''; $('friendRelation').value=friend?.relationship||'';
  $('birthdayDay').value=friend?.birthdayDay||''; $('birthdayMonth').value=friend?.birthdayMonth||''; $('birthdayYear').value=friend?.birthdayYear||'';
  $('photoData').value=friend?.imageData||''; $('friendBubbleColour').value=friend?.bubbleColor||settings.bubble; $('friendFrameColour').value=friend?.frameColor||settings.accent;
  selectFrameOption(friend?.frameStyle||'plain'); renderPhotoPreview(); safeOpen($('friendDialog'));
}
function renderPhotoPreview(){
  const d=$('photoData')?.value||''; $('photoPreviewWrap').innerHTML=d?`<img src="${d}" alt="">`:'<span>📷</span>';
}
async function resizePhoto(file,max=700,quality=.75){
  return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=reject;r.onload=()=>{const img=new Image();img.onerror=reject;img.onload=()=>{const scale=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',quality));};img.src=r.result;};r.readAsDataURL(file);});
}
function saveFriend(){
  const form=$('friendForm'); if(!form?.reportValidity()) return;
  const id=$('friendId').value||uid();
  const old=state.friends.find(f=>f.id===id);
  const friend={id,name:$('friendName').value.trim(),relationship:$('friendRelation').value.trim(),imageData:$('photoData').value,birthdayDay:Number($('birthdayDay').value)||'',birthdayMonth:Number($('birthdayMonth').value)||'',birthdayYear:Number($('birthdayYear').value)||'',entries:old?.entries||[],bubbleColor:$('friendBubbleColour')?.value||settings.bubble,frameStyle:$('friendFrameStyle')?.value||'plain',frameColor:$('friendFrameColour')?.value||settings.accent};
  const index=state.friends.findIndex(f=>f.id===id);
  if(index>=0) state.friends[index]=friend; else state.friends.push(friend);
  if(!persistFriends()){
    if(index>=0 && old) state.friends[index]=old; else state.friends=state.friends.filter(f=>f.id!==id);
    alert('Could not save this friend. Browser storage may be full. Try removing the photo and saving again.');
    return;
  }
  safeClose($('friendDialog')); renderHome();
  if(state.selectedId===id){renderPersonHero();showChoice();}
  showToast(index>=0?'Person updated':'Friend added');
}

function openEntryDialog(type,entry=null){
  const c=categoryFor(type); populateMonths(); $('entryForm').reset();
  $('entryId').value=entry?.id||''; $('entryType').value=type; $('entryDialogTitle').textContent=entry?`Edit ${c.name}`:`Add ${c.name}`;
  $('entryEmoji').value=entry?.emoji||c.emoji; $('entryTitle').value=entry?.title||''; $('entryValue').value=entry?.value||'';
  $('entryDay').value=entry?.day||''; $('entryMonth').value=entry?.month||''; $('entryYear').value=entry?.year||'';
  const isDate=type==='date'; $('entryDateFields').classList.toggle('hidden',!isDate); $('entryValueLabel').classList.toggle('hidden',isDate); safeOpen($('entryDialog'));
}
function saveEntry(event){
  event.preventDefault(); const f=selected(); if(!f) return;
  const id=$('entryId').value||uid(),type=$('entryType').value;
  const entry={id,type,emoji:$('entryEmoji').value.trim()||categoryFor(type).emoji,title:$('entryTitle').value.trim(),value:$('entryValue').value.trim(),day:Number($('entryDay').value)||'',month:Number($('entryMonth').value)||'',year:Number($('entryYear').value)||''};
  const ix=f.entries.findIndex(x=>x.id===id); if(ix>=0)f.entries[ix]=entry;else f.entries.push(entry);
  if(!persistFriends()){alert('Could not save this info. Browser storage may be full.');return;}
  safeClose($('entryDialog')); showToast(ix>=0?'Updated':'Added');
  if(!$('readPanel').classList.contains('hidden')) renderReadEdit(); else showAddInfo();
}

function openSettings(){
  $('bgColour').value=settings.bg; $('accentColour').value=settings.accent; $('bubbleColour').value=settings.bubble; renderSettingsCategories(); safeOpen($('settingsDialog'));
}
function renderSettingsCategories(){
  const box=$('settingsCategories');box.innerHTML='';
  settings.categories.forEach((c,i)=>{const row=document.createElement('div');row.className='settings-category-row';row.innerHTML=`<input class="cat-emoji" value="${esc(c.emoji)}" maxlength="4"><input class="cat-name" value="${esc(c.name)}" maxlength="50"><button type="button" class="xbtn">×</button>`;row.querySelector('.xbtn').onclick=()=>{settings.categories.splice(i,1);renderSettingsCategories();};box.appendChild(row);});
}
function addCategory(){settings.categories.push({id:`custom-${uid()}`,name:'New category',emoji:'✦'});renderSettingsCategories();}
function saveSettingsFromDialog(){
  document.querySelectorAll('.settings-category-row').forEach((row,i)=>{settings.categories[i].emoji=row.querySelector('.cat-emoji').value.trim()||'✦';settings.categories[i].name=row.querySelector('.cat-name').value.trim()||'Category';});
  settings.bg=$('bgColour').value;settings.accent=$('accentColour').value;settings.bubble=$('bubbleColour').value;persistSettings();safeClose($('settingsDialog'));renderHome();showToast('Settings saved');
}
function exportData(){
  const payload={version:4,exportedAt:new Date().toISOString(),settings,friends:state.friends};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`friend-dossier-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();URL.revokeObjectURL(a.href);a.remove();
}
async function importData(file){
  try{const parsed=JSON.parse(await file.text());const arr=Array.isArray(parsed)?parsed:parsed.friends;if(!Array.isArray(arr))throw Error();if(!confirm(`Import ${arr.length} people and replace current data?`))return;state.friends=arr.map(normalizeFriend);if(parsed.settings)settings={...settings,...parsed.settings};persistFriends();persistSettings();renderHome();safeClose($('settingsDialog'));showToast('Imported');}catch{alert('That backup could not be read.');}finally{$('importInput').value='';}
}

function injectFrameStyles(){
  if($('frameStyles')) return;
  const s=document.createElement('style');s.id='frameStyles';s.textContent=`.person-bubble{--person-bubble:var(--bubble);--frame-color:var(--accent);overflow:visible!important;background:radial-gradient(circle at 29% 18%,rgba(255,255,255,.7) 0 3%,rgba(255,255,255,.22) 5% 15%,transparent 17%),radial-gradient(circle at 70% 72%,color-mix(in srgb,var(--person-bubble) 58%,transparent),transparent 46%),linear-gradient(145deg,rgba(255,255,255,.14),color-mix(in srgb,var(--person-bubble) 28%,transparent))!important}.person-bubble>img,.person-bubble>.bubble-initials,.person-bubble>.bubble-label{position:relative;z-index:3}.frame-layer{position:absolute;inset:-8px;z-index:2;pointer-events:none;border-radius:50%}.frame-plain .frame-layer{border:3px solid color-mix(in srgb,var(--frame-color) 68%,white 18%);box-shadow:0 0 15px color-mix(in srgb,var(--frame-color) 30%,transparent),inset 0 0 8px rgba(255,255,255,.2)}.frame-flower{position:absolute;color:var(--frame-color);font-size:clamp(20px,6vw,30px);text-shadow:0 2px 4px rgba(0,0,0,.28),0 0 7px color-mix(in srgb,var(--frame-color) 60%,transparent)}.frame-flower.f1{top:-8%;left:18%;transform:rotate(-25deg)}.frame-flower.f2{top:-5%;right:16%;transform:rotate(22deg)}.frame-flower.f3{top:24%;right:-9%;transform:rotate(65deg)}.frame-flower.f4{bottom:18%;right:-7%;transform:rotate(105deg)}.frame-flower.f5{bottom:-8%;right:23%;transform:rotate(155deg)}.frame-flower.f6{bottom:-8%;left:20%;transform:rotate(205deg)}.frame-flower.f7{bottom:18%;left:-8%;transform:rotate(250deg)}.frame-flower.f8{top:23%;left:-9%;transform:rotate(300deg)}.frame-shard{position:absolute;width:19%;height:27%;background:linear-gradient(135deg,color-mix(in srgb,var(--frame-color) 80%,white),color-mix(in srgb,var(--frame-color) 66%,transparent));clip-path:polygon(50% 0,100% 100%,0 74%);filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))}.frame-shard.s1{top:-16%;left:39%}.frame-shard.s2{top:0;right:-9%;transform:rotate(48deg)}.frame-shard.s3{top:40%;right:-17%;transform:rotate(90deg)}.frame-shard.s4{bottom:-8%;right:3%;transform:rotate(137deg)}.frame-shard.s5{bottom:-17%;left:39%;transform:rotate(180deg)}.frame-shard.s6{bottom:-8%;left:2%;transform:rotate(225deg)}.frame-shard.s7{top:40%;left:-17%;transform:rotate(270deg)}.frame-shard.s8{top:0;left:-9%;transform:rotate(315deg)}.edit-person-choice{grid-column:1/-1;min-height:105px!important;margin-top:2px}.read-topbar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin-bottom:14px}.read-topbar .back-link{justify-self:start;padding:5px 0}.read-edit-button{justify-self:end;border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);background:color-mix(in srgb,var(--accent) 11%,transparent);color:var(--accent);border-radius:999px;padding:8px 14px;font-weight:800}.read-profile{border:1px solid var(--border);border-radius:28px;padding:20px;background:linear-gradient(155deg,rgba(255,255,255,.075),rgba(255,255,255,.025));box-shadow:0 18px 45px rgba(0,0,0,.18)}.read-profile-head{display:flex;align-items:center;gap:15px;padding-bottom:18px;border-bottom:1px solid rgba(255,255,255,.08)}.read-profile-photo,.read-profile-initials{width:88px;height:88px;border-radius:50%;flex:0 0 auto}.read-profile-photo{object-fit:cover;border:3px solid rgba(255,255,255,.34)}.read-profile-initials{display:grid;place-items:center;background:linear-gradient(145deg,var(--accent),var(--bubble));color:#351f40;font-size:29px;font-weight:900}.read-profile-head h1{margin:0;font-size:31px}.read-profile-head p{margin:3px 0;color:var(--muted);font-size:13px}.read-birthday{margin-top:7px;font-size:12px}.read-story{padding-top:18px}.profile-prose-line{display:grid;grid-template-columns:34px 1fr;gap:10px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.055)}.profile-prose-emoji{font-size:22px;text-align:center}.profile-prose-line p,.profile-prose-block p{margin:0;color:#eee5f3;font-size:14px;line-height:1.65}.profile-prose-block{margin:14px 0;padding:14px;border-radius:18px;background:rgba(255,255,255,.038);border:1px solid rgba(255,255,255,.06)}.profile-prose-label{font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);margin-bottom:9px}.profile-prose-block p+p{margin-top:8px}.read-empty{text-align:center;color:var(--muted);padding:26px 10px}.edit-mode-title{justify-self:center;font-weight:800}.edit-list{display:grid;gap:10px}.edit-list-card{display:grid;grid-template-columns:40px 1fr auto;gap:10px;align-items:start;border:1px solid var(--border);border-radius:18px;padding:12px;background:rgba(255,255,255,.045)}.edit-list-card small{display:block;color:var(--muted);font-size:10px;text-transform:uppercase}.edit-list-card p{margin:4px 0 0;font-size:13px}.edit-list-actions{display:grid;gap:3px}`;document.head.appendChild(s);
}

function bind(){
  $('addFriendBtn').onclick=()=>openFriendDialog();
  $('personBackBtn').onclick=goHome;
  $('readBtn').onclick=showRead;
  $('addInfoBtn').onclick=showAddInfo;
  $('settingsBtn').onclick=openSettings;
  $('searchInput').addEventListener('input',renderHome);
  $('friendForm').addEventListener('submit',e=>e.preventDefault());
  $('friendForm').querySelector('.primary-button').addEventListener('click',saveFriend);
  $('entryForm').addEventListener('submit',saveEntry);
  $('photoInput').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{$('photoData').value=await resizePhoto(file);renderPhotoPreview();showToast('Photo ready');}catch{alert('That photo could not be loaded.');}finally{e.target.value='';}});
  $('removePhotoBtn').onclick=()=>{$('photoData').value='';renderPhotoPreview();};
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>safeClose($(b.dataset.close)));
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('cancel',e=>{e.preventDefault();safeClose(d);}));
  $('addCategoryBtn').onclick=addCategory;
  $('saveSettingsBtn').onclick=saveSettingsFromDialog;
  $('exportBtn').onclick=exportData;
  $('importInput').addEventListener('change',e=>{const f=e.target.files?.[0];if(f)importData(f);});
}

function boot(){
  populateMonths(); injectFrameStyles(); injectPersonStyleEditor(); loadData(); bind(); renderHome(); ensureEditChoice();
  setTimeout(()=>{$('splash')?.classList.add('done');$('app')?.classList.remove('hidden');},2100);
}

boot();
