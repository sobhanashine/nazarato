// An isolated loopback PostgREST substitute. Never imports an .env or a real
// project connection. Fictional records exist only in this test process.
import http from "node:http";
import { spawn } from "node:child_process";
const port = Number(process.env.NAZARATO_RECOVERY_PORT || 4321);
const dbPort = port + 1;
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
let mode = "normal", votes = [], profiles = [], actions = [], reviews = [], analysisRows = [], corrections = [];
const model = {model_id:"nazarato-fa-rules",model_version:"0.1.0"};
const businesses = [1,2,3,4].map(n => {
  const facts = {name:`مکان آزمایشی جدا ${n}`,category_slug:"cafe",city:"رشت",neighborhood_slug:"golsar",contact:{address:"نشانی آزمایشی گلسار"}};
  return {id:id(n),slug:`isolated-cafe-${n}`,type:"company",status:"active",...facts,initial:"م",color:"#20584B",info:[{label:"نشانی",value:facts.contact.address}],description:"رکورد مصنوعیِ آزمون جدا",verified:false,claimed:false,owner_id:n===1?id(900):null,review_count:n===1?6:0,rating_avg:4,created_at:"2026-09-01T12:00:00Z",business_sources:[{status:"approved",source_type:"open_dataset",permission_basis:"open_license",source_ref:"https://example.invalid/test-only",license_name:"Test-only source",license_url:"https://example.invalid/license",attribution_text:"منبع مصنوعی آزمون",field_payload:facts}]};
});
const users = [900,901,902].map(n=>({id:id(n),phone:`+98900000000${n-899}`,display_name:"کاربر آزمون جدا",username:`isolated-${n}`,avatar_color:"#20584B",role:n===902?"admin":"consumer",public_profile:true,is_banned:false,created_at:"2026-09-01",reviews_count:0}));
const initialReviews = [1,2,3,4,5,6].map(n => {
  const negative=n<=3;
  const body=negative?"سرویس بد بود؛ فضای آرام و خوب":"سرویس خوب بود؛ فضای آرام و خوب";
  const aspect_scores={atmosphere:{net:1,confidence:0.8,positive:1,negative:0,mentions:1},service:{net:negative?-1:1,confidence:0.8,positive:negative?0:1,negative:negative?1:0,mentions:1}};
  const evidence_spans=[{aspect:"atmosphere",polarity:"positive",excerpt:"فضای آرام و خوب",start:0,end:10,cue:"خوب"},{aspect:"service",polarity:negative?"negative":"positive",excerpt:negative?"سرویس بد بود":"سرویس خوب بود",start:0,end:10,cue:negative?"بد":"خوب"}];
  return {id:id(100+n),author_id:id(200+n),business_id:id(1),status:"published",origin_kind:"first_party",body,rating:negative?2:5,created_at:negative?"2026-08-15T12:00:00Z":"2026-09-15T12:00:00Z",verified:false,helpful_count:0,author:{id:id(200+n),display_name:"نویسنده آزمون",username:null,avatar_color:"#20584B"},business:businesses[0],review_analyses:[{review_id:id(100+n),...model,is_active:true,human_status:"unreviewed",confidence:0.8,suspicious_score:0,aspect_scores,evidence_spans,sentiment:negative?"mixed":"positive",issue_cluster:negative?"service_experience":null}]};
});
function reset() { mode="normal";votes=[];profiles=[];corrections=[];reviews=structuredClone(initialReviews);analysisRows=reviews.flatMap(r=>r.review_analyses);actions=[{id:id(800),business_id:id(1),created_by:id(900),title:"بهبود سرویس آزمایشی",target_aspect:"service",target_issue_cluster:"service_experience",baseline_window_start:"2026-06-04",baseline_window_end:"2026-09-01",baseline_review_count:3,baseline_negative_mentions:3,baseline_negative_rate:1,target_reduction_pct:50,target_negative_rate:0.5,follow_up_date:"2026-09-30",model_id:model.model_id,model_version:model.model_version,metric_version:"qualified-review-rate/1",status:"active",created_at:"2026-09-01",measured_at:null}]; }
reset();
function filterRows(rows,url) {
  return rows.filter(row=>[...url.searchParams].every(([key,value])=>{
    if (["select","order","limit","offset"].includes(key)) return true;
    if (key.includes(".")) return mode !== "revoked"; // embedded source gates
    const [op,...rest]=value.split(".");const target=rest.join(".");const v=row[key];
    if(op==="eq") return String(v)===target;
    if(op==="neq") return String(v)!==target;
    if(op==="in") return target.slice(1,-1).split(",").includes(String(v));
  if(op==="gte") return String(v)>=target;
    if(op==="lte") return String(v)<=target;
    if(op==="gt") return Number(v)>Number(target);
    if(op==="is") return target==="null"?v==null:String(v)===target;
    return true;
  })).slice(0,Number(url.searchParams.get("limit")||5000));
}
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,`http://127.0.0.1:${dbPort}`);
  if(url.pathname==="/__control"){reset();mode=url.searchParams.get("mode")||"normal";res.writeHead(200,{"content-type":"application/json"}).end("{}");return;}
  let raw="";for await(const chunk of req) raw+=chunk;
  const table=url.pathname.split("/").at(-1);
  if(mode==="unavailable"){res.writeHead(503,{"content-type":"application/json"}).end(JSON.stringify({message:"isolated outage",code:"TEST"}));return;}
  let rows;
  if(table==="save_real_taste_profile"){
    const input=JSON.parse(raw);profiles=profiles.filter(p=>p.user_id!==input.p_user_id);profiles.push({user_id:input.p_user_id,model_id:"nabz-real-evidence",model_version:"1.0.0",is_active:true,dimension_weights:input.p_profile});res.writeHead(204).end();return;
  }
  if(table==="comparison_votes" && req.method==="POST"){
    const input=JSON.parse(raw);const pair=[input.winner_business_id,input.loser_business_id].sort().join(":");
    if(votes.some(v=>v.pair===pair&&v.scenario_slug===input.scenario_slug&&v.user_id===input.user_id&&v.anonymous_session_id===input.anonymous_session_id)){res.writeHead(409,{"content-type":"application/json"}).end(JSON.stringify({code:"23505"}));return;}
    votes.push({moderation_status:"accepted",weight:1,vote_window:new Date().toISOString().slice(0,10),...input,id:id(1000+votes.length),pair,created_at:new Date().toISOString()});res.writeHead(201).end();return;
  }
  if(table==="reviews" && req.method==="POST") {
    const input=JSON.parse(raw);
    if(reviews.some(r=>r.author_id===input.author_id&&r.business_id===input.business_id)){res.writeHead(409,{"content-type":"application/json"}).end(JSON.stringify({code:"23505"}));return;}
    const review={...input,id:id(700+reviews.length),created_at:new Date().toISOString(),helpful_count:0,author:users.find(u=>u.id===input.author_id),business:businesses.find(b=>b.id===input.business_id)};
    reviews.push(review);rows=[review];
  } else if(table==="reviews" && req.method==="PATCH") {
    rows=filterRows(reviews,url);for(const row of rows) Object.assign(row,JSON.parse(raw));
  } else if(table==="review_analyses" && req.method==="POST") {
    const input=JSON.parse(raw);analysisRows.push(input);rows=[input];
  } else if(table==="review_analyses" && req.method==="PATCH") {
    rows=filterRows(analysisRows,url);for(const row of rows) Object.assign(row,JSON.parse(raw));
  } else if(table==="review_analysis_corrections" && req.method==="POST") {
    const input={...JSON.parse(raw),id:id(750+corrections.length),corrected_at:new Date().toISOString()};corrections.push(input);rows=[input];
  } else if(table==="business_improvement_actions" && req.method==="POST") {
    const input=JSON.parse(raw);
    if(actions.some(a=>a.business_id===input.business_id&&["planned","active"].includes(a.status))){res.writeHead(409,{"content-type":"application/json"}).end(JSON.stringify({code:"23505"}));return;}
    const action={...input,id:id(800+actions.length),created_at:new Date().toISOString(),measured_at:null};actions.push(action);rows=[action];
  } else if(table==="business_improvement_actions" && req.method==="PATCH"){
    rows=filterRows(actions,url);for(const row of rows) Object.assign(row,JSON.parse(raw));
  } else if(table==="businesses") rows=filterRows(mode==="sparse"?businesses.slice(0,2):mode==="revoked"?[]:businesses,url);
  else if(table==="business_sources") rows=filterRows(mode==="revoked"?[]:businesses.map(b=>({business_id:b.id,...b.business_sources[0]})),url);
  else if(table==="reviews") rows=filterRows(mode==="weak"?reviews.slice(0,2):reviews,url).map(r=>({...r,review_analyses:analysisRows.filter(a=>a.review_id===r.id),businesses:r.business,users:r.author}));
  else if(table==="review_analyses") rows=filterRows(analysisRows,url);
  else if(table==="review_analysis_corrections") rows=filterRows(corrections,url);
  else if(table==="users") rows=filterRows(users,url).map(u=>mode==="private-user"&&u.id===id(901)?{...u,public_profile:false,display_name:"PRIVATE_PROFILE_IDENTITY"}:u);
  else if(table==="comparison_votes") rows=filterRows(votes,url);
  else if(table==="taste_profiles") rows=filterRows(profiles,url);
  else if(table==="business_improvement_actions") rows=filterRows(actions,url);
  else rows=[];
  if(req.headers.accept?.includes("vnd.pgrst.object") && rows.length!==1){res.writeHead(406,{"content-type":"application/json"}).end(JSON.stringify({code:"PGRST116",details:`The result contains ${rows.length} rows`,message:"JSON object requested, multiple (or no) rows returned"}));return;}
  res.writeHead(200,{"content-type":"application/json","content-range":`0-${Math.max(0,rows.length-1)}/${rows.length}`}).end(req.headers.accept?.includes("vnd.pgrst.object")?JSON.stringify(rows[0]):JSON.stringify(rows));
});
server.listen(dbPort,"127.0.0.1",()=>{
  // Explicit blank overrides prevent Next's dotenv loader from restoring real
  // optional-provider keys from the checkout's .env.local.
  const env={...process.env,NODE_ENV:"development",NEXT_PUBLIC_SUPABASE_URL:`http://127.0.0.1:${dbPort}`,SUPABASE_SERVICE_ROLE_KEY:"isolated-test-key-only",JWT_SECRET:"isolated-nazarato-recovery-secret-32-chars",OTP_HASH_SECRET:"isolated-nazarato-otp-secret-32-chars",NAZARATO_LOCAL_PREVIEW:"false",NEXT_PUBLIC_SMFLOW_ENABLED:"false",KAVENEGAR_API_KEY:"",KAVENEGAR_TEMPLATE:"",GEMINI_API_KEY:"",WP_API_URL:"",VAPID_PRIVATE_KEY:"",VAPID_PUBLIC_KEY:"",NEXT_PUBLIC_VAPID_PUBLIC_KEY:"",NEXT_PUBLIC_SUPABASE_ANON_KEY:"",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:""};
  const next=spawn(process.execPath,["node_modules/next/dist/bin/next","dev","-p",String(port),"--hostname","127.0.0.1"],{stdio:"inherit",env});
  const stop=()=>{next.kill("SIGTERM");server.close();};process.on("SIGTERM",stop);process.on("SIGINT",stop);
  next.on("exit",code=>{server.close();process.exit(code||0);});
});
