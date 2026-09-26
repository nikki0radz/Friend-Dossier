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
let entryImageDraft = [];
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

let deferredInstall=null;
function ensureInstallCard(){
  if($('friendDossierInstallCard'))return $('friendDossierInstallCard');
  const card=document.createElement('div');
  card.id='friendDossierInstallCard';
  card.className='fd-install-card';
  card.innerHTML=`
    <button class="fd-install-dismiss" type="button" aria-label="Not now">×</button>
    <div class="fd-install-icon">✦</div>
    <div class="fd-install-copy"><strong>Install Friend Dossier</strong><small>Keep it on your phone like a normal app.</small></div>
    <button class="fd-install-go" type="button">Install</button>`;
  document.body.appendChild(card);
  card.querySelector('.fd-install-dismiss').onclick=()=>card.classList.remove('show');
  card.querySelector('.fd-install-go').onclick=installFriendDossier;
  return card;
}
function showInstallCard(){
  if(!deferredInstall)return;
  window.setTimeout(()=>ensureInstallCard().classList.add('show'),900);
}
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();
  deferredInstall=e;
  const b=$('installAppBtn');
  if(b)b.textContent='📲 Download Friend Dossier app';
  const hint=$('installAppHint');
  if(hint)hint.textContent='Ready to install as an app ✦';
  showInstallCard();
});
window.addEventListener('appinstalled',()=>{
  deferredInstall=null;
  $('friendDossierInstallCard')?.classList.remove('show');
  const b=$('installAppBtn');
  if(b)b.textContent='✓ Friend Dossier is installed';
  const hint=$('installAppHint');
  if(hint)hint.textContent='Installed on this device ✦';
  showToast('Friend Dossier installed ✦');
});
async function installFriendDossier(){
  if(deferredInstall){
    $('friendDossierInstallCard')?.classList.remove('show');
    deferredInstall.prompt();
    try{await deferredInstall.userChoice;}catch{}
    deferredInstall=null;
  }else{
    alert('Chrome has not offered the app install event yet. Close this tab, reopen Friend Dossier in Chrome and try again.');
  }
}
function registerFriendDossierApp(){
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}),{once:true});
  }
}

function injectInstallCardStyles(){
  if($('friendDossierInstallStyles'))return;
  const st=document.createElement('style');
  st.id='friendDossierInstallStyles';
  st.textContent=`
    .fd-install-card{position:fixed;left:14px;right:14px;bottom:max(14px,env(safe-area-inset-bottom));z-index:99999;display:grid;grid-template-columns:42px 1fr auto;align-items:center;gap:11px;padding:13px 14px;border-radius:20px;background:rgba(27,19,38,.96);border:1px solid color-mix(in srgb,var(--accent) 36%,rgba(255,255,255,.12));box-shadow:0 18px 50px rgba(0,0,0,.48),0 0 28px color-mix(in srgb,var(--accent) 12%,transparent);backdrop-filter:blur(18px);transform:translateY(calc(100% + 34px));opacity:0;pointer-events:none;transition:.32s cubic-bezier(.2,.8,.2,1)}
    .fd-install-card.show{transform:none;opacity:1;pointer-events:auto}
    .fd-install-icon{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:color-mix(in srgb,var(--accent) 15%,transparent);color:var(--accent);font-size:21px;text-shadow:0 0 12px currentColor}
    .fd-install-copy{min-width:0}.fd-install-copy strong{display:block;font-family:Georgia,'Times New Roman',serif;font-size:14px}.fd-install-copy small{display:block;margin-top:3px;color:rgba(255,255,255,.58);font-size:10px;line-height:1.3}
    .fd-install-go{border:1px solid color-mix(in srgb,var(--accent) 55%,transparent);border-radius:12px;padding:10px 13px;background:color-mix(in srgb,var(--accent) 16%,rgba(255,255,255,.02));color:var(--accent);font-weight:900;font-size:11px;box-shadow:0 0 16px color-mix(in srgb,var(--accent) 12%,transparent)}
    .fd-install-dismiss{position:absolute;right:5px;top:-29px;width:27px;height:27px;border:1px solid rgba(255,255,255,.12);border-radius:50%;background:rgba(20,14,27,.9);color:#fff;font-size:17px;line-height:1}
  `;
  document.head.appendChild(st);
}
function showToast(msg){
  const t = $('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => t.classList.remove('show'), 1700);
}
function safeOpen(dialog){ if(!dialog)return; try{if(!dialog.open)dialog.showModal();}catch{dialog.setAttribute('open','');} }
function safeClose(dialog){ if(!dialog)return; try{if(dialog.open)dialog.close();}catch{dialog.removeAttribute('open');} }
function populateMonths(){ ['birthdayMonth','entryMonth'].forEach(id=>{const select=$(id);if(!select)return;const current=select.value;select.innerHTML='<option value="">Month</option>'+MONTHS.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('');if(current)select.value=current;}); }
function formatPartialDate(day,month,year){ if(!day||!month)return '';const base=`${Number(day)} ${MONTHS[Number(month)-1]}`;return year?`${base} ${year}`:base; }
function toArray(v){ if(Array.isArray(v))return v;if(typeof v==='string')return v.split(/\n|,/).map(x=>x.trim()).filter(Boolean);return []; }
function normalizeFriend(f={}){ if(Array.isArray(f.entries)){return{id:f.id||uid(),name:f.name||'Unnamed',relationship:f.relationship||'',imageData:f.imageData||'',birthdayDay:f.birthdayDay||'',birthdayMonth:f.birthdayMonth||'',birthdayYear:f.birthdayYear||'',entries:f.entries,bubbleColor:f.bubbleColor||'',frameStyle:f.frameStyle||'plain',frameColor:f.frameColor||''};}const entries=[];const push=(type,emoji,title,value)=>{if(value)entries.push({id:uid(),type,emoji,title,value});};toArray(f.gifts).forEach(v=>push('gift','🎁','',v));toArray(f.likes).forEach(v=>push('like','💜','',v));push('allergy','⚠️','',f.allergies||'');push('note','✎','',f.notes||'');toArray(f.custom).forEach(v=>{if(v&&typeof v==='object')push('note','✦',v.label||'',v.value||'');});if(f.otherDate)entries.push({id:uid(),type:'date',emoji:'📅',title:f.otherDateLabel||'Important date',value:'',day:Number(f.otherDate.slice(8,10)),month:Number(f.otherDate.slice(5,7)),year:Number(f.otherDate.slice(0,4))});let birthdayDay='',birthdayMonth='',birthdayYear='';if(f.birthday){birthdayYear=Number(f.birthday.slice(0,4));birthdayMonth=Number(f.birthday.slice(5,7));birthdayDay=Number(f.birthday.slice(8,10));}return{id:f.id||uid(),name:f.name||'Unnamed',relationship:f.relationship||'',imageData:f.imageData||'',birthdayDay,birthdayMonth,birthdayYear,entries,bubbleColor:'',frameStyle:'plain',frameColor:''}; }
function persistFriends(){ try{localStorage.setItem(DATA_KEY,JSON.stringify(state.friends));return true;}catch(err){console.error('Friend Dossier save failed',err);return false;} }
function loadData(){ let migrated=false;try{let raw=localStorage.getItem(DATA_KEY);if(!raw){for(const key of LEGACY_KEYS){const candidate=localStorage.getItem(key);if(candidate){raw=candidate;migrated=true;break;}}}if(raw){const parsed=JSON.parse(raw);const arr=Array.isArray(parsed)?parsed:(Array.isArray(parsed?.friends)?parsed.friends:[]);state.friends=arr.map(normalizeFriend);if(migrated)persistFriends();}}catch(err){console.error('Friend Dossier load failed',err);state.friends=[];}try{const rawSettings=localStorage.getItem(SETTINGS_KEY);if(rawSettings){const parsed=JSON.parse(rawSettings);settings={...settings,...parsed,categories:Array.isArray(parsed.categories)?parsed.categories:settings.categories};}}catch(err){console.warn('Settings load failed',err);}applySettings(); }
function persistSettings(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));applySettings();}
function applySettings(){document.documentElement.style.setProperty('--bg',settings.bg);document.documentElement.style.setProperty('--accent',settings.accent);document.documentElement.style.setProperty('--bubble',settings.bubble);}
function selected(){return state.friends.find(f=>f.id===state.selectedId);}
function frameMarkup(style){if(style==='flowers')return `<span class="frame-flower f1">✿</span><span class="frame-flower f2">❀</span><span class="frame-flower f3">✿</span><span class="frame-flower f4">❀</span><span class="frame-flower f5">✿</span><span class="frame-flower f6">❀</span><span class="frame-flower f7">✿</span><span class="frame-flower f8">❀</span>`;if(style==='shards')return `<span class="frame-shard s1"></span><span class="frame-shard s2"></span><span class="frame-shard s3"></span><span class="frame-shard s4"></span><span class="frame-shard s5"></span><span class="frame-shard s6"></span><span class="frame-shard s7"></span><span class="frame-shard s8"></span>`;return '';}
function renderHome(){const grid=$('peopleGrid');if(!grid)return;const q=($('searchInput')?.value||'').trim().toLowerCase();grid.innerHTML='';state.friends.filter(f=>`${f.name} ${f.relationship}`.toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name)).forEach(f=>{const b=document.createElement('button');const frame=f.frameStyle||'plain';b.className=`person-bubble frame-${frame}`;b.style.setProperty('--person-bubble',f.bubbleColor||settings.bubble);b.style.setProperty('--frame-color',f.frameColor||settings.accent);const face=f.imageData?`<img src="${f.imageData}" alt="">`:`<div class="bubble-initials">${esc(initials(f.name))}</div>`;b.innerHTML=`<span class="frame-layer">${frameMarkup(frame)}</span>${face}<div class="bubble-label">${esc(f.name)}${f.relationship?`<span class="bubble-relation">${esc(f.relationship)}</span>`:''}</div>`;b.addEventListener('click',()=>openPerson(f.id));grid.appendChild(b);});}
function openPerson(id){state.selectedId=id;$('homeView')?.classList.add('hidden');$('personView')?.classList.remove('hidden');homeTools()?.classList.add('hidden');renderPersonHero();showChoice();}
function goHome(){$('personView')?.classList.add('hidden');$('homeView')?.classList.remove('hidden');homeTools()?.classList.remove('hidden');state.selectedId=null;renderHome();}
function renderPersonHero(){const f=selected();if(!f)return;const face=f.imageData?`<img class="hero-photo" src="${f.imageData}" alt="">`:`<div class="hero-initials">${esc(initials(f.name))}</div>`;const bd=formatPartialDate(f.birthdayDay,f.birthdayMonth,f.birthdayYear);$('personHero').innerHTML=`${face}<h1>${esc(f.name)}</h1>${f.relationship?`<p>${esc(f.relationship)}</p>`:''}${bd?`<span class="birthday-pill">🎂 ${esc(bd)}</span>`:''}`;}
function ensureEditChoice(){const panel=$('personChoice');if(!panel||$('editPersonBtn'))return;const b=document.createElement('button');b.id='editPersonBtn';b.className='big-choice edit-person-choice';b.innerHTML='<span>🎨</span><strong>Edit person</strong><small>Photo, birthday & bubble style</small>';b.addEventListener('click',()=>openFriendDialog(selected()));panel.appendChild(b);}
function showChoice(){$('personChoice')?.classList.remove('hidden');$('readPanel')?.classList.add('hidden');$('addInfoPanel')?.classList.add('hidden');$('personHero')?.classList.remove('hidden');$('personBackBtn')?.classList.remove('hidden');$('personView')?.classList.remove('read-mode');ensureEditChoice();}
function showRead(){$('personChoice')?.classList.add('hidden');$('addInfoPanel')?.classList.add('hidden');$('personHero')?.classList.add('hidden');$('personBackBtn')?.classList.add('hidden');$('personView')?.classList.add('read-mode');$('readPanel')?.classList.remove('hidden');renderRead();}
function categoryFor(type){return settings.categories.find(c=>c.id===type)||{id:type,name:type,emoji:'✦'};}
function displayEntry(e){if(e.type==='date'){const d=formatPartialDate(e.day,e.month,e.year);return `${e.title||'Important date'}${d?`: ${d}`:''}`;}if(e.title&&e.value)return `${e.title}: ${e.value}`;return e.value||e.title||'';}
function renderRead(){const f=selected(),p=$('readPanel');if(!f||!p)return;const frame=f.frameStyle||'plain';const frameColor=f.frameColor||settings.accent;const bubbleColor=f.bubbleColor||settings.bubble;const face=f.imageData?`<img class="read-profile-photo" src="${f.imageData}" alt="">`:`<div class="read-profile-initials">${esc(initials(f.name))}</div>`;const bd=formatPartialDate(f.birthdayDay,f.birthdayMonth,f.birthdayYear);p.innerHTML=`<section class="character-sheet character-frame-${esc(frame)}" style="--profile-frame:${esc(frameColor)};--profile-bubble:${esc(bubbleColor)}"><div class="character-card-actions"><button class="character-back" id="backToChoices">‹ Back</button><span>FRIEND DOSSIER</span><button class="character-edit" id="editReadBtn">Edit</button></div><span class="sheet-corner corner-a">✦</span><span class="sheet-corner corner-b">✦</span><span class="sheet-corner corner-c">✦</span><span class="sheet-corner corner-d">✦</span><div class="character-title-rule"><span></span><b>✧</b><span></span></div><div class="character-profile-head"><div class="character-portrait-wrap frame-${esc(frame)}"><span class="frame-layer">${frameMarkup(frame)}</span>${face}</div><div class="character-name-block"><div class="character-name">${esc(f.name)}</div>${f.relationship?`<div class="character-role">${esc(f.relationship)}</div>`:''}${bd?`<div class="character-birthday">🎂 ${esc(bd)}</div>`:''}</div></div><div class="character-divider"><span></span><b>◆</b><span></span></div><div id="readStory" class="character-sections"></div><div class="character-footer-ornament">✦ · ✧ · ✦</div></section>`;$('backToChoices').onclick=showChoice;$('editReadBtn').onclick=renderReadEdit;const story=$('readStory');if(!f.entries.length){story.innerHTML='<div class="read-empty">No lore recorded yet ✦</div>';return;}const groups=new Map();f.entries.forEach(e=>{if(!groups.has(e.type))groups.set(e.type,[]);groups.get(e.type).push(e);});for(const [type,entries]of groups){const c=categoryFor(type);const values=entries.map(displayEntry).filter(Boolean);if(!values.length)continue;const section=document.createElement('section');section.className='character-section';section.innerHTML=`<div class="character-section-title"><span>${esc(c.emoji)}</span><strong>${esc(c.name)}</strong></div><ul>${values.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`;story.appendChild(section);}}
function renderReadEdit(){const f=selected(),p=$('readPanel');if(!f||!p)return;p.innerHTML=`<div class="read-topbar"><button class="back-link" id="backToRead">‹ Read</button><span class="edit-mode-title">Edit dossier</span><button class="text-button" id="addFromEdit">＋ Add</button></div><div class="edit-list" id="editList"></div>`;$('backToRead').onclick=renderRead;$('addFromEdit').onclick=showAddInfo;const list=$('editList');if(!f.entries.length){list.innerHTML='<div class="empty-card">Nothing to edit yet.</div>';return;}f.entries.forEach(e=>{const c=categoryFor(e.type),d=e.type==='date'?formatPartialDate(e.day,e.month,e.year):'';const card=document.createElement('div');card.className='edit-list-card';card.innerHTML=`<div class="entry-emoji">${esc(e.emoji||c.emoji)}</div><div><small>${esc(c.name)}</small>${e.title?`<strong>${esc(e.title)}</strong>`:''}${e.value?`<p>${esc(e.value)}</p>`:''}${d?`<p>${esc(d)}</p>`:''}</div><div class="edit-list-actions"><button class="soft-button edit-one">Edit</button><button class="text-button delete-one">Delete</button></div>`;card.querySelector('.edit-one').onclick=()=>openEntryDialog(e.type,e);card.querySelector('.delete-one').onclick=()=>{if(confirm('Delete this item?')){f.entries=f.entries.filter(x=>x.id!==e.id);persistFriends();renderReadEdit();}};list.appendChild(card);});}
function showAddInfo(){const f=selected();if(!f)return;$('personChoice')?.classList.add('hidden');$('readPanel')?.classList.add('hidden');$('personHero')?.classList.remove('hidden');$('personBackBtn')?.classList.remove('hidden');$('personView')?.classList.remove('read-mode');const p=$('addInfoPanel');p.classList.remove('hidden');p.innerHTML=`<div class="section-top"><h2>Add to ${esc(f.name)}</h2><button class="text-button" id="cancelAddInfo">Done</button></div><div class="category-grid" id="categoryGrid"></div>`;$('cancelAddInfo').onclick=showChoice;const g=$('categoryGrid');settings.categories.forEach(c=>{const b=document.createElement('button');b.className='category-button';b.innerHTML=`<span>${esc(c.emoji)}</span><strong>${esc(c.name)}</strong>`;b.onclick=()=>openEntryDialog(c.id);g.appendChild(b);});}
function injectPersonStyleEditor(){if($('personStyleEditor'))return;const form=$('friendForm'),saveBtn=form?.querySelector('.primary-button');if(!form||!saveBtn)return;const wrap=document.createElement('div');wrap.id='personStyleEditor';wrap.className='person-style-editor';wrap.innerHTML=`<h3>Bubble appearance</h3><div class="person-colours"><label>Bubble colour<input id="friendBubbleColour" type="color" value="#b9d8ff"></label><label>Frame colour<input id="friendFrameColour" type="color" value="#e2b5ff"></label></div><div class="frame-heading">Frame</div><div class="frame-picker"><button type="button" data-frame="plain" class="frame-option active"><span class="frame-preview preview-plain"></span><b>Plain</b></button><button type="button" data-frame="flowers" class="frame-option"><span class="frame-preview preview-flowers"></span><b>Flowers</b></button><button type="button" data-frame="shards" class="frame-option"><span class="frame-preview preview-shards"></span><b>Shards</b></button></div><input id="friendFrameStyle" type="hidden" value="plain">`;form.insertBefore(wrap,saveBtn);wrap.querySelectorAll('.frame-option').forEach(b=>b.onclick=()=>selectFrameOption(b.dataset.frame));}
function selectFrameOption(frame){if($('friendFrameStyle'))$('friendFrameStyle').value=frame;document.querySelectorAll('.frame-option').forEach(b=>b.classList.toggle('active',b.dataset.frame===frame));}
function openFriendDialog(friend=null){injectPersonStyleEditor();populateMonths();const form=$('friendForm');form.reset();$('friendId').value=friend?.id||'';$('friendDialogTitle').textContent=friend?'Edit person':'Add friend';$('friendName').value=friend?.name||'';$('friendRelation').value=friend?.relationship||'';$('birthdayDay').value=friend?.birthdayDay||'';$('birthdayMonth').value=friend?.birthdayMonth||'';$('birthdayYear').value=friend?.birthdayYear||'';$('photoData').value=friend?.imageData||'';$('friendBubbleColour').value=friend?.bubbleColor||settings.bubble;$('friendFrameColour').value=friend?.frameColor||settings.accent;selectFrameOption(friend?.frameStyle||'plain');renderPhotoPreview();safeOpen($('friendDialog'));}
function renderPhotoPreview(){const d=$('photoData')?.value||'';$('photoPreviewWrap').innerHTML=d?`<img src="${d}" alt="">`:'<span>📷</span>';}
async function resizePhoto(file,max=700,quality=.75){return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=reject;r.onload=()=>{const img=new Image();img.onerror=reject;img.onload=()=>{const scale=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',quality));};img.src=r.result;};r.readAsDataURL(file);});}
function saveFriend(){const form=$('friendForm');if(!form?.reportValidity())return;const id=$('friendId').value||uid();const old=state.friends.find(f=>f.id===id);const friend={id,name:$('friendName').value.trim(),relationship:$('friendRelation').value.trim(),imageData:$('photoData').value,birthdayDay:Number($('birthdayDay').value)||'',birthdayMonth:Number($('birthdayMonth').value)||'',birthdayYear:Number($('birthdayYear').value)||'',entries:old?.entries||[],bubbleColor:$('friendBubbleColour')?.value||settings.bubble,frameStyle:$('friendFrameStyle')?.value||'plain',frameColor:$('friendFrameColour')?.value||settings.accent};const index=state.friends.findIndex(f=>f.id===id);if(index>=0)state.friends[index]=friend;else state.friends.push(friend);if(!persistFriends()){if(index>=0&&old)state.friends[index]=old;else state.friends=state.friends.filter(f=>f.id!==id);alert('Could not save this friend. Browser storage may be full. Try removing the photo and saving again.');return;}safeClose($('friendDialog'));renderHome();if(state.selectedId===id){renderPersonHero();showChoice();}showToast(index>=0?'Person updated':'Friend added');}
function ensureEntryImagePicker(){
  const form=$('entryForm');
  if(!form||$('entryImagePicker'))return;
  const saveBtn=form.querySelector('.primary-button');
  const wrap=document.createElement('section');
  wrap.id='entryImagePicker';
  wrap.className='entry-image-picker';
  wrap.innerHTML=`<div class="entry-image-head"><div><strong>Pictures</strong><small>Add photos for this item</small></div><label class="soft-button entry-photo-add">＋ Add pictures<input id="entryImageInput" type="file" accept="image/*" multiple hidden></label></div><div id="entryImagePreview" class="entry-image-preview"></div>`;
  form.insertBefore(wrap,saveBtn);
  $('entryImageInput').addEventListener('change',async e=>{
    const files=[...(e.target.files||[])].slice(0,8-entryImageDraft.length);
    if(!files.length)return;
    try{
      for(const file of files){
        entryImageDraft.push(await resizePhoto(file,620,.68));
      }
      renderEntryImagePreview();
      showToast(files.length===1?'Picture ready':`${files.length} pictures ready`);
    }catch{
      alert('One of those pictures could not be loaded.');
    }finally{e.target.value='';}
  });
}
function renderEntryImagePreview(){
  const box=$('entryImagePreview');
  if(!box)return;
  if(!entryImageDraft.length){
    box.innerHTML='<span class="entry-image-empty">No pictures attached</span>';
    return;
  }
  box.innerHTML=entryImageDraft.map((src,i)=>`<button type="button" class="entry-image-chip" data-remove-image="${i}" aria-label="Remove picture ${i+1}"><img src="${src}" alt=""><span>×</span></button>`).join('');
  box.querySelectorAll('[data-remove-image]').forEach(btn=>btn.onclick=()=>{
    entryImageDraft.splice(Number(btn.dataset.removeImage),1);
    renderEntryImagePreview();
  });
}
function openEntryDialog(type,entry=null){
  const c=categoryFor(type);
  ensureEntryImagePicker();
  populateMonths();
  $('entryForm').reset();
  $('entryId').value=entry?.id||'';
  $('entryType').value=type;
  $('entryDialogTitle').textContent=entry?`Edit ${c.name}`:`Add ${c.name}`;
  $('entryEmoji').value=entry?.emoji||c.emoji;
  $('entryTitle').value=entry?.title||'';
  $('entryValue').value=entry?.value||'';
  $('entryDay').value=entry?.day||'';
  $('entryMonth').value=entry?.month||'';
  $('entryYear').value=entry?.year||'';
  entryImageDraft=Array.isArray(entry?.images)?[...entry.images]:[];
  renderEntryImagePreview();
  const isDate=type==='date';
  $('entryDateFields').classList.toggle('hidden',!isDate);
  $('entryValueLabel').classList.toggle('hidden',isDate);
  safeOpen($('entryDialog'));
}
function saveEntry(event){event.preventDefault();const f=selected();if(!f)return;const id=$('entryId').value||uid(),type=$('entryType').value;const entry={id,type,emoji:$('entryEmoji').value.trim()||categoryFor(type).emoji,title:$('entryTitle').value.trim(),value:$('entryValue').value.trim(),day:Number($('entryDay').value)||'',month:Number($('entryMonth').value)||'',year:Number($('entryYear').value)||'',images:[...entryImageDraft]};const ix=f.entries.findIndex(x=>x.id===id);if(ix>=0)f.entries[ix]=entry;else f.entries.push(entry);if(!persistFriends()){alert('Could not save this info. Browser storage may be full. Try removing one or more pictures.');return;}safeClose($('entryDialog'));showToast(ix>=0?'Updated':'Added');if(!$('readPanel').classList.contains('hidden'))renderReadEdit();else showAddInfo();}
function openSettings(){$('bgColour').value=settings.bg;$('accentColour').value=settings.accent;$('bubbleColour').value=settings.bubble;renderSettingsCategories();safeOpen($('settingsDialog'));}
function renderSettingsCategories(){const box=$('settingsCategories');box.innerHTML='';settings.categories.forEach((c,i)=>{const row=document.createElement('div');row.className='settings-category-row';row.innerHTML=`<input class="cat-emoji" value="${esc(c.emoji)}" maxlength="4"><input class="cat-name" value="${esc(c.name)}" maxlength="50"><button type="button" class="xbtn">×</button>`;row.querySelector('.xbtn').onclick=()=>{settings.categories.splice(i,1);renderSettingsCategories();};box.appendChild(row);});}
function addCategory(){settings.categories.push({id:`custom-${uid()}`,name:'New category',emoji:'✦'});renderSettingsCategories();}
function saveSettingsFromDialog(){document.querySelectorAll('.settings-category-row').forEach((row,i)=>{settings.categories[i].emoji=row.querySelector('.cat-emoji').value.trim()||'✦';settings.categories[i].name=row.querySelector('.cat-name').value.trim()||'Category';});settings.bg=$('bgColour').value;settings.accent=$('accentColour').value;settings.bubble=$('bubbleColour').value;persistSettings();safeClose($('settingsDialog'));renderHome();showToast('Settings saved');}
function exportData(){const payload={version:4,exportedAt:new Date().toISOString(),settings,friends:state.friends};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`friend-dossier-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();URL.revokeObjectURL(a.href);a.remove();}
async function importData(file){try{const parsed=JSON.parse(await file.text());const arr=Array.isArray(parsed)?parsed:parsed.friends;if(!Array.isArray(arr))throw Error();if(!confirm(`Import ${arr.length} people and replace current data?`))return;state.friends=arr.map(normalizeFriend);if(parsed.settings)settings={...settings,...parsed.settings};persistFriends();persistSettings();renderHome();safeClose($('settingsDialog'));showToast('Imported');}catch{alert('That backup could not be read.');}finally{$('importInput').value='';}}
function injectFrameStyles(){if($('frameStyles'))return;const s=document.createElement('style');s.id='frameStyles';s.textContent=`.person-bubble{--person-bubble:var(--bubble);--frame-color:var(--accent);overflow:visible!important;position:relative;display:grid;place-items:center;background:radial-gradient(circle at 29% 18%,rgba(255,255,255,.7) 0 3%,rgba(255,255,255,.22) 5% 15%,transparent 17%),radial-gradient(circle at 70% 72%,color-mix(in srgb,var(--person-bubble) 58%,transparent),transparent 46%),linear-gradient(145deg,rgba(255,255,255,.14),color-mix(in srgb,var(--person-bubble) 28%,transparent))!important}.person-bubble>img,.person-bubble>.bubble-initials{position:absolute;inset:50% auto auto 50%;transform:translate(-50%,-50%);z-index:3;width:82%;height:82%;border-radius:50%;object-fit:cover}.person-bubble>.bubble-label{position:absolute;z-index:4;left:50%;transform:translateX(-50%);bottom:-38px;width:120%;text-align:center}.frame-layer{position:absolute;inset:0;z-index:2;pointer-events:none;border-radius:50%}.frame-plain .frame-layer{inset:3%;border:3px solid color-mix(in srgb,var(--frame-color) 68%,white 18%);box-shadow:0 0 15px color-mix(in srgb,var(--frame-color) 30%,transparent),inset 0 0 8px rgba(255,255,255,.2)}.frame-flower{position:absolute;color:var(--frame-color);font-size:clamp(16px,4.7vw,23px);line-height:1;text-shadow:0 2px 4px rgba(0,0,0,.28),0 0 7px color-mix(in srgb,var(--frame-color) 55%,transparent)}.frame-flowers .frame-layer:before{content:"";position:absolute;inset:7%;border:3px solid color-mix(in srgb,var(--frame-color) 70%,#c88658 35%);border-radius:50%;box-shadow:inset 0 0 5px rgba(255,255,255,.22),0 0 8px color-mix(in srgb,var(--frame-color) 25%,transparent)}.frame-flower.f1{top:2%;left:20%;transform:rotate(-18deg)}.frame-flower.f2{top:4%;right:18%;transform:rotate(18deg)}.frame-flower.f3{top:28%;right:0;transform:rotate(65deg)}.frame-flower.f4{bottom:24%;right:1%;transform:rotate(110deg)}.frame-flower.f5{bottom:1%;right:21%;transform:rotate(155deg)}.frame-flower.f6{bottom:2%;left:19%;transform:rotate(205deg)}.frame-flower.f7{bottom:24%;left:1%;transform:rotate(250deg)}.frame-flower.f8{top:28%;left:0;transform:rotate(300deg)}.frame-shard{position:absolute;width:15%;height:21%;background:linear-gradient(135deg,color-mix(in srgb,var(--frame-color) 80%,white),color-mix(in srgb,var(--frame-color) 66%,transparent));clip-path:polygon(50% 0,100% 100%,0 74%);filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))}.frame-shard.s1{top:-2%;left:42%}.frame-shard.s2{top:10%;right:2%;transform:rotate(48deg)}.frame-shard.s3{top:41%;right:-3%;transform:rotate(90deg)}.frame-shard.s4{bottom:7%;right:9%;transform:rotate(137deg)}.frame-shard.s5{bottom:-2%;left:42%;transform:rotate(180deg)}.frame-shard.s6{bottom:7%;left:9%;transform:rotate(225deg)}.frame-shard.s7{top:41%;left:-3%;transform:rotate(270deg)}.frame-shard.s8{top:10%;left:2%;transform:rotate(315deg)}.edit-person-choice{grid-column:1/-1;min-height:105px!important;margin-top:2px}.read-topbar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin-bottom:14px}.edit-mode-title{justify-self:center;font-weight:800}.edit-list{display:grid;gap:10px}.edit-list-card{display:grid;grid-template-columns:40px 1fr auto;gap:10px;align-items:start;border:1px solid var(--border);border-radius:18px;padding:12px;background:rgba(255,255,255,.045)}.edit-list-card small{display:block;color:var(--muted);font-size:10px;text-transform:uppercase}.edit-list-card p{margin:4px 0 0;font-size:13px}.edit-list-actions{display:grid;gap:3px}`;document.head.appendChild(s);}
function injectEntryImageStyles(){
  if($('entryImageStyles'))return;
  const s=document.createElement('style');
  s.id='entryImageStyles';
  s.textContent=`
    .entry-image-picker{margin-top:4px;padding:12px;border:1px solid var(--border);border-radius:16px;background:rgba(255,255,255,.025)}
    .entry-image-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.entry-image-head>div{display:grid;gap:2px}.entry-image-head strong{font-size:13px}.entry-image-head small{font-size:10px;color:var(--muted)}
    .entry-photo-add{white-space:nowrap;padding:8px 10px!important;font-size:11px!important}
    .entry-image-preview{display:flex;gap:8px;overflow-x:auto;padding:10px 1px 2px;scrollbar-width:none}.entry-image-preview::-webkit-scrollbar{display:none}
    .entry-image-empty{font-size:11px;color:var(--muted);font-style:italic}
    .entry-image-chip{position:relative;flex:0 0 62px;width:62px;height:62px;padding:0;border:1px solid rgba(255,255,255,.14);border-radius:13px;overflow:hidden;background:#111}
    .entry-image-chip img{width:100%;height:100%;object-fit:cover;display:block}.entry-image-chip span{position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.72);color:#fff;font-size:15px;line-height:1}
    .edit-list-card:has(.edit-list-image-count){grid-template-columns:40px 1fr auto}.edit-list-image-count{display:inline-block;margin-top:5px;font-size:10px;color:var(--muted)}
  `;
  document.head.appendChild(s);
}
function injectCharacterProfileStyles(){if($('characterProfileStyles'))return;const s=document.createElement('style');s.id='characterProfileStyles';s.textContent=`#personView.read-mode{padding:0!important;margin:0!important;max-width:none!important;min-height:100dvh}#personView.read-mode #readPanel{min-height:100dvh;margin:0!important;padding:0!important}#personView.read-mode .character-sheet{min-height:100dvh;border-radius:0;padding:18px 18px 26px;display:flex;flex-direction:column}.character-sheet{--profile-frame:var(--accent);--profile-bubble:var(--bubble);position:relative;isolation:isolate;overflow:hidden;border:2px solid color-mix(in srgb,var(--profile-frame) 75%,white 12%);background:radial-gradient(circle at 50% -15%,color-mix(in srgb,var(--profile-frame) 18%,transparent),transparent 42%),linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.018)),#1b1326;box-shadow:0 20px 48px rgba(0,0,0,.32),inset 0 0 0 4px rgba(255,255,255,.025),inset 0 0 40px color-mix(in srgb,var(--profile-frame) 8%,transparent)}.character-sheet:before{content:"";position:absolute;inset:7px;border:1px solid color-mix(in srgb,var(--profile-frame) 36%,transparent);border-radius:21px;pointer-events:none}.character-sheet:after{content:"";position:absolute;inset:0;z-index:-1;opacity:.18;background-image:radial-gradient(circle at 20% 25%,currentColor 0 1px,transparent 1.5px),radial-gradient(circle at 80% 68%,currentColor 0 1px,transparent 1.5px);background-size:31px 31px,43px 43px;color:var(--profile-frame)}.character-card-actions{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;position:relative;z-index:4;margin-bottom:12px}.character-card-actions span{font-family:Georgia,serif;font-size:10px;letter-spacing:.21em;color:color-mix(in srgb,var(--profile-frame) 75%,white)}.character-back,.character-edit{border:0;background:transparent;color:#f1e8f5;font-weight:800;padding:8px 0}.character-back{justify-self:start}.character-edit{justify-self:end;color:var(--profile-frame)}.sheet-corner{position:absolute;color:var(--profile-frame);font-size:14px;opacity:.8;text-shadow:0 0 9px color-mix(in srgb,var(--profile-frame) 55%,transparent)}.corner-a{top:46px;left:12px}.corner-b{top:46px;right:12px}.corner-c{bottom:10px;left:12px}.corner-d{bottom:10px;right:12px}.character-title-rule,.character-divider{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;color:var(--profile-frame)}.character-title-rule{margin:0 24px 18px}.character-divider{margin:18px 6px 7px}.character-title-rule span,.character-divider span{height:1px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--profile-frame) 70%,transparent))}.character-title-rule span:last-child,.character-divider span:last-child{background:linear-gradient(90deg,color-mix(in srgb,var(--profile-frame) 70%,transparent),transparent)}.character-profile-head{display:flex;flex-direction:column;align-items:center;text-align:center;gap:13px;position:relative;z-index:2}.character-portrait-wrap{--frame-color:var(--profile-frame);position:relative;width:min(46vw,180px);aspect-ratio:1;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 25%,rgba(255,255,255,.17),transparent 40%),color-mix(in srgb,var(--profile-bubble) 16%,transparent)}.character-portrait-wrap .frame-layer{inset:0}.character-portrait-wrap .read-profile-photo,.character-portrait-wrap .read-profile-initials{position:absolute;inset:50% auto auto 50%;transform:translate(-50%,-50%);width:78%;height:78%;border-radius:50%;z-index:3}.character-portrait-wrap .read-profile-photo{object-fit:cover;border:2px solid rgba(255,255,255,.28);box-shadow:0 8px 24px rgba(0,0,0,.32)}.character-portrait-wrap .read-profile-initials{display:grid;place-items:center;background:linear-gradient(145deg,var(--profile-frame),var(--profile-bubble));color:#281735;font-size:36px;font-weight:900}.character-name{font-family:Georgia,serif;font-size:clamp(34px,10vw,48px);line-height:.95;letter-spacing:-.035em;color:#fff8ff;text-shadow:0 2px 14px rgba(0,0,0,.35)}.character-role{margin-top:8px;color:color-mix(in srgb,var(--profile-frame) 72%,white);font-size:12px;text-transform:uppercase;letter-spacing:.13em}.character-birthday{display:inline-block;margin-top:10px;padding:6px 9px;border-radius:999px;border:1px solid color-mix(in srgb,var(--profile-frame) 28%,transparent);background:rgba(255,255,255,.04);font-size:11px;color:#eadff0}.character-sections{display:grid;gap:11px;padding:10px 2px 2px;flex:1}.character-section{border:1px solid color-mix(in srgb,var(--profile-frame) 22%,rgba(255,255,255,.08));border-radius:16px;padding:12px 13px;background:linear-gradient(135deg,color-mix(in srgb,var(--profile-frame) 7%,transparent),rgba(255,255,255,.025));box-shadow:inset 0 1px rgba(255,255,255,.035)}.character-section-title{display:flex;align-items:center;gap:7px;margin-bottom:7px;color:color-mix(in srgb,var(--profile-frame) 74%,white)}.character-section-title span{font-size:17px}.character-section-title strong{font-family:Georgia,serif;font-size:14px;letter-spacing:.04em}.character-section ul{margin:0;padding-left:21px;display:grid;gap:5px}.character-section li{color:#f0e7f4;font-size:13px;line-height:1.48;padding-left:2px}.character-section li::marker{color:var(--profile-frame);font-size:.85em}.character-footer-ornament{text-align:center;margin:14px 0 0;color:color-mix(in srgb,var(--profile-frame) 62%,transparent);font-size:11px;letter-spacing:.22em}.character-frame-flowers:before{border-style:dashed}.character-frame-shards{clip-path:polygon(2% 0,98% 0,100% 2%,100% 98%,98% 100%,2% 100%,0 98%,0 2%)}.read-empty{text-align:center;color:var(--muted);padding:30px 10px;font-family:Georgia,serif;font-style:italic}@media(min-width:700px){#personView.read-mode .character-sheet{max-width:760px;margin:0 auto!important;border-radius:28px;min-height:calc(100dvh - 30px)}#personView.read-mode{padding:15px!important}.character-portrait-wrap{width:190px}}`;document.head.appendChild(s);}
function bind(){$('addFriendBtn').onclick=()=>openFriendDialog();$('personBackBtn').onclick=goHome;$('readBtn').onclick=showRead;$('addInfoBtn').onclick=showAddInfo;$('settingsBtn').onclick=openSettings;$('searchInput').addEventListener('input',renderHome);$('friendForm').addEventListener('submit',e=>e.preventDefault());$('friendForm').querySelector('.primary-button').addEventListener('click',saveFriend);$('entryForm').addEventListener('submit',saveEntry);$('photoInput').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{$('photoData').value=await resizePhoto(file);renderPhotoPreview();showToast('Photo ready');}catch{alert('That photo could not be loaded.');}finally{e.target.value='';}});$('removePhotoBtn').onclick=()=>{$('photoData').value='';renderPhotoPreview();};document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>safeClose($(b.dataset.close)));document.querySelectorAll('dialog').forEach(d=>d.addEventListener('cancel',e=>{e.preventDefault();safeClose(d);}));$('addCategoryBtn').onclick=addCategory;$('saveSettingsBtn').onclick=saveSettingsFromDialog;$('exportBtn').onclick=exportData;$('installAppBtn')?.addEventListener('click',installFriendDossier);$('importInput').addEventListener('change',e=>{const f=e.target.files?.[0];if(f)importData(f);});}
function boot(){populateMonths();injectFrameStyles();injectEntryImageStyles();injectInstallCardStyles();injectCharacterProfileStyles();injectPersonStyleEditor();loadData();bind();registerFriendDossierApp();renderHome();ensureEditChoice();setTimeout(()=>{$('splash')?.classList.add('done');$('app')?.classList.remove('hidden');},2100);}
boot();