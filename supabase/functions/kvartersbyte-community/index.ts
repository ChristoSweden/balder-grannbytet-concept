const companies=['finnvedsbostader','balder','nivika','heimstaden'];
const uuid=s=>typeof s==='string'&&/^[a-f0-9-]{36}$/.test(s);
const text=(s,min,max)=>typeof s==='string'&&s.trim().length>=min&&s.trim().length<=max;
const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const base=Deno.env.get('SUPABASE_URL');
const secret=Deno.env.get('SUPABASE_SECRET_KEYS')?JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')).default:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
async function db(path,method='GET',body){const headers={apikey:secret,'Content-Type':'application/json',Prefer:'return=representation'};if(!secret?.startsWith('sb_secret_'))headers.Authorization='Bearer '+secret;const r=await fetch(base+'/rest/v1/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw new Error('database');return r.status===204?null:await r.json()}
const publicFields='id,company,building,scope,title,description,kind,category,price,photo,nickname,status,created_at';
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 const allowed=origin==='https://kvartersbyte-independent.vercel.app'||/^https:\/\/kvartersbyte-independent-[a-z0-9-]+\.vercel\.app$/.test(origin);
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(allowed?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Headers':'content-type,x-device-key','Access-Control-Allow-Methods':'GET,POST,OPTIONS','X-Content-Type-Options':'nosniff'};
 const out=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(origin&&!allowed)return out({error:'Otillåten webbplats.'},403);
 try{
 const url=new URL(req.url),action=url.searchParams.get('action')||'feed';
 if(req.method==='GET'&&action==='feed'){
  const company=url.searchParams.get('company');if(!companies.includes(company))return out({error:'Välj fastighetsbolag.'},400);
  const building=(url.searchParams.get('building')||'').trim().toLocaleLowerCase('sv');if(building.length>80)return out({error:'Ogiltigt område.'},400);
  let filter='company=eq.'+company+'&status=eq.active&expires_at=gt.'+encodeURIComponent(new Date().toISOString());
  // Filtering is not membership authorization. Only company-wide posts cross building filters.
  if(building)filter+='&or='+encodeURIComponent('(scope.eq.company,building.eq.'+JSON.stringify(building)+')');
  const rows=await db('kb_listings?select='+publicFields+'&'+filter+'&order=created_at.desc&limit=40');return out({listings:rows});
 }
 const token=req.headers.get('x-device-key')||'';if(!/^[a-f0-9]{64}$/.test(token))return out({error:'Din privata webbläsarnyckel saknas.'},401);
 const me=await digest(token);
 if(req.method==='GET'&&action==='mine')return out({listings:await db('kb_listings?select='+publicFields+'&owner_hash=eq.'+me+'&status=neq.removed&order=created_at.desc&limit=100')});
 if(req.method==='GET'&&action==='inbox'){
  const threads=await db('kb_threads?select=id,listing_id,buyer_name,created_at&or=(seller_hash.eq.'+me+',buyer_hash.eq.'+me+')&order=created_at.desc&limit=60');
  for(const t of threads){const l=await db('kb_listings?select=title,nickname,company&id=eq.'+t.listing_id);t.listing=l[0]||null}return out({threads});
 }
 if(req.method==='GET'&&action==='messages'){
  const id=url.searchParams.get('thread');if(!uuid(id))return out({error:'Ogiltig konversation.'},400);
  const ts=await db('kb_threads?id=eq.'+id+'&or=(seller_hash.eq.'+me+',buyer_hash.eq.'+me+')');if(!ts.length)return out({error:'Konversationen hittades inte.'},404);
  const rows=await db('kb_messages?thread_id=eq.'+id+'&order=created_at.asc&limit=150');return out({messages:rows.map(x=>({id:x.id,body:x.body,mine:x.sender_hash===me,created_at:x.created_at}))});
 }
 if(req.method!=='POST')return out({error:'Okänd åtgärd.'},404);
 const raw=await req.text();if(raw.length>190000)return out({error:'Bilden eller texten är för stor.'},413);
 let b;try{b=JSON.parse(raw);if(!b||typeof b!=='object'||Array.isArray(b))throw Error()}catch{return out({error:'Ogiltiga uppgifter.'},400)}
 const ip=req.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown';
 const iphash=await digest(secret+new Date().toISOString().slice(0,10)+ip);
 if(!await db('rpc/kb_rate','POST',{p_actor:'ip:'+iphash,p_limit:100})||!await db('rpc/kb_rate','POST',{p_actor:'device:'+me,p_limit:35}))return out({error:'För många försök. Försök igen om en timme.'},429);
 if(action==='publish'){
  if(!companies.includes(b.company)||!text(b.building,2,80)||!['building','company'].includes(b.scope)||!text(b.title,3,80)||!text(b.description,5,1200)||!text(b.nickname,1,40)||!['sell','give','lend','wanted'].includes(b.kind)||!['furniture','home','tools','plants','kids','other'].includes(b.category)||!Number.isInteger(b.price)||b.price<0||b.price>1000000)return out({error:'Kontrollera annonsens uppgifter.'},400);
  if(b.photo&&(!/^data:image\/(webp|jpeg);base64,[A-Za-z0-9+/=]+$/.test(b.photo)||b.photo.length>=180000))return out({error:'Ogiltig bild. Använd en mindre bild.'},400);
  const row={company:b.company,building:b.building.trim().toLocaleLowerCase('sv'),scope:b.scope,title:b.title.trim(),description:b.description.trim(),nickname:b.nickname.trim(),kind:b.kind,category:b.category,price:b.kind==='sell'?b.price:0,photo:b.photo||null,owner_hash:me};
  const result=await db('kb_listings?select='+publicFields,'POST',row);return out({listing:result[0]},201);
 }
 if(action==='close'||action==='remove'){
  if(!uuid(b.id))return out({error:'Ogiltig annons.'},400);
  const rows=await db('kb_listings?id=eq.'+b.id+'&owner_hash=eq.'+me+'&select=id','PATCH',{status:action==='close'?'closed':'removed'});return rows.length?out({ok:true}):out({error:'Annonsen tillhör inte denna webbläsare.'},403);
 }
 if(action==='contact'){
  if(!uuid(b.id)||!text(b.name,1,40)||!text(b.body,1,1200))return out({error:'Fyll i namn och meddelande.'},400);
  const ls=await db('kb_listings?id=eq.'+b.id+'&status=eq.active&expires_at=gt.'+encodeURIComponent(new Date().toISOString()));const l=ls[0];if(!l)return out({error:'Annonsen är inte längre tillgänglig.'},404);if(l.owner_hash===me)return out({error:'Det här är din egen annons.'},400);
  const blocks=await db('kb_blocks?or=(and(blocker_hash.eq.'+l.owner_hash+',blocked_hash.eq.'+me+'),and(blocker_hash.eq.'+me+',blocked_hash.eq.'+l.owner_hash+'))');if(blocks.length)return out({error:'Kontakten är blockerad.'},403);
  let ts=await db('kb_threads?listing_id=eq.'+b.id+'&buyer_hash=eq.'+me);if(!ts.length){try{ts=await db('kb_threads','POST',{listing_id:b.id,seller_hash:l.owner_hash,buyer_hash:me,buyer_name:b.name.trim()})}catch{ts=await db('kb_threads?listing_id=eq.'+b.id+'&buyer_hash=eq.'+me)}}
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
