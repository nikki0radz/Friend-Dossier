(() => {
  function categoryEmojiByName(name){
    const clean=String(name||'').trim().toLowerCase();
    const list=Array.isArray(settings?.categories)?settings.categories:[];
    const match=list.find(c=>String(c?.name||'').trim().toLowerCase()===clean);
    return String(match?.emoji||'').trim() || '◆';
  }

  function decorateCategoryDividers(){
    document.querySelectorAll('#readStory .character-section').forEach(section=>{
      const title=section.querySelector('.character-section-title');
      const strong=title?.querySelector('strong');
      if(!title||!strong) return;
      title.querySelector('.category-emoji-divider')?.remove();
      const emoji=categoryEmojiByName(strong.textContent);
      const divider=document.createElement('div');
      divider.className='category-emoji-divider';
      divider.innerHTML=`<span></span><b>${esc(emoji)}</b><span></span>`;
      title.insertAdjacentElement('afterend',divider);
    });
  }

  const previousRenderRead=renderRead;
  renderRead=function(){
    previousRenderRead();
    decorateCategoryDividers();
  };

  const style=document.createElement('style');
  style.id='categoryDividerStyles';
  style.textContent=`
    .category-emoji-divider{display:grid;grid-template-columns:minmax(32px,1fr) auto minmax(32px,1fr);align-items:center;gap:10px;width:min(86%,340px);margin:7px auto 13px;color:var(--profile-heading)}
    .category-emoji-divider span{height:1px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--profile-heading) 62%,transparent))}
    .category-emoji-divider span:last-child{background:linear-gradient(90deg,color-mix(in srgb,var(--profile-heading) 62%,transparent),transparent)}
    .category-emoji-divider b{font-size:17px;line-height:1;font-weight:400;filter:drop-shadow(0 0 7px color-mix(in srgb,var(--profile-sparkle) 48%,transparent));transform:translateY(-1px)}
    .character-section-title{margin-bottom:0!important}
  `;
  document.head.appendChild(style);
})();
