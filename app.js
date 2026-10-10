const APP_VERSION="0.13.5",STORAGE_KEY="adaptive_phrasal_verbs_v1",READ_FIRST_KEY="adaptive_phrasal_read_first_v1",SESSION_SIZE=15,TIME_LIMIT=15,PRETHINK_SECONDS=4;
const BANK=window.PHRASAL_BANK||[],BY_ID=Object.fromEntries(BANK.map(x=>[x.id,x])),PERSONAL_PRIORITY=new Set(["split_up"]);
const MODES=["context","meaning","contrast","particle","paraphrase","precision"];
const AVS_RANKS=window.ADRIAN_VISUAL_SYSTEM?.ranks||[];
const COLOR_BANDS_15=AVS_RANKS.length?AVS_RANKS.map(x=>x.color):["#422522","#512927","#632D2A","#762F32","#843729","#904311","#90570C","#8B6B05","#798136","#57965A","#32A48F","#4AA7C8","#7AA5EC","#BB9EF0","#E7BF57"];
const AVS_TEXT_BANDS_15=AVS_RANKS.length?AVS_RANKS.map(x=>x.text||x.color):COLOR_BANDS_15;
const TRANSFORMS={
bring_up:"She MENTIONED the issue.",call_off:"They CANCELLED the match.",carry_out:"They PERFORMED the test.",catch_up_with:"He REACHED the others.",come_across:"I FOUND it by chance.",
come_up_with:"We INVENTED a solution.",end_up:"We FINALLY got lost.",find_out:"I DISCOVERED the truth.",get_by:"He MANAGES on little money.",get_over:"She RECOVERED from flu.",
get_rid_of:"We REMOVED the old files.",give_in:"He STOPPED RESISTING.",give_up:"She STOPPED smoking.",hand_in:"SUBMIT your work.",keep_up_with:"I can't MATCH their pace.",
look_into:"They INVESTIGATED the complaint.",put_off:"They POSTPONED the meeting.",put_up_with:"I can't TOLERATE this noise.",run_out_of:"We HAVE NO milk left.",set_up:"She ESTABLISHED a business.",
stick_to:"FOLLOW the plan.",take_over:"She ASSUMED CONTROL.",take_part_in:"He PARTICIPATED in the survey.",take_up:"She STARTED yoga.",turn_out:"It PROVED easy.",work_out:"We SOLVED the problem."
};
const PRECISION_BANK={
turn_off:{text:"The room is empty now, so please ___ the lights before you leave.",d:["turn_on","turn_down","put_out"]},
turn_down:{text:"The music is too loud; please ___ it a little.",d:["turn_off","turn_up","turn_on"]},
turn_on:{text:"It's freezing in here. Can you ___ the heater?",d:["turn_off","turn_down","put_on"]},
put_out:{text:"The candle is still burning; please ___ it before bed.",d:["turn_off","put_away","put_down"]},
call_off:{text:"The pitch is flooded, so the organisers have decided to ___ the match.",d:["put_off","set_off","carry_on"]},
put_off:{text:"We can't meet today, so let's ___ the meeting until Friday.",d:["call_off","set_up","carry_out"]},
carry_out:{text:"Before launch, the lab must ___ three safety tests.",d:["carry_on","work_out","set_up"]},
hand_in:{text:"Your essay is due at noon; remember to ___ it before the deadline.",d:["fill_in","bring_in","take_part_in"]},
look_into:{text:"The police promised to ___ the allegation and establish what happened.",d:["look_over","look_up","look_around"]},
look_after:{text:"Can you ___ my dog while I'm away this weekend?",d:["look_for","look_over","look_around"]},
run_out_of:{text:"Take extra bottles; we might ___ water during the hike.",d:["do_without","cut_down_on","get_rid_of"]},
give_up:{text:"Her doctor advised her to ___ smoking completely, not just reduce it.",d:["cut_down_on","carry_on","give_in"]},
get_over:{text:"It took her several weeks to ___ the flu completely.",d:["come_down_with","get_through","get_by"]},
come_down_with:{text:"I've started coughing and sneezing; I think I'm going to ___ a cold.",d:["get_over","get_through","run_out_of"]},
get_off:{text:"This is our stop; we need to ___ the bus here.",d:["get_on","get_out","pull_over"]},
get_on:{text:"The bus is here; let's ___ before it leaves.",d:["get_off","get_out","set_off"]},
check_in:{text:"Our flight leaves at six, so we need to ___ at the airport by four.",d:["log_in","get_on","set_off"]},
log_in:{text:"Enter your username and password to ___ to your account.",d:["check_in","log_out","sign_up_for"]},
log_out:{text:"This is a shared computer; remember to ___ of your account when you finish.",d:["log_in","check_out","turn_off"]},
take_off:{text:"The plane is scheduled to ___ at 7:15.",d:["get_off","set_off","take_over"]},
take_over:{text:"The current manager retires on Friday, and Maya will ___ on Monday.",d:["take_on","carry_on","set_up"]},
bring_up:{text:"I don't want to discuss money tonight, so please don't ___ the subject.",d:["point_out","go_over","look_into"]},
point_out:{text:"The reviewer used a red pen to ___ the exact factual error in the report.",d:["bring_up","look_over","look_into"]},
keep_up_with:{text:"The lecturer is speaking too fast; I can't ___ him.",d:["catch_up_with","get_on_with","carry_on"]},
put_up_with:{text:"The neighbours play loud music every night; I can't ___ the noise any longer.",d:["put_off","put_out","get_over"]},
break_into:{text:"Someone tried to ___ the house through a locked window.",d:["break_in","break_out","get_out"]},
hold_on:{text:"I'm checking your booking now; please ___ for a moment.",d:["carry_on","go_on","keep_on"]},
speak_up:{text:"We can't hear you at the back; please ___ a little.",d:["hold_on","calm_down","carry_on"]},
cut_down_on:{text:"My doctor says I should ___ sugar rather than stop eating it completely.",d:["give_up","do_without","run_out_of"]},
work_on:{text:"My pronunciation is weak, so I need to ___ it every day.",d:["work_out","go_over","carry_on"]}
};
const PRECISION_IDS=new Set(Object.keys(PRECISION_BANK));
let state=loadState(),sessionStarting=false,session=null,current=null,timerHandle=null,deadline=0,locked=false,questionPhase="answer",audioCtx=null,soundOn=true,lastTickShown=TIME_LIMIT+1,lastUrgentBeat=-1,flashQueue=[],flashIndex=0,flashRevealed=false;
const $=id=>document.getElementById(id),clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
function readFirstEnabled(){try{return localStorage.getItem(READ_FIRST_KEY)!=="0";}catch(e){return true;}}
function renderReadFirstToggle(){const b=$("readFirstToggle"),n=$("readFirstNote");if(!b)return;const on=readFirstEnabled();b.setAttribute("aria-pressed",String(on));b.textContent=on?"MODO · LEER PRIMERO · SÍ":"MODO · TODO JUNTO · NORMAL";if(n)n.textContent=on?"Primero lees el enunciado; los 15 s empiezan cuando aparecen las respuestas.":"Pregunta y respuestas aparecen a la vez; los 15 s empiezan inmediatamente.";}
function setReadFirstEnabled(on){try{localStorage.setItem(READ_FIRST_KEY,on?"1":"0");}catch(e){}renderReadFirstToggle();}
function shuffledAnswerColorClasses(){
  const a=["option-c1","option-c2","option-c3","option-c4"],tones=["option-tone-1","option-tone-2","option-tone-3"];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a.map(c=>c+" "+tones[Math.floor(Math.random()*tones.length)]);
}
function blankMode(){return{attempts:0,correct:0};}
function blankItem(){return{attempts:0,correct:0,totalTime:0,avgTime:0,streak:0,bestStreak:0,lastSeen:0,misses:0,automatic:0,masteredRewarded:false,modes:Object.fromEntries(MODES.map(m=>[m,blankMode()]))};}
function freshState(){return{version:3,level:1,difficulty:1,sessions:0,answers:0,correct:0,studySec:0,items:{},confusions:{},history:[],answerHistory:[]};}
function normalizeItem(raw={}){const seed=blankItem(),m=Object.assign(seed,raw&&typeof raw==="object"&&!Array.isArray(raw)?raw:{});for(const key of ["attempts","correct","totalTime","avgTime","streak","bestStreak","lastSeen","misses","automatic"])m[key]=Math.max(0,Number(m[key])||0);m.modes=m.modes&&typeof m.modes==="object"&&!Array.isArray(m.modes)?m.modes:{};for(const mode of MODES)m.modes[mode]=Object.assign(blankMode(),m.modes[mode]||{});m.automatic=Number(m.automatic)||0;return m;}
function loadState(){try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")||freshState(),sessions=Math.max(0,Number(raw.sessions)||0),legacyDifficulty=Math.max(1,Math.min(15,Number(raw.difficulty??raw.level)||1)),s=Object.assign(freshState(),raw);const validRow=r=>r!==null&&typeof r==="object"&&!Array.isArray(r),repair=[s.history,s.answerHistory].some(rows=>Array.isArray(rows)&&rows.some(r=>!validRow(r)));if(repair){try{localStorage.setItem(STORAGE_KEY+"_recovery_"+Date.now(),JSON.stringify(raw));}catch(e){console.warn("Recovery backup unavailable",e);}}s.version=3;s.sessions=sessions;s.difficulty=legacyDifficulty;s.level=Number(raw.version)>=3?Math.max(1,Number(raw.level)||sessions+1):sessions+1;s.studySec=Number(s.studySec)||0;s.answerHistory=Array.isArray(s.answerHistory)?s.answerHistory.filter(validRow):[];s.history=Array.isArray(s.history)?s.history.filter(validRow):[];s.confusions=s.confusions&&typeof s.confusions==="object"&&!Array.isArray(s.confusions)?s.confusions:{};s.items=s.items&&typeof s.items==="object"&&!Array.isArray(s.items)?s.items:{};for(const x of BANK)s.items[x.id]=normalizeItem(s.items[x.id]);if(repair){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(s));}catch(e){console.warn("Repaired progress could not be saved",e);}}return s;}catch(e){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)localStorage.setItem(STORAGE_KEY+"_recovery_"+Date.now(),raw);}catch(_){}const s=freshState();for(const x of BANK)s.items[x.id]=blankItem();return s;}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function stats(x){return state.items[x.id]||(state.items[x.id]=blankItem());}
function modeBreadth(x){const m=stats(x);return MODES.filter(k=>m.modes[k]?.attempts>0).length;}
function mastery(x){const m=stats(x);if(!m.attempts)return 0;const acc=m.correct/m.attempts,exp=Math.min(1,m.attempts/10),speed=clamp((TIME_LIMIT-m.avgTime)/TIME_LIMIT,0,1),streak=Math.min(1,m.streak/4),breadth=Math.min(1,modeBreadth(x)/4);return Math.round((acc*.45+exp*.15+speed*.10+streak*.10+breadth*.20)*100);}
function mastered(x){const m=stats(x);return m.attempts>=6&&modeBreadth(x)>=3&&mastery(x)>=75;}
function globalMastery(){return BANK.length?Math.round(BANK.reduce((n,x)=>n+mastery(x),0)/BANK.length):0;}
function coverage(){return BANK.length?Math.round(BANK.filter(x=>stats(x).attempts>0).length/BANK.length*100):0;}
function recentAnswers(n=60){return state.answerHistory.slice(-n);}
function recentAccuracy(){const h=recentAnswers();return h.length?Math.round(h.filter(x=>x.ok).length/h.length*100):null;}
function allAccuracy(){return state.answers?Math.round(state.correct/state.answers*100):null;}
function automaticPct(){const h=recentAnswers();return h.length?Math.round(h.filter(x=>x.ok&&x.time<=4).length/h.length*100):0;}
function avgResponse(){const h=recentAnswers();return h.length?h.reduce((n,x)=>n+x.time,0)/h.length:null;}
function avgHits(){if(!state.sessions)return null;const h=state.history.slice(-20);return h.length?(h.reduce((n,x)=>n+x.score,0)/h.length):null;}
function rating(){const a=recentAccuracy()??allAccuracy()??0;return Math.round(globalMastery()*.55+a*.30+automaticPct()*.15);}
function focusItems(limit=5){const seen=BANK.filter(x=>stats(x).attempts).sort((a,b)=>mastery(a)-mastery(b)||stats(b).misses-stats(a).misses);const unseen=BANK.filter(x=>!stats(x).attempts);return [...seen,...unseen].slice(0,limit);}
function fmtTime(s){s=Math.round(s||0);if(s<60)return s+"s";const m=Math.floor(s/60),r=s%60;return m+"m "+r+"s";}
function hexRgb(hex){const h=hex.replace("#","");return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)].join(",");}
function valueLevel(v){return Math.max(1,Math.min(15,Math.ceil(clamp(Number(v)||0,0,1)*15)));}
function valueColor(v){return COLOR_BANDS_15[valueLevel(v)-1];}
function valueTextColor(v){return AVS_TEXT_BANDS_15[valueLevel(v)-1];}
function paintText(id,v){const el=$(id);if(el)el.style.color=valueTextColor(v);}
function paintFill(id,v){const el=$(id);if(el)el.style.background=valueColor(v);}
function paintScore(id,score,max=15){const el=$(id);if(el)el.style.color=valueTextColor(clamp((Number(score)||0)/Math.max(1,Number(max)||15),0,1));}
function applyTheme(){const ranks=window.ADRIAN_VISUAL_SYSTEM?.ranks||[];if(!ranks.length)return;const i=clamp(Math.ceil((Math.max(1,rating())/100)*15),1,15)-1,rank=ranks[i];document.documentElement.style.setProperty("--ai-color",rank.color);document.documentElement.style.setProperty("--ai-rgb",hexRgb(rank.color));document.documentElement.style.setProperty("--ambient-rank-color",rank.color);}
function showScreen(id){for(const x of ["startScreen","statsScreen","flashScreen","gameScreen","endScreen","errorsScreen"])$(x).classList.toggle("hidden",x!==id);window.scrollTo(0,0);}
function localDayKey(ts=Date.now()){const d=new Date(ts),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return y+"-"+m+"-"+day;}
function focusPlan(){return{minimum:8,recommended:12,stretch:18};}
function focusWeekData(){const now=new Date(),dow=(now.getDay()+6)%7,monday=new Date(now.getFullYear(),now.getMonth(),now.getDate()-dow),labels=["L","M","X","J","V","S","D"],map={};for(const x of state.answerHistory||[]){const k=localDayKey(x.at||0);map[k]=(map[k]||0)+(Number(x.time)||0)+(Number(x.prethink)||0);}return labels.map((label,i)=>{const d=new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+i),key=localDayKey(d.getTime()),future=d>now;return{label,key,today:key===localDayKey(),future,sec:map[key]||0};});}
function focusStatus(mins,t){if(mins>=t.stretch)return"stretch reached";if(mins>=t.recommended)return"recommended met";if(mins>=t.minimum)return"minimum reached";return Math.max(0,Math.ceil(t.minimum-mins))+"m to minimum";}
function focusPanelHtml(items){const t=focusPlan(),days=focusWeekData(),todaySec=days.find(x=>x.today)?.sec||0,todayMin=todaySec/60,totalSec=Number(state.studySec)||0,weekSec=days.reduce((n,x)=>n+x.sec,0),maxMin=Math.max(t.stretch,...days.map(x=>x.sec/60),1),p=Math.min(100,todayMin/t.stretch*100),minPos=t.minimum/t.stretch*100,recPos=t.recommended/t.stretch*100,weak=items?.[0],bars=days.map(d=>{const mins=d.sec/60,h=d.future?0:Math.max(d.sec?4:0,Math.min(100,mins/maxMin*100));return '<div class="focus-day '+(d.today?"today ":"")+(d.future?"future":"")+'"><div class="focus-bar-mini"><i style="height:'+h+'%"></i></div><b>'+d.label+'</b><small>'+(mins?Math.round(mins)+"m":"·")+'</small></div>';}).join("");return '<div class="focus-head"><div><span>FOCUS TIME · TODAY</span><strong>'+fmtTime(todaySec)+' <small>/ '+t.recommended+'m</small></strong></div><em>'+focusStatus(todayMin,t)+'</em></div><div class="focus-progress"><i style="width:'+p+'%"></i><b class="focus-mark min" style="left:'+minPos+'%"></b><b class="focus-mark rec" style="left:'+recPos+'%"></b></div><div class="focus-targets"><span>MIN '+t.minimum+'m</span><span>REC '+t.recommended+'m</span><span>STRETCH '+t.stretch+'m</span></div><p class="focus-why">Base '+t.recommended+'m · adaptive recycling'+(weak?" · weakest: "+weak.pv:"")+'</p><div class="focus-week"><div class="focus-week-head"><b>THIS WEEK · '+fmtTime(weekSec)+'</b><span>TOTAL FOCUS · '+fmtTime(totalSec)+'</span></div><div class="focus-week-bars">'+bars+'</div></div><small class="focus-note">Focus Time counts active practice time recorded by this app.</small>';}
function skillRows(items){return items.map(x=>{const m=mastery(x),c=valueColor(m/100),t=valueTextColor(m/100);return '<div class="skillrow"><div class="name"><span class="skill-name-text" style="color:'+t+'">'+x.pv+'</span></div><div class="track"><div class="fill mastery" style="width:'+m+'%;background:'+c+'"></div></div><div class="pct" style="color:'+t+'">'+m+'%</div></div>';}).join("");}
function ratingRank(){return state.answers?clamp(Math.ceil((rating()/100)*15),1,15):0;}
function stageLabel(rank){const names=["FOUNDATIONS","CONTROL","B2 PATTERNS","FLUENCY","AUTOMATICITY","MASTERY"];return names[Math.min(5,Math.max(0,Math.floor(((rank||1)-1)/3)))];}
function evidencePct(){return Math.min(100,Math.round((state.answers/Math.max(1,BANK.length*4))*100));}
function readinessPct(){return Math.round(.45*coverage()+.55*Math.min(100,(globalMastery()/80)*100));}
function focusTodaySec(){const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();return recentAnswers(1200).filter(x=>(x.at||0)>=start).reduce((n,x)=>n+(Number(x.time)||0)+(Number(x.prethink)||0),0);}
function renderDailyPhrasal(){const host=$("dailyKeyHost"),x=focusItems(1)[0];if(!host||!x)return;const m=mastery(x),front=x.contexts[0],back=x.contexts[0].replace("___",x.pv);host.innerHTML='<div class="daily-key-head"><div><span>PHRASAL KEY</span><b>WEAKEST CURRENT TARGET</b></div><em>'+m+'%</em></div><div class="key-marks">'+Array.from({length:25},(_,i)=>'<i class="'+(i<Math.round(m/4)?"on":"")+'"></i>').join("")+'</div><button id="dailyPhrasalCard" class="daily-key-card" type="button" aria-expanded="false"><div class="daily-key-face daily-key-front"><small>ENGLISH → ENGLISH</small><strong>'+front+'</strong><span>TAP TO REVEAL</span></div><div class="daily-key-face daily-key-back"><small>PHRASAL UNLOCKED</small><strong>'+x.pv.toUpperCase()+'</strong><b>'+x.en+'</b><span>'+back+'</span></div></button><div class="key-carousel-hint">1 TAP: FLIP · 2nd TAP: HIDE</div>';const card=$("dailyPhrasalCard");card?.addEventListener("click",async()=>{card.classList.toggle("revealed");card.setAttribute("aria-expanded",card.classList.contains("revealed")?"true":"false");try{await ensureAudio();playKeyFlip(card.classList.contains("revealed"),true);}catch(e){}});}
function playKeyFlip(revealed=true,soft=false){const notes=revealed?[[659.25,0],[987.77,.045],[1318.5,.095]]:[[987.77,0],[783.99,.045],[587.33,.09]],gain=soft?.006:.011;notes.forEach(([f,d],i)=>tone(f,i===2?.085:.055,i===2?gain:gain*.82,i===1?"triangle":"sine",d));}
function treeRand(seed=129){let t=seed>>>0;return()=>{t+=0x6D2B79F5;let x=t;x=Math.imul(x^x>>>15,x|1);x^=x+Math.imul(x^x>>>7,x|61);return((x^x>>>14)>>>0)/4294967296;};}
let TREE_PARTS_CACHE=null;
function growthTreeParts(){if(TREE_PARTS_CACHE)return TREE_PARTS_CACHE;const rnd=treeRand(20260912),branches=[],leaves=[];const grow=(x,y,len,ang,width,depth,dist)=>{const sway=(rnd()-.5)*.18,angle=ang+sway,x2=x+Math.cos(angle)*len,y2=y+Math.sin(angle)*len,bend=(rnd()-.5)*10,mx=(x+x2)/2+Math.cos(angle+Math.PI/2)*bend,my=(y+y2)/2+Math.sin(angle+Math.PI/2)*bend,score=dist+len*.58+depth*2+rnd()*2;branches.push({score,html:'<path d="M '+x.toFixed(1)+' '+y.toFixed(1)+' Q '+mx.toFixed(1)+' '+my.toFixed(1)+' '+x2.toFixed(1)+' '+y2.toFixed(1)+'" stroke-width="'+Math.max(1.25,width).toFixed(2)+'"/>'});if(depth>=4){const rot=Math.round((rnd()-.5)*90),rx=(5+rnd()*5).toFixed(1),ry=(2.8+rnd()*3).toFixed(1),green=["#607d3b","#769447","#8ca85a","#526f36"][Math.floor(rnd()*4)];leaves.push({score:score+8+rnd()*15,html:'<ellipse cx="'+(x2+(rnd()-.5)*7).toFixed(1)+'" cy="'+(y2+(rnd()-.5)*6).toFixed(1)+'" rx="'+rx+'" ry="'+ry+'" transform="rotate('+rot+' '+x2.toFixed(1)+' '+y2.toFixed(1)+')" fill="'+green+'"/>'});}if(depth>=6)return;const next=len*(.72+rnd()*.09),w=width*.72,spread=.35+rnd()*.20;grow(x2,y2,next,angle-spread,w,depth+1,dist+len);grow(x2,y2,next*(.92+rnd()*.12),angle+spread*(.88+rnd()*.22),w*.96,depth+1,dist+len);};grow(210,274,56,-Math.PI/2,12,0,0);TREE_PARTS_CACHE=[...branches.map(x=>({...x,kind:"branch"})),...leaves.map(x=>({...x,kind:"leaf"}))].sort((a,b)=>a.score-b.score||a.kind.localeCompare(b.kind)).slice(0,200);return TREE_PARTS_CACHE;}
function renderGrowthTree(){const host=$("growthTreeHost");if(!host)return;const stage=Math.min(200,Math.floor(state.level/50)),parts=growthTreeParts().slice(0,stage),branch=parts.filter(x=>x.kind==="branch").map(x=>x.html).join(""),leaf=parts.filter(x=>x.kind==="leaf").map(x=>x.html).join("");host.innerHTML='<div class="growth-tree-canvas" data-tree-stage="'+stage+'"><svg viewBox="0 0 420 300" role="img" aria-label="Practice tree, growth stage '+stage+' of 200"><defs><linearGradient id="treeTrunk" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#5d3827"/><stop offset=".55" stop-color="#76503a"/><stop offset="1" stop-color="#957258"/></linearGradient></defs><ellipse class="tree-ground" cx="210" cy="282" rx="78" ry="7"/><g class="tree-branches" fill="none" stroke="url(#treeTrunk)" stroke-linecap="round" stroke-linejoin="round">'+branch+'</g><g class="tree-leaves">'+leaf+'</g></svg></div><div class="growth-tree-count"><b>'+state.level.toLocaleString()+'</b><span>LEVEL</span></div>';}
function medalCounts(){return window.AdrianAchievements?.countsFromHistory?.(state.history||[])||{blue:0,violet:0,gold:0};}
function renderMedalSummary(latest=null){const strip=window.AdrianAchievements?.medalStripHtml?.(medalCounts(),{context:"summary"})||"",badge=latest?window.AdrianAchievements?.badgeHtml?.(latest.correct,latest.total||SESSION_SIZE,medalCounts())||"":"";if($("startMedals"))$("startMedals").innerHTML=strip;if($("endMedals"))$("endMedals").innerHTML=strip+badge;}
function aiLegendHtml(current=ratingRank()){return COLOR_BANDS_15.map((c,i)=>'<div class="ai-legend-item '+(current===i+1?'current':'')+'" style="--swatch:'+c+'"><i></i><b>'+(i+1)+'</b></div>').join("");}
function phrasalGlobalJson(){const snap=window.AdaptiveLanguageDashboard?.snapshot?.()||null;return{schema:'ADAPTIVE_PHRASAL_GLOBAL_V1',app:'adaptive-phrasal-verbs',appVersion:APP_VERSION,generatedAt:new Date().toISOString(),scale:{type:'AVS',min:1,max:15,current:ratingRank()},global:{level:state.level,sessions:state.sessions,totalAnswers:state.answers,coveragePct:coverage(),masteryPct:globalMastery(),recentAccuracyPct:recentAccuracy(),avgHits15:avgHits(),automaticPct:automaticPct(),avgResponseSec:avgResponse(),studySec:state.studySec,phrasalsMastered:BANK.filter(mastered).length,bankSize:BANK.length},skills:BANK.map(x=>({id:x.id,phrasal:x.pv,meaning:x.en,masteryPct:mastery(x),attempts:stats(x).attempts,correct:stats(x).correct,misses:stats(x).misses,modesSeen:modeBreadth(x)})).sort((a,b)=>a.masteryPct-b.masteryPct),recentLevels:(state.history||[]).slice(-30),recentErrors:(state.answerHistory||[]).filter(x=>!x.ok).slice(-40),dashboard:snap};}
async function copyPhrasalGlobalJson(sourceId='globalJsonBtn'){const text=JSON.stringify(phrasalGlobalJson(),null,2);try{await navigator.clipboard.writeText(text);}catch(e){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}const btn=$(sourceId);if(btn){const old=btn.textContent;btn.textContent='JSON COPIED';setTimeout(()=>{if(btn)btn.textContent=old;},1200);}const card=$('endAiHandoff');if(card){card.classList.add('copied');setTimeout(()=>card.classList.remove('copied'),1200);}return text;}

function renderHome(){
  applyTheme();
  renderReadFirstToggle();
  const rank=ratingRank(),stageNum=Math.min(6,Math.max(1,Math.ceil((rank||1)/3))),evidence=evidencePct(),ready=readinessPct(),today=focusTodaySec(),seen=BANK.filter(x=>stats(x).attempts).length,pairs=Object.values(state.confusions||{}).filter(n=>n>0).length,recent=recentAccuracy(),all=allAccuracy(),delta=recent!=null&&all!=null?recent-all:null,masteredN=BANK.filter(mastered).length;
  $("startKicker").textContent="CAMPAIGN 1 · STAGE "+stageNum+"/6 · "+stageLabel(rank);
  $("startLevel").textContent="LEVEL "+state.level;
  $("startAiLevel").textContent=(rank?rank:"—")+" / 15";
  $("startAiConfidence").textContent="AI Valoration · evidence "+evidence+"%";
  $("coverageText").textContent=seen.toLocaleString()+" / "+BANK.length.toLocaleString();$("coverageFill").style.width=coverage()+"%";
  $("masteryText").textContent=globalMastery()+"%";$("masteryFill").style.width=globalMastery()+"%";
  $("startRating").textContent=rating()||"—";$("startAccuracy").textContent=recent==null?"—":recent+"%";$("startAvg").textContent=avgResponse()==null?"—":avgResponse().toFixed(1)+"s";$("startAllAccuracy").textContent=avgHits()==null?"—":avgHits().toFixed(1);$("startAuto").textContent=automaticPct()+"%";$("startMastered").textContent=masteredN+"/"+BANK.length;$("startTotal").textContent=state.answers;$("startStudyTime").textContent=fmtTime(state.studySec);
  $("startFocusPanel").innerHTML=focusPanelHtml(focusItems());
  $("startPeerDelta").textContent=delta==null?"—":(delta>=0?"+":"")+delta;$("startPeerDelta").className="peer-delta "+(delta==null||Math.abs(delta)<3?"neutral":delta>0?"good":"bad");
  $("paceRecent").textContent=recent==null?"—":recent;$("paceAll").textContent=all==null?"—":all;$("paceMastery").textContent=globalMastery();$("paceCoverage").textContent=coverage();$("paceAuto").textContent=automaticPct();
  $("startPeerStatus").textContent="Today "+fmtTime(today)+" · "+(state.sessions?state.sessions+" completed levels":"building evidence")+" · English-only adaptive practice";
  $("readinessScore").textContent=ready+"%";$("readinessFill").style.width=ready+"%";$("readinessStage").textContent=ready>=85?"Exam-ready core":ready>=65?"Consolidating":ready>=40?"Building control":"Building foundation";
  $("readinessStatus").textContent="Internal readiness: coverage "+coverage()+"% · mastery "+globalMastery()+"% · target 100% coverage + stable multi-mode mastery.";$("readinessBox").classList.toggle("ready",ready>=85);
  $("readinessCore").textContent=masteredN+" / "+BANK.length+" mastered";$("readinessEvidence").textContent=state.answers+" answers · "+state.sessions+" completed levels";
  const unseen=BANK.length-seen;$("campaignStatus").textContent=unseen?unseen+" unseen · 15 s fixed · short prompts · close distractors.":"All "+BANK.length+" exposed · distractors tighten as your level rises.";
  $("startBtn").textContent=state.sessions?"CONTINUE · LEVEL "+state.level:"START · LEVEL "+state.level;$("buildVersion").textContent=(location.protocol.startsWith("http")?"ONLINE":"LOCAL")+" BUILD · v"+APP_VERSION+" · BANK "+BANK.length;
  if(rank){$("startAiLevel").style.color=AVS_TEXT_BANDS_15[rank-1];}paintText("coverageText",coverage()/100);paintFill("coverageFill",coverage()/100);paintText("masteryText",globalMastery()/100);paintFill("masteryFill",globalMastery()/100);paintText("startRating",rating()/100);if(recent!=null)paintText("startAccuracy",recent/100);if(avgHits()!=null)paintScore("startAllAccuracy",avgHits());paintText("startAuto",automaticPct()/100);paintText("startMastered",masteredN/BANK.length);paintText("readinessScore",ready/100);paintFill("readinessFill",ready/100);
  renderDailyPhrasal();renderGrowthTree();renderMedalSummary();if(window.AdaptiveLanguageDashboard)window.AdaptiveLanguageDashboard.refresh();
}

function confusionRows(limit=8){const rows=Object.entries(state.confusions).sort((a,b)=>b[1]-a[1]).slice(0,limit);if(!rows.length)return'<div class="statusbox">No stable confusion pair yet.</div>';return rows.map(([key,n])=>{const[a,b]=key.split("|"),A=BY_ID[a],B=BY_ID[b];return A&&B?'<div class="skillrow"><div class="name"><span class="skill-name-text">'+A.pv+' ↔ '+B.pv+'</span></div><div class="track"><div class="fill" style="width:'+Math.min(100,n*15)+'%"></div></div><div class="pct">'+n+'×</div></div>':"";}).join("");}
function renderStats(){QuizLearning.evidence(state.answerHistory);applyTheme();const cov=coverage(),mas=globalMastery(),recent=recentAccuracy(),hits=avgHits(),auto=automaticPct();$("statsCoverage").textContent=cov+"%";$("statsMastery").textContent=mas+"%";$("statsAccuracy").textContent=(recent??0)+"%";$("statsAllAccuracy").textContent=hits===null?"-":hits.toFixed(1);$("statsAutomatic").textContent=auto+"%";$("statsAvg").textContent=avgResponse()===null?"-":avgResponse().toFixed(1)+"s";$("statsTotal").textContent=state.answers;$("statsStudyTime").textContent=fmtTime(state.studySec);$("statsFocusPanel").innerHTML=focusPanelHtml(focusItems());$("statsConfusions").innerHTML=confusionRows();$("statsSkills").innerHTML=skillRows([...BANK].sort((a,b)=>mastery(a)-mastery(b)));paintText("statsCoverage",cov/100);paintText("statsMastery",mas/100);if(recent!=null)paintText("statsAccuracy",recent/100);if(hits!=null)paintScore("statsAllAccuracy",hits);paintText("statsAutomatic",auto/100);}
function weightFor(x){const m=stats(x),weak=(100-mastery(x))/14,unseen=m.attempts?0:6,miss=Math.min(5,m.misses*.45),breadth=(MODES.length-modeBreadth(x))*.8,personal=PERSONAL_PRIORITY.has(x.id)?1.5:0;const due=m.attempts&&QuizLearning.ready(m,state.level),base=1+weak+unseen+miss+breadth+personal;return due?base+8:m.attempts?base*.20:base;}
function pickWeighted(pool){const ws=pool.map(weightFor),sum=ws.reduce((a,b)=>a+b,0);let r=Math.random()*sum;for(let i=0;i<pool.length;i++){r-=ws[i];if(r<=0)return pool[i];}return pool[pool.length-1];}
function buildQueue(){const pool=[...BANK],out=[];while(out.length<SESSION_SIZE&&pool.length){const x=pickWeighted(pool);out.push(x);pool.splice(pool.indexOf(x),1);}return out;}
function chooseMode(x){const m=stats(x),unseen=m.attempts<2,r=Math.random(),lvl=state.difficulty;if(unseen)return r<.55?"context":r<.80?"meaning":r<.95?"particle":"contrast";if(lvl<=3)return r<.45?"context":r<.70?"meaning":r<.90?"particle":"contrast";if(lvl<=7)return r<.30?"context":r<.45?"meaning":r<.75?"particle":r<.95?"contrast":"paraphrase";if(lvl<=11)return r<.20?"context":r<.30?"meaning":r<.65?"particle":r<.90?"contrast":"paraphrase";return r<.15?"context":r<.20?"meaning":r<.60?"particle":r<.85?"contrast":"paraphrase";}
function confusionBonus(target,candidate){return (state.confusions[target.id+"|"+candidate.id]||0)*3+(state.confusions[candidate.id+"|"+target.id]||0)*2;}
function rankedDistractors(target,mode){const parts=target.pv.split(" "),base=parts[0],particle=parts.slice(1).join(" ");return BANK.filter(x=>x.id!==target.id).map(x=>{const xp=x.pv.split(" "),xbase=xp[0],xparticle=xp.slice(1).join(" ");let score=Math.random();if(xbase===base)score+=mode==="contrast"||mode==="particle"?22:13;if(x.tag===target.tag)score+=9;if(xparticle===particle)score+=3;if(x.difficulty===target.difficulty)score+=2;score+=confusionBonus(target,x);return{x,score};}).sort((a,b)=>b.score-a.score).map(o=>o.x);}
function pickDistractors(target,mode,count=3){const textKey=x=>String(mode==="meaning"?x.en:x.pv).trim().toLowerCase(),seen=new Set([textKey(target)]);const ranked=rankedDistractors(target,mode).filter(x=>{const key=textKey(x);if(!key||seen.has(key))return false;seen.add(key);return true;}),lvl=state.difficulty,windowSize=lvl<=3?14:lvl<=7?9:lvl<=11?6:4,top=ranked.slice(0,Math.min(windowSize,ranked.length)),out=[];while(out.length<count&&top.length){const span=Math.min(lvl>=12?3:lvl>=8?4:6,top.length),i=Math.floor(Math.random()*span);out.push(top.splice(i,1)[0]);}return out;}
function particleOf(x){return x.pv.split(" ").slice(1).join(" ");}
function particleOptions(target){const base=target.pv.split(" ")[0],same=BANK.filter(x=>x.id!==target.id&&x.pv.split(" ")[0]===base).map(particleOf),fallback=["up","out","off","on","over","back","in","into","with","for","after","by","about","across"];const correct=particleOf(target),pool=[...new Set([...same,...fallback].filter(x=>x&&x!==correct))];return shuffle([correct,...shuffle(pool).slice(0,3)]);}
function contextFor(x,index){const m=stats(x);return x.contexts[(m.attempts+index)%x.contexts.length];}
function shouldUsePrecision(target){const spec=PRECISION_BANK[target?.id];if(!spec)return false;const m=stats(target),skill=mastery(target),chance=m.misses>0?.78:m.attempts<3?.72:skill<75?.62:.42;return Math.random()<chance;}
function makePrecisionQuestion(target){const spec=PRECISION_BANK[target?.id];if(!spec)return null;const distractors=spec.d.map(id=>BY_ID[id]).filter(Boolean);if(distractors.length!==3)return null;return{target,mode:"precision",thinkKind:"precision",text:spec.text,correctKey:target.id,options:shuffle([{key:target.id,text:target.pv,confusionId:target.id},...distractors.map(x=>({key:x.id,text:x.pv,confusionId:x.id}))])};}
function makeQuestion(target,index){if(shouldUsePrecision(target)){const precise=makePrecisionQuestion(target);if(precise)return precise;}let mode=chooseMode(target);if(mode==="paraphrase"&&!TRANSFORMS[target.id])mode="contrast";const ds=pickDistractors(target,mode),ctx=contextFor(target,index);if(mode==="meaning")return{target,mode,text:target.pv.toUpperCase()+" = ?",correctKey:target.id,options:shuffle([{key:target.id,text:target.en,confusionId:target.id},...ds.map(x=>({key:x.id,text:x.en,confusionId:x.id}))])};
if(mode==="particle"){const base=target.pv.split(" ")[0],correct=particleOf(target),opts=particleOptions(target);return{target,mode,text:ctx.replace("___",base+" ___"),correctKey:correct,options:opts.map(x=>({key:x,text:x,confusionId:null}))};}
if(mode==="paraphrase")return{target,mode,text:TRANSFORMS[target.id],correctKey:target.id,options:shuffle([{key:target.id,text:target.pv,confusionId:target.id},...ds.map(x=>({key:x.id,text:x.pv,confusionId:x.id}))])};
return{target,mode,text:ctx,correctKey:target.id,options:shuffle([{key:target.id,text:target.pv,confusionId:target.id},...ds.map(x=>({key:x.id,text:x.pv,confusionId:x.id}))])};}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function settleUi(promise,ms,label){let t=null;try{return await Promise.race([Promise.resolve(promise),new Promise(resolve=>{t=setTimeout(()=>{console.warn(label+" timed out; continuing safely");resolve(null);},ms);})]);}catch(e){console.error(label+" failed",e);return null;}finally{if(t)clearTimeout(t);}}
function missionOverlay(show=true){const el=$("missionOverlay");if(!el)return null;el.classList.toggle("hidden",!show);el.setAttribute("aria-hidden",show?"false":"true");return el;}
function playCountdownStep(n){tone(n===3?523.25:n===2?659.25:783.99,.07,.017,"triangle");}
function adaptiveLevelTarget(){const h=(state.history||[]).slice(-8).filter(x=>Number.isFinite(x.score)),recent=h.length?h.reduce((n,x)=>n+x.score,0)/h.length:7.5,diffBase=5.5+(state.difficulty-1)*.48;return clamp(Math.round((recent*.64+diffBase*.36+.35)*2)/2,4.5,14.5);}
async function showLevelIntro(target){const el=missionOverlay(true);if(!el)return;el.className="mission-overlay intro";el.style.setProperty("--mission-accent",valueColor(target/15));const last=state.history.slice(-1)[0],lastLine=last?"LAST "+last.score+"/15"+(Number.isFinite(last.target)?" · "+((last.score-last.target)>=0?"+":"")+(last.score-last.target).toFixed(1)+" VS TARGET":""):"FIRST LEVEL";$("missionBody").innerHTML="<div class=\"mission-eyebrow\">LEVEL "+state.level+"</div><div class=\"mission-title\">TARGET</div><div class=\"mission-score\" style=\"color:"+valueTextColor(target/15)+"\">"+target.toFixed(1)+"<small>/15</small></div><div class=\"mission-meta\">"+lastLine+"</div><div class=\"mission-rules\">15 QUESTIONS · "+TIME_LIMIT+"s</div>";for(const n of [3,2,1]){$("missionCount").textContent=String(n);$("missionCount").classList.remove("pop");void $("missionCount").offsetWidth;$("missionCount").classList.add("pop");playCountdownStep(n);await wait(650);}$("missionCount").textContent="GO";tone(1318.5,.09,.022,"sine");await wait(260);missionOverlay(false);}
async function showLevelResolution(score,target,completedLevel){
 const el=missionOverlay(true);if(!el)return;const hit=score>=target,achievement=window.AdrianAchievements?.tier?.(score,15)||null;
 el.className="mission-overlay resolution "+(hit?"hit":"miss");el.style.setProperty("--mission-accent",achievement?.color||(hit?"#57965A":"#762F32"));
 $("missionCount").textContent="ROUTE";playLevelScore(score,15);window.AdrianAchievements?.play?.(tone,score,15);
 try{await window.AdrianAchievements.celebrate(score,15,{mount:$("missionBody"),counts:medalCounts(),label:hit?"TARGET CLEARED":"TARGET MISSED"});}finally{missionOverlay(false);}
}

function secondaryEffect(run){try{Promise.resolve(run()).catch(e=>console.warn("Secondary effect recovered",e));}catch(e){console.warn("Secondary effect recovered",e);}}
async function startSession(){if(sessionStarting)return;sessionStarting=true;try{await settleUi(ensureAudio(),1000,"Audio start");const target=adaptiveLevelTarget();session={queue:buildQueue(),index:0,correct:0,times:[],errors:[],started:Date.now(),snapshot:JSON.stringify(state),target,combo:0,bestCombo:0,recovered:0,masteredRewards:0,learningXp:0,lastReward:""};$("sessionLevel").innerHTML="L"+state.level+"<small class=\"level-target\">TARGET "+target.toFixed(1)+"</small>";secondaryEffect(()=>window.LanguagePoints?.beginLevel?.({target,level:state.level}));await settleUi(showLevelIntro(target),4500,"Session intro");missionOverlay(false);showScreen("gameScreen");renderSegments(TIME_LIMIT);nextQuestion();}finally{sessionStarting=false;}}
function renderSegments(left=TIME_LIMIT,total=TIME_LIMIT){
  const host=$("segments");
  if(!host)return;
  const duration=Math.max(.001,Number(total)||TIME_LIMIT),seconds=Math.max(1,Math.ceil(duration));
  if(host.children.length!==seconds||host.dataset.secondsTotal!==String(seconds)){
    const nodes=Array.from({length:seconds},()=>{const node=document.createElement("i");node.className="seg";return node;});
    host.replaceChildren(...nodes);
    host.classList.add("seconds-bar");
    host.dataset.secondsTotal=String(seconds);
    host.style.gridTemplateColumns="repeat("+seconds+",minmax(0,1fr))";
    host.setAttribute("role","progressbar");
    host.setAttribute("aria-valuemin","0");
    host.setAttribute("aria-valuemax",String(seconds));
  }
  const remaining=Math.max(0,Math.min(duration,Number(left)||0));
  const elapsed=Math.max(0,Math.min(seconds,Math.floor(duration-remaining+0.000001)));
  [...host.children].forEach((node,index)=>node.classList.toggle("on",index<elapsed));
  host.setAttribute("aria-valuenow",String(elapsed));
  host.setAttribute("aria-valuetext",elapsed+" de "+seconds+" segundos transcurridos");
}

// Centered, touch-safe four-colour reveal control.
const NucleoReadFirstSkip=(()=>{
  let button=null,action=null,waitingForFreshGesture=false;
  const ANSWERS='.answer,.option,.kq-choice';
  // An answer must always begin a NEW gesture after the reveal button's click.
  document.addEventListener('pointerdown',event=>{
    if(waitingForFreshGesture&&event.target?.closest?.(ANSWERS))waitingForFreshGesture=false;
  },true);
  document.addEventListener('keydown',event=>{
    if(waitingForFreshGesture&&(event.key==='Enter'||event.key===' ')&&event.target?.closest?.(ANSWERS))
      waitingForFreshGesture=false;
  },true);
  document.addEventListener('click',event=>{
    if(!waitingForFreshGesture||!event.target?.closest?.(ANSWERS))return;
    event.preventDefault();event.stopImmediatePropagation();
  },true);
  function ensure(){
    if(button)return button;
    const css=document.createElement('style');css.id='nucleo-read-skip-style';
    css.textContent=[
      '.nucleo-read-skip-host{position:relative!important}',
      '.nucleo-read-skip-host.read-first-hidden{visibility:visible!important;opacity:1!important;pointer-events:auto!important}',
      '.nucleo-read-skip-host.read-first-hidden > :not(.nucleo-read-skip){visibility:hidden!important;pointer-events:none!important}',
      '.nucleo-read-skip-host.prethink-hidden{display:grid!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}',
      '#gameScreen #answers.nucleo-read-skip-host.prethink-hidden{display:grid!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}',
      '.nucleo-read-skip-host.prethink-hidden > :not(.nucleo-read-skip){visibility:hidden!important;pointer-events:none!important}',
      '.nucleo-read-skip-host.kq-choices.hidden{display:grid!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}',
      '.nucleo-read-skip-host.kq-choices.hidden > :not(.nucleo-read-skip){visibility:hidden!important;pointer-events:none!important}',
      '.nucleo-read-skip{appearance:none;position:absolute;z-index:20;top:50%;left:50%;transform:translate(-50%,-50%);display:grid;place-items:center;width:100px;height:92px;margin:0;padding:10px;background:#EAF0F5;border:2px solid #25282C;border-radius:17px;box-shadow:0 4px 16px rgba(0,0,0,.24);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none}',
      '.nucleo-read-skip[hidden]{display:none!important}',
      '.nucleo-read-skip:active{transform:translate(-50%,-50%) scale(.96)}',
      '.nucleo-read-skip:focus-visible{outline:3px solid #ffd566;outline-offset:3px}',
      '.nucleo-read-skip-tiles{width:72px;height:66px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:5px}',
      '.nucleo-read-skip-tiles i{display:block;border-radius:6px;box-shadow:inset 0 -2px 0 rgba(0,0,0,.20)}',
      '.nucleo-read-skip-tiles i:nth-child(1){background:#77531f}',
      '.nucleo-read-skip-tiles i:nth-child(2){background:#1f6264}',
      '.nucleo-read-skip-tiles i:nth-child(3){background:#405582}',
      '.nucleo-read-skip-tiles i:nth-child(4){background:#74405a}',
      '@media(max-width:520px){.nucleo-read-skip{width:94px;height:88px}.nucleo-read-skip-tiles{width:68px;height:63px}}'
    ].join('');
    document.head.append(css);
    button=document.createElement('button');button.type='button';
    button.className='nucleo-read-skip';button.hidden=true;
    button.setAttribute('aria-label','Mostrar las cuatro respuestas ahora');
    button.title='Mostrar respuestas';
    button.innerHTML='<span class="nucleo-read-skip-tiles" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
    for(const type of ['pointerdown','pointerup','touchstart','touchend'])
      button.addEventListener(type,event=>event.stopPropagation());
    button.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      if(!action||button.hidden)return;
      const reveal=action;action=null;button.disabled=true;
      reveal();
      waitingForFreshGesture=true;
    });
    return button;
  }
  return {
    show(anchorId,onReveal){
      const anchor=document.getElementById(anchorId);
      if(!anchor||typeof onReveal!=='function')return;
      let host;
      if(anchorId==='gameCard')host=anchor.querySelector('.options');
      else if(anchorId==='kqOriginal')host=document.getElementById('kqChoices');
      else host=document.getElementById('answers');
      if(!host)return;
      const b=ensure();
      host.classList.add('nucleo-read-skip-host');
      if(b.parentElement!==host)host.appendChild(b);
      action=onReveal;waitingForFreshGesture=false;
      b.disabled=false;b.hidden=false;
    },
    hide(){action=null;if(button){button.hidden=true;button.disabled=true;}},
    get button(){return button;}
  };
})();
function shouldPrethink(q){return !!q&&readFirstEnabled();}
function renderQuestionMeta(thinking=false){
  if(!current)return;
  const reward=current.rewardSpecial?" · "+current.rewardSpecial:"";
  const think=current.thinkKind==="precision"?(thinking?" · THINK · PRECISION":" · PRECISION"):thinking?" · THINK · RECALL":"";
  $("qTotal").textContent="/ "+SESSION_SIZE+think+reward;
}
function beginAnswerTimer(){
  clearInterval(timerHandle);questionPhase="answer";lastTickShown=TIME_LIMIT+1;lastUrgentBeat=-1;$("timer").classList.remove("prethink");$("gameScreen").classList.remove("think-recall");renderQuestionMeta(false);deadline=Date.now()+TIME_LIMIT*1000;renderSegments(TIME_LIMIT);tick();timerHandle=setInterval(tick,50);
}
function revealPrethink(){
  if(questionPhase!=="prethink"||locked||!current)return;
  NucleoReadFirstSkip.hide();
  clearInterval(timerHandle);
  current.prethink=Math.min(PRETHINK_SECONDS,Math.max(0,(Date.now()-(current.prethinkStartedAt||Date.now()))/1000));
  const box=$("answers"),questionEl=$("questionText")?.parentElement,before=questionEl?.getBoundingClientRect();
  box.classList.remove("prethink-hidden");questionEl?.classList.remove("prethink-question");
  const after=questionEl?.getBoundingClientRect();
  if(before&&after&&!matchMedia("(prefers-reduced-motion: reduce)").matches){
    const dy=before.top-after.top;
    if(Math.abs(dy)>1)questionEl.animate([{transform:`translateY(${dy}px)`},{transform:"translateY(0)"}],{duration:330,easing:"cubic-bezier(.2,.8,.25,1)"});
    box.classList.remove("prethink-enter");void box.offsetWidth;box.classList.add("prethink-enter");setTimeout(()=>box.classList.remove("prethink-enter"),360);
  }
  beginAnswerTimer();
}
function beginPrethink(){
  NucleoReadFirstSkip.show('questionText',()=>{revealPrethink();tone(900,.028,.007,'sine');});
  clearInterval(timerHandle);questionPhase="prethink";current.thinkKind=current.thinkKind||"recall";current.prethink=PRETHINK_SECONDS;current.prethinkStartedAt=Date.now();lastTickShown=PRETHINK_SECONDS+1;lastUrgentBeat=-1;$("gameScreen").classList.toggle("think-precision",current.thinkKind==="precision");$("gameScreen").classList.toggle("think-recall",current.thinkKind!=="precision");$("timer").classList.add("prethink");$("answers").classList.add("prethink-hidden");$("questionText")?.parentElement?.classList.add("prethink-question");renderQuestionMeta(true);deadline=Date.now()+PRETHINK_SECONDS*1000;renderSegments(PRETHINK_SECONDS,PRETHINK_SECONDS);tick();timerHandle=setInterval(tick,50);
}
function nextQuestion(){
  QuizLearning.clear();
  clearInterval(timerHandle);NucleoReadFirstSkip.hide();locked=false;questionPhase="answer";lastTickShown=TIME_LIMIT+1;lastUrgentBeat=-1;$("gameScreen").classList.remove("think-precision","think-recall");$("correctReveal").classList.remove("show");if(!session)return;if(session.index>=SESSION_SIZE){finishSession();return;}
  current=makeQuestion(session.queue[session.index],session.index);current.prethink=0;$("qIndex").textContent=session.index+1;
  const rewardStats=stats(current.target),rewardSpecial=rewardStats.misses>0&&!rewardStats.masteredRewarded&&rewardStats.streak>=1?"MASTER CHANCE":rewardStats.misses>0&&rewardStats.streak===0?"RECOVERY":rewardStats.attempts>0?"REVIEW":session.index===SESSION_SIZE-1?"FINAL":"";current.rewardSpecial=rewardSpecial;
  $("questionText").textContent=current.text;const box=$("answers");box.className="answers";box.innerHTML="";const answerColors=shuffledAnswerColorClasses();current.options.forEach((o,i)=>{const b=document.createElement("button");b.className="answer "+answerColors[i];b.textContent=o.text;b.dataset.key=o.key;b.addEventListener("click",()=>answer(o));box.appendChild(b);});
  if(shouldPrethink(current))beginPrethink();else{NucleoReadFirstSkip.hide();beginAnswerTimer();}
}
function audioSupported(){return !!(window.AudioContext||window.webkitAudioContext);}
async function ensureAudio(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC){soundOn=false;refreshSoundButton();return false;}
    if(!audioCtx)audioCtx=new AC();
    if(audioCtx.state==='suspended')await audioCtx.resume();
    const ok=audioCtx.state==='running';if(!ok){soundOn=false;refreshSoundButton();}return ok;
  }catch(e){console.warn("Audio unavailable",e);soundOn=false;refreshSoundButton();return false;}
}
function tone(freq,dur=.035,gain=.018,type='sine',delay=0){
  if(!soundOn||!audioCtx||audioCtx.state!=='running')return;
  const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,t);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur+.01);
}
function playTick(strong=false,step=0){const f=strong?(step%2?1540:1260):(step%2?1280:980);tone(f,strong?.034:.026,strong?.026:.016,'square');}
function playUrgentTimerPulse(left,beat=0){const final=left<=2,f=final?(beat%2?1660:1450):(beat%2?1360:1160);tone(f,final?.034:.028,final?.016:.012,final?'square':'triangle');if(left<=.55)tone(1960,.042,.010,'sine',.014);}
function playCorrect(){tone(880,.045,.015,"sine");}
function playWrong(){tone(220,.065,.015,"sine");}
const LEVEL_SCORE_ROOTS=[146.83,155.56,164.81,174.61,196.00,220.00,246.94,261.63,293.66,329.63,349.23,392.00,440.00,493.88,523.25];
function semitoneHz(root,n){return root*Math.pow(2,n/12);}
function playLevelScore(correct,total=15){
  const rank=Math.max(1,Math.min(15,Math.round(15*(Number(correct)||0)/Math.max(1,Number(total)||15)))),root=LEVEL_SCORE_ROOTS[rank-1];
  let intervals=[0],step=.105,dur=.085,gain=.015,type='triangle';
  if(rank<=3){intervals=[0,-1,-5];step=.11;dur=.11;gain=.014;type='triangle';}
  else if(rank<=6){intervals=[0,3,0];step=.095;dur=.095;gain=.015;type='sine';}
  else if(rank<=9){intervals=[0,2,4];step=.085;dur=.085;gain=.017;type='triangle';}
  else if(rank<=12){intervals=[0,4,7,12];step=.075;dur=.09;gain=.019;type='triangle';}
  else if(rank<=14){intervals=[0,4,7,12,16];step=.068;dur=.095;gain=.021;type='sine';}
  else{intervals=[0,4,7,12,16,19,24];step=.062;dur=.105;gain=.024;type='triangle';}
  intervals.forEach((semi,i)=>{const delay=i*step,f=semitoneHz(root,semi);tone(f,i===intervals.length-1?dur*1.8:dur,gain,type,delay);if(rank>=10&&i>=2)tone(f*2,.045,gain*.24,'sine',delay+.012);});
  if(rank>=13){const finale=(intervals.length-1)*step+.07;tone(root/2,.22,gain*.8,'sine',finale);[0,4,7,12].forEach((semi,i)=>tone(semitoneHz(root,semi),rank===15?.28:.20,gain*(rank===15?.72:.55),i%2?'sine':'triangle',finale+i*.012));}
  if(rank===15){const crown=(intervals.length-1)*step+.30;[12,16,19,24].forEach((semi,i)=>tone(semitoneHz(root,semi),.18,.012,'sine',crown+i*.045));}
}
function haptic(ok){
  try{if(navigator.vibrate)navigator.vibrate(ok?18:[24,16,42]);}catch(e){}
}
function pulseFeedback(ok){/* Feedback stays on the answer tiles. */}
function burstParticles(anchor){/* Feedback stays on the answer tiles. */}
function refreshSoundButton(){const b=$("soundBtn");if(!b)return;if(!audioSupported()){soundOn=false;b.disabled=true;b.textContent='🔇';b.setAttribute('aria-label','Audio unavailable');b.title='Audio unavailable';return;}b.disabled=false;b.textContent=soundOn?'🔊':'🔇';b.setAttribute('aria-label',soundOn?'Sound on':'Sound off');b.title='';}
function tick(){const limit=questionPhase==="prethink"?PRETHINK_SECONDS:TIME_LIMIT,ms=Math.max(0,deadline-Date.now()),sec=ms/1000,pct=ms/(limit*1000)*100,shown=Math.ceil(sec);$("timerText").textContent=sec.toFixed(1);renderSegments(sec,limit);$("timer").style.setProperty("--timer-cut",(100-pct)+"%");$("timer").classList.toggle("urgent",questionPhase==="answer"&&sec<=3);if(questionPhase==="prethink"){if(ms<=0){clearInterval(timerHandle);revealPrethink();}return;}if(sec>3&&shown<lastTickShown&&shown>0&&shown<TIME_LIMIT){playTick(false,shown);lastTickShown=shown;}if(sec<=3&&sec>0){const beat=sec>2?Math.floor((3-sec)*2):100+Math.floor((2-sec)*4);if(beat!==lastUrgentBeat){lastUrgentBeat=beat;playUrgentTimerPulse(sec,beat);}}if(ms<=0){clearInterval(timerHandle);answer(null,true);}}
function showCorrectReveal(target){/* Feedback stays on the answer tiles. */}
function answer(option,timeout=false){if(locked||questionPhase!=="answer")return;locked=true;clearInterval(timerHandle);const elapsed=clamp((TIME_LIMIT*1000-Math.max(0,deadline-Date.now()))/1000,0,TIME_LIMIT),target=current.target,ok=!!option&&option.key===current.correctKey,m=stats(target),mm=m.modes[current.mode],prior={attempts:m.attempts,misses:m.misses,streak:m.streak,masteredRewarded:!!m.masteredRewarded};const masteredReward=ok&&prior.misses>0&&!prior.masteredRewarded&&prior.streak>=1&&prior.attempts>=3,recoveredReward=ok&&!masteredReward&&prior.misses>0&&prior.streak===0;session.lastReward="";if(ok){session.combo++;session.bestCombo=Math.max(session.bestCombo,session.combo);let rewardXp=10+(elapsed<=4?2:0)+(prior.attempts?2:0);if(masteredReward){session.masteredRewards++;rewardXp+=12;session.lastReward="MASTERED ✦";m.masteredRewarded=true;}else if(recoveredReward){session.recovered++;rewardXp+=6;session.lastReward="RECOVERED";}const comboBonus={3:3,5:5,10:10,15:20}[session.combo]||0;if(comboBonus){rewardXp+=comboBonus;if(!session.lastReward)session.lastReward=`COMBO ×${session.combo}`;}session.learningXp+=rewardXp;}else session.combo=0;Object.assign(m,QuizLearning.space(m,ok,elapsed<=4));m.lastLevel=state.level;m.attempts++;m.totalTime+=elapsed;m.avgTime=m.totalTime/m.attempts;m.lastSeen=Date.now();mm.attempts++;state.answers++;state.studySec+=elapsed+(Number(current.prethink)||0);if(ok){m.correct++;m.streak++;m.bestStreak=Math.max(m.bestStreak,m.streak);mm.correct++;state.correct++;session.correct++;if(elapsed<=4)m.automatic++;}else{m.streak=0;m.misses++;let wrongId=option?.confusionId||null;if(!wrongId&&option&&current.mode==="particle"){const base=target.pv.split(" ")[0],cand=BANK.find(x=>x.id!==target.id&&x.pv.split(" ")[0]===base&&particleOf(x)===option.key);wrongId=cand?.id||null;}if(wrongId){const key=target.id+"|"+wrongId;state.confusions[key]=(state.confusions[key]||0)+1;}session.errors.push({target:target.id,choice:wrongId,shown:option?.text||null,timeout,mode:current.mode,question:current.text});}
state.answerHistory.push({id:target.id,mode:current.mode,ok,time:elapsed,prethink:Number(current.prethink)||0,studyMode:readFirstEnabled()?"READ_FIRST":"STANDARD",preReadMs:Math.round((Number(current.prethink)||0)*1000),at:Date.now()});state.answerHistory=QuizLearning.retain(state.answerHistory,1200,STORAGE_KEY+":answers");session.times.push(elapsed);const answeredSession=session,answeredIndex=session.index;setTimeout(()=>{if(session!==answeredSession||session.index!==answeredIndex||session.finishing)return;session.index++;nextQuestion();},QuizLearning.HOLD_MS);secondaryEffect(()=>window.LanguagePoints?.recordAnswer?.({correct:ok,sec:elapsed,timeLimit:TIME_LIMIT}));const buttons=[...$("answers").children];buttons.forEach(b=>{b.disabled=true;if(b.dataset.key===current.correctKey)b.classList.add("good");else if(option&&b.dataset.key===option.key)b.classList.add("bad");else b.classList.add("dim");});QuizLearning.show("#questionText",current.text,current.options.find(o=>o.key===current.correctKey)?.text||target.pv);showFeedback(ok,timeout,target);try{if(ok)playCorrect();else playWrong();haptic(ok);}catch(e){console.warn("Answer cue unavailable",e);}try{save();}catch(e){console.warn("Progress save unavailable",e);}}
function showFeedback(ok,timeout,target){/* Feedback stays on the answer tiles. */}
async function finishSession(){if(!session||session.finishing)return;session.finishing=true;locked=true;clearInterval(timerHandle);timerHandle=null;current=null;try{await finishSessionBody();}catch(e){console.error("Session close recovered",e);try{renderEnd(state.difficulty);}catch(_){} }finally{missionOverlay(false);showScreen("endScreen");}}
async function finishSessionBody(){clearInterval(timerHandle);const acc=session.correct/SESSION_SIZE,difficultyBefore=state.difficulty,completedLevel=state.level,target=session.target;if(acc>=.80)state.difficulty=Math.min(15,state.difficulty+1);else if(acc<.47)state.difficulty=Math.max(1,state.difficulty-1);state.sessions++;state.level=Math.min(10000,state.sessions+1);const learning=rating();state.learningRewardXp=(state.learningRewardXp||0)+(session.learningXp||0);state.history.push({at:Date.now(),level:completedLevel,score:session.correct,total:SESSION_SIZE,difficultyBefore,difficultyAfter:state.difficulty,target,targetDelta:session.correct-target,targetHit:session.correct>=target,avgTime:session.times.reduce((a,b)=>a+b,0)/session.times.length,learning,learningXp:session.learningXp||0,bestCombo:session.bestCombo||0,recovered:session.recovered||0,masteredRewards:session.masteredRewards||0,lifetimeLearningXp:state.learningRewardXp});state.history=QuizLearning.preserve(state.history,STORAGE_KEY+":sessions");save();try{renderEnd(difficultyBefore);const rewardLine=$("endSub");if(rewardLine)rewardLine.textContent+=` · +${session.learningXp||0} XP · COMBO ×${session.bestCombo||0}${session.recovered?` · ${session.recovered} RECOVERED`:""}${session.masteredRewards?` · ${session.masteredRewards} MASTERED`:""}`;}catch(e){console.error("End screen render failed",e);}try{await showLevelResolution(session.correct,target,completedLevel);}catch(e){console.error("End route recovered",e);missionOverlay(false);}try{await settleUi(window.LanguagePoints?.awardLevel?.({correct:session.correct,total:SESSION_SIZE,target,recovered:session.recovered||0,mastered:session.masteredRewards||0,level:completedLevel}),1600,"Language points");}catch(e){console.error("Points award recovered",e);}finally{missionOverlay(false);showScreen("endScreen");}}
function lessonItem(){if(session.errors.length)return BY_ID[session.errors[0].target];return [...session.queue].sort((a,b)=>mastery(a)-mastery(b))[0];}
function renderLesson(){const x=lessonItem();if(!x){$("levelLesson").classList.add("hidden");return;}const example=x.contexts[0].replace("___",x.pv);$("levelLesson").classList.remove("hidden");$("levelLesson").innerHTML='<div class="lesson-kicker">LEVEL FLASHCARD · ENGLISH ONLY</div><h2>'+x.pv+'</h2><div class="lesson-source"><b>Meaning:</b> '+x.en+'</div><div class="lesson-formula">'+x.pv.toUpperCase()+'</div><div class="lesson-example"><strong>Example</strong>'+example+'</div><div class="lesson-cue">Mastery '+mastery(x)+'% · '+modeBreadth(x)+'/6 exercise modes seen.</div>';}
function pvScoreChart(rows){if(window.HubCharts)return HubCharts.chart((rows||[]).map(r=>({at:r.at,value:r.score15??r.score,target:r.target,label:"Nivel "+r.level})),{max:15,unit:" /15",title:"Resultados"});if(!rows?.length)return "<div class=\"statusbox\">Complete a level to start the graph.</div>";const rs=rows.slice(-30),w=720,h=230,L=42,R=14,T=18,B=30,x=i=>L+(rs.length===1?.5:i/(rs.length-1))*(w-L-R),y=v=>T+(15-v)/15*(h-T-B),bands=COLOR_BANDS_15.map((c,i)=>"<rect x=\""+L+"\" y=\""+y(i+1)+"\" width=\""+(w-L-R)+"\" height=\""+Math.max(1,y(i)-y(i+1))+"\" fill=\""+c+"\" fill-opacity=\".50\"/>").join(""),pts=rs.map((q,i)=>x(i)+","+y(q.score15)).join(" "),dots=rs.map((q,i)=>"<circle cx=\""+x(i)+"\" cy=\""+y(q.score15)+"\" r=\"3.2\" fill=\""+valueColor(q.score15/15)+"\"/>").join("");return "<svg class=\"score-chart\" viewBox=\"0 0 "+w+" "+h+"\"><rect x=\""+L+"\" y=\""+T+"\" width=\""+(w-L-R)+"\" height=\""+(h-T-B)+"\" rx=\"8\" fill=\"#101815\"/>"+bands+"<polyline points=\""+pts+"\" fill=\"none\" stroke=\"#f4f7f5\" stroke-width=\"3\" stroke-linejoin=\"round\"/>"+dots+"</svg>";}
function pvLearningChart(rows){if(window.HubCharts)return HubCharts.chart((rows||[]).map(r=>({at:r.at,value:r.learning??null})),{title:"Línea de aprendizaje"});if(!rows?.length)return "<div class=\"statusbox\">The learning curve will appear after your first levels.</div>";let e=null;const vals=rows.slice(-40).map(x=>{const v=Number.isFinite(x.learning)?x.learning:100*x.score15/15;e=e==null?v:.22*v+.78*e;return e;}),w=720,h=190,L=42,R=14,T=18,B=26,x=i=>L+(vals.length===1?.5:i/(vals.length-1))*(w-L-R),y=v=>T+(100-v)/100*(h-T-B),pts=vals.map((v,i)=>x(i)+","+y(v)).join(" "),c=valueColor(vals[vals.length-1]/100);return "<svg class=\"score-chart\" viewBox=\"0 0 "+w+" "+h+"\"><rect x=\""+L+"\" y=\""+T+"\" width=\""+(w-L-R)+"\" height=\""+(h-T-B)+"\" rx=\"8\" fill=\"#101815\"/><polyline points=\""+pts+"\" fill=\"none\" stroke=\""+c+"\" stroke-width=\"4\" stroke-linejoin=\"round\"/></svg>";}
function renderEnd(old){applyTheme();renderMedalSummary({correct:session.correct,total:SESSION_SIZE});const avg=session.times.reduce((a,b)=>a+b,0)/Math.max(1,session.times.length),rank=ratingRank(),evidence=evidencePct();$("endScore").textContent=session.correct+"/15";const targetEl=$("endTarget");if(targetEl){const d=session.correct-session.target,hit=d>=0;targetEl.className="target-result "+(hit?"hit":"miss");targetEl.innerHTML="<span>TARGET "+session.target.toFixed(1)+"</span><b>"+(d>=0?"+":"")+d.toFixed(1)+"</b><small>"+(hit?"TARGET BEATEN":"TARGET MISSED")+"</small>";}$("endSub").textContent=state.difficulty>old?"Adaptive difficulty up · harder contrasts unlocked.":state.difficulty<old?"Adaptive difficulty adjusted · weak contrasts recycled.":"Adaptive difficulty held · contrasts rebalanced.";$("eAvg").textContent=avg.toFixed(1)+"s";$("eAuto").textContent=automaticPct()+"%";$("eRating").textContent=rating();$("eCoverage").textContent=coverage()+"%";$("eMastery").textContent=globalMastery()+"%";$("eMastered").textContent=BANK.filter(mastered).length+"/"+BANK.length;paintText("eAuto",automaticPct()/100);paintText("eRating",rating()/100);paintText("eCoverage",coverage()/100);paintText("eMastery",globalMastery()/100);paintText("eMastered",BANK.filter(mastered).length/BANK.length);if($("endAiLevel")){$("endAiLevel").textContent=(rank||"-")+" / 15";if(rank)$("endAiLevel").style.color=AVS_TEXT_BANDS_15[rank-1];}if($("endAiConfidence"))$("endAiConfidence").textContent="AI Valoration · evidence "+evidence+"%";if($("aiLegend"))$("aiLegend").innerHTML=aiLegendHtml(rank);const snap=window.AdaptiveLanguageDashboard?.snapshot?.();if(snap){const score=$("pvLearningScore"),dir=$("pvLearningDirection");score.textContent=Number.isFinite(snap.learning)?snap.learning.toFixed(1):"-";if(Number.isFinite(snap.learning))score.style.color=valueTextColor(snap.learning/100);const rows=snap.history||[],last=rows.at(-1)?.learning??null,prev=rows.at(-2)?.learning??null,delta=last!=null&&prev!=null?last-prev:null;dir.className="learning-direction "+(delta==null||Math.abs(delta)<.05?"neutral":delta>0?"good":"bad");dir.textContent=delta==null?"—":(delta>0?"↑ +":"↓ ")+delta.toFixed(1);$("pvEndScoreChart").innerHTML=pvScoreChart(rows);$("pvEndLearningChart").innerHTML=pvLearningChart(rows);}$("weakSkills").innerHTML=skillRows(focusItems());const has=session.errors.length>0;for(const id of ["errorsBtn","topErrorsBtn"])$(id).classList.toggle("hidden",!has);renderLesson();}
function renderErrors(){const box=$("errorsFull");$("errorsCount").textContent=session?.errors?.length?session.errors.length+" mistakes in the latest level.":"No mistakes in the latest level.";if(!session?.errors?.length){box.innerHTML='<div class="statusbox">Perfect level.</div>';return;}box.innerHTML=session.errors.map(e=>{const t=BY_ID[e.target],c=e.choice?BY_ID[e.choice]:null;return '<div class="mistake-card"><b>'+t.pv+' · '+e.mode.toUpperCase()+'</b><p>'+e.question+'</p><div class="mistake-choice"><div>'+(e.timeout?"TIME":e.shown?("Your answer: "+e.shown):"Wrong answer")+'</div><div class="correct">Correct: '+t.pv+' · '+t.en+'</div></div>'+(c?'<p>Confused with <strong>'+c.pv+'</strong>: '+c.en+'</p>':'')+'</div>';}).join("");}
function openErrors(){renderErrors();showScreen("errorsScreen");}
function renderFlash(){const x=flashQueue[flashIndex%flashQueue.length];if(!x)return;flashRevealed=false;$("flashAgainBtn").textContent="SHOW ANSWER";const example=x.contexts[0];$("flashCardHost").innerHTML='<div class="lesson-kicker">CARD '+(flashIndex+1)+' / '+flashQueue.length+' · MASTERY '+mastery(x)+'%</div><h2>Which phrasal verb?</h2><div class="lesson-source"><b>Meaning:</b> '+x.en+'</div><div class="lesson-example"><strong>Context</strong>'+example+'</div><div id="flashReveal" class="lesson-formula hidden">'+x.pv.toUpperCase()+'</div><div class="lesson-cue">'+modeBreadth(x)+'/6 exercise modes seen · '+stats(x).attempts+' adaptive attempts.</div>';}
function openFlash(){flashQueue=[...BANK].sort((a,b)=>mastery(a)-mastery(b)||stats(a).attempts-stats(b).attempts);flashIndex=0;renderFlash();showScreen("flashScreen");}
function toggleFlash(){flashRevealed=!flashRevealed;$("flashReveal").classList.toggle("hidden",!flashRevealed);$("flashAgainBtn").textContent=flashRevealed?"HIDE ANSWER":"SHOW ANSWER";}
function nextFlash(){flashIndex=(flashIndex+1)%flashQueue.length;renderFlash();}
function goHome(){clearInterval(timerHandle);session=null;current=null;renderHome();showScreen("startScreen");}
function abortSession(){clearInterval(timerHandle);if(session?.snapshot){state=JSON.parse(session.snapshot);for(const x of BANK)state.items[x.id]=normalizeItem(state.items[x.id]);save();}goHome();}
function exportProgress(){const blob=new Blob([JSON.stringify({app:"adaptive-phrasal-verbs",version:APP_VERSION,exportedAt:new Date().toISOString(),state},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="adaptive-phrasal-verbs-progress.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function importProgressFile(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result),incoming=data.state||data;if(!incoming||typeof incoming!=="object")throw new Error("Invalid backup");localStorage.setItem(STORAGE_KEY,JSON.stringify(incoming));state=loadState();renderHome();if(window.AdaptiveLanguageDashboard)window.AdaptiveLanguageDashboard.refresh();}catch(e){alert("Could not import this progress backup.");}};r.readAsText(file);}
function resetProgress(){if(!confirm("Reset Adaptive Phrasal Verbs progress?"))return;localStorage.removeItem(STORAGE_KEY);state=loadState();renderHome();if(window.AdaptiveLanguageDashboard)window.AdaptiveLanguageDashboard.refresh();}
async function setSound(){soundOn=!soundOn;if(soundOn){await ensureAudio();tone(760,.06,.025,"sine");}refreshSoundButton();}
$("readFirstToggle").addEventListener("click",()=>setReadFirstEnabled(!readFirstEnabled()));$("startBtn").addEventListener("click",startSession);$("continueBtn").addEventListener("click",startSession);$("topContinueBtn").addEventListener("click",startSession);$("homeBtn").addEventListener("click",goHome);$("topHomeBtn").addEventListener("click",goHome);$("abortSessionBtn").addEventListener("click",abortSession);$("soundBtn").addEventListener("click",setSound);
$("globalJsonBtn")?.addEventListener("click",()=>copyPhrasalGlobalJson("globalJsonBtn"));$("endCopyHandoffBtn")?.addEventListener("click",()=>copyPhrasalGlobalJson("endCopyHandoffBtn"));$("statsBtn").addEventListener("click",()=>{if(window.AdaptiveLanguageDashboard)return window.AdaptiveLanguageDashboard.open();renderStats();showScreen("statsScreen");});$("statsBackBtn").addEventListener("click",goHome);$("statsTopDashboardBtn").addEventListener("click",goHome);
$("flashBtn").addEventListener("click",openFlash);$("flashAgainBtn").addEventListener("click",toggleFlash);$("flashNextBtn").addEventListener("click",nextFlash);$("flashBackBtn").addEventListener("click",goHome);$("flashTopDashboardBtn").addEventListener("click",goHome);
$("exportBtn").addEventListener("click",exportProgress);$("importBtn").addEventListener("click",()=>$("importFile").click());$("importFile").addEventListener("change",e=>importProgressFile(e.target.files?.[0]));$("resetBtn").addEventListener("click",resetProgress);
$("errorsBtn").addEventListener("click",openErrors);$("topErrorsBtn").addEventListener("click",openErrors);$("errorsBackBtn").addEventListener("click",()=>showScreen("endScreen"));$("errorsTopDashboardBtn").addEventListener("click",goHome);
document.addEventListener("visibilitychange",()=>{if(document.hidden&&timerHandle)clearInterval(timerHandle);else if(!document.hidden&&session&&!session.finishing&&!locked&&current){clearInterval(timerHandle);deadline=Date.now()+Math.min(TIME_LIMIT,parseFloat($("timerText").textContent)||TIME_LIMIT)*1000;lastTickShown=Math.ceil(parseFloat($("timerText").textContent)||TIME_LIMIT)+1;lastUrgentBeat=-1;timerHandle=setInterval(tick,50);}});
refreshSoundButton();renderHome();showScreen("startScreen");
