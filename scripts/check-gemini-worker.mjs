// Actual workerd request semantics, with an intercepted provider. No credentials
// or requests leave this local test. Uses Wrangler's existing runtime packages.
import { build } from "esbuild";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
const result=await build({
  stdin:{contents:`import {requestGemini} from './lib/chat/gemini.ts'; export default {async fetch(){ const r=await requestGemini('isolated-runtime-test',{}); return Response.json({status:r.status}); }}`,resolveDir:process.cwd()},
  bundle:true,write:false,format:"esm",platform:"browser",
  define:{"process.env.GEMINI_MODEL":JSON.stringify("gemini-3.7-flash")},
});
let upstreamStatus=200, calls=0;
const mf=new Miniflare(convertV4MiniflareOptions({workers:[{
  name:"gemini-runtime-test",modules:true,compatibilityDate:"2026-09-30",
  script:result.outputFiles[0].text,
  outboundService:request=>{
    calls++;
    if(new URL(request.url).hostname!=="generativelanguage.googleapis.com" || request.headers.get("x-goog-api-key")!=="isolated-runtime-test")throw Error("Wrong provider target/header");
    return new Response(null,{status:upstreamStatus,headers:upstreamStatus===302?{location:"https://untrusted.invalid/"}:{}});
  },
}]}));
try {
  for(const status of [200,302]) {
    upstreamStatus=status;calls=0;
    const r=await mf.dispatchFetch("http://localhost/"); const d=await r.json();
    if(!r.ok || d.status!==status || calls!==1)throw Error("Worker provider request/redirect regression");
  }
  console.log("PASS: actual workerd sends Gemini request and never follows a provider redirect.");
} finally {await mf.dispose();}
