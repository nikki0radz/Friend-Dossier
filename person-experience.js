(() => {
  const FONT_MAP={classic:"Georgia, 'Times New Roman', serif",elegant:"'Palatino Linotype','Book Antiqua',Palatino,serif",clean:"'Trebuchet MS',Arial,sans-serif",typewriter:"'Courier New',Courier,monospace"};

  function frameEmojis(friend){
    if(Array.isArray(friend?.frameEmojis)&&friend.frameEmojis.filter(Boolean).length) return friend.frameEmojis.filter(Boolean).slice(0,3);
    if(friend?.frameStyle==='flowers') return ['🌸'];
    if(friend?.frameStyle==='shards') return ['💎'];
    return [];
  }
  function wreathMarkup(friend,count=24){
    const list=frameEmojis(friend); if(!list.length) return '';
    const sizes=[1,.78,1.14,.88,1.03,.74,1.18,.84];
    const nudges=[0,-3,2,-1,3,-2,1,-3];
    let html='';
    for(let i=0;i<count;i++){
      const angle=(360/count)*i-90,rad=angle*Math.PI/180,radius=43+nudges[i%nudges.length];
      const x=50+Math.cos(rad)*radius,y=50+Math.sin(rad)*radius,size=sizes[i%sizes.length],rot=((i*37)%48)-24;
      html+=`<span class="px-wreath-piece" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;--s:${size};transform:translate(-50%,-50%) rotate(${rot}deg)">${esc(list[i%list.length])}</span>`;
    }
    return html;
  }
  function useWreath(friend){ return friend?.frameStyle && friend.frameStyle!=='plain' && frameEmojis(friend).length; }
  function portraitMarkup(friend,cls='px-hero-portrait'){
    const face=friend.imageData?`<img src="${friend.imageData}" alt="">`:`<div class="px-initials">${esc(initials(friend.name))}</div>`;
    const wreath=useWreath(friend)?`<span class="px-wreath">${wreathMarkup(friend,26)}</span>`:'';
    return `<div class="${cls} ${useWreath(friend)?'has-wreath':'has-bubble'}" style="--px-frame:${esc(friend.frameColor||settings.accent)};--px-bubble:${esc(friend.bubbleColor||settings.bubble)}">${wreath}${face}</div>`;
  }

  renderPersonHero=function(){
    const f=selected(); if(!f) return;
    const bd=formatPartialDate(f.birthdayDay,f.birthdayMonth,f.birthdayYear);
    const hero=$('personHero');
    hero.innerHTML=`
      <div class="px-ambient" aria-hidden="true"><i>✦</i><i>✧</i><i>⋆</i><i>✦</i><i>✶</i><i>⋆</i><i>✧</i><i>✦</i></div>
      ${portraitMarkup(f)}
      <div class="px-name">${esc(f.name)}</div>
      ${f.relationship?`<div class="px-role">${esc(f.relationship)}</div>`:''}
      ${bd?`<div class="px-birthday">🎂 ${esc(bd)}</div>`:''}
      <div class="px-rule"><span></span><b>✦</b><span></span></div>`;
  };

  showChoice=function(){
    $('readPanel')?.classList.add('hidden');
    $('addInfoPanel')?.classList.add('hidden');
    $('personHero')?.classList.remove('hidden');
    $('personBackBtn')?.classList.remove('hidden');
    $('personView')?.classList.remove('read-mode');
    const panel=$('personChoice');
    panel?.classList.remove('hidden');
    if(panel){
      panel.innerHTML=`<button id="readBtn" class="px-open-dossier"><span>✦</span><strong>Open dossier</strong><small>Enter ${esc(selected()?.name||'their')} archive</small></button>`;
      $('readBtn').onclick=showRead;
    }
  };

  function detailMarkup(e){
    if(e.type==='date'){
      const d=formatPartialDate(e.day,e.month,e.year),main=e.title||'Important date';
      return `<li><span class="entry-main">${esc(main)}</span>${d?`<span class="entry-detail">(${esc(d)})</span>`:''}</li>`;
    }
    const title=(e.title||'').trim(),value=(e.value||'').trim();
    const main=title||value,detail=title&&value?value:'';
    if(!main) return '';
    return `<li><span class="entry-main">${esc(main)}</span>${detail?`<span class="entry-detail">(${esc(detail)})</span>`:''}</li>`;
  }

  renderRead=function(){
    const f=selected(),p=$('readPanel'); if(!f||!p) return;
    const frame=f.frameColor||settings.accent,bg=f.profileBg||'#1b1326',text=f.profileText||'#f4edf7',head=f.profileHeading||frame,spark=f.profileSparkle||frame;
    const font=FONT_MAP[f.profileFont]||FONT_MAP.classic;
    const bd=formatPartialDate(f.birthdayDay,f.birthdayMonth,f.birthdayYear);
    p.innerHTML=`<section class="character-sheet px-dossier" style="--profile-frame:${esc(frame)};--profile-bg:${esc(bg)};--profile-text:${esc(text)};--profile-heading:${esc(head)};--profile-sparkle:${esc(spark)};--px-font:${font}">
      <div class="character-card-actions"><button class="character-back" id="backToChoices">‹ Profile</button><span>FRIEND DOSSIER</span><button class="character-edit" id="editEntriesBtn">Edit entries</button></div>
      <div class="px-dossier-sparks" aria-hidden="true"><i>✦</i><i>⋆</i><i>✧</i><i>✦</i><i>✶</i></div>
      <div class="px-dossier-head">${portraitMarkup(f,'px-dossier-portrait')}<div class="character-name">${esc(f.name)}</div>${f.relationship?`<div class="character-role">${esc(f.relationship)}</div>`:''}${bd?`<div class="character-birthday">🎂 ${esc(bd)}</div>`:''}</div>
      <div class="character-divider"><span></span><b>◆</b><span></span></div>
      <div class="px-dossier-tools"><button id="dossierAddInfo">＋ Add info</button><button id="dossierEditPerson">✎ Edit person</button></div>
      <div id="readStory" class="character-sections"></div>
      <div class="character-footer-ornament">✦ · ✧ · ✦</div>
    </section>`;
    $('backToChoices').onclick=showChoice;
    $('editEntriesBtn').onclick=renderReadEdit;
    $('dossierAddInfo').onclick=showAddInfo;
    $('dossierEditPerson').onclick=()=>openFriendDialog(f);
    const story=$('readStory');
    if(!f.entries.length){story.innerHTML='<div class="read-empty">No lore recorded yet ✦</div>';return;}
    const groups=new Map();f.entries.forEach(e=>{if(!groups.has(e.type))groups.set(e.type,[]);groups.get(e.type).push(e);});
    for(const [type,entries] of groups){const c=categoryFor(type),items=entries.map(detailMarkup).filter(Boolean);if(!items.length)continue;const sec=document.createElement('section');sec.className='character-section';sec.innerHTML=`<div class="character-section-title"><strong>${esc(c.name)}</strong></div><ul>${items.join('')}</ul>`;story.appendChild(sec);}
  };

  const css=document.createElement('style');css.id='personExperienceStyles';css.textContent=`
    #personView:not(.read-mode){min-height:calc(100dvh - 18px);display:flex;flex-direction:column;position:relative;overflow:hidden;padding-bottom:28px}
    #personView:not(.read-mode) #personBackBtn{position:relative;z-index:5;align-self:flex-start}
    #personView:not(.read-mode) #personHero{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:0;padding:18px 12px 12px;position:relative}
    .px-hero-portrait,.px-dossier-portrait{position:relative;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;isolation:isolate}
    .px-hero-portrait{width:min(70vw,300px);margin-top:-12px}.px-dossier-portrait{width:min(48vw,190px);margin:0 auto 15px}
    .px-hero-portrait.has-bubble,.px-dossier-portrait.has-bubble{background:radial-gradient(circle at 30% 20%,rgba(255,255,255,.45),transparent 25%),linear-gradient(145deg,color-mix(in srgb,var(--px-bubble) 35%,transparent),color-mix(in srgb,var(--px-bubble) 12%,transparent));box-shadow:inset 0 0 28px rgba(255,255,255,.08),0 20px 60px rgba(0,0,0,.25)}
    .px-hero-portrait.has-wreath,.px-dossier-portrait.has-wreath{background:transparent!important;box-shadow:none!important}
    .px-hero-portrait>img,.px-hero-portrait>.px-initials,.px-dossier-portrait>img,.px-dossier-portrait>.px-initials{position:absolute;inset:50% auto auto 50%;transform:translate(-50%,-50%);width:72%;height:72%;border-radius:50%;object-fit:cover;z-index:2;box-shadow:0 12px 36px rgba(0,0,0,.32)}
    .px-hero-portrait.has-bubble>img,.px-hero-portrait.has-bubble>.px-initials,.px-dossier-portrait.has-bubble>img,.px-dossier-portrait.has-bubble>.px-initials{width:82%;height:82%}
    .px-initials{display:grid!important;place-items:center;background:linear-gradient(145deg,var(--px-frame),var(--px-bubble));font-size:42px;font-weight:900;color:#2a1833}
    .px-wreath{position:absolute;inset:0;z-index:4;pointer-events:none}.px-wreath-piece{position:absolute;font-size:calc(clamp(23px,7vw,38px) * var(--s));line-height:1;filter:drop-shadow(0 3px 3px rgba(0,0,0,.3));white-space:nowrap}.px-dossier-portrait .px-wreath-piece{font-size:calc(clamp(20px,5.7vw,31px) * var(--s))}
    .px-name{font-family:Georgia,serif;font-size:clamp(38px,11vw,56px);line-height:.95;margin-top:23px;text-align:center;color:#fff8ff;text-shadow:0 4px 24px rgba(0,0,0,.42)}
    .px-role{margin-top:10px;font-size:12px;text-transform:uppercase;letter-spacing:.18em;color:color-mix(in srgb,var(--accent) 75%,white)}.px-birthday{margin-top:10px;font-size:12px;color:#e9ddea}
    .px-rule{width:min(70vw,330px);display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;color:var(--accent);margin-top:24px}.px-rule span{height:1px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--accent) 70%,transparent))}.px-rule span:last-child{background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 70%,transparent),transparent)}
    .px-open-dossier{width:min(88vw,520px);margin:4px auto 0;padding:19px 20px;border-radius:22px;border:1px solid color-mix(in srgb,var(--accent) 42%,transparent);background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 15%,transparent),rgba(255,255,255,.035));color:#fff;display:grid;grid-template-columns:auto 1fr;grid-template-areas:'icon title' 'icon sub';column-gap:13px;text-align:left;box-shadow:0 16px 38px rgba(0,0,0,.2)}.px-open-dossier>span{grid-area:icon;align-self:center;font-size:27px;color:var(--accent);text-shadow:0 0 12px currentColor}.px-open-dossier strong{grid-area:title;font-family:Georgia,serif;font-size:21px}.px-open-dossier small{grid-area:sub;color:var(--muted);font-size:11px;margin-top:2px}
    #personChoice{margin-top:auto!important;padding-bottom:max(8px,env(safe-area-inset-bottom))}
    .px-ambient{position:absolute;inset:0;pointer-events:none}.px-ambient i{position:absolute;color:color-mix(in srgb,var(--accent) 70%,white);font-style:normal;text-shadow:0 0 12px currentColor;animation:pxTwinkle 4.8s ease-in-out infinite}.px-ambient i:nth-child(1){left:9%;top:18%;font-size:18px}.px-ambient i:nth-child(2){right:12%;top:14%;font-size:26px;animation-delay:-1.2s}.px-ambient i:nth-child(3){left:18%;bottom:26%;font-size:15px;animation-delay:-2.1s}.px-ambient i:nth-child(4){right:13%;bottom:29%;font-size:19px;animation-delay:-.7s}.px-ambient i:nth-child(5){left:6%;top:52%;font-size:11px;animation-delay:-3s}.px-ambient i:nth-child(6){right:7%;top:48%;font-size:13px;animation-delay:-1.7s}.px-ambient i:nth-child(7){left:31%;top:8%;font-size:10px;animation-delay:-2.6s}.px-ambient i:nth-child(8){right:31%;bottom:15%;font-size:12px;animation-delay:-.3s}
    .px-dossier{font-family:var(--px-font);position:relative}.px-dossier-head{text-align:center}.px-dossier .character-name{color:var(--profile-heading)!important}.px-dossier .character-section-title strong{color:var(--profile-heading)!important}.px-dossier-sparks{position:absolute;inset:48px 12px auto;pointer-events:none}.px-dossier-sparks i{position:absolute;color:var(--profile-sparkle);font-style:normal;text-shadow:0 0 11px currentColor;animation:pxTwinkle 5s ease-in-out infinite}.px-dossier-sparks i:nth-child(1){left:8%;top:20px}.px-dossier-sparks i:nth-child(2){right:10%;top:70px;animation-delay:-2s}.px-dossier-sparks i:nth-child(3){left:19%;top:120px;animation-delay:-1s}.px-dossier-sparks i:nth-child(4){right:24%;top:6px;animation-delay:-3s}.px-dossier-sparks i:nth-child(5){right:4%;top:145px;animation-delay:-1.5s}
    .px-dossier-tools{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:7px 2px 16px}.px-dossier-tools button{border:1px solid color-mix(in srgb,var(--profile-frame) 28%,transparent);background:color-mix(in srgb,var(--profile-frame) 9%,transparent);color:var(--profile-heading);border-radius:13px;padding:10px 9px;font-size:11px;font-weight:800}
    @keyframes pxTwinkle{0%,100%{opacity:.18;transform:scale(.86) rotate(0)}50%{opacity:.9;transform:scale(1.12) rotate(7deg)}}
    @media(min-width:700px){.px-hero-portrait{width:310px}.px-dossier-portrait{width:205px}}
  `;document.head.appendChild(css);
})();