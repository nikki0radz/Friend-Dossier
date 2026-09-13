(() => {
  const $ = id => document.getElementById(id);
  const add = $('addFriendBtn');
  const dialog = $('friendDialog');
  const form = $('friendForm');
  const saveBtn = form?.querySelector('.primary-button');
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DATA_KEY = 'friendDossier.v4';

  function ensureMonths() {
    ['birthdayMonth','entryMonth'].forEach(id => {
      const select = $(id);
      if (!select) return;
      const current = select.value;
      select.innerHTML = '<option value="">Month</option>' + MONTH_NAMES.map((month, i) => `<option value="${i + 1}">${month}</option>`).join('');
      if (current) select.value = current;
      select.disabled = false;
      select.style.pointerEvents = 'auto';
    });
  }

  function safeOpen(el) {
    if (!el) return;
    try { if (typeof el.showModal === 'function' && !el.open) el.showModal(); else if (!el.open) el.setAttribute('open',''); }
    catch { el.setAttribute('open',''); }
  }
  function safeClose(el) {
    if (!el) return;
    try { if (typeof el.close === 'function' && el.open) el.close(); else el.removeAttribute('open'); }
    catch { el.removeAttribute('open'); }
  }

  function ensureStyleFields() {
    if (!form || ($('friendBubbleColour') && $('friendFrameColour') && $('friendFrameStyle'))) return;
    const target = saveBtn || form.querySelector('.primary-button');
    if (!target) return;
    const wrap = document.createElement('div');
    wrap.id = 'personStyleEditor';
    wrap.className = 'person-style-editor';
    wrap.innerHTML = `
      <h3>Bubble appearance</h3>
      <div class="person-colours">
        <label>Bubble colour<input id="friendBubbleColour" type="color" value="#b9d8ff"></label>
        <label>Frame colour<input id="friendFrameColour" type="color" value="#e2b5ff"></label>
      </div>
      <div class="frame-heading">Frame</div>
      <div class="frame-picker">
        <button type="button" data-frame="plain" class="frame-option active"><span class="frame-preview preview-plain"></span><b>Plain</b></button>
        <button type="button" data-frame="flowers" class="frame-option"><span class="frame-preview preview-flowers"></span><b>Flowers</b></button>
        <button type="button" data-frame="shards" class="frame-option"><span class="frame-preview preview-shards"></span><b>Shards</b></button>
      </div>
      <input id="friendFrameStyle" type="hidden" value="plain">`;
    form.insertBefore(wrap, target);
    wrap.querySelectorAll('.frame-option').forEach(btn => btn.addEventListener('click', () => {
      $('friendFrameStyle').value = btn.dataset.frame;
      wrap.querySelectorAll('.frame-option').forEach(x => x.classList.toggle('active', x === btn));
    }));
  }

  function openAddFriend() {
    if (!dialog || !form) return;
    ensureStyleFields(); ensureMonths(); form.reset();
    if ($('friendId')) $('friendId').value='';
    if ($('friendDialogTitle')) $('friendDialogTitle').textContent='Add friend';
    if ($('photoData')) $('photoData').value='';
    if ($('photoPreviewWrap')) $('photoPreviewWrap').innerHTML='<span>📷</span>';
    const cs = getComputedStyle(document.documentElement);
    if ($('friendBubbleColour')) $('friendBubbleColour').value=cs.getPropertyValue('--bubble').trim()||'#b9d8ff';
    if ($('friendFrameColour')) $('friendFrameColour').value=cs.getPropertyValue('--accent').trim()||'#e2b5ff';
    if ($('friendFrameStyle')) $('friendFrameStyle').value='plain';
    $('personStyleEditor')?.querySelectorAll('.frame-option').forEach(x=>x.classList.toggle('active',x.dataset.frame==='plain'));
    safeOpen(dialog);
  }

  function makeId(){return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}
  function readFriends(){try{const p=JSON.parse(localStorage.getItem(DATA_KEY)||'[]');return Array.isArray(p)?p:(Array.isArray(p?.friends)?p.friends:[])}catch{return []}}
  function initials(name=''){return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()||'').join('')||'?'}
  function esc(v=''){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}

  function renderFriendDirect(friend){
    const grid=$('peopleGrid'); if(!grid) return;
    let node=grid.querySelector(`[data-friend-id="${CSS.escape(friend.id)}"]`);
    if(!node){node=document.createElement('button');node.className=`person-bubble frame-${friend.frameStyle||'plain'}`;node.dataset.friendId=friend.id;grid.appendChild(node)}
    node.style.setProperty('--person-bubble',friend.bubbleColor||'#b9d8ff');
    node.style.setProperty('--frame-color',friend.frameColor||'#e2b5ff');
    const face=friend.imageData?`<img src="${friend.imageData}" alt="">`:`<div class="bubble-initials">${esc(initials(friend.name))}</div>`;
    node.innerHTML=`${face}<div class="bubble-label">${esc(friend.name)}${friend.relationship?`<span class="bubble-relation">${esc(friend.relationship)}</span>`:''}</div>`;
    node.onclick=()=>{try{if(typeof openPerson==='function')openPerson(friend.id)}catch{}};
  }

  async function shrinkDataUrl(dataUrl){
    if(!dataUrl) return '';
    return new Promise(resolve=>{const img=new Image();img.onload=()=>{const max=520,scale=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.68))};img.onerror=()=>resolve(dataUrl);img.src=dataUrl});
  }

  async function saveFriendDirect(event){
    event?.preventDefault?.(); event?.stopImmediatePropagation?.();
    if(!form) return;
    const name=$('friendName')?.value.trim()||'';
    if(!name){$('friendName')?.reportValidity?.();return;}
    const id=$('friendId')?.value||makeId();
    const friends=readFriends(); const idx=friends.findIndex(f=>f.id===id); const old=idx>=0?friends[idx]:null;
    const cs=getComputedStyle(document.documentElement);
    const friend={id,name,relationship:$('friendRelation')?.value.trim()||'',imageData:$('photoData')?.value||'',birthdayDay:Number($('birthdayDay')?.value)||'',birthdayMonth:Number($('birthdayMonth')?.value)||'',birthdayYear:Number($('birthdayYear')?.value)||'',entries:old?.entries||[],bubbleColor:$('friendBubbleColour')?.value||cs.getPropertyValue('--bubble').trim()||'#b9d8ff',frameStyle:$('friendFrameStyle')?.value||'plain',frameColor:$('friendFrameColour')?.value||cs.getPropertyValue('--accent').trim()||'#e2b5ff'};
    if(idx>=0)friends[idx]=friend;else friends.push(friend);
    try{localStorage.setItem(DATA_KEY,JSON.stringify(friends));}
    catch(err){
      friend.imageData=await shrinkDataUrl(friend.imageData);
      if(idx>=0)friends[idx]=friend;else friends[friends.length-1]=friend;
      try{localStorage.setItem(DATA_KEY,JSON.stringify(friends));}
      catch(err2){alert('Could not save this friend because browser storage is full. Try removing the photo and saving again.');return;}
    }
    try{if(typeof state!=='undefined'&&state?.friends){state.friends=friends;if(typeof renderHome==='function')renderHome();else renderFriendDirect(friend)}else renderFriendDirect(friend)}catch{renderFriendDirect(friend)}
    safeClose(dialog);
    try{if(typeof showToast==='function')showToast(idx>=0?'Person updated':'Friend added')}catch{}
  }

  ensureMonths();
  if(add)add.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openAddFriend()},{capture:true});
  if(saveBtn){saveBtn.type='button';saveBtn.addEventListener('click',saveFriendDirect,{capture:true});}
  if(form)form.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();saveFriendDirect(e)},{capture:true});

  const settingsBtn=$('settingsBtn'),settingsDialog=$('settingsDialog');
  if(settingsBtn&&settingsDialog)settingsBtn.addEventListener('click',e=>{e.preventDefault();try{if(typeof openSettings==='function'){openSettings();return}}catch{}safeOpen(settingsDialog)},{capture:true});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-close]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();safeClose($(b.dataset.close))},{capture:true});
})();
