(() => {
  const FONT_MAP={
    default:'',
    classic:"'Libre Baskerville', Georgia, serif",
    elegant:"'Dancing Script', cursive",
    clean:"'Nunito Sans', Arial, sans-serif",
    typewriter:"'Special Elite', 'Courier New', monospace",
    storybook:"'UnifrakturCook', 'Old English Text MT', cursive",
    handwritten:"'Caveat', cursive"
  };

  function ensureProfileAura(){
    let aura=document.getElementById('profileAuraLayer');
    if(!aura){
      aura=document.createElement('div');
      aura.id='profileAuraLayer';
      aura.setAttribute('aria-hidden','true');
      document.body.appendChild(aura);
    }
    return aura;
  }
  function syncProfileAura(friend){
    const aura=ensureProfileAura();
    const active=friend && !$('personView')?.classList.contains('hidden') && !$('personView')?.classList.contains('read-mode');
    aura.classList.toggle('active',Boolean(active));
    document.body.classList.toggle('person-profile-active',Boolean(active));
    if(active) aura.style.setProperty('--profile-aura',friend.profileSparkle||friend.profileHeading||friend.frameColor||settings.accent);
  }
  function sparkleIcons(friend){
    return Array.isArray(friend?.profileSparkleIcons)&&friend.profileSparkleIcons.length?friend.profileSparkleIcons.slice(0,100):['✦','✧','⋆','✶','☾','⟡'];
  }
  function sparkleCount(friend,area='profile'){
    const density=friend?.profileSparkleDensity||'constellation';
    const counts={profile:{whisper:7,constellation:18,starfall:44},dossier:{whisper:5,constellation:11,starfall:20}};
    return counts[area]?.[density]||counts[area].constellation;
  }
  function sparkleHash(seed=''){
    let h=2166136261;
    for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619);}
    return ()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
  }
  function sparkleMarkup(friend,area='profile'){
    const icons=sparkleIcons(friend),count=sparkleCount(friend,area);
    const layouts={
      profile:[
        [3,10,18],[18,8,17],[43,9,20],[67,8,18],[92,9,19],
        [8,18,14],[28,18,18],[55,17,15],[80,17,19],[97,23,16],
        [4,29,20],[18,31,15],[37,28,13],[59,30,17],[76,27,15],[94,35,20],
        [7,41,17],[25,42,19],[47,39,14],[67,42,21],[86,43,16],
        [3,54,18],[16,55,13],[35,52,16],[54,55,14],[74,53,18],[95,57,20],
        [7,67,15],[22,65,18],[40,68,13],[60,66,17],[81,69,15],[94,72,19],
        [4,80,20],[18,78,14],[33,82,18],[51,79,15],[69,83,19],[87,81,16],
        [9,91,17],[29,90,15],[48,91,18],[68,92,14],[92,90,20],
        [50,23,11],[12,48,12],[88,33,13],[30,59,12]
      ],
      dossier:[
        [10,12,10],[86,11,15],[23,25,9],[72,24,13],[7,39,14],[91,38,9],
        [31,48,11],[66,46,8],[15,60,13],[84,61,10],[43,69,9],[71,73,14],
        [9,82,10],[92,85,8],[27,89,12],[57,86,9],[49,31,10],[37,76,8],
        [78,52,11],[18,44,9]
      ]
    };
    const slots=layouts[area]||layouts.profile;
    const rand=sparkleHash(String(friend?.id||friend?.name||'friend')+'|'+area+'|'+icons.join('|'));
    let pool=[];
    function nextIcon(){
      if(!pool.length){
        pool=icons.slice();
        for(let i=pool.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
      }
      return pool.pop()||icons[0];
    }
    return Array.from({length:Math.min(count,slots.length)},(_,i)=>{
      const pos=slots[i],icon=nextIcon();
      const size=Math.max(10,pos[2]+Math.floor(rand()*10)-2);
      const delay=-(rand()*7.4).toFixed(2);
      const opacityLow=(.08+rand()*.34).toFixed(2);
      const opacityHigh=Math.min(.96,Number(opacityLow)+.20+rand()*.40).toFixed(2);
      const floatX=Math.round(rand()*18-9);
      const floatY=Math.round(-(4+rand()*12));
      const rotate=Math.round(rand()*28-14);
      const floatRot=Math.round(rand()*18-9);
      const floatDur=(5.2+rand()*6.2).toFixed(2);
      const fadeDur=(4.1+rand()*5.7).toFixed(2);
      return '<i style="left:'+pos[0]+'%;top:'+pos[1]+'%;font-size:'+size+'px;--spark-delay:'+delay+'s;--spark-opacity-low:'+opacityLow+';--spark-opacity-high:'+opacityHigh+';--spark-float-x:'+floatX+'px;--spark-float-y:'+floatY+'px;--spark-rotate:'+rotate+'deg;--spark-float-rotate:'+floatRot+'deg;--spark-float-dur:'+floatDur+'s;--spark-fade-dur:'+fadeDur+'s">'+esc(icon)+'</i>';
    }).join('');
  }
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
      const angle=(360/count)*i-90,rad=angle*Math.PI/180,radius=40.5+nudges[i%nudges.length]*.45;
      const x=50+Math.cos(rad)*radius,y=50+Math.sin(rad)*radius,size=sizes[i%sizes.length],rot=((i*37)%48)-24;
      html+=`<span class="px-wreath-piece" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;--s:${size};transform:translate(-50%,-50%) rotate(${rot}deg)">${esc(list[i%list.length])}</span>`;
    }
    return html;
  }
  function useWreath(friend){ return friend?.frameStyle==='emoji' && frameEmojis(friend).length; }
  function portraitMarkup(friend,cls='px-hero-portrait'){
    const face=friend.imageData?`<img src="${friend.imageData}" alt="">`:`<div class="px-initials">${esc(initials(friend.name))}</div>`;
    const wreath=useWreath(friend)?`<span class="px-wreath">${wreathMarkup(friend,30)}</span>`:'';
    const portraitMode=useWreath(friend)?'has-wreath':'has-none';
    return `<div class="${cls} ${portraitMode}" style="--px-frame:${esc(friend.frameColor||settings.accent)}">${wreath}${face}</div>`;
  }

  renderPersonHero=function(){
    const f=selected(); if(!f) return;
    const bd=formatPartialDate(f.birthdayDay,f.birthdayMonth,f.birthdayYear);
    const hero=$('personHero');
    const personAccent=f.profileSparkle||f.profileHeading||f.frameColor||settings.accent;
    $('personView')?.style.setProperty('--person-accent',personAccent);
    $('personView')?.style.setProperty('--person-text',f.profileText||'#f4edf7');
    $('personView')?.style.setProperty('--person-heading',f.profileHeading||f.frameColor||personAccent);
    const fontKey=(f.profileFont in FONT_MAP)?f.profileFont:'default';
    const personRoot=$('personView');
    const textScale=Math.max(80,Math.min(140,Number(f.profileTextScale)||100));
    const scale=textScale/100;
    const bodyScale=1+(scale-1)*.65;
    const vw=window.innerWidth||390;
    personRoot?.style.setProperty('--person-text-scale',String(scale));
    personRoot?.style.setProperty('--person-name-size',`${Math.min(56,Math.max(38,vw*.11))*scale}px`);
    personRoot?.style.setProperty('--person-meta-size',`${12*bodyScale}px`);
    personRoot?.style.setProperty('--person-archive-title-size',`${24*scale}px`);
    personRoot?.style.setProperty('--person-archive-sub-size',`${10*bodyScale}px`);
    personRoot?.style.setProperty('--person-action-size',`${12*bodyScale}px`);
    personRoot?.style.setProperty('--person-dossier-name-size',`${Math.min(48,Math.max(34,vw*.10))*scale}px`);
    personRoot?.style.setProperty('--person-dossier-role-size',`${12*bodyScale}px`);
    personRoot?.style.setProperty('--person-dossier-birthday-size',`${11*bodyScale}px`);
    personRoot?.style.setProperty('--person-section-title-size',`${17*bodyScale}px`);
    personRoot?.style.setProperty('--person-entry-size',`${13*bodyScale}px`);
    personRoot?.style.setProperty('--person-entry-detail-size',`${11*bodyScale}px`);
    personRoot?.classList.toggle('custom-text-size',textScale!==100);
    syncProfileAura(f);
    if(fontKey==='default'){
      personRoot?.classList.remove('custom-person-font');
      personRoot?.style.removeProperty('--person-font');
    }else{
      personRoot?.classList.add('custom-person-font');
      personRoot?.style.setProperty('--person-font',FONT_MAP[fontKey]);
    }
    let ambient=personRoot?.querySelector(':scope > .px-ambient');
    if(!ambient){
      ambient=document.createElement('div');
      ambient.className='px-ambient';
      ambient.setAttribute('aria-hidden','true');
      personRoot?.prepend(ambient);
    }
    ambient.innerHTML=sparkleMarkup(f,'profile');
    hero.innerHTML=`
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

  function categoryImages(entries){
    return entries.flatMap(entry=>(Array.isArray(entry.images)?entry.images:[]).filter(Boolean));
  }

  let galleryImages=[];
  let galleryIndex=0;
  function ensureGalleryViewer(){
    if(document.getElementById('dossierGalleryViewer'))return document.getElementById('dossierGalleryViewer');
    const viewer=document.createElement('div');
    viewer.id='dossierGalleryViewer';
    viewer.className='dossier-gallery-viewer';
    viewer.innerHTML=`
      <button class="dgv-close" aria-label="Close gallery">×</button>
      <button class="dgv-nav dgv-prev" aria-label="Previous picture">‹</button>
      <figure><img alt=""><figcaption></figcaption></figure>
      <button class="dgv-nav dgv-next" aria-label="Next picture">›</button>
    `;
    document.body.appendChild(viewer);
    viewer.querySelector('.dgv-close').onclick=closeGallery;
    viewer.querySelector('.dgv-prev').onclick=()=>stepGallery(-1);
    viewer.querySelector('.dgv-next').onclick=()=>stepGallery(1);
    viewer.addEventListener('click',e=>{if(e.target===viewer)closeGallery();});
    let startX=0,startY=0;
    viewer.addEventListener('touchstart',e=>{
      if(e.touches.length!==1)return;
      startX=e.touches[0].clientX;startY=e.touches[0].clientY;
    },{passive:true});
    viewer.addEventListener('touchend',e=>{
      if(!startX||!e.changedTouches?.length)return;
      const dx=e.changedTouches[0].clientX-startX,dy=e.changedTouches[0].clientY-startY;
      startX=startY=0;
      if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.2)stepGallery(dx<0?1:-1);
    },{passive:true});
    return viewer;
  }
  function updateGalleryViewer(){
    const viewer=ensureGalleryViewer();
    const img=viewer.querySelector('img');
    const cap=viewer.querySelector('figcaption');
    img.src=galleryImages[galleryIndex]||'';
    cap.textContent=galleryImages.length>1?`${galleryIndex+1} / ${galleryImages.length}`:'';
    viewer.querySelector('.dgv-prev').classList.toggle('hidden',galleryImages.length<2);
    viewer.querySelector('.dgv-next').classList.toggle('hidden',galleryImages.length<2);
  }
  function openGallery(images,index=0){
    galleryImages=images;
    galleryIndex=Math.max(0,Math.min(index,images.length-1));
    updateGalleryViewer();
    ensureGalleryViewer().classList.add('open');
    document.body.classList.add('gallery-open');
  }
  function closeGallery(){
    document.getElementById('dossierGalleryViewer')?.classList.remove('open');
    document.body.classList.remove('gallery-open');
  }
  function stepGallery(direction){
    if(galleryImages.length<2)return;
    galleryIndex=(galleryIndex+direction+galleryImages.length)%galleryImages.length;
    updateGalleryViewer();
  }
  function bindCategoryGalleries(root){
    root.querySelectorAll('.category-gallery').forEach(gallery=>{
      const images=JSON.parse(gallery.dataset.images||'[]');
      gallery.querySelectorAll('.category-thumb').forEach((btn,i)=>btn.onclick=()=>openGallery(images,i));
    });
  }

  renderRead=function(){
    const f=selected(),p=$('readPanel'); if(!f||!p) return;
    const frame=f.frameColor||settings.accent,bg=f.profileBg||'#1b1326',text=f.profileText||'#f4edf7',head=f.profileHeading||frame,spark=f.profileSparkle||frame;
    const font=(f.profileFont&&FONT_MAP[f.profileFont])?FONT_MAP[f.profileFont]:"Georgia, 'Times New Roman', serif";
    const bd=formatPartialDate(f.birthdayDay,f.birthdayMonth,f.birthdayYear);
    p.innerHTML=`<section class="character-sheet px-dossier" style="--profile-frame:${esc(frame)};--profile-bg:${esc(bg)};--profile-text:${esc(text)};--profile-heading:${esc(head)};--profile-sparkle:${esc(spark)};--px-font:${font}">
      <div class="character-card-actions"><button class="character-back" id="backToChoices">‹ Profile</button><span>FRIEND DOSSIER</span><button class="character-edit" id="editEntriesBtn">Edit entries</button></div>
      <div class="px-dossier-sparks" aria-hidden="true">${sparkleMarkup(f,'dossier')}</div>
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
    for(const [type,entries] of groups){
      const c=categoryFor(type),items=entries.map(detailMarkup).filter(Boolean),images=categoryImages(entries);
      if(!items.length&&!images.length)continue;
      const sec=document.createElement('section');
      sec.className='character-section';
      const gallery=images.length?`<div class="category-gallery" data-images='${esc(JSON.stringify(images))}'>${images.map((src,i)=>`<button type="button" class="category-thumb" aria-label="Open picture ${i+1}"><img src="${src}" alt=""></button>`).join('')}</div>`:'';
      sec.innerHTML=`<div class="character-section-title"><strong>${esc(c.name)}</strong></div>${items.length?`<ul>${items.join('')}</ul>`:''}${gallery}`;
      story.appendChild(sec);
    }
    bindCategoryGalleries(story);
  };

  const auraObserver=new MutationObserver(()=>syncProfileAura(selected()));
  if($('personView')) auraObserver.observe($('personView'),{attributes:true,attributeFilter:['class']});

  const css=document.createElement('style');css.id='personExperienceStyles';css.textContent=`
    body.person-profile-active .grimoire-ambience{display:none!important}
    #app:has(#personView:not(.hidden))>.grimoire-ambience{display:none!important}
    #profileAuraLayer{position:fixed;inset:-160px;z-index:0;pointer-events:none;opacity:0;background:radial-gradient(ellipse at 50% 72%,color-mix(in srgb,var(--profile-aura) 13%,transparent) 0%,color-mix(in srgb,var(--profile-aura) 7%,transparent) 28%,color-mix(in srgb,var(--profile-aura) 3%,transparent) 48%,transparent 70%);filter:blur(34px);transition:opacity .25s ease}
    #profileAuraLayer.active{opacity:.62;animation:profileAuraPulse 3.6s ease-in-out infinite}
    @keyframes profileAuraPulse{0%,100%{opacity:.42;transform:scale(1)}50%{opacity:.68;transform:scale(1.025)}}
    #app{position:relative;z-index:1}

    #personView.custom-person-font,#personView.custom-person-font *{font-family:var(--person-font)!important}
    #personView:not(.read-mode){min-height:calc(100dvh - 18px);display:flex;flex-direction:column;position:relative;overflow:visible;padding-bottom:28px}
    #personView:not(.read-mode) #personBackBtn{position:relative;z-index:5;align-self:flex-start}
    #personView:not(.read-mode) #personHero{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:0;padding:18px 12px 12px;position:relative}
    .px-hero-portrait,.px-dossier-portrait{position:relative;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;isolation:isolate}
    .px-hero-portrait{width:min(70vw,300px);margin-top:-12px}.px-dossier-portrait{width:min(48vw,190px);margin:0 auto 15px}
    .px-hero-portrait.has-bubble,.px-dossier-portrait.has-bubble{background:radial-gradient(circle at 30% 20%,rgba(255,255,255,.32),transparent 25%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.018));box-shadow:inset 0 0 28px rgba(255,255,255,.07),0 20px 60px rgba(0,0,0,.25)}
    .px-hero-portrait.has-wreath,.px-dossier-portrait.has-wreath{background:transparent!important;box-shadow:none!important}
    .px-hero-portrait.has-none,.px-dossier-portrait.has-none{background:transparent!important;box-shadow:none!important}
    .px-hero-portrait.has-none>img,.px-dossier-portrait.has-none>img{width:82%;height:82%;border:0!important;box-shadow:0 12px 36px rgba(0,0,0,.28)!important}
    .px-hero-portrait.has-none>.px-initials,.px-dossier-portrait.has-none>.px-initials{width:82%;height:82%;background:transparent!important;box-shadow:none!important;color:var(--person-accent,var(--accent))!important}
    .px-hero-portrait>img,.px-hero-portrait>.px-initials,.px-dossier-portrait>img,.px-dossier-portrait>.px-initials{position:absolute;inset:50% auto auto 50%;transform:translate(-50%,-50%);width:80%;height:80%;border-radius:50%;object-fit:cover;z-index:2;box-shadow:0 12px 36px rgba(0,0,0,.32)}
    .px-hero-portrait.has-bubble>img,.px-hero-portrait.has-bubble>.px-initials,.px-dossier-portrait.has-bubble>img,.px-dossier-portrait.has-bubble>.px-initials{width:82%;height:82%}
    .px-initials{display:grid!important;place-items:center;background:linear-gradient(145deg,var(--px-frame),color-mix(in srgb,var(--px-frame) 28%,#fff));font-size:42px;font-weight:900;color:#2a1833}
    .px-wreath{position:absolute;inset:0;z-index:4;pointer-events:none}.px-wreath-piece{position:absolute;font-size:calc(clamp(25px,7.3vw,40px) * var(--s));line-height:1;filter:drop-shadow(0 3px 3px rgba(0,0,0,.3));white-space:nowrap}.px-dossier-portrait .px-wreath-piece{font-size:calc(clamp(20px,5.7vw,31px) * var(--s))}
    .px-name{font-family:var(--person-font,Georgia,serif);font-size:var(--person-name-size,clamp(38px,11vw,56px));line-height:.95;margin-top:23px;text-align:center;color:var(--person-heading,var(--person-text));text-shadow:0 4px 24px rgba(0,0,0,.42)}
    .px-role{margin-top:10px;font-size:var(--person-meta-size,12px);text-transform:uppercase;letter-spacing:.18em;color:color-mix(in srgb,var(--person-text) 78%,transparent)}.px-birthday{margin-top:10px;font-size:var(--person-meta-size,12px);color:var(--person-text)}
    .px-rule{width:min(70vw,330px);display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;color:var(--person-accent,var(--accent));margin-top:24px}.px-rule span{height:1px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--person-accent,var(--accent)) 70%,transparent))}.px-rule span:last-child{background:linear-gradient(90deg,color-mix(in srgb,var(--person-accent,var(--accent)) 70%,transparent),transparent)}
    .px-open-dossier{width:min(88vw,520px);margin:4px auto 0;padding:19px 20px;border-radius:22px;border:1px solid color-mix(in srgb,var(--person-accent,var(--accent)) 42%,transparent);background:linear-gradient(145deg,color-mix(in srgb,var(--person-accent,var(--accent)) 10%,transparent),rgba(255,255,255,.025));color:var(--person-text);display:grid;grid-template-columns:auto 1fr;grid-template-areas:'icon title' 'icon sub';column-gap:13px;text-align:left;box-shadow:0 16px 38px rgba(0,0,0,.2)}.px-open-dossier>span{grid-area:icon;align-self:center;font-size:27px;color:var(--person-accent,var(--accent));text-shadow:0 0 12px currentColor}.px-open-dossier strong{grid-area:title;font-family:var(--person-font,Georgia,serif);font-size:var(--person-archive-title-size,21px);color:var(--person-heading,var(--person-text))}.px-open-dossier small{grid-area:sub;color:color-mix(in srgb,var(--person-text) 62%,transparent);font-size:var(--person-archive-sub-size,11px);margin-top:2px}
    #personChoice{margin-top:auto!important;padding-bottom:max(8px,env(safe-area-inset-bottom))}
    #personView:not(.read-mode){color:var(--person-text)}
    #personView:not(.read-mode) .back-link{color:color-mix(in srgb,var(--person-text) 70%,transparent)}
    #personView:not(.read-mode) .px-secondary-actions strong{color:var(--person-text)}
        .px-ambient{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:visible}.px-ambient i{position:absolute;color:color-mix(in srgb,var(--person-accent,var(--accent)) 70%,white);font-style:normal;text-shadow:0 0 12px currentColor;opacity:var(--spark-opacity-low,.28);transform:translate3d(0,0,0) rotate(var(--spark-rotate,0deg));animation:pxSparkFloat var(--spark-float-dur,8s) ease-in-out infinite,pxSparkFade var(--spark-fade-dur,6s) ease-in-out infinite;animation-delay:var(--spark-delay,0s),var(--spark-delay,0s);will-change:transform,opacity}.px-ambient~*{position:relative;z-index:1}#personView.read-mode>.px-ambient{display:none!important}
    .px-dossier{font-family:var(--px-font);position:relative}.px-dossier-head{text-align:center}.px-dossier .character-name{font-size:var(--person-dossier-name-size,clamp(34px,10vw,48px))!important;color:var(--profile-heading)!important}.px-dossier .character-role{font-size:var(--person-dossier-role-size,12px)!important}.px-dossier .character-birthday{font-size:var(--person-dossier-birthday-size,11px)!important}.px-dossier .character-section-title strong{color:var(--profile-heading)!important}.px-dossier-sparks{position:absolute;inset:48px 12px auto;height:230px;pointer-events:none}.px-dossier-sparks i{position:absolute;color:var(--profile-sparkle);font-style:normal;text-shadow:0 0 11px currentColor;opacity:var(--spark-opacity-low,.28);transform:translate3d(0,0,0) rotate(var(--spark-rotate,0deg));animation:pxSparkFloat var(--spark-float-dur,8s) ease-in-out infinite,pxSparkFade var(--spark-fade-dur,6s) ease-in-out infinite;animation-delay:var(--spark-delay,0s),var(--spark-delay,0s);will-change:transform,opacity}
    .px-dossier-tools{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:7px 2px 16px}.px-dossier-tools button{border:1px solid color-mix(in srgb,var(--profile-frame) 28%,transparent);background:color-mix(in srgb,var(--profile-frame) 9%,transparent);color:var(--profile-heading);border-radius:13px;padding:10px 9px;font-size:11px;font-weight:800}
    @keyframes pxSparkFloat{0%,100%{transform:translate3d(0,0,0) rotate(var(--spark-rotate,0deg))}50%{transform:translate3d(var(--spark-float-x,4px),var(--spark-float-y,-9px),0) rotate(calc(var(--spark-rotate,0deg) + var(--spark-float-rotate,5deg)))}}@keyframes pxSparkFade{0%,100%{opacity:var(--spark-opacity-low,.22)}42%{opacity:var(--spark-opacity-high,.78)}72%{opacity:calc((var(--spark-opacity-low,.22) + var(--spark-opacity-high,.78))/2)}}
    .category-gallery{display:flex;gap:7px;overflow-x:auto;padding:10px 1px 2px;margin-top:7px;scroll-snap-type:x proximity;scrollbar-width:none}.category-gallery::-webkit-scrollbar{display:none}
    .category-thumb{flex:0 0 48px;width:48px;height:48px;padding:0;border-radius:11px;overflow:hidden;border:1px solid color-mix(in srgb,var(--profile-frame) 30%,rgba(255,255,255,.1));background:#090909;box-shadow:0 4px 13px rgba(0,0,0,.25);scroll-snap-align:start}.category-thumb img{width:100%;height:100%;display:block;object-fit:cover}
    .category-thumb:active{transform:scale(.96)}
    .dossier-gallery-viewer{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(0,0,0,.9);backdrop-filter:blur(10px)}.dossier-gallery-viewer.open{display:flex}
    body.gallery-open{overflow:hidden}
    .dossier-gallery-viewer figure{margin:0;width:min(92vw,780px);height:min(78vh,760px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}.dossier-gallery-viewer img{max-width:100%;max-height:calc(78vh - 34px);object-fit:contain;border-radius:16px;box-shadow:0 18px 70px rgba(0,0,0,.7)}.dossier-gallery-viewer figcaption{min-height:16px;color:rgba(255,255,255,.62);font:11px/1.2 Georgia,serif;letter-spacing:.12em}
    .dgv-close,.dgv-nav{position:fixed;border:0;background:rgba(255,255,255,.09);color:#fff;backdrop-filter:blur(7px);box-shadow:0 8px 24px rgba(0,0,0,.28)}.dgv-close{right:18px;top:max(18px,env(safe-area-inset-top));width:42px;height:42px;border-radius:50%;font-size:28px;line-height:1}.dgv-nav{top:50%;transform:translateY(-50%);width:42px;height:54px;border-radius:15px;font-size:34px}.dgv-prev{left:10px}.dgv-next{right:10px}.dgv-nav.hidden{display:none}
    @media(max-width:520px){.dgv-nav{top:auto;bottom:max(18px,env(safe-area-inset-bottom));transform:none}.dgv-prev{left:calc(50% - 58px)}.dgv-next{right:calc(50% - 58px)}.dossier-gallery-viewer{padding:16px}.category-thumb{flex-basis:46px;width:46px;height:46px}}
    @media(min-width:700px){.px-hero-portrait{width:310px}.px-dossier-portrait{width:205px}}
  `;document.head.appendChild(css);
})();