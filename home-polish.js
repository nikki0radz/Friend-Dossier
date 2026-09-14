(() => {
  function ensureDeleteButton(){
    const form=$('friendForm');
    if(!form || $('deleteFriendBtn')) return;
    const save=form.querySelector('.primary-button');
    if(!save) return;
    const btn=document.createElement('button');
    btn.id='deleteFriendBtn';
    btn.type='button';
    btn.className='delete-friend-button';
    btn.textContent='Delete person';
    btn.addEventListener('click',()=>{
      const id=$('friendId')?.value;
      if(!id) return;
      const friend=state.friends.find(f=>f.id===id);
      if(!friend) return;
      if(!confirm(`Delete ${friend.name}? This cannot be undone.`)) return;
      state.friends=state.friends.filter(f=>f.id!==id);
      persistFriends();
      safeClose($('friendDialog'));
      if(state.selectedId===id){
        state.selectedId=null;
        $('personView')?.classList.add('hidden');
        $('homeView')?.classList.remove('hidden');
        homeTools()?.classList.remove('hidden');
      }
      renderHome();
      showToast('Person deleted');
    });
    save.insertAdjacentElement('afterend',btn);
  }

  const priorOpen=openFriendDialog;
  openFriendDialog=function(friend=null){
    priorOpen(friend);
    ensureDeleteButton();
    const btn=$('deleteFriendBtn');
    if(btn) btn.classList.toggle('hidden',!friend);
  };

  function addGrimoireAmbience(){
    if($('grimoireAmbience')) return;
    const layer=document.createElement('div');
    layer.id='grimoireAmbience';
    layer.className='grimoire-ambience';
    const glyphs=['✦','✧','⋆','✶','✷','☾','✺','⟡','✵','⋆','✦','✧'];
    for(let i=0;i<42;i++){
      const s=document.createElement('span');
      s.className=`grimoire-spark spark-${i%6}`;
      s.textContent=glyphs[i%glyphs.length];
      const x=(i*37+11)%96;
      const y=(i*61+7)%95;
      const size=9+((i*13)%19);
      const delay=-((i*0.47)%7);
      const dur=4.2+((i*0.31)%5);
      s.style.cssText=`left:${x}%;top:${y}%;font-size:${size}px;animation-delay:${delay}s;animation-duration:${dur}s`;
      layer.appendChild(s);
    }
    $('app')?.prepend(layer);
  }

  const css=document.createElement('style');
  css.id='homePolishStyles';
  css.textContent=`
    .people-grid{gap:34px 16px!important;align-items:start!important;padding-bottom:26px}
    .person-bubble{margin-bottom:24px!important}
    .person-bubble>.bubble-label{bottom:-25px!important;width:128%!important;font-size:16px!important;line-height:1.05!important;font-weight:850!important;letter-spacing:.01em!important;text-shadow:0 2px 9px rgba(0,0,0,.55)}
    .person-bubble>.bubble-label .bubble-relation{display:block;margin-top:3px;font-size:10px!important;opacity:.66;font-weight:650!important}
    .frame-emoji.person-bubble{background:transparent!important;box-shadow:none!important;border-color:transparent!important}
    .frame-emoji.person-bubble:before,.frame-emoji.person-bubble:after{display:none!important}
    .frame-emoji.person-bubble>.bubble-initials{background:linear-gradient(145deg,color-mix(in srgb,var(--person-bubble) 76%,white),color-mix(in srgb,var(--person-bubble) 56%,transparent))!important}
    .frame-emoji.person-bubble>img{box-shadow:0 8px 24px rgba(0,0,0,.32)}
    .delete-friend-button{width:100%;margin-top:10px;padding:12px 14px;border-radius:14px;border:1px solid rgba(255,100,120,.28);background:rgba(120,25,45,.14);color:#ff9fb2;font-weight:850;letter-spacing:.015em}
    .delete-friend-button:hover{background:rgba(120,25,45,.24)}
    .grimoire-ambience{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;opacity:.92}
    #app>header,#app>main{position:relative;z-index:1}
    .grimoire-spark{position:absolute;color:color-mix(in srgb,var(--accent) 72%,white 18%);text-shadow:0 0 8px currentColor,0 0 18px color-mix(in srgb,var(--accent) 50%,transparent);opacity:.2;animation:grimoireTwinkle 6s ease-in-out infinite,grimoireFloat 9s ease-in-out infinite;will-change:transform,opacity;user-select:none}
    .spark-1{opacity:.35}.spark-2{opacity:.5}.spark-3{opacity:.24}.spark-4{opacity:.62}.spark-5{opacity:.32}
    #homeView:before{content:'☽  ✦  ⟡  ✧  ☾';display:block;text-align:center;margin:2px 0 22px;color:color-mix(in srgb,var(--accent) 68%,white 14%);letter-spacing:.5em;font-size:13px;opacity:.78;text-shadow:0 0 10px color-mix(in srgb,var(--accent) 55%,transparent)}
    #homeView:after{content:'✦  arcana amicorum  ✦';display:block;text-align:center;margin:12px 0 20px;color:color-mix(in srgb,var(--accent) 48%,white 12%);font-family:Georgia,serif;font-size:10px;letter-spacing:.22em;text-transform:uppercase;opacity:.55}
    @keyframes grimoireTwinkle{0%,100%{opacity:.12}35%{opacity:.7}58%{opacity:.26}75%{opacity:.55}}
    @keyframes grimoireFloat{0%,100%{transform:translate3d(0,0,0) rotate(0)}50%{transform:translate3d(0,-9px,0) rotate(7deg)}}
    @media(max-width:420px){.people-grid{gap:30px 12px!important}.person-bubble>.bubble-label{font-size:15px!important;bottom:-23px!important}}
  `;
  document.head.appendChild(css);
  ensureDeleteButton();
  addGrimoireAmbience();
})();