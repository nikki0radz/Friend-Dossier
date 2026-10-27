/* The same local records power every layout. Decoration is kept out of the reading flow. */
function validDossierDate(day, month, year) {
  const d=Number(day), m=Number(month), y=Number(year)||2000;
  const date=new Date(y,m-1,d);
  return d>0 && m>0 && m<=12 && date.getDate()===d && date.getMonth()===m-1;
}
(() => {
  const icons={
    people:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/>',
    settings:'<path d="m9 3-1 3-3 1-2 4 2 2-1 3 3 3 3-1 2 3 4-1 1-3 3-1 1-4-3-2V6l-3-2-3 1Z"/><circle cx="12" cy="12" r="3"/>',
    search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
    pin:'<path d="m9 3 8 0-1 6 3 4v2H7v-2l3-4ZM13 15v7"/>',
    arrow:'<path d="m9 5 7 7-7 7"/>',
    back:'<path d="m15 5-7 7 7 7"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    edit:'<path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14Z"/>',
    note:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    heart:'<path d="M12 21 3 12C-2 4 8-1 12 6c4-7 14-2 9 6Z"/>',
    gift:'<rect x="3" y="9" width="18" height="4" rx="1"/><path d="M5 13v8h14v-8M12 9v12m0-12C3 9 4 1 9 4l3 5Zm0 0c9 0 8-8 3-5Z"/>',
    warning:'<path d="m12 3 10 18H2ZM12 9v5m0 3v1"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'
  };
  const icon=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.note}</svg>`;
  const names={allergy:'Allergy / avoid',date:'Important dates',gift:'Gift ideas',like:'Likes',note:'Notes'};
  const catName=type=>names[type]||categoryFor(type).name;
  const catIcon=type=>icon(({allergy:'warning',date:'calendar',gift:'gift',like:'heart'})[type]||'note');
  let peopleOnly=false;
  let allCategories=false;
  let expanded=new Set();
  let settingsDraft=null;
  const views=[['people','People list','A searchable list with useful details.'],['cards','Profile cards','A compact, visual grid of your people.'],['upcoming','Upcoming dates','Birthdays and plans at the top.']];
  const theme=()=>settings.cleanTheme==='dark'?'dark':'light';
  const layout=()=>views.some(v=>v[0]===settings.startScreen)?settings.startScreen:'people';

  function applyCleanTheme(){
    document.documentElement.dataset.theme=theme();
    const dark=theme()==='dark';
    const values={'--bg':dark?'#17181c':'#faf8fa','--text':dark?'#f4eff2':'#27212a','--accent':dark?'#e2a8b9':'#71385e','--muted':dark?'#aaa5ae':'#746d79','--border':dark?'#35353e':'#e6e0e7','--panel':dark?'#23242a':'#ffffff'};
    Object.entries(values).forEach(([key,value])=>document.documentElement.style.setProperty(key,value));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',values['--bg']);
  }
  const priorApplySettings=applySettings;
  applySettings=function(){priorApplySettings();applyCleanTheme();};
  applyCleanTheme();

  function avatar(f){
    const source=f.imageData||f.photoSourceData||'';
    return source?`<img class="fd-avatar" data-friend-photo="${esc(f.id)}" src="${esc(source)}" alt="${esc(f.name)}’s photo">`:`<span class="fd-avatar fd-initials">${esc(initials(f.name))}</span>`;
  }
  function bindPhotos(root){
    root.querySelectorAll('[data-friend-photo]').forEach(img=>{
      img.onerror=()=>{
        const f=state.friends.find(friend=>friend.id===img.dataset.friendPhoto);
        if(f?.photoSourceData && img.getAttribute('src')!==f.photoSourceData){img.src=f.photoSourceData;return;}
        const fallback=document.createElement('span');fallback.className='fd-avatar fd-initials';fallback.textContent=initials(f?.name||'');img.replaceWith(fallback);
      };
      if(img.complete && !img.naturalWidth)img.onerror();
    });
  }
  function preview(f){
    const entry=f.entries.find(e=>e.pinned)||f.entries.find(e=>e.type==='like')||f.entries.find(e=>e.type!=='allergy');
    return entry?displayEntry(entry):(f.birthdayDay&&f.birthdayMonth?`Birthday ${formatPartialDate(f.birthdayDay,f.birthdayMonth,'')}`:'Open dossier');
  }
  function events(){
    const result=[];
    for(const friend of state.friends){
      const birthday=nextOccurrence(friend.birthdayDay,friend.birthdayMonth,friend.birthdayYear,true);
      if(birthday)result.push({...birthday,friend,title:`${friend.name}’s birthday`,recurring:true});
      for(const entry of friend.entries.filter(e=>e.type==='date')){
        const next=nextOccurrence(entry.day,entry.month,entry.year,entry.recurring!==false);
        if(next)result.push({...next,friend,title:`${friend.name} · ${entry.title||'Important date'}`,recurring:entry.recurring!==false});
      }
    }
    return result.sort((a,b)=>a.date-b.date||a.friend.name.localeCompare(b.friend.name));
  }
  function peopleRow(f){return `<button class="fd-person" data-person="${esc(f.id)}">${avatar(f)}<span class="fd-person-copy"><strong>${esc(f.name)}</strong><small>${esc(preview(f))}</small></span><span class="fd-chevron">${icon('arrow')}</span></button>`;}
  function bindPeople(root){bindPhotos(root);root.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>openPerson(b.dataset.person));}
  function updateNav(){
    const profile=!$('personView').classList.contains('hidden');
    document.querySelectorAll('[data-nav]').forEach(b=>b.setAttribute('aria-current',b.dataset.nav===((profile||peopleOnly)?'people':'home')?'page':'false'));
  }
  function ensureShell(){
    if($('fdBrand'))return;
    const tools=homeTools();
    tools.insertAdjacentHTML('afterbegin',`<div class="fd-brand" id="fdBrand"><h1>Friend Dossier</h1></div>`);
    $('fdBrand').appendChild($('settingsBtn'));
    $('settingsBtn').innerHTML=icon('settings');
    $('settingsBtn').onclick=()=>openSettings();
    $('searchInput').setAttribute('aria-label','Search people and details');
    $('searchInput').placeholder='Search people and details…';
    const label=document.createElement('label');label.className='fd-search-wrap';label.innerHTML=icon('search');
    $('searchInput').before(label);label.appendChild($('searchInput'));
    $('homeView').insertAdjacentHTML('afterbegin','<div id="fdAgenda"></div><div id="fdPeopleHead"></div>');
    const nav=document.createElement('nav');nav.id='fdBottomNav';nav.className='fd-bottom-nav';nav.setAttribute('aria-label','Main navigation');
    nav.innerHTML=`<button data-nav="home">${icon('grid')}<span>Home</span></button><button data-nav="people">${icon('people')}<span>People</span></button><button data-nav="calendar">${icon('calendar')}<span>Calendar</span></button>`;
    document.body.appendChild(nav);
    nav.querySelector('[data-nav="home"]').onclick=()=>{peopleOnly=false;window.closeImportantDateCalendar?.(true);goHome();};
    nav.querySelector('[data-nav="people"]').onclick=()=>{peopleOnly=true;window.closeImportantDateCalendar?.(true);goHome();$('searchInput').focus();};
    nav.querySelector('[data-nav="calendar"]').onclick=()=>window.openImportantDateCalendar(new Date());
    $('addFriendBtn').innerHTML=icon('plus')+' Add friend';
    $('addFriendBtn').onclick=()=>openFriendDialog();
  }

  renderHome=function(){
    ensureShell();applyCleanTheme();
    const mode=peopleOnly?'people':layout();
    document.documentElement.dataset.startScreen=mode;
    const q=($('searchInput').value||'').trim().toLowerCase();
    if(mode==='upcoming')window.renderImportantDateWeek?.();
    const upcoming=events();
    const next=upcoming[0];
    const nextBox=$('nextImportantDate');
    nextBox.className='fd-next';nextBox.setAttribute('role','button');nextBox.tabIndex=0;
    nextBox.innerHTML=next?`${icon('calendar')}<span><strong>${esc(next.title)}</strong><small>${esc(next.date.toLocaleDateString('en-GB',{day:'numeric',month:'short'}))} · ${esc(countdownWords(next.days))}</small></span>${icon('arrow')}`:`${icon('calendar')}<span>See your important dates</span>${icon('arrow')}`;
    nextBox.onclick=()=>window.openImportantDateCalendar(next?.date||new Date());
    nextBox.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();nextBox.click();}};
    const agenda=$('fdAgenda');agenda.innerHTML='';
    if(mode==='upcoming'){
      agenda.innerHTML=`<div class="fd-section-heading"><h2>Coming up</h2><button class="text-button" id="fdViewMonth">View month ${icon('arrow')}</button></div><div class="fd-agenda-list">${upcoming.length?upcoming.slice(0,5).map(e=>`<button class="fd-event" data-person="${esc(e.friend.id)}"><span class="fd-date-block"><strong>${e.date.getDate()}</strong><small>${esc(e.date.toLocaleDateString('en-GB',{month:'short'}))}</small></span><span><strong>${esc(e.title)}</strong><small>${esc(countdownWords(e.days))}</small><small>${e.recurring?'Repeats yearly':'One-off'}</small></span>${icon('arrow')}</button>`).join(''):'<p class="fd-empty">Add a birthday or an important date to a profile and it will appear here.</p>'}</div>`;
      $('fdViewMonth').onclick=()=>window.openImportantDateCalendar(new Date());bindPeople(agenda);
    }
    const people=state.friends.filter(f=>`${f.name} ${f.entries.map(displayEntry).join(' ')}`.toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));
    $('fdPeopleHead').innerHTML=`<div class="fd-section-heading"><h2>${mode==='upcoming'?'Your people':'People'} <small>${people.length}</small></h2><button class="text-button" id="fdQuickAdd">${icon('plus')} Add</button></div>`;
    $('fdQuickAdd').onclick=()=>openFriendDialog();
    const grid=$('peopleGrid');grid.className=mode==='cards'?'fd-people fd-card-grid':'fd-people fd-list';
    grid.innerHTML=people.length?people.map(peopleRow).join(''):`<div class="fd-empty"><h3>${state.friends.length?'No people found':'Your people, remembered'}</h3><p>${state.friends.length?'Try another search.':'Add someone to start keeping their dates, favourites and little details together.'}</p></div>`;
    bindPeople(grid);updateNav();
  };
  const coreGoHome=goHome;
  goHome=function(){coreGoHome();updateNav();};
  openPerson=function(id){
    if(!state.friends.some(f=>f.id===id))return;
    if(state.selectedId!==id){allCategories=false;expanded=new Set();}
    state.selectedId=id;$('app').classList.add('person-mode');$('homeView').classList.add('hidden');homeTools().classList.add('hidden');$('personView').classList.remove('hidden');showRead();updateNav();
  };
  showChoice=function(){showRead();};
  showRead=function(){
    $('personChoice').classList.add('hidden');$('personHero').classList.add('hidden');$('personBackBtn').classList.add('hidden');$('addInfoPanel').classList.add('hidden');$('readPanel').classList.remove('hidden');$('personView').classList.add('read-mode');renderRead();
  };

  function entryCard(entry, pinnedArea=false){
    const text=entry.type==='date'?formatPartialDate(entry.day,entry.month,entry.year):'';
    return `<article class="fd-entry" data-entry="${esc(entry.id)}"><div class="fd-entry-copy">${pinnedArea?`<small class="fd-category-label">${esc(catName(entry.type))}</small>`:''}${entry.title?`<strong>${esc(entry.title)}</strong>`:''}${text?`<p>${esc(text)} <small>· ${entry.recurring!==false?'Yearly':'One-off'}</small></p>`:''}${entry.value?`<p>${esc(entry.value)}</p>`:''}${entry.images?.length?`<div class="fd-entry-images">${entry.images.map((src,i)=>`<button type="button" data-photo="${i}" aria-label="Open picture ${i+1}"><img src="${esc(src)}" alt="Attached picture ${i+1}" loading="lazy"></button>`).join('')}</div>`:''}</div><div class="fd-entry-actions"><button class="fd-pin ${entry.pinned?'is-pinned':''}" aria-label="${entry.pinned?'Unpin':'Pin'} item" aria-pressed="${!!entry.pinned}" data-pin="${esc(entry.id)}">${icon('pin')}</button><button aria-label="Edit item" data-edit="${esc(entry.id)}">${icon('edit')}</button></div></article>`;
  }
  function bindEntries(root){
    const f=selected();
    root.querySelectorAll('[data-pin]').forEach(b=>b.onclick=()=>{
      const entry=f.entries.find(e=>e.id===b.dataset.pin);const old=entry.pinned;entry.pinned=!old;
      if(!persistFriends()){entry.pinned=old;fdAlert('This item could not be saved.',{title:'Couldn’t save'});return;}
      renderRead();showToast(entry.pinned?'Pinned to top':'Unpinned');
    });
    root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{const entry=f.entries.find(e=>e.id===b.dataset.edit);window.__returnToDossierAfterEntry=true;openEntryDialog(entry.type,entry);});
    root.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{
      const entry=f.entries.find(e=>e.id===b.closest('[data-entry]').dataset.entry);const modal=$('fdPhotoDialog');
      $('fdFullPhoto').src=entry.images[Number(b.dataset.photo)];safeOpen(modal);
    });
  }
  renderRead=function(){
    const f=selected();if(!f)return;
    const pinned=f.entries.filter(e=>e.pinned), allergies=f.entries.filter(e=>e.type==='allergy');
    const types=[...new Set([...settings.categories.map(c=>c.id),...f.entries.map(e=>e.type)])];
    const visible=allCategories?types:types.filter(type=>f.entries.some(e=>e.type===type));
    $('readPanel').innerHTML=`<div class="fd-profile-top"><button id="fdBackPeople" class="text-button">${icon('back')} People</button><button id="fdEditPerson" class="text-button">Edit profile</button></div><header class="fd-profile-head">${avatar(f)}<div><h1>${esc(f.name)}</h1>${f.birthdayDay&&f.birthdayMonth?`<span>${icon('calendar')} ${esc(formatPartialDate(f.birthdayDay,f.birthdayMonth,f.birthdayYear))}</span>`:''}<button class="text-button fd-change-photo" id="fdChangePhoto">${f.imageData||f.photoSourceData?'Change photo':'Add photo'}</button></div></header><button class="primary-button fd-add-info" id="fdAddInfo">${icon('plus')} Add info</button>${allergies.length?`<div class="fd-allergy">${icon('warning')}<div><strong>Allergy / avoid</strong>${allergies.map(e=>`<p>${esc(displayEntry(e))}</p>`).join('')}</div></div>`:''}<section class="fd-pinned"><div class="fd-section-heading"><h2>${icon('pin')} Pinned details</h2></div>${pinned.length?pinned.map(e=>entryCard(e,true)).join(''):'<p class="fd-pin-hint">Tap the pin beside any item to keep it here.</p>'}</section><div class="fd-section-heading"><h2>Browse dossier</h2><button class="text-button" id="fdManageItems">Manage</button></div><div class="fd-categories">${visible.map(type=>{
      const entries=f.entries.filter(e=>e.type===type);
      const photos=entries.flatMap(entry=>(entry.images||[]).map((src,index)=>({src,index,id:entry.id})));
      return `<div class="fd-category-block"><details data-type="${esc(type)}" ${expanded.has(type)?'open':''}><summary>${catIcon(type)}<strong>${esc(catName(type))}</strong><span class="fd-count">${entries.length}</span>${icon('arrow')}</summary><div class="fd-category-items">${entries.map(e=>entryCard(e)).join('')}<button class="text-button fd-category-add" data-add-type="${esc(type)}">${icon('plus')} Add ${esc(catName(type).toLowerCase())}</button></div></details>${photos.length?`<div class="fd-category-preview">${photos.slice(0,3).map(photo=>`<button type="button" data-entry="${esc(photo.id)}" data-photo="${photo.index}" aria-label="Open ${esc(catName(type).toLowerCase())} picture ${photo.index+1}"><img src="${esc(photo.src)}" alt="${esc(catName(type))} picture" loading="lazy"></button>`).join('')}${photos.length>3?`<span>+${photos.length-3} more</span>`:''}</div>`:''}</div>`;
    }).join('')}</div><button class="fd-all-categories" id="fdAllCategories">${icon('grid')}${allCategories?'Show saved categories':'All categories'}${icon('arrow')}</button><p class="fd-profile-foot">${f.entries.length} saved ${f.entries.length===1?'item':'items'}</p>`;
    bindPhotos($('readPanel'));
    $('fdChangePhoto').onclick=()=>{openFriendDialog(f);$('photoInput').click();};
    $('fdBackPeople').onclick=()=>goHome();$('fdEditPerson').onclick=()=>openFriendDialog(f);$('fdAddInfo').onclick=showAddInfo;$('fdManageItems').onclick=renderReadEdit;
    $('fdAllCategories').onclick=()=>{allCategories=!allCategories;renderRead();};
    $('readPanel').querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)expanded.add(d.dataset.type);else expanded.delete(d.dataset.type);}));
    $('readPanel').querySelectorAll('[data-add-type]').forEach(b=>b.onclick=()=>{expanded.add(b.dataset.addType);window.__returnToDossierAfterEntry=true;openEntryDialog(b.dataset.addType);});
    bindEntries($('readPanel'));
  };
  showAddInfo=function(){
    const f=selected();if(!f)return;
    $('readPanel').classList.add('hidden');$('addInfoPanel').classList.remove('hidden');
    $('addInfoPanel').innerHTML=`<div class="fd-profile-top"><button class="text-button" id="fdCancelAdd">${icon('back')} ${esc(f.name)}</button></div><h1>Add info</h1><p class="fd-muted">What would you like to remember?</p><div class="fd-category-grid">${settings.categories.map(c=>`<button data-add-type="${esc(c.id)}">${catIcon(c.id)}<strong>${esc(catName(c.id))}</strong>${icon('plus')}</button>`).join('')}</div><button class="text-button" id="fdNewCategory">${icon('plus')} New category</button>`;
    $('fdCancelAdd').onclick=showRead;
    $('addInfoPanel').querySelectorAll('[data-add-type]').forEach(b=>b.onclick=()=>{window.__returnToDossierAfterEntry=true;openEntryDialog(b.dataset.addType);});
    $('fdNewCategory').onclick=()=>openCategoryDialog();
  };
  const coreSaveEntry=saveEntry;
  saveEntry=function(event){coreSaveEntry(event);if(!$('entryDialog').open&&selected()){showRead();renderHome();}};
  $('entryForm').removeEventListener('submit',coreSaveEntry);$('entryForm').addEventListener('submit',saveEntry);
  const coreOpenEntry=openEntryDialog;
  openEntryDialog=function(type,entry=null){
    coreOpenEntry(type,entry);
    $('entryDialogTitle').textContent=(entry?'Edit ':'Add ')+catName(type).toLowerCase();
    $('entryDelete').classList.toggle('hidden',!entry);
    $('entryDelete').onclick=async()=>{
      const f=selected();if(!f||!entry)return;
      if(!await fdConfirm('Remove this item and its attached pictures?',{title:'Delete item?',confirmLabel:'Delete',danger:true,icon:'!'}))return;
      const old=f.entries;f.entries=old.filter(e=>e.id!==entry.id);
      if(!persistFriends()){f.entries=old;fdAlert('This change could not be saved.',{title:'Couldn’t save'});return;}
      safeClose($('entryDialog'));showRead();renderHome();showToast('Item deleted');
    };
  };
  renderReadEdit=function(){
    showRead();allCategories=true;expanded=new Set(selected().entries.map(e=>e.type));renderRead();
    showToast('Use the pencil to edit or delete an item');
  };
  const coreOpenFriend=openFriendDialog;
  openFriendDialog=function(friend=null){
    coreOpenFriend(friend?{...friend,imageData:friend.imageData||friend.photoSourceData||''}:null);
    $('friendDialogTitle').textContent=friend?'Edit profile':'Add friend';
    $('friendForm').querySelector('.primary-button').textContent='Save friend';
    $('friendDelete').classList.toggle('hidden',!friend);
    $('friendDelete').onclick=async()=>{
      if(!friend||!await fdConfirm(`Delete ${friend.name} and their saved details? Export a backup first if you want to keep a copy.`,{title:'Delete friend?',confirmLabel:'Delete',danger:true,icon:'!'}))return;
      const old=state.friends;state.friends=old.filter(f=>f.id!==friend.id);
      if(!persistFriends()){state.friends=old;fdAlert('This change could not be saved.',{title:'Couldn’t save'});return;}
      safeClose($('friendDialog'));goHome();showToast('Friend deleted');
    };
  };
  function openCategoryDialog(){safeOpen($('fdCategoryDialog'));$('fdCategoryName').focus();}
  $('settingsDialog').querySelector('.modal-card').innerHTML=`<div class="modal-head"><h2>Settings</h2><button type="button" class="xbtn" id="fdCloseSettings" aria-label="Close settings">×</button></div><h3>Main screen</h3><p class="fd-muted">Choose what you see when you open Friend Dossier.</p><fieldset class="fd-layout-options"><legend class="fd-sr-only">Main screen layout</legend>${views.map(([value,label,description])=>`<label class="fd-layout-option"><input type="radio" name="startScreen" value="${value}">${icon(value==='people'?'people':value==='cards'?'grid':'calendar')}<span><strong>${label}</strong><small>${description}</small></span></label>`).join('')}</fieldset><h3>Appearance</h3><label>Colour mode<select id="fdTheme"><option value="light">Light · warm white & plum</option><option value="dark">Dark · charcoal & rose</option></select></label><h3>Categories</h3><button class="soft-button full" id="fdAddCategory" type="button">New category</button><h3>App</h3><button id="installAppBtn" type="button" class="soft-button full">Install Friend Dossier</button><p id="installAppHint" class="fd-muted"></p><h3>Backup</h3><button id="exportBtn" type="button" class="soft-button full">Export backup</button><input id="importInput" type="file" accept="application/json,.json" hidden><button id="fdImport" type="button" class="soft-button full">Import backup</button><p class="fd-muted">Your details are saved on this device. Export a backup to keep a separate copy.</p><button id="saveSettingsBtn" type="button" class="primary-button">Save settings</button>`;
  openSettings=function(){
    settingsDraft={startScreen:layout(),cleanTheme:theme()};
    $('settingsDialog').querySelector(`input[value="${settingsDraft.startScreen}"]`).checked=true;
    $('fdTheme').value=settingsDraft.cleanTheme;syncInstallUi();safeOpen($('settingsDialog'));
  };
  $('fdCloseSettings').onclick=()=>safeClose($('settingsDialog'));
  $('fdAddCategory').onclick=openCategoryDialog;
  $('exportBtn').onclick=exportData;
  $('fdImport').onclick=()=>$('importInput').click();
  $('importInput').onchange=e=>{const file=e.target.files[0];if(file)importData(file);};
  $('installAppBtn').onclick=installFriendDossier;
  $('saveSettingsBtn').onclick=()=>{
    const old={...settings};settings.startScreen=$('settingsDialog').querySelector('input[name="startScreen"]:checked').value;settings.cleanTheme=$('fdTheme').value;
    try{persistSettings();}catch{settings=old;applyCleanTheme();fdAlert('Settings could not be saved.',{title:'Couldn’t save'});return;}
    peopleOnly=false;safeClose($('settingsDialog'));renderHome();if(selected())showRead();showToast('Settings saved');
  };
  document.body.insertAdjacentHTML('beforeend',`<dialog id="fdCategoryDialog" class="modal"><form id="fdCategoryForm" class="modal-card"><div class="modal-head"><h2>New category</h2><button type="button" class="xbtn" data-close="fdCategoryDialog" aria-label="Close">×</button></div><label>Category name<input id="fdCategoryName" required maxlength="60" placeholder="For example: Favourite music"></label><button class="primary-button">Create category</button></form></dialog><dialog id="fdPhotoDialog" class="modal fd-photo-dialog"><button type="button" class="xbtn" data-close="fdPhotoDialog" aria-label="Close picture">×</button><img id="fdFullPhoto" alt="Attached picture"></dialog>`);
  document.querySelectorAll('[data-close="fdCategoryDialog"],[data-close="fdPhotoDialog"]').forEach(b=>b.onclick=()=>safeClose($(b.dataset.close)));
  $('fdCategoryForm').onsubmit=e=>{
    e.preventDefault();const name=$('fdCategoryName').value.trim();if(!name)return;
    if(settings.categories.some(c=>c.name.toLowerCase()===name.toLowerCase())){fdAlert('A category with that name already exists.',{title:'Choose another name'});return;}
    const old=settings.categories;settings.categories=[...old,{id:'custom-'+uid(),name,emoji:'✎'}];
    try{persistSettings();}catch{settings.categories=old;fdAlert('The category could not be saved.',{title:'Couldn’t save'});return;}
    safeClose($('fdCategoryDialog'));$('fdCategoryForm').reset();if(selected())showAddInfo();showToast('Category created');
  };
  $('entryForm').insertAdjacentHTML('beforeend','<button type="button" id="entryDelete" class="fd-danger hidden">Delete item</button>');
  $('choosePhotoBtn').onclick=()=>$('photoInput').click();
  $('friendForm').insertAdjacentHTML('beforeend','<button type="button" id="friendDelete" class="fd-danger hidden">Delete friend</button>');
  $('entryDialog').addEventListener('close',()=>{window.__returnToDossierAfterEntry=false;});
  renderHome();
})();
