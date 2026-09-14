(() => {
  const EMOJI_KEY = 'frameEmojis';

  function fallbackEmojis(friend){
    if(Array.isArray(friend?.frameEmojis) && friend.frameEmojis.filter(Boolean).length) return friend.frameEmojis.filter(Boolean).slice(0,3);
    if(friend?.frameStyle === 'flowers') return ['🌸'];
    if(friend?.frameStyle === 'shards') return ['💎'];
    return ['🌸'];
  }

  function wreathMarkup(emojis, count=22){
    const list=(emojis||[]).filter(Boolean).slice(0,3);
    if(!list.length) return '';
    const sizes=[1,.78,1.13,.88,1.02,.72,1.18,.84];
    const nudges=[0,-3,2,-1,3,-2,1,-3];
    let html='';
    for(let i=0;i<count;i++){
      const angle=(360/count)*i - 90;
      const rad=angle*Math.PI/180;
      const radius=43 + nudges[i%nudges.length];
      const x=50 + Math.cos(rad)*radius;
      const y=50 + Math.sin(rad)*radius;
      const size=sizes[i%sizes.length];
      const emoji=list[i%list.length];
      const rotate=((i*37)%48)-24;
      html += `<span class="emoji-wreath-piece" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;--emoji-size:${size};transform:translate(-50%,-50%) rotate(${rotate}deg)">${esc(emoji)}</span>`;
    }
    return html;
  }

  function hydrateEmojiData(){
    try{
      const raw=localStorage.getItem(DATA_KEY);
      if(raw){
        const parsed=JSON.parse(raw);
        const arr=Array.isArray(parsed)?parsed:(Array.isArray(parsed?.friends)?parsed.friends:[]);
        const map=new Map(arr.map(f=>[f.id,f]));
        state.friends.forEach(friend=>{
          const saved=map.get(friend.id);
          if(Array.isArray(saved?.frameEmojis)) friend.frameEmojis=saved.frameEmojis.slice(0,3);
          if(friend.frameStyle==='flowers'){friend.frameStyle='emoji';friend.frameEmojis=friend.frameEmojis?.length?friend.frameEmojis:['🌸'];}
          if(friend.frameStyle==='shards'){friend.frameStyle='emoji';friend.frameEmojis=friend.frameEmojis?.length?friend.frameEmojis:['💎'];}
        });
        persistFriends();
      }
    }catch(err){console.warn('Emoji frame migration skipped',err);}
  }

  function ensureEmojiEditor(){
    const editor=$('personStyleEditor');
    if(!editor || $('friendFrameEmoji1')) return;
    const picker=editor.querySelector('.frame-picker');
    if(picker){
      picker.innerHTML=`
        <button type="button" data-frame="plain" class="frame-option"><span class="frame-preview preview-plain"></span><b>Plain</b></button>
        <button type="button" data-frame="emoji" class="frame-option emoji-frame-option"><span class="emoji-preview-wreath"><i>🌸</i><i>✨</i><i>🌿</i><i>🌸</i><i>✨</i><i>🌿</i></span><b>Emoji wreath</b></button>`;
      picker.querySelectorAll('.frame-option').forEach(btn=>btn.addEventListener('click',()=>{
        $('friendFrameStyle').value=btn.dataset.frame;
        picker.querySelectorAll('.frame-option').forEach(x=>x.classList.toggle('active',x===btn));
        updateEmojiEditorVisibility();
      }));
    }
    const fields=document.createElement('div');
    fields.className='emoji-frame-editor';
    fields.innerHTML=`
      <div class="emoji-frame-title"><strong>Wreath emojis</strong><small>Choose up to 3</small></div>
      <div class="emoji-frame-inputs">
        <label><span>1</span><input id="friendFrameEmoji1" maxlength="8" inputmode="text" placeholder="🌸"></label>
        <label><span>2</span><input id="friendFrameEmoji2" maxlength="8" inputmode="text" placeholder="🌿"></label>
        <label><span>3</span><input id="friendFrameEmoji3" maxlength="8" inputmode="text" placeholder="✨"></label>
      </div>
      <p class="emoji-frame-help">The app mixes big and small versions around the whole circle.</p>`;
    picker?.insertAdjacentElement('afterend',fields);
    fields.querySelectorAll('input').forEach(input=>input.addEventListener('input',updateEmojiPreview));
  }

  function selectedFrameEmojis(){
    return [$('friendFrameEmoji1')?.value.trim(),$('friendFrameEmoji2')?.value.trim(),$('friendFrameEmoji3')?.value.trim()].filter(Boolean).slice(0,3);
  }

  function updateEmojiEditorVisibility(){
    const fields=document.querySelector('.emoji-frame-editor');
    if(fields) fields.classList.toggle('hidden',$('friendFrameStyle')?.value!=='emoji');
    updateEmojiPreview();
  }

  function updateEmojiPreview(){
    const preview=document.querySelector('.emoji-preview-wreath');
    if(!preview) return;
    const emojis=selectedFrameEmojis();
    const use=emojis.length?emojis:['🌸','✨','🌿'];
    preview.querySelectorAll('i').forEach((node,i)=>node.textContent=use[i%use.length]);
  }

  const originalOpenFriendDialog=openFriendDialog;
  openFriendDialog=function(friend=null){
    originalOpenFriendDialog(friend);
    ensureEmojiEditor();
    const emojis=fallbackEmojis(friend);
    if($('friendFrameEmoji1')) $('friendFrameEmoji1').value=emojis[0]||'';
    if($('friendFrameEmoji2')) $('friendFrameEmoji2').value=emojis[1]||'';
    if($('friendFrameEmoji3')) $('friendFrameEmoji3').value=emojis[2]||'';
    const style=(friend?.frameStyle==='flowers'||friend?.frameStyle==='shards')?'emoji':(friend?.frameStyle||'plain');
    if($('friendFrameStyle')) $('friendFrameStyle').value=style;
    document.querySelectorAll('.frame-option').forEach(btn=>btn.classList.toggle('active',btn.dataset.frame===style));
    updateEmojiEditorVisibility();
  };

  const originalSaveButton=$('friendForm')?.querySelector('.primary-button');
  originalSaveButton?.addEventListener('click',()=>{
    queueMicrotask(()=>{
      const id=$('friendId')?.value;
      const friend=state.friends.find(f=>f.id===id);
      if(!friend) return;
      if($('friendFrameStyle')?.value==='emoji'){
        friend.frameStyle='emoji';
        friend.frameEmojis=selectedFrameEmojis().length?selectedFrameEmojis():['🌸'];
      }else{
        friend.frameStyle='plain';
        friend.frameEmojis=[];
      }
      persistFriends();
      renderHome();
    });
  });

  renderHome=function(){
    const grid=$('peopleGrid');if(!grid)return;
    const q=($('searchInput')?.value||'').trim().toLowerCase();grid.innerHTML='';
    state.friends.filter(f=>`${f.name} ${f.relationship}`.toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name)).forEach(f=>{
      const style=f.frameStyle==='plain'?'plain':'emoji';
      const b=document.createElement('button');
      b.className=`person-bubble frame-${style}`;
      b.style.setProperty('--person-bubble',f.bubbleColor||settings.bubble);
      b.style.setProperty('--frame-color',f.frameColor||settings.accent);
      const face=f.imageData?`<img src="${f.imageData}" alt="">`:`<div class="bubble-initials">${esc(initials(f.name))}</div>`;
      const frame=style==='emoji'?`<span class="frame-layer emoji-wreath">${wreathMarkup(fallbackEmojis(f),22)}</span>`:`<span class="frame-layer"></span>`;
      b.innerHTML=`${frame}${face}<div class="bubble-label">${esc(f.name)}${f.relationship?`<span class="bubble-relation">${esc(f.relationship)}</span>`:''}</div>`;
      b.addEventListener('click',()=>openPerson(f.id));grid.appendChild(b);
    });
  };

  renderRead=function(){
    const f=selected(),p=$('readPanel');if(!f||!p)return;
    const style=f.frameStyle==='plain'?'plain':'emoji';
    const frameColor=f.frameColor||settings.accent,bubbleColor=f.bubbleColor||settings.bubble;
    const face=f.imageData?`<img class="read-profile-photo" src="${f.imageData}" alt="">`:`<div class="read-profile-initials">${esc(initials(f.name))}</div>`;
    const bd=formatPartialDate(f.birthdayDay,f.birthdayMonth,f.birthdayYear);
    const portraitFrame=style==='emoji'?`<span class="frame-layer emoji-wreath">${wreathMarkup(fallbackEmojis(f),24)}</span>`:`<span class="frame-layer"></span>`;
    p.innerHTML=`<section class="character-sheet character-frame-${style}" style="--profile-frame:${esc(frameColor)};--profile-bubble:${esc(bubbleColor)}"><div class="character-card-actions"><button class="character-back" id="backToChoices">‹ Back</button><span>FRIEND DOSSIER</span><button class="character-edit" id="editReadBtn">Edit</button></div><span class="sheet-corner corner-a">✦</span><span class="sheet-corner corner-b">✦</span><span class="sheet-corner corner-c">✦</span><span class="sheet-corner corner-d">✦</span><div class="character-title-rule"><span></span><b>✧</b><span></span></div><div class="character-profile-head"><div class="character-portrait-wrap frame-${style}">${portraitFrame}${face}</div><div class="character-name-block"><div class="character-name">${esc(f.name)}</div>${f.relationship?`<div class="character-role">${esc(f.relationship)}</div>`:''}${bd?`<div class="character-birthday">🎂 ${esc(bd)}</div>`:''}</div></div><div class="character-divider"><span></span><b>◆</b><span></span></div><div id="readStory" class="character-sections"></div><div class="character-footer-ornament">✦ · ✧ · ✦</div></section>`;
    $('backToChoices').onclick=showChoice;$('editReadBtn').onclick=renderReadEdit;
    const story=$('readStory');if(!f.entries.length){story.innerHTML='<div class="read-empty">No lore recorded yet ✦</div>';return;}
    const groups=new Map();f.entries.forEach(e=>{if(!groups.has(e.type))groups.set(e.type,[]);groups.get(e.type).push(e);});
    for(const [type,entries] of groups){const c=categoryFor(type),values=entries.map(displayEntry).filter(Boolean);if(!values.length)continue;const section=document.createElement('section');section.className='character-section';section.innerHTML=`<div class="character-section-title"><span>${esc(c.emoji)}</span><strong>${esc(c.name)}</strong></div><ul>${values.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`;story.appendChild(section);}
  };

  const css=document.createElement('style');
  css.id='emojiWreathStyles';
  css.textContent=`
    .emoji-wreath{position:absolute!important;inset:0!important;border-radius:50%;pointer-events:none;z-index:5!important;overflow:visible}
    .emoji-wreath:before{content:"";position:absolute;inset:8%;border-radius:50%;border:2px solid color-mix(in srgb,var(--frame-color) 62%,#d0a36b 38%);box-shadow:0 0 9px color-mix(in srgb,var(--frame-color) 25%,transparent),inset 0 0 5px rgba(255,255,255,.16)}
    .emoji-wreath-piece{position:absolute;display:block;font-size:calc(clamp(17px,5vw,27px) * var(--emoji-size));line-height:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.28));transform-origin:center;white-space:nowrap}
    .character-portrait-wrap .emoji-wreath-piece{font-size:calc(clamp(20px,6.2vw,31px) * var(--emoji-size))}
    .frame-emoji .frame-layer{inset:0}
    .frame-emoji.person-bubble>img,.frame-emoji.person-bubble>.bubble-initials{width:72%;height:72%}
    .character-portrait-wrap.frame-emoji .read-profile-photo,.character-portrait-wrap.frame-emoji .read-profile-initials{width:70%;height:70%}
    .emoji-frame-editor{margin-top:14px;padding:13px;border-radius:16px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035)}
    .emoji-frame-title{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px}.emoji-frame-title small{color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.08em}
    .emoji-frame-inputs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.emoji-frame-inputs label{display:grid;grid-template-columns:22px 1fr;align-items:center;gap:4px}.emoji-frame-inputs label span{font-size:10px;color:var(--muted);text-align:center}.emoji-frame-inputs input{min-width:0;text-align:center;font-size:22px;padding:9px 4px;border-radius:12px}
    .emoji-frame-help{margin:9px 0 0;color:var(--muted);font-size:10px;line-height:1.4}
    .emoji-frame-option .emoji-preview-wreath{position:relative;width:54px;height:54px;border-radius:50%;display:block;margin:auto}.emoji-preview-wreath i{position:absolute;font-style:normal;font-size:16px}.emoji-preview-wreath i:nth-child(1){top:0;left:18px}.emoji-preview-wreath i:nth-child(2){top:9px;right:0}.emoji-preview-wreath i:nth-child(3){bottom:5px;right:4px}.emoji-preview-wreath i:nth-child(4){bottom:0;left:17px}.emoji-preview-wreath i:nth-child(5){bottom:8px;left:0}.emoji-preview-wreath i:nth-child(6){top:8px;left:1px}
  `;
  document.head.appendChild(css);

  hydrateEmojiData();
  ensureEmojiEditor();
  renderHome();
})();