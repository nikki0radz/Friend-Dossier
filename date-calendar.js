(() => {
  const MONTH_NAMES=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const WEEK_DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const DATE_EMOJIS=['🎂','🎁','✈️','💌','🎉','🍽️','⭐','❤️','🌙','📅'];
  let weekOffset=0;
  let calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  let calendarSelected=new Date();
  let suppressWeekClick=false;

  const startOfDay=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x;};
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return startOfDay(x);};
  const startOfMondayWeek=d=>{
    const x=startOfDay(d);
    const offset=(x.getDay()+6)%7;
    x.setDate(x.getDate()-offset);
    return x;
  };
  const keyFor=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const sameDay=(a,b)=>keyFor(a)===keyFor(b);
  const prettyDate=d=>d.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const shortRange=(a,b)=>a.getMonth()===b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${MONTH_NAMES[a.getMonth()].slice(0,3)}`
    : `${a.getDate()} ${MONTH_NAMES[a.getMonth()].slice(0,3)} – ${b.getDate()} ${MONTH_NAMES[b.getMonth()].slice(0,3)}`;

  function dateEvents(date){
    const y=date.getFullYear(),m=date.getMonth()+1,d=date.getDate(),events=[];
    (state.friends||[]).forEach(friend=>{
      if(Number(friend.birthdayDay)===d&&Number(friend.birthdayMonth)===m){
        events.push({
          kind:'birthday',friend,entry:null,emoji:'🎂',
          title:`${friend.name}'s birthday`,
          subtitle:friend.relationship||'Birthday'
        });
      }
      (friend.entries||[]).filter(e=>e.type==='date').forEach(entry=>{
        if(Number(entry.day)!==d||Number(entry.month)!==m)return;
        const recurring=entry.recurring!==false;
        const entryYear=Number(entry.year)||0;
        if(recurring){
          if(entryYear&&y<entryYear)return;
        }else if((entryYear||new Date().getFullYear())!==y)return;
        events.push({
          kind:'date',friend,entry,
          emoji:(entry.emoji||'📅').trim()||'📅',
          title:(entry.title||'Important date').trim()||'Important date',
          subtitle:friend.name
        });
      });
    });
    return events;
  }

  function ensureWeekStrip(){
    let wrap=$('dateWeekDashboard');
    if(wrap)return wrap;
    const next=$('nextImportantDate');
    if(!next)return null;
    wrap=document.createElement('section');
    wrap.id='dateWeekDashboard';
    wrap.className='date-week-dashboard';
    wrap.innerHTML=`
      <div class="date-week-head">
        <button type="button" class="week-shift week-prev" aria-label="Previous week">‹</button>
        <button type="button" class="week-open-calendar"><span id="weekRangeLabel">This week</span><small>Open calendar</small></button>
        <button type="button" class="week-shift week-next" aria-label="Next week">›</button>
      </div>
      <div id="dateWeekStrip" class="date-week-strip" aria-label="Important dates this week"></div>`;
    next.insertAdjacentElement('afterend',wrap);
    wrap.querySelector('.week-prev').onclick=()=>{weekOffset-=7;renderWeekStrip();};
    wrap.querySelector('.week-next').onclick=()=>{weekOffset+=7;renderWeekStrip();};
    wrap.querySelector('.week-open-calendar').onclick=()=>openDateCalendar(addDays(startOfMondayWeek(new Date()),weekOffset));

    const strip=wrap.querySelector('#dateWeekStrip');
    let startX=0,startY=0,pointerId=null;
    strip.addEventListener('pointerdown',e=>{
      startX=e.clientX;startY=e.clientY;pointerId=e.pointerId;suppressWeekClick=false;
      strip.setPointerCapture?.(e.pointerId);
    });
    strip.addEventListener('pointerup',e=>{
      if(pointerId!==e.pointerId)return;
      const dx=e.clientX-startX,dy=e.clientY-startY;
      pointerId=null;
      if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.25){
        suppressWeekClick=true;
        weekOffset+=dx<0?7:-7;
        renderWeekStrip();
        setTimeout(()=>{suppressWeekClick=false;},80);
      }
    });
    strip.addEventListener('pointercancel',()=>{pointerId=null;});
    return wrap;
  }

  function renderWeekStrip(){
    const wrap=ensureWeekStrip();if(!wrap)return;
    const strip=wrap.querySelector('#dateWeekStrip');
    const start=addDays(startOfMondayWeek(new Date()),weekOffset),end=addDays(start,6);
    wrap.querySelector('#weekRangeLabel').textContent=weekOffset===0?'Next 7 days':shortRange(start,end);
    strip.innerHTML='';
    for(let i=0;i<7;i++){
      const date=addDays(start,i),events=dateEvents(date);
      const button=document.createElement('button');
      button.type='button';
      button.className='date-week-day'+(events.length?' has-date':'')+(sameDay(date,new Date())?' today':'');
      button.setAttribute('aria-label',`${prettyDate(date)}${events.length?`, ${events.length} important date${events.length>1?'s':''}`:''}`);
      const emojis=[...new Set(events.map(x=>x.emoji))].slice(0,3);
      button.innerHTML=`
        <span class="week-day-name">${date.toLocaleDateString(undefined,{weekday:'short'}).slice(0,2)}</span>
        <strong>${date.getDate()}</strong>
        <span class="week-day-emojis">${emojis.map(x=>`<i>${esc(x)}</i>`).join('')}${events.length>3?'<b>＋</b>':''}</span>`;
      button.onclick=()=>{
        if(suppressWeekClick)return;
        openDateCalendar(date);
      };
      strip.appendChild(button);
    }
  }

  function ensureCalendar(){
    let overlay=$('importantDateCalendar');
    if(overlay)return overlay;
    overlay=document.createElement('section');
    overlay.id='importantDateCalendar';
    overlay.className='important-date-calendar hidden';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML=`
      <div class="calendar-shell">
        <header class="calendar-topbar">
          <button type="button" id="calendarClose" class="calendar-back">‹ Home</button>
          <div><strong>Important dates</strong><small>Little things worth remembering</small></div>
          <button type="button" id="calendarToday" class="calendar-today">Today</button>
        </header>
        <div class="calendar-month-nav">
          <button type="button" id="calendarPrevMonth" aria-label="Previous month">‹</button>
          <h2 id="calendarMonthTitle"></h2>
          <button type="button" id="calendarNextMonth" aria-label="Next month">›</button>
        </div>
        <div class="calendar-weekdays">${WEEK_DAYS.map(x=>`<span>${x}</span>`).join('')}</div>
        <div id="calendarMonthGrid" class="calendar-month-grid"></div>
        <section id="calendarDayDetails" class="calendar-day-details"></section>
      </div>`;
    document.body.appendChild(overlay);
    $('calendarClose').onclick=closeDateCalendar;
    $('calendarToday').onclick=()=>{
      calendarSelected=startOfDay(new Date());
      calendarCursor=new Date(calendarSelected.getFullYear(),calendarSelected.getMonth(),1);
      renderCalendarMonth();
    };
    $('calendarPrevMonth').onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderCalendarMonth();};
    $('calendarNextMonth').onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderCalendarMonth();};
    return overlay;
  }

  function openDateCalendar(date=new Date(),skipHistory=false){
    const overlay=ensureCalendar();
    calendarSelected=startOfDay(date);
    calendarCursor=new Date(calendarSelected.getFullYear(),calendarSelected.getMonth(),1);
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('important-calendar-open');
    renderCalendarMonth();
    if(!skipHistory)window.friendDossierHistoryPush?.('calendar',{date:keyFor(calendarSelected)});
  }

  function closeDateCalendar(skipHistory=false){
    if(!skipHistory&&window.friendDossierHistoryBack?.('calendar'))return;
    const overlay=$('importantDateCalendar');if(!overlay)return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('important-calendar-open');
  }

  function renderCalendarMonth(){
    const grid=$('calendarMonthGrid');if(!grid)return;
    $('calendarMonthTitle').textContent=`${MONTH_NAMES[calendarCursor.getMonth()]} ${calendarCursor.getFullYear()}`;
    const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth();
    const first=new Date(y,m,1);
    const mondayOffset=(first.getDay()+6)%7;
    const start=addDays(first,-mondayOffset);
    grid.innerHTML='';
    for(let i=0;i<42;i++){
      const date=addDays(start,i),events=dateEvents(date),inMonth=date.getMonth()===m;
      const button=document.createElement('button');
      button.type='button';
      button.className='calendar-day'+(inMonth?'':' other-month')+(events.length?' has-events':'')+(sameDay(date,new Date())?' today':'')+(sameDay(date,calendarSelected)?' selected':'');
      const emojis=[...new Set(events.map(e=>e.emoji))].slice(0,3);
      button.innerHTML=`<span class="calendar-day-number">${date.getDate()}</span><span class="calendar-day-emojis">${emojis.map(x=>`<i>${esc(x)}</i>`).join('')}${events.length>3?'<b>＋</b>':''}</span>`;
      button.setAttribute('aria-label',`${prettyDate(date)}${events.length?`, ${events.length} important date${events.length>1?'s':''}`:''}`);
      button.onclick=()=>{
        calendarSelected=date;
        if(date.getMonth()!==m)calendarCursor=new Date(date.getFullYear(),date.getMonth(),1);
        renderCalendarMonth();
      };
      grid.appendChild(button);
    }
    renderCalendarDayDetails();
  }

  function renderCalendarDayDetails(){
    const box=$('calendarDayDetails');if(!box)return;
    const events=dateEvents(calendarSelected);
    box.innerHTML=`<div class="calendar-detail-head"><div><small>Selected day</small><strong>${esc(prettyDate(calendarSelected))}</strong></div><span>${events.length?events.length:''}</span></div>`;
    if(!events.length){
      box.insertAdjacentHTML('beforeend','<div class="calendar-no-events">Nothing written here yet <span>✦</span></div>');
      return;
    }
    const list=document.createElement('div');
    list.className='calendar-event-list';
    events.forEach(event=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='calendar-event-card';
      button.innerHTML=`
        <span class="calendar-event-emoji">${esc(event.emoji)}</span>
        <span class="calendar-event-copy"><strong>${esc(event.title)}</strong><small>${esc(event.subtitle||event.friend.name)}</small></span>
        <span class="calendar-event-arrow">›</span>`;
      button.onclick=()=>{
        closeDateCalendar(true);
        openPerson(event.friend.id);
      };
      list.appendChild(button);
    });
    box.appendChild(list);
  }

  function softenNextDateCard(){
    const card=$('nextImportantDate');if(!card)return;
    const next=typeof nextImportantDate==='function'?nextImportantDate():null;
    card.classList.toggle('calendar-clickable',Boolean(next));
    card.onclick=next?()=>openDateCalendar(next.date):null;
    if(next)card.setAttribute('aria-label','Open important dates calendar');
    else card.removeAttribute('aria-label');
  }

  function ensureDateEmojiPicker(){
    const fields=$('entryDateFields');if(!fields)return null;
    let picker=$('dateEmojiPicker');
    if(picker)return picker;
    picker=document.createElement('div');
    picker.id='dateEmojiPicker';
    picker.className='date-emoji-picker';
    picker.innerHTML=`
      <div class="date-emoji-picker-head"><span>Calendar emoji</span><input id="dateEmojiInput" maxlength="8" inputmode="text" aria-label="Calendar emoji"></div>
      <div class="date-emoji-quick">${DATE_EMOJIS.map(x=>`<button type="button" data-date-emoji="${x}">${x}</button>`).join('')}</div>`;
    fields.insertBefore(picker,fields.querySelector('.date-parts'));
    $('dateEmojiInput').addEventListener('input',()=>{
      if($('entryEmoji'))$('entryEmoji').value=$('dateEmojiInput').value.trim()||'📅';
      syncDateEmojiButtons();
    });
    picker.querySelectorAll('[data-date-emoji]').forEach(btn=>btn.onclick=()=>{
      $('dateEmojiInput').value=btn.dataset.dateEmoji;
      if($('entryEmoji'))$('entryEmoji').value=btn.dataset.dateEmoji;
      syncDateEmojiButtons();
    });
    return picker;
  }

  function syncDateEmojiButtons(){
    const value=$('dateEmojiInput')?.value||'';
    document.querySelectorAll('#dateEmojiPicker [data-date-emoji]').forEach(btn=>btn.classList.toggle('active',btn.dataset.dateEmoji===value));
  }

  const priorOpenEntryDialog=openEntryDialog;
  openEntryDialog=function(type,entry=null){
    priorOpenEntryDialog(type,entry);
    const picker=ensureDateEmojiPicker();
    if(!picker)return;
    const isDate=type==='date';
    picker.classList.toggle('hidden',!isDate);
    if(isDate){
      const value=(entry?.emoji||$('entryEmoji')?.value||'📅').trim()||'📅';
      $('dateEmojiInput').value=value;
      if($('entryEmoji'))$('entryEmoji').value=value;
      syncDateEmojiButtons();
    }
  };

  const priorRenderHome=renderHome;
  renderHome=function(){
    priorRenderHome();
    renderWeekStrip();
    softenNextDateCard();
  };

  const style=document.createElement('style');
  style.id='importantDateCalendarStyles';
  style.textContent=`
    .next-important-date{
      min-height:44px!important;
      margin:4px 0 7px!important;
      padding:10px 13px!important;
      border:1px solid color-mix(in srgb,var(--accent) 32%,transparent)!important;
      border-radius:16px!important;
      background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 8%,rgba(255,255,255,.04)),color-mix(in srgb,var(--bg) 88%,rgba(255,255,255,.018)))!important;
      box-shadow:0 6px 18px rgba(0,0,0,.11),inset 0 1px rgba(255,255,255,.055)!important;
      font-size:14px!important;
      line-height:1.35!important;
      font-weight:550!important;
      text-shadow:none!important;
    }
    .next-important-date strong{font-weight:720!important}
    .next-important-date .date-emphasis{font-size:1em!important;color:color-mix(in srgb,var(--accent) 82%,white 10%)!important;text-shadow:0 0 8px color-mix(in srgb,var(--accent) 18%,transparent)!important}
    .next-important-date.calendar-clickable{cursor:pointer}
    .date-week-dashboard{grid-column:1/-1;width:100%;margin:0 0 5px;padding:7px 7px 8px;border:1px solid color-mix(in srgb,var(--accent) 16%,transparent);border-radius:18px;background:rgba(255,255,255,.018);backdrop-filter:blur(8px)}
    .date-week-head{display:grid;grid-template-columns:30px 1fr 30px;align-items:center;margin-bottom:5px}
    .week-shift{width:30px;height:28px;border:0;background:transparent;color:color-mix(in srgb,var(--home-text,var(--text)) 52%,transparent);font-size:22px;padding:0}
    .week-open-calendar{border:0;background:transparent;color:var(--home-text,var(--text));display:flex;align-items:baseline;justify-content:center;gap:7px;padding:3px 8px}
    .week-open-calendar span{font:700 11px/1 var(--home-font,system-ui);letter-spacing:.02em}
    .week-open-calendar small{font:600 8px/1 var(--home-font,system-ui);color:color-mix(in srgb,var(--home-text,var(--text)) 44%,transparent);text-transform:uppercase;letter-spacing:.08em}
    .date-week-strip{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;touch-action:pan-y;user-select:none;-webkit-user-select:none}
    .date-week-day{min-width:0;height:57px;padding:5px 1px 4px;border:1px solid transparent;border-radius:13px;background:transparent;color:color-mix(in srgb,var(--home-text,var(--text)) 72%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:flex-start}
    .date-week-day .week-day-name{font-size:8px;text-transform:uppercase;letter-spacing:.08em;opacity:.54;line-height:1}
    .date-week-day strong{font:700 15px/1.1 var(--home-font,system-ui);margin-top:4px}
    .week-day-emojis{display:flex;align-items:center;justify-content:center;min-height:15px;margin-top:3px;gap:1px;max-width:100%;overflow:hidden}
    .week-day-emojis i{font-style:normal;font-size:10px;line-height:1}.week-day-emojis b{font-size:8px;font-weight:700;opacity:.6}
    .date-week-day.has-date{border-color:color-mix(in srgb,var(--accent) 30%,transparent);background:color-mix(in srgb,var(--accent) 7%,transparent);color:var(--home-text,var(--text))}
    .date-week-day.today strong{display:grid;place-items:center;min-width:25px;height:25px;margin-top:1px;border-radius:50%;background:color-mix(in srgb,var(--accent) 18%,transparent);color:color-mix(in srgb,var(--accent) 72%,white 24%)}
    body.important-calendar-open{overflow:hidden!important}
    .important-date-calendar{position:fixed;inset:0;z-index:160000;background:radial-gradient(circle at 50% -10%,color-mix(in srgb,var(--accent) 15%,transparent),transparent 34%),var(--bg);color:var(--text);overflow:auto;overscroll-behavior:contain}
    .important-date-calendar.hidden{display:none!important}
    .calendar-shell{width:min(100%,680px);min-height:100dvh;margin:0 auto;padding:max(14px,env(safe-area-inset-top)) 14px max(22px,env(safe-area-inset-bottom));box-sizing:border-box}
    .calendar-topbar{display:grid;grid-template-columns:70px 1fr 70px;align-items:center;gap:8px;padding:3px 0 16px}
    .calendar-topbar>div{text-align:center;display:grid;gap:2px}.calendar-topbar>div strong{font-family:Georgia,'Times New Roman',serif;font-size:17px;color:color-mix(in srgb,var(--accent) 66%,white 34%)}.calendar-topbar>div small{font-size:8px;letter-spacing:.04em;color:var(--muted)}
    .calendar-back,.calendar-today{border:0;background:transparent;color:color-mix(in srgb,var(--text) 68%,transparent);font-weight:700;padding:8px 4px}.calendar-back{text-align:left}.calendar-today{text-align:right;font-size:10px}
    .calendar-month-nav{display:grid;grid-template-columns:44px 1fr 44px;align-items:center;margin:2px 0 11px}
    .calendar-month-nav button{width:38px;height:38px;border-radius:50%;border:1px solid color-mix(in srgb,var(--accent) 20%,transparent);background:rgba(255,255,255,.025);color:var(--accent);font-size:24px}
    .calendar-month-nav button:last-child{justify-self:end}.calendar-month-nav h2{margin:0;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:27px;font-weight:600;letter-spacing:-.02em}
    .calendar-weekdays{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin:0 0 5px}.calendar-weekdays span{text-align:center;font-size:8px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
    .calendar-month-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}
    .calendar-day{position:relative;min-width:0;aspect-ratio:.86;padding:7px 2px 4px;border:1px solid rgba(255,255,255,.045);border-radius:15px;background:rgba(255,255,255,.018);color:var(--text);display:flex;flex-direction:column;align-items:center;justify-content:flex-start}
    .calendar-day.other-month{opacity:.25}.calendar-day-number{font:700 13px/1 var(--home-font,system-ui);display:grid;place-items:center;width:24px;height:24px;border-radius:50%}
    .calendar-day-emojis{min-height:19px;margin-top:5px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:1px;line-height:1}.calendar-day-emojis i{font-style:normal;font-size:11px}.calendar-day-emojis b{font-size:8px;opacity:.55}
    .calendar-day.has-events{border-color:color-mix(in srgb,var(--accent) 24%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 7%,transparent),rgba(255,255,255,.015))}
    .calendar-day.today .calendar-day-number{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent) 55%,transparent);color:var(--accent)}
    .calendar-day.selected{border-color:color-mix(in srgb,var(--accent) 70%,white 8%);background:color-mix(in srgb,var(--accent) 12%,transparent);box-shadow:0 0 18px color-mix(in srgb,var(--accent) 10%,transparent)}.calendar-day.selected .calendar-day-number{background:var(--accent);color:var(--bg)}
    .calendar-day-details{margin-top:16px;padding:14px;border:1px solid color-mix(in srgb,var(--accent) 18%,transparent);border-radius:20px;background:rgba(255,255,255,.022)}
    .calendar-detail-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.calendar-detail-head>div{display:grid;gap:3px}.calendar-detail-head small{font-size:8px;text-transform:uppercase;letter-spacing:.09em;color:var(--muted)}.calendar-detail-head strong{font-family:Georgia,'Times New Roman',serif;font-size:16px}.calendar-detail-head>span{min-width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--accent) 10%,transparent);color:var(--accent);font-size:11px}
    .calendar-no-events{text-align:center;padding:17px 6px;color:var(--muted);font-size:11px}.calendar-no-events span{color:var(--accent)}
    .calendar-event-list{display:grid;gap:7px}.calendar-event-card{display:grid;grid-template-columns:38px 1fr 18px;align-items:center;gap:9px;width:100%;padding:9px 10px;border:1px solid rgba(255,255,255,.06);border-radius:14px;background:rgba(255,255,255,.025);color:var(--text);text-align:left}.calendar-event-emoji{font-size:21px;text-align:center}.calendar-event-copy{display:grid;gap:2px}.calendar-event-copy strong{font-size:12px}.calendar-event-copy small{font-size:9px;color:var(--muted)}.calendar-event-arrow{font-size:20px;color:var(--accent);opacity:.65}
    .date-emoji-picker{margin:4px 0 12px;padding:10px;border:1px solid color-mix(in srgb,var(--accent) 17%,var(--border));border-radius:14px;background:rgba(255,255,255,.025)}
    .date-emoji-picker.hidden{display:none!important}.date-emoji-picker-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}.date-emoji-picker-head span{font-size:10px;color:#d7cbdc}.date-emoji-picker-head input{width:58px!important;height:38px!important;padding:5px!important;text-align:center;font-size:21px!important;margin:0!important}
    .date-emoji-quick{display:grid;grid-template-columns:repeat(10,1fr);gap:3px}.date-emoji-quick button{aspect-ratio:1;border:1px solid transparent;border-radius:9px;background:transparent;font-size:16px;padding:0}.date-emoji-quick button.active{border-color:color-mix(in srgb,var(--accent) 45%,transparent);background:color-mix(in srgb,var(--accent) 10%,transparent)}
    @media(max-width:390px){.calendar-shell{padding-left:10px;padding-right:10px}.calendar-month-grid{gap:3px}.calendar-day{border-radius:12px;padding-top:5px}.calendar-day-emojis i{font-size:10px}.date-emoji-quick{grid-template-columns:repeat(5,1fr)}}
  `;
  document.head.appendChild(style);

  window.openImportantDateCalendar=(date,skipHistory=false)=>openDateCalendar(date,skipHistory);
  window.closeImportantDateCalendar=(skipHistory=false)=>closeDateCalendar(skipHistory);

  renderWeekStrip();
  softenNextDateCard();
})();