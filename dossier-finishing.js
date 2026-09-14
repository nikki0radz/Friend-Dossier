(() => {
  const CREATIVE_TITLES = new Map([
    ['allergy / avoid', 'Warnings & Wards'],
    ['important date', 'Dates Written in the Stars'],
    ['gift idea', 'Treasures They’d Adore'],
    ['thing they like', 'Treasures & Delights'],
    ['things they like', 'Treasures & Delights'],
    ['note', 'Whispers & Notes'],
    ['food / drink', 'Feasts & Favourites']
  ]);

  function enchantDossierTitles(){
    const dossier=document.querySelector('.px-dossier');
    if(!dossier) return;

    const mast=dossier.querySelector('.character-card-actions > span');
    if(mast) mast.textContent='✦  The Dossier  ✦';

    dossier.querySelectorAll('.character-section-title strong').forEach(strong=>{
      if(!strong.dataset.originalTitle) strong.dataset.originalTitle=strong.textContent.trim();
      const original=strong.dataset.originalTitle;
      const replacement=CREATIVE_TITLES.get(original.toLowerCase());
      if(replacement) strong.textContent=replacement;
    });
  }

  const previousRenderRead=renderRead;
  renderRead=function(){
    previousRenderRead();
    enchantDossierTitles();
  };

  const css=document.createElement('style');
  css.id='dossierFinishingStyles';
  css.textContent=`
    /* The dossier is a black enchanted page, independent of the profile background. */
    .px-dossier{
      background:
        radial-gradient(circle at 50% 4%,color-mix(in srgb,var(--profile-frame) 10%,transparent),transparent 30%),
        radial-gradient(circle at 14% 42%,color-mix(in srgb,var(--profile-sparkle) 5%,transparent),transparent 28%),
        #000!important;
      box-shadow:inset 0 0 90px rgba(255,255,255,.012),0 22px 65px rgba(0,0,0,.5)!important;
    }

    /* Utility controls become quiet marginalia instead of part of the spectacle. */
    .px-dossier .character-card-actions{
      min-height:28px!important;
      padding:2px 3px 8px!important;
      align-items:center!important;
      opacity:.82;
    }
    .px-dossier .character-card-actions > span{
      font-family:Georgia,'Times New Roman',serif!important;
      font-size:9px!important;
      font-weight:500!important;
      letter-spacing:.2em!important;
      text-transform:none!important;
      color:color-mix(in srgb,var(--profile-heading) 68%,transparent)!important;
      text-shadow:0 0 9px color-mix(in srgb,var(--profile-sparkle) 28%,transparent)!important;
    }
    .px-dossier .character-back,
    .px-dossier .character-edit{
      width:auto!important;
      min-width:0!important;
      min-height:0!important;
      padding:3px 5px!important;
      margin:0!important;
      border:0!important;
      background:transparent!important;
      box-shadow:none!important;
      border-radius:0!important;
      font-size:9px!important;
      font-weight:500!important;
      letter-spacing:.025em!important;
      color:color-mix(in srgb,var(--profile-text) 46%,transparent)!important;
      opacity:.8!important;
      text-shadow:none!important;
    }
    .px-dossier .character-back:hover,
    .px-dossier .character-edit:hover,
    .px-dossier .character-back:focus-visible,
    .px-dossier .character-edit:focus-visible{
      color:var(--profile-heading)!important;
      opacity:1!important;
    }

    /* Chapter titles: softer, more literary, more like illuminated headings. */
    .px-dossier .character-section-title{
      margin-top:1px!important;
      margin-bottom:0!important;
    }
    .px-dossier .character-section-title:before,
    .px-dossier .character-section-title:after{
      display:none!important;
    }
    .px-dossier .character-section-title strong{
      font-family:Georgia,'Times New Roman',serif!important;
      font-size:19px!important;
      font-weight:500!important;
      font-style:italic!important;
      letter-spacing:.015em!important;
      line-height:1.2!important;
      white-space:normal!important;
      text-transform:none!important;
      text-shadow:0 0 16px color-mix(in srgb,var(--profile-sparkle) 26%,transparent)!important;
    }
    .px-dossier .character-section-title strong:after{display:none!important}

    .px-dossier .category-emoji-divider{
      width:min(78%,300px)!important;
      margin:8px auto 14px!important;
      opacity:.88;
    }
    .px-dossier .category-emoji-divider b{
      font-size:18px!important;
      filter:drop-shadow(0 0 8px color-mix(in srgb,var(--profile-sparkle) 55%,transparent))!important;
    }

    /* Let the chapter boxes disappear a little further into the black page. */
    .px-dossier .character-section{
      background:
        radial-gradient(circle at 12% 0%,color-mix(in srgb,var(--profile-sparkle) 7%,transparent),transparent 36%),
        rgba(255,255,255,.012)!important;
      border-color:color-mix(in srgb,var(--profile-frame) 18%,transparent)!important;
      box-shadow:inset 0 1px rgba(255,255,255,.025),0 8px 25px rgba(0,0,0,.28)!important;
    }
  `;
  document.head.appendChild(css);
  enchantDossierTitles();
})();
