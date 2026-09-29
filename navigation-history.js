(() => {
  let restoring=false;

  const rawOpenPerson=openPerson;
  const rawShowRead=showRead;
  const rawShowChoice=showChoice;
  const rawGoHome=goHome;

  function currentDepth(){
    return Number(history.state?.fdDepth)||0;
  }

  function pushView(view,extra={}){
    if(restoring)return;
    const current=history.state||{};
    const same=current.fdNav&&current.view===view&&
      (!extra.id||current.id===extra.id)&&
      (!extra.date||current.date===extra.date);
    if(same)return;
    history.pushState({
      fdNav:true,
      fdDepth:currentDepth()+1,
      view,
      ...extra
    },'',location.href);
  }

  const initial={...(history.state||{}),fdNav:true,fdDepth:0,view:'home'};
  history.replaceState(initial,'',location.href);

  openPerson=function(id){
    rawOpenPerson(id);
    pushView('person',{id});
  };

  showRead=function(){
    rawShowRead();
    if(state.selectedId)pushView('dossier',{id:state.selectedId});
  };

  showChoice=function(){
    const current=history.state;
    if(!restoring&&current?.fdNav&&current.view==='dossier'&&currentDepth()>0){
      history.back();
      return;
    }
    rawShowChoice();
  };

  goHome=function(){
    const current=history.state;
    if(!restoring&&current?.fdNav&&current.view!=='home'&&currentDepth()>0){
      history.back();
      return;
    }
    rawGoHome();
  };

  window.friendDossierHistoryPush=(view,extra={})=>pushView(view,extra);
  window.friendDossierHistoryBack=view=>{
    const current=history.state;
    if(restoring)return false;
    if(current?.fdNav&&current.view===view&&currentDepth()>0){
      history.back();
      return true;
    }
    return false;
  };

  function parseDateKey(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return new Date();
    const [y,m,d]=String(value).split('-').map(Number);
    return new Date(y,m-1,d,12,0,0);
  }

  function restoreView(nav){
    restoring=true;
    try{
      window.closeImportantDateCalendar?.(true);
      const view=nav?.fdNav?nav.view:'home';
      if(view==='calendar'){
        rawGoHome();
        window.openImportantDateCalendar?.(parseDateKey(nav.date),true);
      }else if(view==='dossier'&&nav.id){
        rawOpenPerson(nav.id);
        rawShowRead();
      }else if(view==='person'&&nav.id){
        rawOpenPerson(nav.id);
        rawShowChoice();
      }else{
        rawGoHome();
      }
    }finally{
      requestAnimationFrame(()=>{restoring=false;});
    }
  }

  window.addEventListener('popstate',e=>{
    if(e.state?.fdNav)restoreView(e.state);
  });

  const back=document.getElementById('personBackBtn');
  if(back)back.onclick=goHome;
})();