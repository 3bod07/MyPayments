// ════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════
const DEFAULT_CATS = ["☕️ مقاهي","🌯 مطاعم","⛽️ بنزين","🛍️ مشتريات","📱 اشتراكات","♻️ تقاسيط"];
const CAT_COLORS   = ["#f0a500","#38bdf8","#a78bfa","#f472b6","#34d399","#fb923c","#f87171","#22d3ee","#a3e635","#e879f9","#818cf8","#fbbf24"];
const ACCENTS = [
  // ── دافئة ──
  {n:"ذهبي",       v:"#f0a500", g:"radial-gradient(circle at 35% 30%, #ffe580, #f0a500, #92400e)"},
  {n:"نحاسي",      v:"#d97706", g:"radial-gradient(circle at 35% 30%, #fde68a, #d97706, #78350f)"},
  {n:"برتقالي",    v:"#f97316", g:"radial-gradient(circle at 35% 30%, #fed7aa, #f97316, #7c2d12)"},
  {n:"طماطمي",     v:"#ef4444", g:"radial-gradient(circle at 35% 30%, #fca5a5, #ef4444, #7f1d1d)"},
  // ── وردية وبنفسجية ──
  {n:"وردي",       v:"#f472b6", g:"radial-gradient(circle at 35% 30%, #fbcfe8, #f472b6, #831843)"},
  {n:"فوشيا",      v:"#d946ef", g:"radial-gradient(circle at 35% 30%, #f5d0fe, #d946ef, #701a75)"},
  {n:"أرجواني",    v:"#9333ea", g:"radial-gradient(circle at 35% 30%, #e9d5ff, #9333ea, #3b0764)"},
  {n:"بنفسجي",     v:"#7c3aed", g:"radial-gradient(circle at 35% 30%, #ddd6fe, #7c3aed, #2e1065)"},
  // ── زرقاء ──
  {n:"نيلي",       v:"#4f46e5", g:"radial-gradient(circle at 35% 30%, #c7d2fe, #4f46e5, #1e1b4b)"},
  {n:"أزرق",       v:"#0ea5e9", g:"radial-gradient(circle at 35% 30%, #bae6fd, #0ea5e9, #0c4a6e)"},
  {n:"سماوي",      v:"#06b6d4", g:"radial-gradient(circle at 35% 30%, #cffafe, #06b6d4, #164e63)"},
  // ── خضراء ──
  {n:"فيروزي",     v:"#14b8a6", g:"radial-gradient(circle at 35% 30%, #99f6e4, #14b8a6, #134e4a)"},
  {n:"أخضر",       v:"#22c55e", g:"radial-gradient(circle at 35% 30%, #bbf7d0, #22c55e, #14532d)"},
  {n:"ليموني",     v:"#84cc16", g:"radial-gradient(circle at 35% 30%, #d9f99d, #84cc16, #365314)"},
  // ── نادرة ──
  {n:"عقيق",       v:"#be123c", g:"radial-gradient(circle at 35% 30%, #fda4af, #be123c, #4c0519)"},
  {n:"زمردي",      v:"#059669", g:"radial-gradient(circle at 35% 30%, #6ee7b7, #059669, #022c22)"},
  {n:"كهرماني",    v:"#b45309", g:"radial-gradient(circle at 35% 30%, #fcd34d, #b45309, #451a03)"},
  {n:"ياقوتي",     v:"#7e22ce", g:"radial-gradient(circle at 35% 30%, #e9d5ff, #7e22ce, #3b0764)"},
  {n:"لازوردي",    v:"#1e3a8a", g:"radial-gradient(circle at 35% 30%, #93c5fd, #1e3a8a, #0f172a)"},
  {n:"مرجاني",     v:"#ff6b6b", g:"radial-gradient(circle at 35% 30%, #ffd3d3, #ff6b6b, #7f1d1d)"},
  // ── محايدة ──
  {n:"فضي",        v:"#94a3b8", g:"radial-gradient(circle at 35% 30%, #f1f5f9, #94a3b8, #334155)"},
  {n:"رصاصي غامق", v:"#475569", g:"radial-gradient(circle at 35% 30%, #94a3b8, #475569, #0f172a)"},
  {n:"أبيض",       v:"#e2e8f0", g:"radial-gradient(circle at 35% 30%, #fff, #e2e8f0, #94a3b8)"},
  {n:"أسود رمادي", v:"#1e293b", g:"radial-gradient(circle at 35% 30%, #475569, #1e293b, #020617)"},
];

// ════════════════════════════════════════════════
// STORAGE — IndexedDB (primary) + localStorage (fallback)
// ════════════════════════════════════════════════
var _db=null;
var _dbReady=false;
var _pendingSaves={};

function _openDB(cb){
  if(_db){cb(_db);return;}
  try{
    var req=indexedDB.open('mypayment_db',1);
    req.onupgradeneeded=function(e){
      e.target.result.createObjectStore('kv',{keyPath:'k'});
    };
    req.onsuccess=function(e){
      _db=e.target.result;_dbReady=true;
      // flush any pending saves
      Object.keys(_pendingSaves).forEach(function(k){
        _idbSet(k,_pendingSaves[k]);
      });
      _pendingSaves={};
      cb(_db);
    };
    req.onerror=function(){cb(null);};
  }catch(e){cb(null);}
}

function _idbSet(k,v){
  if(!_db) return;
  try{
    var tx=_db.transaction('kv','readwrite');
    tx.objectStore('kv').put({k:k,v:v});
  }catch(e){}
}

function _idbGet(k,cb){
  _openDB(function(db){
    if(!db){cb(null);return;}
    try{
      var tx=db.transaction('kv','readonly');
      var req=tx.objectStore('kv').get(k);
      req.onsuccess=function(){cb(req.result?req.result.v:null);};
      req.onerror=function(){cb(null);};
    }catch(e){cb(null);}
  });
}

function _idbDel(k){
  if(!_db) return;
  try{
    var tx=_db.transaction('kv','readwrite');
    tx.objectStore('kv').delete(k);
  }catch(e){}
}

function load(k,d){
  // sync load from localStorage (IndexedDB is async — used for writes)
  try{return JSON.parse(localStorage.getItem(k)??'null')??d;}catch{return d;}
}

var _saveTimer;
function save(k,v){
  var json=JSON.stringify(v);
  // 1. localStorage (immediate, sync)
  try{localStorage.setItem(k,json);}catch(e){}
  // 2. IndexedDB (persistent on iOS)
  if(_dbReady){_idbSet(k,json);}else{_pendingSaves[k]=json;}
  // flash indicator
  var dot=document.getElementById('autosave-dot');
  if(dot){
    dot.classList.add('show','saving');
    clearTimeout(_saveTimer);
    _saveTimer=setTimeout(function(){dot.classList.remove('saving');setTimeout(function(){dot.classList.remove('show');},800);},600);
  }
}

function deleteKey(k){
  try{localStorage.removeItem(k);}catch(e){}
  _idbDel(k);
}

// ── On page hide (iOS background) — flush all current state immediately ──
document.addEventListener('visibilitychange',function(){
  if(document.visibilityState==='hidden'){
    // Save all current state synchronously via localStorage
    try{
      if(typeof entries!=='undefined') localStorage.setItem('pt_entries',JSON.stringify(entries));
      if(typeof cats!=='undefined') localStorage.setItem('pt_cats',JSON.stringify(cats));
      if(typeof settings!=='undefined') localStorage.setItem('pt_settings',JSON.stringify(settings));
      if(typeof catBudgets!=='undefined') localStorage.setItem('pt_budgets',JSON.stringify(catBudgets));
      if(typeof debts!=='undefined') localStorage.setItem('pt_debts',JSON.stringify(debts));
      if(typeof salary!=='undefined') localStorage.setItem('pt_salary',JSON.stringify(salary));
      if(typeof templates!=='undefined') localStorage.setItem('pt_templates',JSON.stringify(templates));
      if(typeof catDescs!=='undefined') localStorage.setItem('pt_catdescs',JSON.stringify(catDescs));
    }catch(e){}
  }
});

// ── On load: sync from IndexedDB → localStorage if localStorage is empty ──
function _syncFromIDB(cb){
  var keys=['pt_entries','pt_cats','pt_budgets','pt_settings','pt_debts','pt_salary','pt_templates','pt_catdescs'];
  var pending=keys.length;
  var synced=0;
  _openDB(function(db){
    if(!db){cb();return;}
    keys.forEach(function(k){
      _idbGet(k,function(val){
        if(val!==null){
          // IDB has data — restore to localStorage if localStorage is missing it
          var ls=localStorage.getItem(k);
          if(!ls||ls==='null'){
            try{localStorage.setItem(k,val);synced++;}catch(e){}
          }
        }
        pending--;
        if(pending===0) cb(synced>0);
      });
    });
  });
}

function showWarn(title, body, pctData){
  document.getElementById('warn-title').textContent=title;
  document.getElementById('warn-body').textContent=body;
  var pb=document.getElementById('warn-pct-box');
  if(pctData){
    pb.style.display='block';
    document.getElementById('warn-pct-val').textContent=pctData.pct+'%';
    document.getElementById('warn-remain-amt').textContent='باقي: '+pctData.remain+' '+pctData.cur;
  } else { pb.style.display='none'; }
  document.getElementById('warn-overlay').style.display='flex';
}

var iosNotifTimer;
function showIosNotif(opts){
  var el=document.getElementById('ios-notif');
  var icon=opts&&opts.icon||'🥺';
  var title=opts&&opts.title||(settings.projectName||'وين فلوسي تروح');
  var body=opts&&opts.body||'تكفا ارجع وحط وصف، عشان اعرف بعدين وش شريت 🥺';
  var isBudget=opts&&opts.budget;
  document.getElementById('ios-notif-icon').textContent=icon;
  document.getElementById('ios-notif-title').textContent=title;
  document.getElementById('ios-notif-body').innerHTML=body;
  el.className=isBudget?'show budget-warn':'show';
  // progress bar
  var bar=document.getElementById('ios-notif-progress-bar');
  bar.style.transition='none'; bar.style.width='100%';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{bar.style.transition='width 10s linear';bar.style.width='0%';}));
  clearTimeout(iosNotifTimer);
  iosNotifTimer=setTimeout(()=>el.classList.remove('show'),15000);
}

var entries    = load('pt_entries',[]);
var cats       = load('pt_cats',[...DEFAULT_CATS]);
var catBudgets = load('pt_budgets',{});
var monthly    = load('pt_monthly',[]);
var templates  = load('pt_templates',{});
var settings   = load('pt_settings',{
  darkMode:true, currency:'SAR', confirmDelete:true, showEmoji:true,
  sortBy:'Newest', highlightOver:500, compactMode:false, showRunningTotal:true,
  accentColor:'#f0a500', projectName:'وين فلوسي تروح', colorCat:false, hideTime:false,
  showCharts:true, budgetWarn:true, weekMode:'fixed', monthlyInTotal:false, navPos:'top', includeExtra:true, uiSize:'normal',
  trackerTotal:'day', resetHour:5
});

var filterCat   = '__ALL__';
var dashView    = 'Week';
var detailLevel = 1;
var pendingAction = null;
var dragSrc=null, dragTarget=null;
var budgetCatIdx = null;
var msEntriesMode=false, msSelectedEntries=new Set();
var msCatsMode=false, msSelectedCats=new Set();
var msMonMode=false, msSelectedMon=new Set();
var msDebtMode=false, msSelectedDebt=new Set();
var editEntryId=null;
var debts     = load('pt_debts',[]);
var salary    = load('pt_salary',{amount:0, month:''});
var catDescs  = load('pt_catdescs',{});

// ════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════
var toW = s=>String(s).replace(/[٠١٢٣٤٥٦٧٨٩]/g,d=>d.charCodeAt(0)-1632).replace(/[۰۱۲۳۴۵۶۷۸۹]/g,d=>d.charCodeAt(0)-1776).replace(/[^0-9.]/g,'');
var fmt  = n=>Number(n).toLocaleString('en-SA',{minimumFractionDigits:2,maximumFractionDigits:2});
var isoDate = d=>new Date(d).toISOString().slice(0,10);
var today = ()=>isoDate(new Date());

function getWeekRange(){
  if(settings.weekMode==='rolling'){
    const e=new Date(), s=new Date(e); s.setDate(s.getDate()-6);
    return {start:isoDate(s), end:isoDate(e)};
  }
  // fixed Sun–Sat
  const d=new Date(), day=d.getDay();
  const sun=new Date(d); sun.setDate(d.getDate()-day);
  const sat=new Date(sun); sat.setDate(sun.getDate()+6);
  return {start:isoDate(sun), end:isoDate(sat)};
}
function monthRange(){
  const d=new Date();
  return {start:isoDate(new Date(d.getFullYear(),d.getMonth(),1)),end:isoDate(new Date(d.getFullYear(),d.getMonth()+1,0))};
}
function groupByDay(arr){
  const map={};
  arr.forEach(e=>{const d=isoDate(e.date);(map[d]=map[d]||[]).push(e);});
  return Object.entries(map).sort((a,b)=>b[0].localeCompare(a[0]));
}
function catColor(cat){return CAT_COLORS[cats.indexOf(cat)%CAT_COLORS.length]||'var(--acc)';}

var toastTimer;
function showToast(msg,type='ok',dur=3200){
  const el=document.getElementById('toast');
  el.textContent=msg; el.className=type==='err'?'err':type==='warn'?'warn':'';
  el.style.display='block'; clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.style.display='none',dur);
}

function openConfirm({icon='⚠️',title,warn,body,confirmLabel='تأكيد',confirmClass='btn btn-err',fn}){
  document.getElementById('cm-icon').textContent=icon;
  document.getElementById('cm-title').textContent=title;
  const wb=document.getElementById('cm-warn');
  warn?(wb.textContent=warn,wb.style.display='block'):(wb.style.display='none');
  document.getElementById('cm-body').textContent=body||'';
  const cb=document.getElementById('cm-confirm');
  cb.textContent=confirmLabel; cb.className=confirmClass;
  pendingAction=fn;
  document.getElementById('confirm-modal').classList.add('open');
}

// ════════════════════════════════════════════════
// RENDER ENTRIES
// ════════════════════════════════════════════════
function renderEntries(){
  // day total with configurable reset hour
  function getTrackerDate(){
    var now=new Date(),h=now.getHours(),rh=Number(settings.resetHour)||5;
    if(h<rh){var y=new Date(now);y.setDate(y.getDate()-1);return isoDate(y);}
    return isoDate(now);
  }
  const wr=getWeekRange();
  const trackerDay=getTrackerDate();
  const trackerEntries=(settings.trackerTotal==='week'
    ? entries.filter(e=>isoDate(e.date)>=wr.start&&isoDate(e.date)<=wr.end)
    : entries.filter(e=>isoDate(e.date)===trackerDay)
  ).filter(e=>!e.isIncome); // purchases only
  const wt=trackerEntries.reduce((s,e)=>s+e.amount,0);
  document.getElementById('week-total-val').textContent=fmt(wt);
  document.getElementById('week-total-cur').textContent=settings.currency;
  document.getElementById('amt-cur-label').textContent=settings.currency;
  // mon-cur-label removed (subscriptions removed)
  if(typeof renderSalary==='function') renderSalary();
  const lbl=settings.trackerTotal==='week'
    ? (settings.weekMode==='rolling'?'إجمالي آخر ٧ أيام':'إجمالي الأسبوع')
    : 'إجمالي اليوم';
  document.getElementById('week-total-label').textContent=lbl;
  document.getElementById('week-total-box').style.display=settings.showRunningTotal?'block':'none';
  document.getElementById('week-total-box').className='total-box'+(wt>settings.highlightOver?' over':'');

  let list=[...entries];
  if(filterCat!=='__ALL__') list=list.filter(e=>e.category===filterCat);
  const s=settings.sortBy;
  if(s==='Newest') list.sort((a,b)=>b.id-a.id);
  else if(s==='Oldest') list.sort((a,b)=>a.id-b.id);
  else if(s==='Highest') list.sort((a,b)=>b.amount-a.amount);
  else if(s==='Lowest') list.sort((a,b)=>a.amount-b.amount);

  const grouped=groupByDay(list);
  const container=document.getElementById('entries-list');
  container.innerHTML='';
  if(!grouped.length){container.innerHTML='<div style="color:var(--sub);font-size:13px;text-align:center;padding:30px 0">لا توجد دفعات بعد.<br>أضف أول دفعة أعلاه.</div>';return;}

  const td=today();
  grouped.forEach(([day,dayEntries])=>{
    const isToday=day===td;
    const label=new Date(day+'T12:00:00').toLocaleDateString('ar-SA',{weekday:'long',day:'numeric',month:'long'});
    const dayAmt=dayEntries.reduce((s,e)=>s+e.amount,0);
    const hdr=document.createElement('div'); hdr.className='day-header';
    hdr.innerHTML=`<span class="${isToday?'day-label-today':''}">${isToday?'اليوم':label}</span><span class="day-total">${fmt(dayAmt)} ${settings.currency}</span>`;
    container.appendChild(hdr);
    const wrap=document.createElement('div'); wrap.className='day-entries';
    dayEntries.forEach(e=>{
      const row=document.createElement('div'); row.className='entry-row';
      const cc=e.isIncome?'var(--teal)':(settings.colorCat?catColor(e.category):'var(--acc)');
      const time=new Date(e.date).toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'});
      const showTime=!settings.compactMode&&!settings.hideTime;
      const catName=settings.showEmoji?e.category:e.category.replace(/^\p{Emoji}\s*/u,'');
      const isInc=e.isIncome;
      const catBadge=isInc?'<span class="badge badge-teal">🎁 وصلني</span>':(settings.compactMode?'':`<span class="badge" style="background:color-mix(in srgb,${cc} 20%,transparent);color:${cc}">${catName}</span>`);
      row.innerHTML=`<div style="display:flex;flex-direction:column;align-items:flex-start;flex-shrink:0"><div class="entry-amt" style="color:${cc}">${fmt(e.amount)}</div>${showTime?`<div class="entry-time">${time}</div>`:''}</div><div class="entry-body"><div class="entry-desc">${e.description}</div>${catBadge}</div>${msEntriesMode?`<input type="checkbox" class="ms-check" data-id="${e.id}" style="flex-shrink:0">`:`<button class="edit-btn" data-id="${e.id}" style="background:transparent;border:none;color:var(--sub);cursor:pointer;font-size:13px;padding:0 2px;flex-shrink:0">✎</button><button class="del-btn" data-id="${e.id}">✕</button>`}`;
      wrap.appendChild(row);
    });
    container.appendChild(wrap);
  });

  container.querySelectorAll('.edit-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(msEntriesMode) return;
      const id=+btn.dataset.id;
      const entry=entries.find(e=>e.id===id); if(!entry) return;
      editEntryId=id;
      document.getElementById('edit-amt').value=entry.amount;
      document.getElementById('edit-desc').value=entry.description==='—'?'':entry.description;
      // populate edit-cat select
      const sel=document.getElementById('edit-cat');
      sel.innerHTML=cats.map(c=>`<option value="${c}"${c===entry.category?' selected':''}>${c}</option>`).join('');
      document.getElementById('edit-modal').classList.add('open');
    });
  });

  container.querySelectorAll('.del-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(msEntriesMode) return; // in ms mode del-btn is hidden
      const id=+btn.dataset.id;
      if(settings.confirmDelete){openConfirm({icon:'🗑',title:'حذف هذه الدفعة؟',body:'لا يمكن التراجع.',confirmLabel:'حذف',fn:()=>{entries=entries.filter(e=>e.id!==id);save('pt_entries',entries);renderEntries();showToast('تم الحذف','err');}});}
      else{entries=entries.filter(e=>e.id!==id);save('pt_entries',entries);renderEntries();showToast('تم الحذف','err');}
    });
  });

  // multi-select checkboxes
  if(msEntriesMode){
    document.getElementById('ms-entries-bar').classList.add('active');
    container.querySelectorAll('.ms-check').forEach(cb=>{
      cb.checked=msSelectedEntries.has(+cb.dataset.id);
      cb.addEventListener('change',function(){
        if(this.checked) msSelectedEntries.add(+this.dataset.id);
        else msSelectedEntries.delete(+this.dataset.id);
        document.getElementById('ms-entries-count').textContent=`${msSelectedEntries.size} محدد`;
        this.closest('.entry-row').classList.toggle('selected',this.checked);
      });
    });
    document.getElementById('ms-entries-count').textContent=`${msSelectedEntries.size} محدد`;
  } else {
    document.getElementById('ms-entries-bar').classList.remove('active');
  }
}

// ════════════════════════════════════════════════
// ADD ENTRY + BUDGET CHECK
// ════════════════════════════════════════════════
function addEntry(isIncome){
  var amtEl=document.getElementById('inp-amt');
  var descEl=document.getElementById('inp-desc');
  var catEl=document.getElementById('inp-cat');
  var amt=parseFloat(toW(amtEl.value));
  var desc=descEl.value.trim();
  var cat=isIncome?'🎁 وصلني':(catEl.value||'غير مصنف');
  if(!amt||isNaN(amt)||amt<=0){showToast('أدخل مبلغاً صحيحاً','err');return;}
  var entry={id:Date.now(),amount:amt,description:desc||'—',category:cat,date:new Date().toISOString(),isIncome:!!isIncome};
  entries.unshift(entry);
  save('pt_entries',entries);
  amtEl.value=''; descEl.value=''; catEl.value='';
  renderEntries();
  if(isIncome){
    // also add to extraIncome for salary balance tracking
    // REMOVED(extraIncome): var cur2=isoDate(new Date()).slice(0,7);
    // REMOVED(extraIncome): extraIncome.push({id:Date.now()+1,amount:amt,source:desc||'وصلني',month:cur2});
    // REMOVED(extraIncome): // pt_extra no longer used

    showToast('✓ وصلك '+fmt(amt)+' '+settings.currency+(desc?' — '+desc:''));
    renderSalary();
  } else {
    if(!desc){ showIosNotif(); } else { showToast('تمت الإضافة ✓'); }
    // budget check after adding purchase
    if(settings.budgetWarn&&catBudgets[cat]){
      var wr2=getWeekRange();
      var bud=catBudgets[cat];
      var CUR=settings.currency;
      function budgetWarnModal(spent,limit,type){
        var remaining=Math.max(0,limit-spent);
        var remPct=Math.max(0,Math.round((1-(spent/limit))*100));
        var body=exceeded?'لا تسوي ذكي وتروح تزيد الميزانية، احسب زين ولا تتدلع 😒':'أنفقت '+fmt(spent)+' من أصل '+fmt(limit)+' '+CUR;
        showWarn(exceeded?'⚠️ تجاوزت ميزانية "'+cat+'" ('+type+')!':'📊 ميزانية "'+cat+'" ('+type+')',body,{pct:remPct,remain:fmt(remaining),cur:CUR});
      }
      var exceeded=false;
      if(bud.weekly){
        var ws=entries.filter(function(e){return isoDate(e.date)>=wr2.start&&isoDate(e.date)<=wr2.end&&e.category===cat&&!e.isIncome;}).reduce(function(s,e){return s+e.amount;},0);
        exceeded=ws>bud.weekly;
        if(bud.weekly) setTimeout(function(){budgetWarnModal(ws,bud.weekly,'أسبوعي');},400);
      } else if(bud.monthly){
        var mr2=monthRange();
        var ms=entries.filter(function(e){return isoDate(e.date)>=mr2.start&&isoDate(e.date)<=mr2.end&&e.category===cat&&!e.isIncome;}).reduce(function(s,e){return s+e.amount;},0);
        exceeded=ms>bud.monthly;
        if(bud.monthly) setTimeout(function(){budgetWarnModal(ms,bud.monthly,'شهري');},400);
      }
    }
  }
}


// ════════════════════════════════════════════════
// FILTER PILLS
// ════════════════════════════════════════════════
function renderPills(){
  const el=document.getElementById('filter-pills'); el.innerHTML='';
  const mk=(label,val)=>{
    const b=document.createElement('button'); b.className='pill'+(filterCat===val?' active':'');
    b.textContent=label;
    b.addEventListener('click',()=>{filterCat=filterCat===val?'__ALL__':val;renderPills();renderEntries();});
    el.appendChild(b);
  };
  mk('الكل','__ALL__'); cats.forEach(c=>mk(c,c));
}

// ════════════════════════════════════════════════
// CAT SELECTS
// ════════════════════════════════════════════════
function renderCatSelects(){
  ['inp-cat'].forEach(id=>{
    const el=document.getElementById(id); if(!el)return;
    const val=el.value;
    el.innerHTML='<option value="">— التصنيف —</option>'+cats.map(c=>`<option value="${c}">${settings.showEmoji?c:c.replace(/^\p{Emoji}\s*/u,'')}</option>`).join('');
    el.value=val;
  });
}

// ════════════════════════════════════════════════
// CATEGORIES PAGE
// ════════════════════════════════════════════════
function renderCatsPage(){
  const el=document.getElementById('cats-list'); el.innerHTML='';
  cats.forEach((c,i)=>{
    const row=document.createElement('div'); row.className='cat-row'; row.dataset.i=i;
    const bud=catBudgets[c]||{};
    const cc=catColor(c);
    const budBadge=(bud.weekly||bud.daily||bud.monthly)?`<span class="cat-budget-badge">${[bud.weekly?fmt(bud.weekly)+'/أسبوع':'',bud.daily?fmt(bud.daily)+'/يوم':'',bud.monthly?fmt(bud.monthly)+'/شهر':''].filter(Boolean).join(' · ')}</span>`:'';
    const catDesc=(catDescs&&catDescs[c])?`<div style="font-size:10px;color:var(--sub);margin-top:1px">${catDescs[c]}</div>`:'';
    row.innerHTML=`<span class="drag-handle" style="touch-action:none">☰</span><div style="width:11px;height:11px;border-radius:50%;background:${cc};flex-shrink:0;box-shadow:0 0 6px ${cc}88"></div><div style="flex:1;text-align:right"><div style="font-size:14px">${c}</div>${catDesc}</div>${budBadge}${msCatsMode?`<input type="checkbox" class="ms-check ms-cat-check" data-i="${i}" style="flex-shrink:0">`:`<button class="del-btn cat-budget" data-i="${i}" title="ميزانية">💰</button><button class="del-btn cat-edit" data-i="${i}">✏️</button><button class="del-btn cat-del" data-i="${i}">✕</button>`}`;
    // drag (desktop)
    row.draggable=true;
    row.addEventListener('dragstart',e=>{dragSrc=i;row.classList.add('dragging');e.dataTransfer.effectAllowed='move';});
    row.addEventListener('dragover',e=>{e.preventDefault();});
    row.addEventListener('drop',e=>{e.preventDefault();if(dragSrc===null||dragSrc===i)return;const moved=cats.splice(dragSrc,1)[0];cats.splice(i,0,moved);save('pt_cats',cats);renderCatsPage();renderCatSelects();renderPills();renderEntries();dragSrc=null;});
    row.addEventListener('dragend',()=>row.classList.remove('dragging'));
    // touch drag
    let touchStartY=0,touchIdx=i;
    row.querySelector('.drag-handle').addEventListener('touchstart',te=>{touchStartY=te.touches[0].clientY;dragSrc=i;},{passive:true});
    row.querySelector('.drag-handle').addEventListener('touchmove',te=>{
      te.preventDefault();
      const y=te.touches[0].clientY;
      const rows=[...document.querySelectorAll('.cat-row')];
      rows.forEach((r,ri)=>{const rect=r.getBoundingClientRect();if(y>=rect.top&&y<=rect.bottom) dragTarget=ri;});
    },{passive:false});
    row.querySelector('.drag-handle').addEventListener('touchend',()=>{
      if(dragSrc!==null&&dragTarget!==null&&dragSrc!==dragTarget){
        const moved=cats.splice(dragSrc,1)[0];cats.splice(dragTarget,0,moved);save('pt_cats',cats);renderCatsPage();renderCatSelects();renderPills();renderEntries();
      }
      dragSrc=null;dragTarget=null;
    });
    el.appendChild(row);
  });

  if(msCatsMode){
    document.getElementById('ms-cats-bar').classList.add('active');
    el.querySelectorAll('.ms-cat-check').forEach(cb=>{
      cb.checked=msSelectedCats.has(+cb.dataset.i);
      cb.addEventListener('change',function(){
        if(this.checked) msSelectedCats.add(+this.dataset.i);
        else msSelectedCats.delete(+this.dataset.i);
        document.getElementById('ms-cats-count').textContent=`${msSelectedCats.size} محدد`;
        this.closest('.cat-row').classList.toggle('selected',this.checked);
      });
    });
    document.getElementById('ms-cats-count').textContent=`${msSelectedCats.size} محدد`;
  } else {
    document.getElementById('ms-cats-bar').classList.remove('active');
  }

  el.querySelectorAll('.cat-del').forEach(b=>b.addEventListener('click',()=>{
    const i=+b.dataset.i;
    openConfirm({icon:'🏷',title:`حذف "${cats[i]}"؟`,body:'الدفعات المسجّلة لن تتأثر.',fn:()=>{cats.splice(i,1);save('pt_cats',cats);renderCatsPage();renderCatSelects();renderPills();renderEntries();showToast('تم الحذف','err');}});
  }));
  el.querySelectorAll('.cat-edit').forEach(b=>b.addEventListener('click',()=>{
    const i=+b.dataset.i;const nv=prompt('تعديل:',cats[i]);
    if(nv&&nv.trim()){cats[i]=nv.trim();save('pt_cats',cats);renderCatsPage();renderCatSelects();showToast('تم التعديل');}
  }));
  el.querySelectorAll('.cat-budget').forEach(b=>b.addEventListener('click',()=>{
    const i=+b.dataset.i; budgetCatIdx=i;
    const bud=catBudgets[cats[i]]||{};
    document.getElementById('bm-title').textContent=`ميزانية: ${cats[i]}`;
    document.getElementById('bm-body').textContent='حدد المبلغ الأسبوعي والأو اليومي. اتركه فارغاً لإزالته.';
    document.getElementById('bm-weekly').value=bud.weekly||'';
    document.getElementById('bm-daily').value=bud.daily||'';
    document.getElementById('bm-monthly').value=bud.monthly||'';
    document.getElementById('budget-modal').classList.add('open');
  }));
}

// ════════════════════════════════════════════════
// MONTHLY
// ════════════════════════════════════════════════
function renderMonthly(){
  // Monthly subscriptions removed — debts page is now page-monthly
  renderDebts();
}

// ════════════════════════════════════════════════
// DRAW PIE
// ════════════════════════════════════════════════
function drawPie(catList, total){
  const canvas=document.getElementById('pie-canvas');
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,130,130);
  if(!total){return;}
  let angle=-Math.PI/2;
  catList.forEach(([c,a],i)=>{
    const slice=(a/total)*Math.PI*2;
    ctx.beginPath();ctx.moveTo(65,65);ctx.arc(65,65,60,angle,angle+slice);ctx.closePath();
    ctx.fillStyle=CAT_COLORS[cats.indexOf(c)%CAT_COLORS.length]||'#888';ctx.fill();
    angle+=slice;
  });
  // center hole
  ctx.beginPath();ctx.arc(65,65,30,0,Math.PI*2);
  ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--card').trim()||'#161a23';
  ctx.fill();
}

// ════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════
function renderDashboard(){
  renderSalary();
  const views=[{k:'Week',l:'أسبوع'},{k:'Month',l:'شهر'},{k:'All',l:'الكل'},{k:'custom',l:'مخصص'}];
  const vb=document.getElementById('dash-view-btns'); vb.innerHTML='';
  views.forEach(v=>{
    const b=document.createElement('button');
    b.className='btn'+(dashView!==v.k?' btn-out':'');
    b.style.cssText='flex:1;padding:8px 0;min-width:55px';
    b.textContent=v.l;
    b.addEventListener('click',()=>{dashView=v.k;renderDashboard();});
    vb.appendChild(b);
  });
  document.getElementById('dash-custom-range').style.display=dashView==='custom'?'block':'none';

  const wr=getWeekRange(), mr=monthRange();
  let list=[...entries].filter(e=>!e.isIncome); // purchases only — income tracked separately
  if(dashView==='Week') list=list.filter(e=>isoDate(e.date)>=wr.start&&isoDate(e.date)<=wr.end);
  else if(dashView==='Month') list=list.filter(e=>isoDate(e.date)>=mr.start&&isoDate(e.date)<=mr.end);
  else if(dashView==='custom'){
    const from=document.getElementById('dash-from').value,to=document.getElementById('dash-to').value;
    if(from&&to) list=list.filter(e=>isoDate(e.date)>=from&&isoDate(e.date)<=to);
  }

  const total=list.reduce((s,e)=>s+e.amount,0);
  const highlight=Number(settings.highlightOver)||500;
  const CUR=settings.currency;
  const viewLabel={Week:settings.weekMode==='rolling'?'آخر ٧ أيام':'الأسبوع',Month:'الشهر',All:'الكل',custom:'مخصص'}[dashView];
  document.getElementById('dash-period-label').textContent=`الإجمالي · ${viewLabel}`;

  const tb=document.getElementById('dash-total-box');
  tb.className='total-box'+(total>highlight?' over':'');
  document.getElementById('dash-total-val').textContent=fmt(total);
  document.getElementById('dash-total-cur').textContent=CUR;
  const ow=document.getElementById('dash-over-warn');
  ow.style.display=total>highlight?'block':'none';
  ow.textContent=`⚠️ تجاوزت ${fmt(highlight)} ${CUR}`;
  const dc=document.getElementById('dash-count');
  dc.style.display=detailLevel>=1?'block':'none';
  dc.textContent=`${list.length} دفعة`;

  // ── STATS GRID (level≥1 = medium) ──
  const sg=document.getElementById('dash-stats-grid');
  sg.style.display=(detailLevel>=1&&list.length)?'grid':'none';
  if(detailLevel>=1&&list.length){
    const avg=total/list.length;
    const maxE=Math.max(...list.map(e=>e.amount));
    const minE=Math.min(...list.map(e=>e.amount));
    const uniqueDays=new Set(list.map(e=>isoDate(e.date))).size;
    const dailyAvg=uniqueDays?total/uniqueDays:0;
    const catMap2={};list.forEach(e=>{catMap2[e.category]=(catMap2[e.category]||0)+e.amount;});
    const topCat=Object.entries(catMap2).sort((a,b)=>b[1]-a[1])[0];
    const items=[
      {l:'متوسط الدفعة',v:`${fmt(avg)} ${CUR}`},
      {l:'أعلى دفعة',v:`${fmt(maxE)} ${CUR}`},
      {l:'أقل دفعة',v:`${fmt(minE)} ${CUR}`},
      {l:'عدد الدفعات',v:`${list.length}`},
      ...(detailLevel>=2?[{l:'أيام الإنفاق',v:`${uniqueDays} يوم`},{l:'متوسط يومي',v:`${fmt(dailyAvg)} ${CUR}`}]:[]),
      ...(detailLevel>=2&&topCat?[{l:'أكثر تصنيف',v:topCat[0]}]:[]),
    ];
    sg.innerHTML=items.map(s=>`<div class="stat-box"><div class="stat-label">${s.l}</div><div class="stat-val" style="font-size:${s.v.length>12?'12px':'15px'}">${s.v}</div></div>`).join('');
    sg.style.gridTemplateColumns=items.length>4?'1fr 1fr':'1fr 1fr';
  }

  // ── TREND CHART ──
  const tc=document.getElementById('dash-trend-card');
  tc.style.display=(detailLevel>=1&&settings.showCharts&&list.length)?'block':'none';
  if(detailLevel>=1&&settings.showCharts&&list.length){
    const dayMap={};list.forEach(e=>{const d=isoDate(e.date);dayMap[d]=(dayMap[d]||0)+e.amount;});
    const days=Object.entries(dayMap).sort((a,b)=>a[0].localeCompare(b[0])).slice(-14);
    const maxAmt=Math.max(...days.map(d=>d[1]))||1;
    const chart=document.getElementById('dash-trend-chart'); chart.innerHTML='';
    days.forEach(([d,amt])=>{
      const pct=Math.round((amt/maxAmt)*100);
      const isTd=d===today();
      const wrap=document.createElement('div'); wrap.className='chart-bar-wrap';
      wrap.innerHTML=`<div class="chart-bar" title="${fmt(amt)} ${CUR}" style="height:${pct}%;background:${isTd?'var(--acc)':'color-mix(in srgb,var(--acc) 45%,transparent)'};box-shadow:${isTd?'0 0 8px color-mix(in srgb,var(--acc) 60%,transparent)':'none'}"></div><div style="font-size:8px;color:var(--sub);white-space:nowrap">${new Date(d+'T12:00').toLocaleDateString('ar-SA',{day:'numeric',month:'numeric'})}</div>`;
      chart.appendChild(wrap);
    });
  }

  // ── CATS BREAKDOWN ──
  const catMap={};list.forEach(e=>{catMap[e.category]=(catMap[e.category]||0)+e.amount;});
  const catList=Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  const maxC=catList[0]?.[1]||1;
  const cc2=document.getElementById('dash-cats-card');
  cc2.style.display=detailLevel>=1?'block':'none';
  if(detailLevel>=1){
    document.getElementById('dash-cats-list').innerHTML=catList.length
      ?catList.map(([c,a])=>{
        const clr=catColor(c);
        const bud=catBudgets[c];
        const wBud=bud?.weekly, dBud=bud?.daily;
        const wr2=getWeekRange(), td2=today();
        const wSpent=entries.filter(e=>isoDate(e.date)>=wr2.start&&isoDate(e.date)<=wr2.end&&e.category===c).reduce((s,e)=>s+e.amount,0);
        const dSpent=entries.filter(e=>isoDate(e.date)===td2&&e.category===c).reduce((s,e)=>s+e.amount,0);
        const wWarn=wBud&&wSpent>wBud;
        const dWarn=dBud&&dSpent>dBud;
        return `<div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;flex-direction:row-reverse;align-items:center;margin-bottom:4px;gap:6px;flex-wrap:wrap">
            <span style="font-size:13px">${settings.showEmoji?c:c.replace(/^\p{Emoji}\s*/u,'')}</span>
            <div style="display:flex;gap:6px;align-items:center;flex-direction:row-reverse;flex-wrap:wrap">
              <span style="font-weight:700;font-size:13px;color:${clr}">${fmt(a)} ${CUR}</span>
              ${wBud?`<span style="font-size:10px;color:${wWarn?'var(--err)':'var(--teal)'};font-weight:600">${wWarn?'⚠️ ':''}/أسبوع ${fmt(wBud)}</span>`:''}
              ${dBud?`<span style="font-size:10px;color:${dWarn?'var(--err)':'var(--sub)'};font-weight:600">${dWarn?'⚠️ ':''}/يوم ${fmt(dBud)}</span>`:''}
            </div>
          </div>
          <div class="bar-bg"><div class="bar-fill" style="width:${(a/maxC)*100}%;background:${clr};box-shadow:0 0 6px ${clr}55"></div></div>
          ${detailLevel>=2?`<div style="font-size:10px;color:var(--sub);margin-top:2px">${total>0?((a/total)*100).toFixed(1):0}% من الإجمالي</div>`:''}
        </div>`;
      }).join('')
      :'<div style="color:var(--sub);font-size:13px;text-align:center;padding:14px">لا توجد بيانات.</div>';
  }

  // ── PIE CHART (level≥2) ──
  const pieCard=document.getElementById('dash-pie-card');
  pieCard.style.display=(detailLevel>=2&&catList.length)?'block':'none';
  if(detailLevel>=2&&catList.length){
    drawPie(catList,total);
    const legend=document.getElementById('pie-legend'); legend.innerHTML='';
    catList.slice(0,8).forEach(([c,a])=>{
      const clr=catColor(c);
      const div=document.createElement('div'); div.className='pie-legend-item';
      div.innerHTML=`<span style="font-size:12px;flex:1;text-align:right">${settings.showEmoji?c:c.replace(/^\p{Emoji}\s*/u,'')} <span style="color:var(--sub)">${total>0?((a/total)*100).toFixed(0):0}%</span></span><div class="pie-dot" style="background:${clr};box-shadow:0 0 5px ${clr}88"></div>`;
      legend.appendChild(div);
    });
  }

  // ── BUDGET WARNS (level≥1) ──
  const warnCard=document.getElementById('dash-warns-card');
  const warns=[];
  Object.entries(catBudgets).forEach(([cat,bud])=>{
    if(!bud) return;
    const wr3=getWeekRange(), td3=today();
    if(bud.weekly){
      const spent=entries.filter(e=>isoDate(e.date)>=wr3.start&&isoDate(e.date)<=wr3.end&&e.category===cat).reduce((s,e)=>s+e.amount,0);
      warns.push({cat,budget:bud.weekly,spent,pct:spent/bud.weekly,type:'weekly'});
    }
    if(bud.daily){
      const spent=entries.filter(e=>isoDate(e.date)===td3&&e.category===cat).reduce((s,e)=>s+e.amount,0);
      warns.push({cat,budget:bud.daily,spent,pct:spent/bud.daily,type:'daily'});
    }
  });
  warnCard.style.display=(detailLevel>=1&&warns.length&&settings.budgetWarn)?'block':'none';
  if(warns.length&&settings.budgetWarn){
    document.getElementById('dash-warns-list').innerHTML=warns.sort((a,b)=>b.pct-a.pct).map(w=>{
      const over=w.pct>1; const pct=Math.min(w.pct*100,100).toFixed(0);
      const clr=over?'var(--err)':w.pct>0.8?'#f59e0b':'var(--teal)';
      const typeLabel=w.type==='weekly'?'أسبوعي':'يومي';
      return `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;flex-direction:row-reverse;margin-bottom:4px"><span style="font-size:12px">${w.cat} <span style="font-size:10px;color:var(--sub)">(${typeLabel})</span></span><span style="font-size:12px;color:${clr};font-weight:700">${fmt(w.spent)} / ${fmt(w.budget)} ${CUR}</span></div><div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${clr}"></div></div>${over?`<div style="font-size:10px;color:var(--err);margin-top:2px">⚠️ تجاوزت بـ ${fmt(w.spent-w.budget)} ${CUR} · من بكره بتصرف اقل ولا تسوي نادم 😄</div>`:`<div style="font-size:10px;color:var(--sub);margin-top:2px">${pct}% مستخدم</div>`}</div>`;
    }).join('');
  }

  // ── LARGEST (level≥2) ──
  const lc=document.getElementById('dash-largest-card');
  lc.style.display=detailLevel>=2?'block':'none';
  if(detailLevel>=2){
    const top=[...list].sort((a,b)=>b.amount-a.amount).slice(0,5);
    document.getElementById('dash-largest-list').innerHTML=top.length
      ?top.map(e=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);flex-direction:row-reverse"><div style="text-align:right"><div style="font-size:13px">${e.description}</div><div style="font-size:10px;color:var(--sub)">${new Date(e.date).toLocaleDateString('ar-SA',{day:'2-digit',month:'short'})} · ${e.category}</div></div><div style="font-weight:700;color:${catColor(e.category)};direction:ltr;white-space:nowrap">${fmt(e.amount)} <span style="font-size:11px;color:var(--sub)">${CUR}</span></div></div>`).join('')
      :'<div style="color:var(--sub);font-size:13px;text-align:center;padding:14px">لا توجد بيانات.</div>';
  }

  // ── HEATMAP (level≥3) ──
  const hm=document.getElementById('dash-heatmap-card');
  hm.style.display=(detailLevel>=3&&settings.showCharts&&list.length)?'block':'none';
  if(detailLevel>=3&&settings.showCharts&&list.length){
    const days=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const dayTotals=Array(7).fill(0), dayCounts=Array(7).fill(0);
    list.forEach(e=>{const d=new Date(e.date).getDay();dayTotals[d]+=e.amount;dayCounts[d]++;});
    const maxD=Math.max(...dayTotals)||1;
    document.getElementById('dash-heatmap').innerHTML=days.map((day,i)=>{
      const pct=dayTotals[i]/maxD; const alpha=Math.round(pct*80+5);
      return `<div style="text-align:center"><div style="width:100%;padding-top:100%;border-radius:10px;background:color-mix(in srgb,var(--acc) ${alpha}%,var(--border));margin-bottom:4px;box-shadow:${pct>.5?`0 0 10px color-mix(in srgb,var(--acc) ${Math.round(pct*50)}%,transparent)`:'none'}" title="${fmt(dayTotals[i])} ${CUR}"></div><div style="font-size:9px;color:var(--sub)">${day.slice(0,3)}</div></div>`;
    }).join('');
  }

  // monthly subscriptions removed
  document.getElementById('dash-monthly-card').style.display='none';
}

// ════════════════════════════════════════════════
// TEMPLATES
// ════════════════════════════════════════════════
function renderTemplatesList(){
  const el=document.getElementById('templates-list'); el.innerHTML='';
  const keys=Object.keys(templates);
  if(!keys.length){el.innerHTML='<div style="color:var(--sub);font-size:12px;text-align:right">لا توجد templates محفوظة بعد.</div>';return;}
  keys.forEach(name=>{
    const row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;justify-content:space-between;flex-direction:row-reverse;padding:8px 0;border-bottom:1px solid var(--border);gap:8px';
    row.innerHTML=`<span style="font-size:13px;text-align:right;flex:1">${name} <span style="font-size:10px;color:var(--sub)">(${templates[name].length} تصنيف)</span></span><button class="btn btn-teal-out btn-sm tpl-load" data-name="${name}">تحميل</button><button class="del-btn tpl-del" data-name="${name}">✕</button>`;
    el.appendChild(row);
  });
  el.querySelectorAll('.tpl-load').forEach(b=>b.addEventListener('click',()=>{
    const name=b.dataset.name;
    openConfirm({icon:'📂',title:`تحميل "${name}"؟`,warn:'⚠️ ستُستبدل تصنيفاتك الحالية.',body:'الدفعات المسجّلة لن تتأثر.',confirmLabel:'تحميل',confirmClass:'btn btn-teal',fn:()=>{cats=[...templates[name]];save('pt_cats',cats);renderCatsPage();renderCatSelects();renderPills();showToast(`تم تحميل template "${name}" ✓`);}});
  }));
  el.querySelectorAll('.tpl-del').forEach(b=>b.addEventListener('click',()=>{
    const name=b.dataset.name;
    openConfirm({icon:'🗑',title:`حذف template "${name}"؟`,body:'',fn:()=>{delete templates[name];save('pt_templates',templates);renderTemplatesList();showToast('تم الحذف','err');}});
  }));
}

// ════════════════════════════════════════════════
// DEBTS
// ════════════════════════════════════════════════
function renderDebts(){
  const card=document.getElementById('debts-card');
  const list=document.getElementById('debt-list');
  const cur2=document.getElementById('debt-cur-label');
  if(cur2) cur2.textContent=settings.currency;
  const emptyEl=document.getElementById('debt-empty');
  card.style.display=debts.length?'block':'none';
  if(emptyEl) emptyEl.style.display=debts.length?'none':'block';
  const totalAmt=debts.reduce((s,d)=>s+d.amount,0);
  const paidAmt=debts.filter(d=>d.paid).reduce((s,d)=>s+d.amount,0);
  const remainAmt=totalAmt-paidAmt;
  const td=document.getElementById('debt-total-disp'); if(td) td.textContent=fmt(totalAmt)+' '+settings.currency;
  const pd=document.getElementById('debt-paid-disp'); if(pd) pd.textContent=fmt(paidAmt)+' '+settings.currency;
  const rd=document.getElementById('debt-remain-disp'); if(rd) rd.textContent=fmt(remainAmt)+' '+settings.currency;
  // ms bar
  const msDebtBar=document.getElementById('ms-debt-bar');
  if(msDebtBar){
    msDebtBar.classList.toggle('active',msDebtMode);
    document.getElementById('ms-debt-count').textContent=msDebtMode?msSelectedDebt.size+' محدد':'';
  }
  list.innerHTML='';
  debts.forEach((d,i)=>{
    const row=document.createElement('div');
    // alternating: odd rows slightly more tinted for contrast
    const rowBg=i%2===0
      ? 'color-mix(in srgb,var(--acc) 5%,transparent)'
      : 'transparent';
    row.style.cssText=`display:flex;align-items:center;gap:10px;padding:10px 8px;border-radius:10px;margin-bottom:4px;background:${rowBg};flex-direction:row-reverse;opacity:${d.paid?.45:1};transition:opacity .2s`;
    const amtColor=d.paid?'var(--sub)':'var(--acc)';
    const lineThrough=d.paid?'line-through':'none';
    row.innerHTML=`
      ${msDebtMode
        ? `<input type="checkbox" class="ms-check debt-ms-check" data-i="${i}" ${msSelectedDebt.has(i)?'checked':''} style="flex-shrink:0">`
        : `<input type="checkbox" class="ms-check debt-check" data-i="${i}" ${d.paid?'checked':''} style="flex-shrink:0;accent-color:var(--acc)">`
      }
      <div style="flex:1;text-align:right;min-width:0">
        <div style="font-size:13px;font-weight:600;text-decoration:${lineThrough};color:${d.paid?'var(--sub)':'var(--text)'}">${d.name}</div>
      </div>
      <span style="font-weight:700;color:${amtColor};direction:ltr;white-space:nowrap;font-size:13px;background:color-mix(in srgb,${d.paid?'var(--sub)':'var(--acc)'} 12%,transparent);padding:3px 8px;border-radius:8px">${fmt(d.amount)} ${settings.currency}</span>
      ${msDebtMode?'':`<button class="del-btn debt-del" data-i="${i}" style="color:color-mix(in srgb,var(--acc) 50%,var(--sub))">✕</button>`}`;
    list.appendChild(row);
  });
  list.querySelectorAll('.debt-check').forEach(cb=>cb.addEventListener('change',function(){
    debts[+this.dataset.i].paid=this.checked;save('pt_debts',debts);renderDebts();
  }));
  list.querySelectorAll('.debt-ms-check').forEach(cb=>cb.addEventListener('change',function(){
    const i=+this.dataset.i;
    if(this.checked) msSelectedDebt.add(i); else msSelectedDebt.delete(i);
    document.getElementById('ms-debt-count').textContent=msSelectedDebt.size+' محدد';
  }));
  list.querySelectorAll('.debt-del').forEach(b=>b.addEventListener('click',()=>{
    const i=+b.dataset.i;
    // Custom debt delete message
    openConfirm({
      icon:'💳',
      title:'حذف الدَّيْن؟',
      warn:'إذا خلصت منه مو لازم تحذفه — خله موجود عشان تعرف نهاية الشهر وين راحت فلوسك 😅',
      body:'',
      confirmLabel:'مالك دخل 🗑',
      confirmClass:'btn btn-err',
      fn:()=>{debts.splice(i,1);save('pt_debts',debts);renderDebts();showToast('تم الحذف','err');}
    });
    // Override cancel button text after modal opens
    setTimeout(()=>{
      const cancelBtn=document.getElementById('cm-cancel');
      if(cancelBtn) cancelBtn.textContent='بخليه 🙂';
    },10);
  }));
}

// ════════════════════════════════════════════════
// SALARY
// ════════════════════════════════════════════════
function renderSalary(){
  const cur=isoDate(new Date()).slice(0,7);
  const salDisp=document.getElementById('salary-display-val');
  const salSub=document.getElementById('salary-display-sub');
  const remBar=document.getElementById('salary-remaining-bar');
  const remVal=document.getElementById('salary-remain-val');
  const remLbl=document.getElementById('salary-remain-label');
  // update extra cur label
  const salCurLbl=document.getElementById('salary-cur-label');
  if(salCurLbl) salCurLbl.textContent=settings.currency;

  // Compute extra income directly from entries (isIncome entries this month)
  const mr0=monthRange();
  const extraEntries=entries.filter(e=>e.isIncome&&isoDate(e.date)>=mr0.start&&isoDate(e.date)<=mr0.end);
  const extraTotal=extraEntries.reduce((s,e)=>s+e.amount,0);
  const salaryBase=salary.month===cur?salary.amount:0;
  // includeExtra setting: if false, only show salary; if true, add income entries
  const totalBalance=settings.includeExtra!==false?(salaryBase+extraTotal):salaryBase;

  // Update display
  const hasAnything=salaryBase>0||extraTotal>0;
  if(!hasAnything){
    salDisp.textContent='اضغط لإضافة الراتب';
    if(salSub) salSub.textContent='اضغط لتعديل الراتب';
    if(remBar) remBar.style.display='none';
  } else {
    salDisp.textContent=fmt(totalBalance)+' '+settings.currency;
    const parts=[];
    if(salaryBase>0) parts.push('راتب '+fmt(salaryBase));
    if(extraTotal>0) parts.push('إضافي '+fmt(extraTotal));
    if(salSub) salSub.textContent=parts.length?parts.join(' · '):'اضغط لتعديل الراتب';
    if(remBar){
      const mr=monthRange();
      const spent=entries.filter(e=>!e.isIncome&&isoDate(e.date)>=mr.start&&isoDate(e.date)<=mr.end).reduce((s,e)=>s+e.amount,0);
      const rem=totalBalance-spent;
      remBar.style.display='flex';
      remBar.style.justifyContent='space-between';
      const remColor=rem<0?'#f87171':rem<totalBalance*0.2?'#fbbf24':'#34d399';
      remVal.textContent=fmt(Math.abs(rem))+' '+settings.currency;
      remVal.style.color=remColor;
      remLbl.textContent=rem>=0?'المتبقي':'تجاوزت الرصيد بـ';
    }
  }

  // Extra income entries now shown in tracker list via isIncome flag
}


function applyAccent(v){document.documentElement.style.setProperty('--acc',v);}
function applyUiSize(size){document.body.classList.toggle('compact-mode',size==='compact');}
function applyDark(on){document.body.classList.toggle('light',!on);}
function applyNavPos(pos){
  const isBottom=pos==='bottom';
  document.body.classList.toggle('bottom-nav-mode',isBottom);
  document.getElementById('bottom-nav').classList.toggle('active',isBottom);
  document.querySelector('#nav .nav-tabs').style.display=isBottom?'none':'flex';
}
function applySettings(){
  applyAccent(settings.accentColor);
  applyDark(settings.darkMode);
  document.getElementById('logo').textContent=settings.projectName||'وين فلوسي تروح';
  document.getElementById('set-proj-name').value=settings.projectName||'';
  document.getElementById('set-currency').value=settings.currency;
  document.getElementById('set-sort').value=settings.sortBy;
  document.getElementById('set-highlight').value=settings.highlightOver;
  document.getElementById('highlight-sub').textContent=`${settings.highlightOver} ${settings.currency}`;
  document.getElementById('set-week-mode').value=settings.weekMode||'fixed';
  document.getElementById('set-uisize').value=settings.uiSize||'normal';
  applyUiSize(settings.uiSize||'normal');
  document.getElementById('set-nav-pos').value=settings.navPos||'top';
  document.getElementById('set-tracker-total').value=settings.trackerTotal||'day';
  document.getElementById('set-reset-hour').value=String(settings.resetHour??5);
  applyNavPos(settings.navPos||'top');
  const togMap={dark:'darkMode',confirm:'confirmDelete',emoji:'showEmoji',compact:'compactMode',running:'showRunningTotal',colorcat:'colorCat',hidetime:'hideTime',charts:'showCharts',budgetwarn:'budgetWarn',includeextra:'includeExtra'};
  Object.entries(togMap).forEach(([k,sk])=>document.getElementById('tog-'+k).classList.toggle('on',!!settings[sk]));
  // swatches
  const sw=document.getElementById('color-swatches'); sw.innerHTML='';
  ACCENTS.forEach(a=>{
    const wrap=document.createElement('div');
    wrap.className='swatch-wrap'+(settings.accentColor===a.v?' active':'');
    wrap.title=a.n;
    wrap.innerHTML=`<div class="swatch-blob" style="background:${a.g}"></div>`;
    wrap.addEventListener('click',()=>{settings.accentColor=a.v;save('pt_settings',settings);applySettings();renderEntries();});
    sw.appendChild(wrap);
  });
  renderTemplatesList();
}

function mkToggle(domKey,settKey,extra){
  document.getElementById('tog-'+domKey).addEventListener('click',function(){
    settings[settKey]=!settings[settKey];this.classList.toggle('on',settings[settKey]);save('pt_settings',settings);if(extra)extra(settings[settKey]);
  });
}

// ════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════
function exportXLSX(){
  if(typeof XLSX==='undefined'){
    showToast('مكتبة Excel لم تُحمَّل — تأكد من اتصال الإنترنت ثم أعد المحاولة','err');return;
  }
  const wb=XLSX.utils.book_new();
  const CUR=settings.currency;
  const proj=(settings.projectName||'وين فلوسي تروح');
  const now=new Date();
  const curMonth=isoDate(now).slice(0,7);

  // helper: bold first row
  function boldRow(ws,cols){
    cols.forEach(c=>{if(ws[c]&&ws[c].t!==undefined)ws[c].s={font:{bold:true}};});
  }

  // purchases only
  const purchases=entries.filter(e=>!e.isIncome).sort((a,b)=>a.id-b.id);
  // income entries
  const incomeEntries=entries.filter(e=>e.isIncome).sort((a,b)=>a.id-b.id);

  // ══ 1. كل المدفوعات ══════════════════════════════════════════════════
  {
    const rows=[['#','الوصف','المبلغ ('+CUR+')','التصنيف','التاريخ','اليوم','الوقت','الشهر']];
    purchases.forEach((e,i)=>{
      const d=new Date(e.date);
      rows.push([
        i+1,
        e.description==='—'?'بدون وصف':e.description,
        e.amount, e.category,
        d.toLocaleDateString('ar-SA',{year:'numeric',month:'2-digit',day:'2-digit'}),
        d.toLocaleDateString('ar-SA',{weekday:'long'}),
        d.toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'}),
        isoDate(d).slice(0,7)
      ]);
    });
    const total=purchases.reduce((s,e)=>s+e.amount,0);
    rows.push(['','','','','','','','']);
    rows.push(['الإجمالي الكلي',total,CUR,'','','','','']);
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws['!cols']=[{wch:5},{wch:32},{wch:12},{wch:18},{wch:14},{wch:14},{wch:10},{wch:10}];
    XLSX.utils.book_append_sheet(wb,ws,'المدفوعات');
  }

  // ══ 2. وصلني (دخل إضافي) ═════════════════════════════════════════════
  {
    const rows=[['#','الوصف / المصدر','المبلغ ('+CUR+')','التاريخ','اليوم','الشهر']];
    incomeEntries.forEach((e,i)=>{
      const d=new Date(e.date);
      rows.push([i+1,e.description==='—'?'وصلني':e.description,e.amount,
        d.toLocaleDateString('ar-SA',{year:'numeric',month:'2-digit',day:'2-digit'}),
        d.toLocaleDateString('ar-SA',{weekday:'long'}),isoDate(d).slice(0,7)]);
    });
    const total=incomeEntries.reduce((s,e)=>s+e.amount,0);
    rows.push(['','','','','','']);
    rows.push(['إجمالي الدخل الإضافي',total,CUR,'','','']);
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws['!cols']=[{wch:5},{wch:32},{wch:14},{wch:14},{wch:14},{wch:10}];
    XLSX.utils.book_append_sheet(wb,ws,'وصلني - دخل إضافي');
  }

  // ══ 3. الراتب والرصيد ════════════════════════════════════════════════
  {
    const mr=monthRange();
    const monthPurchases=purchases.filter(e=>isoDate(e.date)>=mr.start&&isoDate(e.date)<=mr.end);
    const monthIncome=incomeEntries.filter(e=>isoDate(e.date)>=mr.start&&isoDate(e.date)<=mr.end);
    const salaryBase=salary.month===curMonth?salary.amount:0;
    const extraTotal=monthIncome.reduce((s,e)=>s+e.amount,0);
    const totalBalance=(settings.includeExtra!==false)?(salaryBase+extraTotal):salaryBase;
    const monthSpent=monthPurchases.reduce((s,e)=>s+e.amount,0);
    const remaining=Math.max(0,totalBalance-monthSpent);
    const spentPct=totalBalance>0?((monthSpent/totalBalance)*100).toFixed(1)+'%':'—';
    const rows=[
      ['بيان الشهر الحالي','القيمة ('+CUR+')'],
      ['الراتب الأساسي', salaryBase||'لم يُسجَّل'],
      ['مجموع "وصلني"', extraTotal],
      ['إجمالي الرصيد', totalBalance],
      ['إجمالي الإنفاق', monthSpent],
      ['المتبقي', remaining],
      ['نسبة الإنفاق من الرصيد', spentPct],
      ['الشهر', curMonth],
      ['',''],
      ['تفاصيل "وصلني" هذا الشهر',''],
      ['الوصف','المبلغ ('+CUR+')'],
    ];
    monthIncome.forEach(e=>rows.push([e.description==='—'?'وصلني':e.description,e.amount]));
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws['!cols']=[{wch:30},{wch:16}];
    XLSX.utils.book_append_sheet(wb,ws,'الراتب والرصيد');
  }

  // ══ 4. ملخص التصنيفات ════════════════════════════════════════════════
  {
    const catMap={},catCount={};
    purchases.forEach(e=>{catMap[e.category]=(catMap[e.category]||0)+e.amount;catCount[e.category]=(catCount[e.category]||0)+1;});
    const totalAll=Object.values(catMap).reduce((s,v)=>s+v,0);
    const rows=[['التصنيف','إجمالي الإنفاق ('+CUR+')','عدد الدفعات','النسبة من الإجمالي','متوسط الدفعة ('+CUR+')']];
    Object.entries(catMap).sort((a,b)=>b[1]-a[1]).forEach(([cat,amt])=>{
      const cnt=catCount[cat];
      rows.push([cat,amt,cnt,totalAll>0?((amt/totalAll)*100).toFixed(1)+'%':'—',(cnt>0?(amt/cnt).toFixed(2):'—')]);
    });
    rows.push(['','','','','']);
    rows.push(['الإجمالي',totalAll,purchases.length,'100%','—']);
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws['!cols']=[{wch:22},{wch:18},{wch:14},{wch:18},{wch:18}];
    XLSX.utils.book_append_sheet(wb,ws,'ملخص التصنيفات');
  }

  // ══ 5. الإنفاق الشهري ════════════════════════════════════════════════
  {
    const monthMap={};
    purchases.forEach(e=>{const m=isoDate(e.date).slice(0,7);monthMap[m]=(monthMap[m]||0)+e.amount;});
    const rows=[['الشهر','الإنفاق ('+CUR+')','عدد الدفعات']];
    const monthCount={};purchases.forEach(e=>{const m=isoDate(e.date).slice(0,7);monthCount[m]=(monthCount[m]||0)+1;});
    Object.entries(monthMap).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([m,amt])=>{
      const d=new Date(m+'-01');
      rows.push([d.toLocaleDateString('ar-SA',{month:'long',year:'numeric'}),amt,monthCount[m]||0]);
    });
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws['!cols']=[{wch:22},{wch:16},{wch:14}];
    XLSX.utils.book_append_sheet(wb,ws,'الإنفاق الشهري');
  }

  // ══ 6. الإنفاق اليومي ════════════════════════════════════════════════
  {
    const dayMap={},dayCount={};
    purchases.forEach(e=>{const d=isoDate(e.date);dayMap[d]=(dayMap[d]||0)+e.amount;dayCount[d]=(dayCount[d]||0)+1;});
    const rows=[['التاريخ','اليوم','الإنفاق ('+CUR+')','عدد الدفعات']];
    Object.entries(dayMap).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([d,amt])=>{
      rows.push([d,new Date(d+'T12:00').toLocaleDateString('ar-SA',{weekday:'long'}),amt,dayCount[d]||0]);
    });
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws['!cols']=[{wch:14},{wch:14},{wch:14},{wch:12}];
    XLSX.utils.book_append_sheet(wb,ws,'الإنفاق اليومي');
  }

  // ══ 7. الديون ════════════════════════════════════════════════════════
  if(debts.length){
    const rows=[['#','اسم الدَّيْن','المبلغ ('+CUR+')','الحالة']];
    debts.forEach((d,i)=>rows.push([i+1,d.name,d.amount,d.paid?'مسدّد ✓':'قيد السداد']));
    const total=debts.reduce((s,d)=>s+d.amount,0);
    const paid=debts.filter(d=>d.paid).reduce((s,d)=>s+d.amount,0);
    rows.push(['','','','']);
    rows.push(['إجمالي الديون',total,CUR,'']);
    rows.push(['المسدّد',paid,CUR,'']);
    rows.push(['المتبقي',total-paid,CUR,'']);
    rows.push(['نسبة السداد',total>0?((paid/total)*100).toFixed(1)+'%':'—','','']);
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws['!cols']=[{wch:5},{wch:32},{wch:14},{wch:14}];
    XLSX.utils.book_append_sheet(wb,ws,'الديون');
  }

  // ══ 8. الميزانيات ════════════════════════════════════════════════════
  const budKeys=Object.keys(catBudgets);
  if(budKeys.length){
    const mr=monthRange(),wr=getWeekRange();
    const td=today();
    const rows=[['التصنيف','ميزانية يومية','ميزانية أسبوعية','ميزانية شهرية','إنفاق اليوم','إنفاق الأسبوع','إنفاق الشهر','نسبة الشهر','الحالة']];
    budKeys.forEach(cat=>{
      const bud=catBudgets[cat];
      const daySpent=purchases.filter(e=>isoDate(e.date)===td&&e.category===cat).reduce((s,e)=>s+e.amount,0);
      const wkSpent=purchases.filter(e=>isoDate(e.date)>=wr.start&&isoDate(e.date)<=wr.end&&e.category===cat).reduce((s,e)=>s+e.amount,0);
      const monSpent=purchases.filter(e=>isoDate(e.date)>=mr.start&&isoDate(e.date)<=mr.end&&e.category===cat).reduce((s,e)=>s+e.amount,0);
      const monPct=bud.monthly?((monSpent/bud.monthly)*100).toFixed(1)+'%':'—';
      const status=bud.monthly&&monSpent>bud.monthly?'⚠️ تجاوز':bud.weekly&&wkSpent>bud.weekly?'⚠️ تجاوز أسبوعي':'ضمن الحدود';
      rows.push([cat,bud.daily||'—',bud.weekly||'—',bud.monthly||'—',daySpent||0,wkSpent||0,monSpent||0,monPct,status]);
    });
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws['!cols']=[{wch:20},{wch:14},{wch:16},{wch:16},{wch:14},{wch:14},{wch:14},{wch:12},{wch:16}];
    XLSX.utils.book_append_sheet(wb,ws,'الميزانيات');
  }

  // ══ 9. إحصائيات عامة ═════════════════════════════════════════════════
  {
    const total=purchases.reduce((s,e)=>s+e.amount,0);
    const uniqueDays=new Set(purchases.map(e=>isoDate(e.date))).size;
    const maxE=purchases.length?Math.max(...purchases.map(e=>e.amount)):0;
    const minE=purchases.length?Math.min(...purchases.map(e=>e.amount)):0;
    const avgE=purchases.length?total/purchases.length:0;
    const avgDay=uniqueDays?total/uniqueDays:0;
    const catMap={};purchases.forEach(e=>{catMap[e.category]=(catMap[e.category]||0)+e.amount;});
    const topCat=Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0];
    const rows=[
      ['إحصائية','القيمة'],
      ['إجمالي الإنفاق الكلي',total+' '+CUR],
      ['عدد الدفعات الكلي',purchases.length],
      ['أيام الإنفاق المسجّلة',uniqueDays],
      ['أعلى دفعة واحدة',maxE+' '+CUR],
      ['أقل دفعة واحدة',minE+' '+CUR],
      ['متوسط الدفعة',avgE.toFixed(2)+' '+CUR],
      ['متوسط الإنفاق اليومي',avgDay.toFixed(2)+' '+CUR],
      ['أكثر تصنيف إنفاقاً',topCat?topCat[0]+' ('+topCat[1]+' '+CUR+')':'—'],
      ['الفلوس الإضافية (وصلني)',incomeEntries.reduce((s,e)=>s+e.amount,0)+' '+CUR],
      ['راتب الشهر الحالي',(salary.month===curMonth?salary.amount:0)+' '+CUR],
      ['إجمالي الديون المسجّلة',debts.reduce((s,d)=>s+d.amount,0)+' '+CUR],
      ['تاريخ التصدير',isoDate(now)+' '+now.toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'})],
      ['العملة',CUR],
    ];
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws['!cols']=[{wch:30},{wch:24}];
    XLSX.utils.book_append_sheet(wb,ws,'إحصائيات عامة');
  }

  // ══ Write ═════════════════════════════════════════════════════════════
  const fname=proj.replace(/[\s\/\\]/g,'_')+'_'+isoDate(now)+'.xlsx';
  try{
    XLSX.writeFile(wb,fname);
    showToast('✓ تم التصدير — '+wb.SheetNames.length+' صفحات');
  }catch(err){
    showToast('خطأ في التصدير: '+err.message,'err');
  }
}


// ════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════

// ════ CLOUD SYNC (JSONBin.io) ════
function _getCloudData(){
  return {
    a:typeof entries!=='undefined'?entries:[],
    b:typeof cats!=='undefined'?cats:[],
    c:typeof catBudgets!=='undefined'?catBudgets:{},
    d:typeof settings!=='undefined'?settings:{},
    e:typeof debts!=='undefined'?debts:[],
    f:typeof salary!=='undefined'?salary:{},
    g:typeof templates!=='undefined'?templates:{},
    h:typeof catDescs!=='undefined'?catDescs:{},
    t:Date.now()
  };
}
function _applyCloudData(j){
  if(j.a){try{localStorage.setItem('pt_entries',JSON.stringify(j.a));}catch(e){}}
  if(j.b){try{localStorage.setItem('pt_cats',JSON.stringify(j.b));}catch(e){}}
  if(j.c){try{localStorage.setItem('pt_budgets',JSON.stringify(j.c));}catch(e){}}
  if(j.d){try{localStorage.setItem('pt_settings',JSON.stringify(j.d));}catch(e){}}
  if(j.e){try{localStorage.setItem('pt_debts',JSON.stringify(j.e));}catch(e){}}
  if(j.f){try{localStorage.setItem('pt_salary',JSON.stringify(j.f));}catch(e){}}
  if(j.g){try{localStorage.setItem('pt_templates',JSON.stringify(j.g));}catch(e){}}
  if(j.h){try{localStorage.setItem('pt_catdescs',JSON.stringify(j.h));}catch(e){}}
}
function _cloudSave(){
  var bid=localStorage.getItem('_cbin')||'',bkey=localStorage.getItem('_ckey')||'';
  if(!bid||!bkey) return;
  fetch('https://api.jsonbin.io/v3/b/'+bid,{
    method:'PUT',
    headers:{'Content-Type':'application/json','X-Access-Key':bkey,'X-Bin-Private':'false'},
    body:JSON.stringify({record:_getCloudData()})
  }).catch(function(){});
}
function _cloudLoad(cb){
  var bid=localStorage.getItem('_cbin')||'',bkey=localStorage.getItem('_ckey')||'';
  if(!bid){cb(false);return;}
  fetch('https://api.jsonbin.io/v3/b/'+bid+'/latest',{
    headers:{'X-Access-Key':bkey}
  }).then(function(r){return r.json();})
  .then(function(j){if(j&&j.record){_applyCloudData(j.record);cb(true);}else{cb(false);}})
  .catch(function(){cb(false);});
}
// Emergency save on exit
function _saveAll(){
  var data=_getCloudData();
  var map={'pt_entries':'a','pt_cats':'b','pt_budgets':'c','pt_settings':'d','pt_debts':'e','pt_salary':'f','pt_templates':'g','pt_catdescs':'h'};
  Object.keys(map).forEach(function(k){if(data[map[k]]){try{localStorage.setItem(k,JSON.stringify(data[map[k]]));}catch(e){}}});
}
window.addEventListener('pagehide',_saveAll,{capture:true});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')_saveAll();},true);
setInterval(function(){_saveAll();_cloudSave();},20000);

function init(){
  // ── overlay & notification ──
  document.getElementById('warn-ok').addEventListener('click',()=>{
    document.getElementById('warn-overlay').style.display='none';
  });
  document.getElementById('warn-edit-budget').addEventListener('click',()=>{
    document.getElementById('warn-overlay').style.display='none';
    // switch to cats page
    document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.bnav-btn').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelector('.nav-tab[data-page="cats"]').classList.add('active');
    document.querySelector('.bnav-btn[data-page="cats"]').classList.add('active');
    document.getElementById('page-cats').classList.add('active');
    renderCatsPage();
  });
  document.getElementById('ios-notif').addEventListener('click',()=>{
    document.getElementById('ios-notif').classList.remove('show');
    document.getElementById('inp-desc').focus();
  });
  document.getElementById('ios-notif-desc-btn').addEventListener('click',(e)=>{
    e.stopPropagation();
    document.getElementById('ios-notif').classList.remove('show');
    // Open edit modal for the most recently added entry (first in array)
    if(entries.length>0){
      const last=entries[0];
      editEntryId=last.id;
      document.getElementById('edit-amt').value=last.amount;
      document.getElementById('edit-desc').value=last.description==='—'?'':last.description;
      const sel=document.getElementById('edit-cat');
      sel.innerHTML=cats.map(c=>`<option value="${c}"${c===last.category?' selected':''}>${c}</option>`).join('');
      document.getElementById('edit-modal').classList.add('open');
      setTimeout(()=>document.getElementById('edit-desc').focus(),200);
    }
  });

  // nav
  document.querySelectorAll('.nav-tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('.bnav-btn').forEach(t=>t.classList.toggle('active',t.dataset.page===tab.dataset.page));
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('page-'+tab.dataset.page).classList.add('active');
      if(tab.dataset.page==='dashboard') renderDashboard();
      if(tab.dataset.page==='monthly') renderDebts();
      if(tab.dataset.page==='cats') renderCatsPage();
    });
  });

  document.getElementById('btn-ms-entries-toggle').addEventListener('click',()=>{
    msEntriesMode=!msEntriesMode; msSelectedEntries=new Set(); renderEntries();
  });
  // multi-select monthly subs
  // REMOVED:   document.getElementById('btn-ms-mon-toggle').addEventListener('click',()=>{msMonMode=!msMonMode;msSelectedMon=new Set();renderMonthly();});
  // REMOVED:   // REMOVED:   document.getElementById('ms-mon-cancel').addEventListener('click',()=>{msMonMode=false;msSelectedMon=new Set();renderMonthly();});
  // REMOVED:   // REMOVED:   document.getElementById('ms-mon-del').addEventListener('click',()=>{
  // REMOVED:     if(!msSelectedMon.size){showToast('لم تحدد شيئاً','warn');return;}
  // REMOVED: openConfirm({icon:'📅',title:`حذف ${msSelectedMon.size} اشتراك؟`,warn:'⚠️ لا يمكن التراجع.',body:'',confirmLabel:'حذف الكل',confirmClass:'btn btn-err',fn:()=>{
  // REMOVED: const idxs=[...msSelectedMon].sort((a,b)=>b-a);
  // REMOVED: idxs.forEach(i=>monthly.splice(i,1));save('pt_monthly',monthly);
  // REMOVED: msMonMode=false;msSelectedMon=new Set();renderMonthly();showToast('تم الحذف','err');
  // REMOVED: }});
  // REMOVED: });
  // multi-select debts
  document.getElementById('btn-ms-debt-toggle').addEventListener('click',()=>{msDebtMode=!msDebtMode;msSelectedDebt=new Set();renderDebts();});
  document.getElementById('ms-debt-cancel').addEventListener('click',()=>{msDebtMode=false;msSelectedDebt=new Set();renderDebts();});
  document.getElementById('ms-debt-del').addEventListener('click',()=>{
    if(!msSelectedDebt.size){showToast('لم تحدد شيئاً','warn');return;}
    openConfirm({icon:'💳',title:`حذف ${msSelectedDebt.size} دَيْن؟`,warn:'مالك دخل؟ 😄 تأكد قبل الحذف.',body:'',confirmLabel:'مالك دخل، امسحها',confirmClass:'btn btn-err',fn:()=>{
      const idxs=[...msSelectedDebt].sort((a,b)=>b-a);
      idxs.forEach(i=>debts.splice(i,1));save('pt_debts',debts);
      msDebtMode=false;msSelectedDebt=new Set();renderDebts();showToast('تم الحذف','err');
    }});
    setTimeout(()=>{const c=document.getElementById('cm-cancel');if(c)c.textContent='بخليها 🙂';},10);
  });

  // multi-select entries
  document.getElementById('ms-entries-cancel').addEventListener('click',()=>{msEntriesMode=false;msSelectedEntries=new Set();renderEntries();});
  document.getElementById('ms-entries-del').addEventListener('click',()=>{
    if(!msSelectedEntries.size){showToast('لم تحدد شيئاً','warn');return;}
    openConfirm({icon:'🗑',title:`حذف ${msSelectedEntries.size} دفعة؟`,warn:'⚠️ لا يمكن التراجع.',body:'',confirmLabel:'حذف الكل',fn:()=>{
      entries=entries.filter(e=>!msSelectedEntries.has(e.id));save('pt_entries',entries);
      msEntriesMode=false;msSelectedEntries=new Set();renderEntries();showToast('تم الحذف','err');
    }});
  });

  // multi-select cats
  document.getElementById('btn-cats-multisel').addEventListener('click',()=>{msCatsMode=!msCatsMode;msSelectedCats=new Set();renderCatsPage();});
  document.getElementById('ms-cats-cancel').addEventListener('click',()=>{msCatsMode=false;msSelectedCats=new Set();renderCatsPage();});
  document.getElementById('ms-cats-del').addEventListener('click',()=>{
    if(!msSelectedCats.size){showToast('لم تحدد شيئاً','warn');return;}
    openConfirm({icon:'🏷',title:`حذف ${msSelectedCats.size} تصنيف؟`,warn:'⚠️ الدفعات المسجّلة لن تتأثر.',body:'',confirmLabel:'حذف الكل',fn:()=>{
      const idxs=[...msSelectedCats].sort((a,b)=>b-a);
      idxs.forEach(i=>cats.splice(i,1));save('pt_cats',cats);
      msCatsMode=false;msSelectedCats=new Set();renderCatsPage();renderCatSelects();renderPills();renderEntries();showToast('تم الحذف','err');
    }});
  });

  // monthly — add new category inline
  // REMOVED:   document.getElementById('btn-mon-new-cat').addEventListener('click',()=>{
  // REMOVED:     const row=document.getElementById('mon-new-cat-row');
  // REMOVED:     row.style.display=row.style.display==='none'?'flex':'none';
  // REMOVED:   // REMOVED:     if(row.style.display==='flex') document.getElementById('mon-new-cat-inp').focus();
  // REMOVED orphan });
  // REMOVED: const saveMonCat=()=>{
  // REMOVED: // REMOVED:     const el=document.getElementById('mon-new-cat-inp');
  // REMOVED: const val=el.value.trim(); if(!val) return;
  // REMOVED: cats.push(val); save('pt_cats',cats);
  // REMOVED: renderCatSelects(); renderPills(); renderCatsPage();
  // REMOVED: document.getElementById('mon-cat').value=val;
  // REMOVED: el.value=''; document.getElementById('mon-new-cat-row').style.display='none';
  // REMOVED: showToast('تم إضافة التصنيف ✓');
  // REMOVED: };
  // REMOVED:   document.getElementById('btn-mon-save-cat').addEventListener('click',saveMonCat);
  // REMOVED:   document.getElementById('mon-new-cat-inp').addEventListener('keydown',e=>{if(e.key==='Enter')saveMonCat();});

  // add entry
  document.getElementById('btn-add').addEventListener('click',function(){addEntry(false);});
  document.getElementById('btn-add-income').addEventListener('click',function(){addEntry(true);});
  // interactive amount input
  document.getElementById('inp-amt').addEventListener('input',function(){
    var w=toW(this.value); if(w!==this.value){var p=this.selectionStart;this.value=w;try{this.setSelectionRange(p,p);}catch(e){}}
    var wrap=this.closest('.amt-wrap');
    this.classList.toggle('has-value',!!w&&w!=='0');
    wrap.classList.remove('popped');
    if(w) requestAnimationFrame(()=>wrap.classList.add('popped'));
    // resize font based on length
    var len=w.length||1;
    this.style.fontSize=len>8?'22px':len>5?'26px':'32px';
  });
  // show hint when amount is filled and desc is empty
  document.getElementById('inp-amt').addEventListener('blur',()=>{
    const hint=document.getElementById('desc-hint');
    const desc=document.getElementById('inp-desc').value.trim();
    const amt=document.getElementById('inp-amt').value.trim();
    hint.style.opacity=(amt&&!desc)?'1':'0';
  });
  document.getElementById('inp-desc').addEventListener('focus',()=>{document.getElementById('desc-hint').style.opacity='0';});
  document.getElementById('inp-amt').addEventListener('keydown',e=>{if(e.key==='Enter')addEntry(false);});
  document.getElementById('inp-desc').addEventListener('keydown',e=>{if(e.key==='Enter')addEntry(false);});

  // arabic numerals
  ['set-highlight','bm-weekly','bm-daily','bm-monthly','edit-amt'].forEach(id=>{
    const el=document.getElementById(id); if(!el) return;
    el.addEventListener('input',function(){
      const w=toW(this.value); if(w!==this.value){const p=this.selectionStart;this.value=w;try{this.setSelectionRange(p,p);}catch(e){}}
      if(id==='set-highlight'){settings.highlightOver=+w||500;save('pt_settings',settings);document.getElementById('highlight-sub').textContent=`${settings.highlightOver} ${settings.currency}`;}
    });
  });

  // add monthly
  // REMOVED:   document.getElementById('btn-add-mon').addEventListener('click',()=>{
  // REMOVED:     const nameEl=document.getElementById('mon-name'), amtEl=document.getElementById('mon-amt'), catEl=document.getElementById('mon-cat');
  // REMOVED: const name=nameEl.value.trim(), amt=parseFloat(toW(amtEl.value));
  // REMOVED: if(!name||!amt||isNaN(amt)||amt<=0){showToast('أدخل اسماً ومبلغاً','err');return;}
  // REMOVED: monthly.unshift({id:Date.now(),name,amount:amt,category:catEl.value||'غير مصنف',active:true,excludeFromTotal:true});
  // REMOVED: save('pt_monthly',monthly); nameEl.value='';amtEl.value='';catEl.value='';
  // REMOVED: renderMonthly(); showToast('تمت الإضافة ✓');
  // REMOVED: });
  // REMOVED: document.getElementById('mon-name').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('btn-add-mon').click();});
  // REMOVED: document.getElementById('mon-amt').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('btn-add-mon').click();});

  // add cat
  document.getElementById('btn-add-cat').addEventListener('click',()=>{
    const el=document.getElementById('inp-new-cat'), val=el.value.trim(); if(!val)return;
    const desc=document.getElementById('inp-new-cat-desc').value.trim();
    cats.push(val); if(!catDescs) catDescs={};
    if(desc) catDescs[val]=desc; save('pt_cats',cats); save('pt_catdescs',catDescs);
    el.value=''; document.getElementById('inp-new-cat-desc').value='';
    renderCatsPage(); renderCatSelects(); renderPills(); showToast('تم إضافة التصنيف');
  });
  document.getElementById('inp-new-cat').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('btn-add-cat').click();});

  // save template button (cats page)
  document.getElementById('btn-save-template').addEventListener('click',()=>{
    document.getElementById('tpl-name-inp').value='';
    document.getElementById('tpl-modal').classList.add('open');
  });
  document.getElementById('tpl-cancel').addEventListener('click',()=>document.getElementById('tpl-modal').classList.remove('open'));
  document.getElementById('tpl-save').addEventListener('click',()=>{
    const name=document.getElementById('tpl-name-inp').value.trim();
    if(!name){showToast('اكتب اسماً للـ template','err');return;}
    templates[name]=[...cats]; save('pt_templates',templates);
    document.getElementById('tpl-modal').classList.remove('open');
    showToast(`تم حفظ template "${name}" ✓`);
    renderTemplatesList();
  });

  // budget modal
  document.getElementById('bm-cancel').addEventListener('click',()=>document.getElementById('budget-modal').classList.remove('open'));
  document.getElementById('bm-save').addEventListener('click',()=>{
    if(budgetCatIdx===null) return;
    const cat=cats[budgetCatIdx];
    const w=parseFloat(toW(document.getElementById('bm-weekly').value));
    const d=parseFloat(toW(document.getElementById('bm-daily').value));
    const m=parseFloat(toW(document.getElementById('bm-monthly').value));
    const obj={};
    if(!isNaN(w)&&w>0) obj.weekly=w;
    if(!isNaN(d)&&d>0) obj.daily=d;
    if(!isNaN(m)&&m>0) obj.monthly=m;
    if(Object.keys(obj).length) catBudgets[cat]=obj; else delete catBudgets[cat];
    save('pt_budgets',catBudgets);
    document.getElementById('budget-modal').classList.remove('open');
    renderCatsPage(); showToast('تم حفظ الميزانية ✓');
  });

  // toggles
  mkToggle('dark','darkMode',v=>{applyDark(v);});
  mkToggle('confirm','confirmDelete');
  mkToggle('emoji','showEmoji',()=>{renderEntries();renderCatsPage();renderCatSelects();renderMonthly();});
  mkToggle('compact','compactMode',()=>renderEntries());
  mkToggle('running','showRunningTotal',()=>renderEntries());
  mkToggle('colorcat','colorCat',()=>renderEntries());
  mkToggle('hidetime','hideTime',()=>renderEntries());
  mkToggle('charts','showCharts');
  mkToggle('budgetwarn','budgetWarn');
  mkToggle('includeextra','includeExtra',()=>renderSalary());
  // monthly-in-total toggle removed (subscriptions removed)

  document.getElementById('set-currency').addEventListener('change',function(){settings.currency=this.value;save('pt_settings',settings);renderEntries();renderMonthly();applySettings();});
  document.getElementById('set-sort').addEventListener('change',function(){settings.sortBy=this.value;save('pt_settings',settings);renderEntries();});
  document.getElementById('set-proj-name').addEventListener('input',function(){settings.projectName=this.value;save('pt_settings',settings);document.getElementById('logo').textContent=this.value||'وين فلوسي تروح';});
  document.getElementById('set-week-mode').addEventListener('change',function(){settings.weekMode=this.value;save('pt_settings',settings);renderEntries();});
  document.getElementById('set-uisize').addEventListener('change',function(){settings.uiSize=this.value;save('pt_settings',settings);applyUiSize(this.value);});
  document.getElementById('set-tracker-total').addEventListener('change',function(){settings.trackerTotal=this.value;save('pt_settings',settings);renderEntries();});
  document.getElementById('set-reset-hour').addEventListener('change',function(){settings.resetHour=Number(this.value);save('pt_settings',settings);renderEntries();});
  document.getElementById('set-nav-pos').addEventListener('change',function(){settings.navPos=this.value;save('pt_settings',settings);applyNavPos(this.value);});

  // bottom nav buttons (same as top nav)
  function switchPage(pageId){
    document.querySelectorAll('.nav-tab').forEach(t=>t.classList.toggle('active',t.dataset.page===pageId));
    document.querySelectorAll('.bnav-btn').forEach(t=>t.classList.toggle('active',t.dataset.page===pageId));
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.getElementById('page-'+pageId).classList.add('active');
    if(pageId==='dashboard') renderDashboard();
    if(pageId==='monthly') renderMonthly();
    if(pageId==='cats') renderCatsPage();
  }
  document.querySelectorAll('.bnav-btn').forEach(btn=>{
    btn.addEventListener('click',()=>switchPage(btn.dataset.page));
  });

  document.getElementById('edit-cancel').addEventListener('click',()=>{document.getElementById('edit-modal').classList.remove('open');editEntryId=null;});
  document.getElementById('edit-save').addEventListener('click',()=>{
    if(!editEntryId) return;
    const amt=parseFloat(toW(document.getElementById('edit-amt').value));
    if(!amt||isNaN(amt)||amt<=0){showToast('أدخل مبلغاً صحيحاً','err');return;}
    const desc=document.getElementById('edit-desc').value.trim()||'—';
    const cat=document.getElementById('edit-cat').value;
    entries=entries.map(e=>e.id===editEntryId?{...e,amount:amt,description:desc,category:cat}:e);
    save('pt_entries',entries);
    document.getElementById('edit-modal').classList.remove('open');
    editEntryId=null;
    renderEntries(); showToast('تم التعديل ✓');
  });

  document.getElementById('btn-guide').addEventListener('click',()=>document.getElementById('guide-modal').classList.add('open'));
  document.getElementById('guide-close').addEventListener('click',()=>document.getElementById('guide-modal').classList.remove('open'));

  document.getElementById('btn-export').addEventListener('click',exportXLSX);
  // ── CLOUD SYNC BUTTONS ──
  var _cbin=localStorage.getItem('_cbin')||'';
  var _ckey=localStorage.getItem('_ckey')||'';
  if(document.getElementById('cloud-bin-id')) document.getElementById('cloud-bin-id').value=_cbin;
  if(document.getElementById('cloud-api-key')) document.getElementById('cloud-api-key').value=_ckey;
  if(document.getElementById('cloud-status')&&_cbin) document.getElementById('cloud-status').textContent='☁️ مفعّل';
  if(document.getElementById('btn-cloud-save-cfg')) document.getElementById('btn-cloud-save-cfg').addEventListener('click',function(){
    var bid=(document.getElementById('cloud-bin-id').value||'').trim();
    var bkey=(document.getElementById('cloud-api-key').value||'').trim();
    if(!bid||!bkey){showToast('أدخل BIN ID و Access Key','err');return;}
    localStorage.setItem('_cbin',bid);localStorage.setItem('_ckey',bkey);
    document.getElementById('cloud-status').textContent='☁️ مفعّل — يحفظ تلقائياً';
    document.getElementById('cloud-status').style.color='#22c55e';
    _cloudSave(); showToast('تم إعداد الحفظ السحابي ✓');
  });
  if(document.getElementById('btn-cloud-sync-now')) document.getElementById('btn-cloud-sync-now').addEventListener('click',function(){
    document.getElementById('cloud-status').textContent='جاري المزامنة...';
    _cloudLoad(function(ok){
      if(ok){
        entries=load('pt_entries',[]);cats=load('pt_cats',[...DEFAULT_CATS]);
        catBudgets=load('pt_budgets',{});debts=load('pt_debts',[]);
        salary=load('pt_salary',{amount:0,month:''});
        renderEntries();renderDebts();renderSalary();
        document.getElementById('cloud-status').textContent='✓ تمت المزامنة';
        document.getElementById('cloud-status').style.color='#22c55e';
        showToast('تمت المزامنة ✓');
      }else{
        document.getElementById('cloud-status').textContent='⚠️ فشلت — تحقق من الإعدادات';
        document.getElementById('cloud-status').style.color='var(--err)';
      }
    });
  });

  // clear all
  // ── مسح الدفعات فقط
  document.getElementById('btn-clear-entries').addEventListener('click',()=>{
    openConfirm({icon:'🗑',title:'مسح الدفعات فقط؟',warn:'⚠️ ستُحذف جميع الدفعات المسجّلة والفلوس الإضافية. التصنيفات تبقى.',body:'تأكد من التصدير أولاً.',confirmLabel:'امسح الدفعات',confirmClass:'btn btn-err',fn:()=>{
      entries=[];salary={amount:0,month:''};
      save('pt_entries',entries);save('pt_salary',salary);
      renderEntries();renderSalary();showToast('تم المسح','err');
    }});
  });

  // ── مسح كل البيانات
  document.getElementById('btn-clear-all').addEventListener('click',()=>{
    openConfirm({icon:'🗑',title:'مسح كل البيانات؟',warn:'⚠️ يحذف الدفعات + الديون + الراتب + الفلوس الإضافية + الميزانيات. التصنيفات تبقى.',body:'تأكد من تصدير Excel أولاً.',confirmLabel:'امسح كل البيانات',confirmClass:'btn btn-err',fn:()=>{
      entries=[];debts=[];catBudgets={};salary={amount:0,month:''};
    // REMOVED(extraIncome): save('pt_entries',entries);save('pt_debts',debts);save('pt_budgets',catBudgets);save('pt_salary',salary);save('pt_extra',extraIncome);
      renderEntries();renderDebts();renderSalary();
      showToast('تم مسح البيانات','err');
    }});
  });

  // ── إعادة البرنامج بشكل كامل (تأكيد مزدوج)
  document.getElementById('btn-full-reset').addEventListener('click',()=>{
    openConfirm({
      icon:'🔄',title:'إعادة البرنامج بشكل كامل؟',
      warn:'⚠️ هذا يحذف كل شيء حرفياً — دفعات، اشتراكات، ديون، راتب، تصنيفات، ميزانيات، templates، وكل الإعدادات.',
      body:'ما في رجعة. تأكد من تصدير Excel إذا تبي تحفظ بياناتك.',
      confirmLabel:'نعم، امسح كل شيء',
      confirmClass:'btn btn-err',
      fn:()=>{
        // second confirmation
        openConfirm({
          icon:'⚠️',title:'تأكيد نهائي — هل أنت متأكد تماماً؟',
          warn:'آخر فرصة! كل بياناتك ستُحذف نهائياً بدون رجعة.',
          body:'',
          confirmLabel:'نعم، أعد ضبط كل شيء',
          confirmClass:'btn btn-err',
          fn:()=>{
            // Clear ALL localStorage keys
            ['pt_entries','pt_cats','pt_budgets','pt_monthly','pt_monthly_desc','pt_templates','pt_settings','pt_debts','pt_salary','pt_lang','pt_catdescs'].forEach(function(k){deleteKey(k);});
            // Reload the page to reset everything to defaults
            location.reload();
          }
        });
      }
    });
  });

  // reset cats
  document.getElementById('btn-reset-cats').addEventListener('click',()=>{
    const tplKeys=Object.keys(templates);
    openConfirm({icon:'🏷',title:'إعادة تعيين التصنيفات؟',warn:'⚠️ ستُستبدل تصنيفاتك الحالية. الدفعات لن تتأثر.',body:tplKeys.length?`لديك ${tplKeys.length} template محفوظ. استخدم زر التحميل في الإعدادات لاختيار أحدها.`:'سيتم تحميل التصنيفات الافتراضية.',confirmLabel:'إعادة تعيين',fn:()=>{
      cats=[...DEFAULT_CATS]; save('pt_cats',cats);
      renderCatsPage();renderCatSelects();renderPills();
      showToast('تمت إعادة التعيين');
    }});
  });

  // confirm modal
  document.getElementById('cm-cancel').addEventListener('click',()=>{document.getElementById('confirm-modal').classList.remove('open');pendingAction=null;document.getElementById('cm-cancel').textContent='إلغاء';});
  document.getElementById('cm-confirm').addEventListener('click',()=>{if(pendingAction){pendingAction();pendingAction=null;}document.getElementById('confirm-modal').classList.remove('open');document.getElementById('cm-cancel').textContent='إلغاء';});

  // dashboard
  document.getElementById('dash-from').addEventListener('change',()=>renderDashboard());
  document.getElementById('dash-to').addEventListener('change',()=>renderDashboard());
  const sl=document.getElementById('detail-slider');
  const dlabels=['مختصر','متوسط','تفصيلي','كامل'];
  // slider is RTL: visual right=0(مختصر) left=3(كامل) → invert: detailLevel = 3 - sliderVal
  sl.addEventListener('input',function(){
    detailLevel=3-Number(this.value);
    document.getElementById('detail-label').textContent=dlabels[detailLevel];
    renderDashboard();
  });
  // set initial slider position to match default detailLevel=1 (متوسط) → sliderVal=2
  sl.value=String(3-detailLevel);

  // ── DEBTS ──
  document.getElementById('btn-add-debt').addEventListener('click',()=>{
    const nameEl=document.getElementById('debt-name');
    const amtEl=document.getElementById('debt-amt');
    const amt=parseFloat(toW(amtEl.value));
    const name=nameEl.value.trim();
    if(!name||!amt||isNaN(amt)||amt<=0){showToast('أدخل اسم الدَّيْن والمبلغ','err');return;}
    debts.unshift({id:Date.now(),name,amount:amt,paid:false});
    save('pt_debts',debts); amtEl.value=''; nameEl.value='';
    renderDebts(); showToast('تم تسجيل الدَّيْن');
  });
  document.getElementById('debt-amt').addEventListener('input',function(){var w=toW(this.value);if(w!==this.value){var p=this.selectionStart;this.value=w;try{this.setSelectionRange(p,p);}catch(e){}}});
  document.getElementById('debt-name').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('btn-add-debt').click();});

  // ── SALARY ──
  document.getElementById('salary-inp').addEventListener('input',function(){var w=toW(this.value);if(w!==this.value){var p=this.selectionStart;this.value=w;try{this.setSelectionRange(p,p);}catch(e){}}});
  document.getElementById('btn-save-salary').addEventListener('click',()=>{
    const amt=parseFloat(toW(document.getElementById('salary-inp').value));
    if(!amt||isNaN(amt)||amt<=0){showToast('أدخل مبلغ الراتب','err');return;}
    salary={amount:amt,month:isoDate(new Date()).slice(0,7)};
    save('pt_salary',salary);
    document.getElementById('salary-edit-form').style.display='none';
    document.getElementById('salary-inp').value='';
    renderSalary(); showToast('تم حفظ الراتب ✓');
  });
  document.getElementById('btn-clear-salary').addEventListener('click',()=>{
    salary={amount:0,month:''};save('pt_salary',salary);
    document.getElementById('salary-edit-form').style.display='none';
    renderSalary(); showToast('تم مسح الراتب');
  });

  // extra income now handled by addEntry(true) via 'وصلني' button

  applySettings();
  renderCatSelects();
  renderPills();
  renderEntries();
  renderDebts();
  renderSalary();
}
// Sync from IndexedDB first (in case localStorage was cleared by iOS)
_syncFromIDB(function(restored){
  if(restored){
    // Reload state variables from localStorage after sync
    entries=load('pt_entries',[]);
    cats=load('pt_cats',[...DEFAULT_CATS]);
    catBudgets=load('pt_budgets',{});
    settings=load('pt_settings',settings); // merge with defaults
    debts=load('pt_debts',[]);
    salary=load('pt_salary',{amount:0,month:''});
    templates=load('pt_templates',{});
    catDescs=load('pt_catdescs',{});
  }
  init();
});