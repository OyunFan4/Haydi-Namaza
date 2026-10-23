(()=>{'use strict';
const K='haydi.tracker',G='haydi.tracker.goal',P=[['Fajr','İmsak'],['Dhuhr','Öğle'],['Asr','İkindi'],['Maghrib','Akşam'],['Isha','Yatsı']];
const $=id=>document.getElementById(id);
const today=()=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const obj=Object.fromEntries(parts.map(p=>[p.type,p.value]));return `${obj.year}-${obj.month}-${obj.day}`};
const current=today();let [viewYear,viewMonth]=current.slice(0,7).split('-').map(Number);
const read=()=>{try{const data=JSON.parse(localStorage.getItem(K)||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{}}catch{return {}}};
const getCount=(rows,key)=>P.reduce((n,[id])=>n+(rows[key]?.[id]===true?1:0),0);
const z=n=>String(n).padStart(2,'0');const fmt=(y,m,d)=>`${y}-${z(m)}-${z(d)}`;
function render(){const grid=$('trackMonthGrid');if(!grid)return;const now=today(),rows=read(),sel=$('trackerDate')?.value;const first=new Date(Date.UTC(viewYear,viewMonth-1,1)),length=new Date(Date.UTC(viewYear,viewMonth,0)).getUTCDate();const offset=(first.getUTCDay()+6)%7;
$('trackMonthTitle').textContent=new Intl.DateTimeFormat('tr-TR',{month:'long',year:'numeric',timeZone:'UTC'}).format(first);
$('trackNextMonth').disabled=fmt(viewYear,viewMonth,1)>=now.slice(0,7)+'-01';grid.replaceChildren();
for(let i=0;i<offset;i++){const empty=document.createElement('span');empty.className='tracker-v6-empty';grid.append(empty)}
for(let d=1;d<=length;d++){const key=fmt(viewYear,viewMonth,d),count=getCount(rows,key),btn=document.createElement('button');btn.type='button';btn.className='tracker-v6-day '+(count===5?'full':count>0?'partial':'none')+(key===now?' today':'')+(key===sel?' chosen':'');btn.disabled=key>now;btn.setAttribute('aria-label',`${d} ${$('trackMonthTitle').textContent}, ${count} / 5 vakit${key>now?' (gelecek gün)':''}`);const num=document.createElement('strong');num.textContent=d;const sub=document.createElement('small');sub.textContent=key>now?'—':count+'/5';btn.append(num,sub);btn.onclick=()=>{const input=$('trackerDate');if(input){input.value=key;input.dispatchEvent(new Event('change',{bubbles:true}));input.scrollIntoView({behavior:'smooth',block:'center'})}};grid.append(btn)}
const days=Math.min(length,viewYear===Number(now.slice(0,4))&&viewMonth===Number(now.slice(5,7))?Number(now.slice(8)):length);const bars=$('trackDistribution');bars.replaceChildren();for(const [id,name] of P){let hits=0;for(let d=1;d<=days;d++)if(rows[fmt(viewYear,viewMonth,d)]?.[id]===true)hits++;const line=document.createElement('div');line.className='tracker-v6-bar';const label=document.createElement('div');label.className='tracker-v6-bar-label';const title=document.createElement('span');title.textContent=name;const stat=document.createElement('b');stat.textContent=`${hits} / ${days}`;label.append(title,stat);const track=document.createElement('div');track.className='tracker-v6-track';const fill=document.createElement('div');fill.className='tracker-v6-fill';fill.style.width=(days?hits/days*100:0)+'%';track.append(fill);line.append(label,track);bars.append(line)}
$('trackDistributionPeriod').textContent=$('trackMonthTitle').textContent;
const goal=Number(localStorage.getItem(G)||'5');const input=$('trackGoal');input.value=String([1,2,3,4,5].includes(goal)?goal:5);let achieved=0;for(let d=1;d<=days;d++)if(getCount(rows,fmt(viewYear,viewMonth,d))>=Number(input.value))achieved++;$('trackGoalSummary').textContent=`Bu ay şu ana kadarki ${days} günün ${achieved} gününde kişisel hedefinize ulaştınız.`;
}
$('trackPrevMonth')?.addEventListener('click',()=>{viewMonth--;if(viewMonth===0){viewMonth=12;viewYear--}render()});
$('trackNextMonth')?.addEventListener('click',()=>{if(fmt(viewYear,viewMonth,1)>=today().slice(0,7)+'-01')return;viewMonth++;if(viewMonth===13){viewMonth=1;viewYear++}render()});
$('trackGoal')?.addEventListener('change',e=>{const n=Number(e.target.value);if(n>=1&&n<=5){localStorage.setItem(G,String(n));render()}});
$('trackToday')?.addEventListener('click',()=>{[viewYear,viewMonth]=today().slice(0,7).split('-').map(Number);const field=$('trackerDate');if(field){field.value=today();field.dispatchEvent(new Event('change',{bubbles:true}))}render()});
window.addEventListener('storage',e=>{if(e.key===K||e.key===G)render()});window.renderTrackerPlus=render;render();
})();
