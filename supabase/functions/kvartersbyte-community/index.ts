const companies=['finnvedsbostader','balder','nivika','heimstaden'];
const uuid=s=>typeof s==='string'&&/^[a-f0-9-]{36}$/.test(s);
const text=(s,min,max)=>typeof s==='string'&&s.trim().length>=min&&s.trim().length<=max;
const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const base=Deno.env.get('SUPABASE_URL');
const secret=Deno.env.get('SUPABASE_SECRET_KEYS')?JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')).default:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
async function db(path,method='GET',body){const headers={apikey:secret,'Content-Type':'application/json',Prefer:'return=representation'};if(!secret?.startsWith('sb_secret_'))headers.Authorization='Bearer '+secret;const r=await fetch(base+'/rest/v1/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw new Error('database');return r.status===204?null:await r.json()}
const publicFields='id,company,building,scope,title,description,kind,category,price,photo,nickname,status,created_at,deadline,dimensions,floor_info,lift_available,carrying_help,collection_notes';
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 const allowed=origin==='https://kvartersbyte-independent.vercel.app'||/^https:\/\/kvartersbyte-independent-[a-z0-9-]+\.vercel\.app$/.test(origin);
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(allowed?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Headers':'content-type,x-device-key','Access-Control-Allow-Methods':'GET,POST,OPTIONS','X-Content-Type-Options':'nosniff'};
 const out=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(origin&&!allowed)return out({error:'Otillåten webbplats.'},403);
 try{
 const url=new URL(req.url),action=url.searchParams.get('action')||'feed';
 if(req.method==='GET'&&action==='pilot'){
  const [c]=await db('kb_pilot_config?select=active,company,area,ends_at,checked_at,privacy_confirmed,retention_approved,participant_limit&id=eq.true');
  const open=!!(c?.active&&c.privacy_confirmed&&c.retention_approved&&c.checked_at&&Date.now()-+new Date(c.checked_at)<86400000&&Date.now()<+new Date(c.ends_at));
  return out({open,company:c?.company,area:c?.area,ends_at:c?.ends_at,limit:c?.participant_limit||30,message:open?'Kostnadsfri, begränsad pilot. Varor kan ha ett pris.':'Pilotförberedelse: nya annonser och nya kontakter är pausade. Läsning, befintliga samtal och support fungerar.'});
 }
 if(req.method==='GET'&&action==='areas'){
  const company=url.searchParams.get('company');if(!companies.includes(company))return out({error:'Välj bolag.'},400);
  const rows=await db('kb_listings?select=building&company=eq.'+company+'&status=in.(active,reserved)&limit=500');return out({areas:[...new Set(rows.map(x=>x.building))].sort().slice(0,100)});
 }
 if(req.method==='GET'&&action==='listing'){
  const id=url.searchParams.get('id'),company=url.searchParams.get('company');if(!uuid(id)||!companies.includes(company))return out({error:'Ogiltig annonslänk.'},400);
  const rows=await db('kb_listings?select='+publicFields+'&id=eq.'+id+'&company=eq.'+company+'&status=in.(active,reserved)&expires_at=gt.'+encodeURIComponent(new Date().toISOString()));return rows.length?out({listing:rows[0],reputation:await db('rpc/kb_reputation','POST',{p_listing:id})}):out({error:'Annonsen har avslutats eller finns inte längre.'},404);
 }
 if(req.method==='GET'&&action==='feed'){
  const company=url.searchParams.get('company');if(!companies.includes(company))return out({error:'Välj fastighetsbolag.'},400);
  const building=(url.searchParams.get('building')||'').trim().toLocaleLowerCase('sv');if(building.length>80)return out({error:'Ogiltigt område.'},400);
  let filter='company=eq.'+company+'&status=in.(active,reserved)&expires_at=gt.'+encodeURIComponent(new Date().toISOString());
  // Filtering is not membership authorization. Only company-wide posts cross building filters.
  if(building)filter+='&or='+encodeURIComponent('(scope.eq.company,building.eq.'+JSON.stringify(building)+')');
  const ids=url.searchParams.get('ids');if(ids!==null){const list=ids.split(',');if(list.length>100||!list.every(uuid))return out({error:'Ogiltiga sparade annonser.'},400);filter+='&id=in.('+list.join(',')+')'}
  const rows=await db('kb_listings?select='+publicFields+'&'+filter+'&order=created_at.desc&limit='+(ids?100:40));return out({listings:rows});
 }
 const token=req.headers.get('x-device-key')||'';if(!/^[a-f0-9]{64}$/.test(token))return out({error:'Din privata webbläsarnyckel saknas.'},401);
 const me=await digest(token);
 if(req.method==='GET'&&action==='support')return out({cases:await db('kb_support_requests?select=id,category,body,answer,status,created_at,updated_at&owner_hash=eq.'+me+'&order=created_at.desc&limit=30')});
 if(req.method==='GET'&&action==='export'){
  const listings=await db('kb_listings?select='+publicFields+'&owner_hash=eq.'+me);
  const threads=await db('kb_threads?select=id,listing_id,buyer_name,created_at&or=(seller_hash.eq.'+me+',buyer_hash.eq.'+me+')&limit=100');
  for(const t of threads){const messages=await db('kb_messages?thread_id=eq.'+t.id+'&order=created_at.asc&limit=500');t.messages=messages.map(x=>({body:x.body,created_at:x.created_at,mine:x.sender_hash===me}))}
  const cases=await db('kb_support_requests?select=id,category,body,answer,status,created_at&owner_hash=eq.'+me);
  return out({exported_at:new Date().toISOString(),listings,threads,support:cases,note:'Export av uppgifter som kan nås med denna privata webbläsarnyckel. Återställningsnyckeln ingår inte.'});
 }
 if(req.method==='GET'&&action==='handoff'){
  const id=url.searchParams.get('thread');if(!uuid(id))return out({error:'Ogiltig konversation.'},400);
  const ts=await db('kb_threads?id=eq.'+id+'&or=(seller_hash.eq.'+me+',buyer_hash.eq.'+me+')');const t=ts[0];if(!t)return out({error:'Konversationen hittades inte.'},404);
  const hs=await db('kb_handoffs?thread_id=eq.'+id);const h=hs[0];if(!h)return out({handoff:null});
  const feedback=await db('kb_feedback?handoff_id=eq.'+h.id+'&author_hash=eq.'+me+'&select=rating');
  return out({handoff:{id:h.id,status:h.status,starts_at:h.starts_at,ends_at:h.ends_at,meeting:h.meeting,can_agree:h.proposer_hash!==me,my_done:t.seller_hash===me?h.seller_done:h.buyer_done,other_done:t.seller_hash===me?h.buyer_done:h.seller_done,rating:feedback[0]?.rating||null}});
 }
 if(req.method==='GET'&&action==='mine')return out({listings:await db('kb_listings?select='+publicFields+'&owner_hash=eq.'+me+'&status=neq.removed&order=created_at.desc&limit=100')});
 if(req.method==='GET'&&action==='inbox'){
  const threads=await db('rpc/kb_inbox','POST',{p_hash:me});return out({threads});
 }
 if(req.method==='GET'&&action==='messages'){
  const id=url.searchParams.get('thread');if(!uuid(id))return out({error:'Ogiltig konversation.'},400);
  const ts=await db('kb_threads?id=eq.'+id+'&or=(seller_hash.eq.'+me+',buyer_hash.eq.'+me+')');if(!ts.length)return out({error:'Konversationen hittades inte.'},404);
  const rows=await db('kb_messages?thread_id=eq.'+id+'&order=created_at.desc,id.desc&limit=150');return out({messages:rows.reverse().map(x=>({id:x.id,body:x.body,mine:x.sender_hash===me,created_at:x.created_at}))});
 }
 if(req.method!=='POST')return out({error:'Okänd åtgärd.'},404);
 const raw=await req.text();if(raw.length>190000)return out({error:'Bilden eller texten är för stor.'},413);
 let b;try{b=JSON.parse(raw);if(!b||typeof b!=='object'||Array.isArray(b))throw Error()}catch{return out({error:'Ogiltiga uppgifter.'},400)}
 const ip=req.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown';
 const iphash=await digest(secret+new Date().toISOString().slice(0,10)+ip);
 if(!await db('rpc/kb_rate','POST',{p_actor:'ip:'+iphash,p_limit:100})||!await db('rpc/kb_rate','POST',{p_actor:'device:'+me,p_limit:35}))return out({error:'För många försök. Försök igen om en timme.'},429);
 if(action==='support'){
  if(!['support','privacy','abuse'].includes(b.category)||!text(b.body,5,2000))return out({error:'Välj ärendetyp och beskriv ditt ärende (5–2000 tecken).'},400);
  const row=await db('kb_support_requests?select=id,status,created_at','POST',{owner_hash:me,category:b.category,body:b.body.trim()});return out({case:row[0]},201);
 }
 if(action==='handoff'){
  if(!uuid(b.thread)||!['propose','agree','cancel','complete','feedback'].includes(b.action))return out({error:'Ogiltig överlämning.'},400);
  try{return out(await db('rpc/kb_handoff_action','POST',{p_hash:me,p_thread:b.thread,p_action:b.action,p_data:b.data||{}}))}catch{return out({error:'Åtgärden kunde inte genomföras. Kontrollera aktuell status, mötesplats och tid. En annan person kan redan ha reserverat saken.'},409)}
 }
 if(action==='publish'||action==='edit'){
  if(!companies.includes(b.company)||!text(b.building,2,80)||!['building','company'].includes(b.scope)||!text(b.title,3,80)||!text(b.description,5,1200)||!text(b.nickname,1,40)||!['sell','give','lend','wanted'].includes(b.kind)||!['furniture','home','tools','plants','kids','other'].includes(b.category)||!Number.isInteger(b.price)||b.price<0||b.price>1000000)return out({error:'Kontrollera annonsens uppgifter.'},400);
  if(b.photo&&(!/^data:image\/(webp|jpeg);base64,[A-Za-z0-9+/=]+$/.test(b.photo)||b.photo.length>=180000))return out({error:'Ogiltig bild. Använd en mindre bild.'},400);
  const deadline=b.deadline?new Date(b.deadline):null;if(deadline&&(!Number.isFinite(+deadline)||deadline<new Date()||deadline>new Date(Date.now()+60*86400000)))return out({error:'Sista hämtdatum ska ligga inom de närmaste 60 dagarna.'},400);
  for(const [field,max] of [['dimensions',100],['floor_info',100],['collection_notes',300]])if(b[field]!==undefined&&(typeof b[field]!=='string'||b[field].length>max))return out({error:'Kontrollera hämtinformationen.'},400);
  const row={company:b.company,building:b.building.trim().replace(/\s+/g,' ').toLocaleLowerCase('sv'),scope:b.scope,title:b.title.trim(),description:b.description.trim(),nickname:b.nickname.trim(),kind:b.kind,category:b.category,price:b.kind==='sell'?b.price:0,photo:b.photo||null,owner_hash:me,deadline:deadline?.toISOString()||null,expires_at:deadline?.toISOString()||new Date(Date.now()+60*86400000).toISOString(),dimensions:b.dimensions||'',floor_info:b.floor_info||'',lift_available:typeof b.lift_available==='boolean'?b.lift_available:null,carrying_help:b.carrying_help===true,collection_notes:b.collection_notes||''};
  if(action==='edit'){
   if(!uuid(b.id))return out({error:'Ogiltig annons.'},400);
   const result=await db('kb_listings?id=eq.'+b.id+'&owner_hash=eq.'+me+'&company=eq.'+b.company+'&status=eq.active&select='+publicFields,'PATCH',row);return result.length?out({listing:result[0]}):out({error:'Bara egna, aktiva annonser kan ändras. Avboka en överlämning först.'},403);
  }
  const admission=await db('rpc/kb_pilot_admit','POST',{p_hash:me,p_company:row.company,p_area:row.building});if(!admission.allowed)return out({error:admission.reason},423);
  row.is_test=/^QA[ _]/.test(row.title);
  const result=await db('kb_listings?select='+publicFields,'POST',row);return out({listing:result[0]},201);
 }
 if(action==='close'||action==='remove'){
  if(!uuid(b.id))return out({error:'Ogiltig annons.'},400);
  const rows=await db('kb_listings?id=eq.'+b.id+'&owner_hash=eq.'+me+'&status=neq.reserved&select=id','PATCH',{status:action==='close'?'closed':'removed',...(action==='remove'?{removed_at:new Date().toISOString()}:{})});return rows.length?out({ok:true}):out({error:'Annonsen tillhör inte denna webbläsare, eller har en bekräftad överlämning som först måste avbokas.'},403);
 }
 if(action==='contact'){
  if(!uuid(b.id)||!text(b.name,1,40)||!text(b.body,1,1200))return out({error:'Fyll i namn och meddelande.'},400);
  const ls=await db('kb_listings?id=eq.'+b.id+'&status=eq.active&expires_at=gt.'+encodeURIComponent(new Date().toISOString()));const l=ls[0];if(!l)return out({error:'Annonsen är inte längre tillgänglig.'},404);if(l.owner_hash===me)return out({error:'Det här är din egen annons.'},400);
  const blocks=await db('kb_blocks?or=(and(blocker_hash.eq.'+l.owner_hash+',blocked_hash.eq.'+me+'),and(blocker_hash.eq.'+me+',blocked_hash.eq.'+l.owner_hash+'))');if(blocks.length)return out({error:'Kontakten är blockerad.'},403);
  let ts=await db('kb_threads?listing_id=eq.'+b.id+'&buyer_hash=eq.'+me);if(!ts.length){const admission=await db('rpc/kb_pilot_admit','POST',{p_hash:me,p_company:l.company,p_area:l.building});if(!admission.allowed)return out({error:admission.reason},423);try{ts=await db('kb_threads','POST',{listing_id:b.id,seller_hash:l.owner_hash,buyer_hash:me,buyer_name:b.name.trim()})}catch{ts=await db('kb_threads?listing_id=eq.'+b.id+'&buyer_hash=eq.'+me)}}
  await db('kb_messages','POST',{thread_id:ts[0].id,sender_hash:me,body:b.body.trim()});return out({thread:ts[0].id},201);
 }
 if(['reply','block'].includes(action)){
  if(!uuid(b.thread))return out({error:'Ogiltig konversation.'},400);
  const ts=await db('kb_threads?id=eq.'+b.thread+'&or=(seller_hash.eq.'+me+',buyer_hash.eq.'+me+')');const t=ts[0];if(!t)return out({error:'Konversationen hittades inte.'},404);const other=t.seller_hash===me?t.buyer_hash:t.seller_hash;
  if(action==='block'){const existing=await db('kb_blocks?blocker_hash=eq.'+me+'&blocked_hash=eq.'+other+'&select=blocker_hash');if(!existing.length)await db('kb_blocks','POST',{blocker_hash:me,blocked_hash:other});return out({ok:true})}
  const blocks=await db('kb_blocks?or=(and(blocker_hash.eq.'+me+',blocked_hash.eq.'+other+'),and(blocker_hash.eq.'+other+',blocked_hash.eq.'+me+'))');if(blocks.length)return out({error:'Kontakten är blockerad.'},403);
  if(!text(b.body,1,1200))return out({error:'Skriv ett meddelande.'},400);await db('kb_messages','POST',{thread_id:t.id,sender_hash:me,body:b.body.trim()});return out({ok:true},201);
 }
 if(action==='report'){
  if(!uuid(b.id)||!text(b.reason,3,400))return out({error:'Beskriv problemet.'},400);
  const existing=await db('kb_reports?listing_id=eq.'+b.id+'&reporter_hash=eq.'+me+'&select=id');if(!existing.length)await db('kb_reports','POST',{listing_id:b.id,reporter_hash:me,reason:b.reason.trim()});return out({ok:true});
 }
 return out({error:'Okänd åtgärd.'},404);
 }catch{return out({error:'Tjänsten kunde inte slutföra åtgärden. Försök igen.'},500)}
});
