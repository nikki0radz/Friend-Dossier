/* One entry per screen; profiles open directly into their details. */
(() => {
  let restoring=false;
  const home=goHome, person=openPerson;
  history.replaceState({fdNav:true,fdDepth:0,view:'home'},'',location.href);
  const depth=()=>Number(history.state?.fdDepth)||0;
  function push(view,extra={}){
    if(restoring)return;
    if(history.state?.view===view&&(!extra.id||history.state.id===extra.id)&&(!extra.date||history.state.date===extra.date))return;
    history.pushState({fdNav:true,fdDepth:depth()+1,view,...extra},'',location.href);
  }
  openPerson=function(id){person(id);if(state.selectedId===id)push('person',{id});};
  goHome=function(){if(!restoring&&depth()>0){history.go(-depth());return;}home();};
  window.friendDossierHistoryPush=push;
  window.friendDossierHistoryBack=view=>{if(!restoring&&history.state?.view===view&&depth()>0){history.back();return true;}return false;};
  window.addEventListener('popstate',event=>{
    restoring=true;
    try{
      window.closeImportantDateCalendar?.(true);
      const nav=event.state||{};
      if(nav.view==='person'&&state.friends.some(f=>f.id===nav.id))person(nav.id);
      else if(nav.view==='calendar'){
        home();const parts=String(nav.date||'').split('-').map(Number);
        window.openImportantDateCalendar(parts.length===3?new Date(parts[0],parts[1]-1,parts[2]):new Date(),true);
      }else home();
    }finally{restoring=false;}
  });
  const observer=new MutationObserver(()=>{
    const el=document.getElementById('importantDateCalendar');
    if(el&&!el.classList.contains('hidden'))document.querySelectorAll('[data-nav]').forEach(b=>b.setAttribute('aria-current',b.dataset.nav==='calendar'?'page':'false'));
  });
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();
