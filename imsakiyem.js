(()=>{'use strict';
const root='./.netlify/functions/imsakiyem';
const memo=new Map();
const tr=s=>String(s||'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]/g,'');
const arr=value=>{if(Array.isArray(value))return value;if(value&&typeof value==='object'){for(const k of ['data','result','results','items','list','records','rows','values','prayerTimes'])if(value[k]){const a=arr(value[k]);if(a.length)return a}}return []};
async function api(query){const key=JSON.stringify(query);if(memo.has(key))return memo.get(key);const params=new URLSearchParams(query),res=await fetch(root+'?'+params,{headers:{Accept:'application/json'}});let body;try{body=await res.json()}catch{throw Error('İmsakiyem yanıtı okunamadı')}if(!res.ok||!body.ok)throw Error(body.error||'İmsakiyem hizmeti cevap vermedi');memo.set(key,body.data);return body.data}
function field(o,keys){if(!o||typeof o!=='object')return undefined;const entry=Object.entries(o).find(([k])=>keys.some(x=>tr(k)===tr(x)));return entry?.[1]}
function locid(o){const v=field(o,['_id','id','stateId','districtId','ilceId','ilId','IlceID','IlID','StateID','DistrictID','value','locationId']);return /^\d+$/.test(String(v))?String(v):null}
function locname(o){return String(field(o,['name','title','stateName','districtName','ilceAdi','ilAdi','IlceAdi','IlAdi','locationName','label'])||'')}
async function location(city,district){const states=arr(await api({type:'states'}));const state=states.find(x=>tr(locname(x))===tr(city));if(!state)throw Error(city+' ilinin API kimliği bulunamadı');const stateId=locid(state);if(!stateId)throw Error('İl kimliği okunamadı');const districts=arr(await api({type:'districts',stateId}));if(!districts.length)throw Error(city+' ilçeleri yüklenemedi');let chosen=district&&district!=='Konumum'?districts.find(x=>tr(locname(x))===tr(district)):null;if(district&&!chosen&&district!=='Konumum')throw Error(district+' ilçesi API listesinde bulunamadı; ilçe seçimini güncelleyin');if(!chosen)chosen=districts.find(x=>['merkez',tr(city),tr(city)+'merkez'].includes(tr(locname(x))))||districts[0];const id=locid(chosen);if(!id)throw Error('İlçe kimliği bulunamadı');return {id,name:locname(chosen)}}
function dateValue(v){const s=String(v||'').trim();let m;if(m=s.match(/^(\d{4})-(\d{2})-(\d{2})/))return `${m[3]}-${m[2]}-${m[1]}`;if(m=s.match(/^(\d{2})[./-](\d{2})[./-](\d{4})/))return `${m[1]}-${m[2]}-${m[3]}`;return null}
function time(v){if(v&&typeof v==='object')v=field(v,['time','value']);const m=String(v||'').match(/(?:^|\D)(\d{1,2}):(\d{2})(?:\D|$)/);return m&&+m[1]<24&&+m[2]<60?String(+m[1]).padStart(2,'0')+':'+m[2]:null}
function mapRow(row){const t=field(row,['timings','times','vakitler','prayerTimes'])||row;const dates=field(row,['date','tarih','miladiTarih','MiladiTarih','MiladiTarihKisa','gregorianDate','dateString']);const date=dateValue(typeof dates==='object'?field(dates,['date','tarih']):dates);const cols={Fajr:['Imsak','İmsak','fajr','imsakVakti'],Sunrise:['Gunes','Güneş','sunrise','gunesVakti'],Dhuhr:['Ogle','Öğle','dhuhr','ogleVakti'],Asr:['Ikindi','İkindi','asr','ikindiVakti'],Maghrib:['Aksam','Akşam','maghrib','aksamVakti'],Isha:['Yatsi','Yatsı','isha','yatsiVakti']};const timings={};for(const [k,names] of Object.entries(cols))timings[k]=time(field(t,names));if(!date||Object.values(timings).some(x=>!x))return null;const hijri=field(row,['hijri_date','hicriTarih','HicriTarih','hijriDate','hijri'])||'';
const hijriMonth=typeof hijri==='object'?Number(field(hijri,['month','ay']))||null:null;
const hijriDay=typeof hijri==='object'?Number(field(hijri,['day','gun']))||null:null;
const hijriLabel=typeof hijri==='object'?String(field(hijri,['full_date','fullDate','text'])||'—'):String(hijri||'—');
return {date,timings,hijriLabel,hijriMonth,hijriDay,holidays:[]}}
async function fetchMonth(year,month,city,district){const loc=await location(city,district);const cacheKey=`haydi.imsakiyem.v9.${loc.id}.${year}.${month}`;let saved;try{saved=JSON.parse(localStorage.getItem(cacheKey)||'null')}catch{}if(saved&&Date.now()-saved.savedAt<6*3600000)return {data:saved.rows,cache:false,source:'Ezan Vakti İmsakiyem'};try{const payload=await api({type:'month',districtId:loc.id,year,month});const source=arr(payload);const rows=source.map(mapRow).filter(Boolean).filter(x=>{const [d,m,y]=x.date.split('-').map(Number);return m===month&&y===year}).sort((a,b)=>a.date.slice(6).localeCompare(b.date.slice(6))||Number(a.date.slice(3,5))-Number(b.date.slice(3,5))||Number(a.date.slice(0,2))-Number(b.date.slice(0,2)));if(!rows.length)throw Error('API yanıtındaki vakit alanları doğrulanamadı; geçersiz saat gösterilmiyor');try{localStorage.setItem(cacheKey,JSON.stringify({savedAt:Date.now(),rows}))}catch{}return {data:rows,cache:false,source:'Ezan Vakti İmsakiyem'}}catch(e){if(saved?.rows?.length)return {data:saved.rows,cache:true,source:'Ezan Vakti İmsakiyem'};throw e}}

// İmsakiyem yanıt vermezse, önceki çalışan hesaplama kaynağına güvenli geçiş.
const latin=s=>String(s).replace(/[ÇĞİÖŞÜçğıöşü]/g,ch=>({'Ç':'C','Ğ':'G','İ':'I','Ö':'O','Ş':'S','Ü':'U','ç':'c','ğ':'g','ı':'i','ö':'o','ş':'s','ü':'u'}[ch]||ch));
async function fallbackMonth(year,month,city){
 const cacheKey=`haydi.aladhan.v11.${city}.${year}.${month}`;
 let old=null;try{old=JSON.parse(localStorage.getItem(cacheKey)||'null')}catch{}
 if(old?.rows?.length&&Date.now()-old.savedAt<6*3600000)return {data:old.rows,cache:false,source:'AlAdhan (Diyanet hesaplama yöntemi)'};
 const coords=(()=>{try{return JSON.parse(localStorage.getItem('vakit.coordinates')||'null')}catch{return null}})();
 const query=new URLSearchParams({method:'13',school:'1'});
 let url;
 if(coords&&Number.isFinite(+coords.lat)&&Number.isFinite(+coords.lon)){
   query.set('latitude',String(coords.lat));query.set('longitude',String(coords.lon));
   url=`https://api.aladhan.com/v1/calendar/${year}/${month}?${query}`;
 }else{
   query.set('city',latin(city));query.set('country','Turkey');
   url=`https://api.aladhan.com/v1/calendarByCity/${year}/${month}?${query}`;
 }
 try{
  const res=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(14000)});
  if(!res.ok)throw Error('Yedek kaynak HTTP '+res.status);
  const payload=await res.json();
  if(payload.code!==200||!Array.isArray(payload.data))throw Error('Yedek kaynak yanıtı geçersiz');
  const cols=['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];
  const rows=payload.data.map(item=>{
   const date=String(item.date?.gregorian?.date||'');
   const timings=Object.fromEntries(cols.map(c=>[c,time(item.timings?.[c])]));
   if(!/^\d{2}-\d{2}-\d{4}$/.test(date)||Object.values(timings).some(x=>!x))return null;
   const hijri=item.date?.hijri||{};
   return {date,timings,hijriLabel:[hijri.day,hijri.month?.en,hijri.year].filter(Boolean).join(' ')||'—',hijriMonth:Number(hijri.month?.number)||null,hijriDay:Number(hijri.day)||null,holidays:hijri.holidays||[]};
  }).filter(Boolean);
  if(rows.length<25)throw Error('Yedek kaynakta yeterli tarih doğrulanamadı');
  try{localStorage.setItem(cacheKey,JSON.stringify({savedAt:Date.now(),rows}))}catch{}
  return {data:rows,cache:false,source:'AlAdhan (Diyanet hesaplama yöntemi)',fallback:true};
 }catch(error){if(old?.rows?.length)return {data:old.rows,cache:true,source:'AlAdhan (Diyanet hesaplama yöntemi)',fallback:true};throw error}
}
async function resilientFetchMonth(year,month,city,district){
 try{return await fetchMonth(year,month,city,district)}
 catch(primaryError){
   try{const secondary=await fallbackMonth(year,month,city);return {...secondary,primaryError:String(primaryError.message||primaryError).slice(0,180)}}
   catch(secondaryError){throw Error('İmsakiyem: '+primaryError.message+'; AlAdhan: '+secondaryError.message)}
 }
}
window.HaydiImsakiyem={fetchMonth:resilientFetchMonth};
})();
