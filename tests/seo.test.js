const a=require('assert');
const http=require('http');
const fs=require('fs');
const path=require('path');
const PORT=process.env.PORT||8080;
const ROOT=path.join(__dirname,'..');

function get(p){return new Promise((ok,no)=>{
  const req=http.get({host:'127.0.0.1',port:PORT,path:p},res=>{
    const chunks=[];res.on('data',c=>chunks.push(c));
    res.on('end',()=>ok({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));
  });
  req.on('error',no);
});}

(async()=>{
  const expected=fs.readFileSync(path.join(ROOT,'public/google7570d22c73b229a8.html'));
  a.strictEqual(expected.toString('utf8'),'google-site-verification: google7570d22c73b229a8.html');
  const v=await get('/google7570d22c73b229a8.html');
  a.strictEqual(v.status,200);
  a.ok(/text\/html/i.test(v.headers['content-type']||''),'verification Content-Type must be text/html');
  a.ok(!v.headers.location,'verification must not redirect');
  a.ok(Buffer.compare(v.body,expected)===0,'verification body must be byte-identical');

  const r=await get('/robots.txt');
  a.strictEqual(r.status,200);
  const robots=r.body.toString('utf8');
  a.match(robots,/User-agent:\s*\*/);
  a.match(robots,/Allow:\s*\//);
  a.match(robots,/Sitemap:\s*https:\/\/errday-7080-night\.onrender\.com\/sitemap\.xml/);

  const s=await get('/sitemap.xml');
  a.strictEqual(s.status,200);
  a.match(s.body.toString('utf8'),/<loc>https:\/\/errday-7080-night\.onrender\.com\/<\/loc>/);

  const og=await get('/og-image.png');
  a.strictEqual(og.status,200);
  a.ok(/image\/png/i.test(og.headers['content-type']||''));

  const h=await get('/');
  a.strictEqual(h.status,200);
  const html=h.body.toString('utf8');
  a.match(html,/<html lang="ko">/);
  a.match(html,/name="referrer" content="strict-origin-when-cross-origin"/);
  const T='얼데이 나이트, 온라인 나이트, 메타버스 나이트 클럽 7080';
  a.ok(html.includes('<title>'+T+'</title>'),'exact <title>');
  a.ok(html.includes('property="og:title" content="'+T+'"'),'exact og:title');
  a.ok(html.includes('property="og:site_name" content="'+T+'"'),'exact og:site_name');
  a.ok(html.includes('name="twitter:title" content="'+T+'"'),'exact twitter:title');
  a.ok(html.includes('"name":"'+T+'"'),'exact JSON-LD name');
  a.ok(html.includes('<h1>'+T+'</h1>'),'exact lobby/noscript h1');
  a.ok(!html.includes('<h1>ERRDAY NIGHTCLUB</h1>'),'old English h1 gone');
  a.match(html,/meta name="description"/);
  a.match(html,/meta name="keywords"/);
  for(const k of ['얼데이 나이트','온라인 나이트','메타버스 나이트','메타버스 클럽','7080','당구','다트']){
    a.ok(html.includes(k),'missing keyword: '+k);
  }
  a.match(html,/name="keywords"[^>]*얼데이 나이트/);
  a.match(html,/name="keywords"[^>]*온라인 나이트/);
  a.match(html,/name="keywords"[^>]*메타버스 나이트/);
  a.match(html,/name="keywords"[^>]*메타버스 클럽/);
  a.match(html,/property="og:description"[^>]*메타버스 나이트/);
  a.match(html,/name="twitter:description"[^>]*온라인 나이트/);
  a.match(html,/class="seoIntro"/);
  a.match(html,/<noscript>/);
  a.match(html,/"alternateName":\[[^\]]*ERRDAY 7080 나이트/);
  a.match(html,/"alternateName":\[[^\]]*ERRDAY NIGHTCLUB/);
  a.match(html,/"keywords":"[^"]*얼데이 나이트[^"]*온라인 나이트[^"]*메타버스 나이트[^"]*메타버스 클럽/);

  a.match(html,/rel="canonical" href="https:\/\/errday-7080-night\.onrender\.com\/"/);
  a.match(html,/property="og:image" content="https:\/\/errday-7080-night\.onrender\.com\/og-image\.png"/);
  a.match(html,/name="twitter:card" content="summary_large_image"/);
  a.match(html,/application\/ld\+json/);
  a.match(html,/WebApplication/);
})().catch(e=>{console.error(e);process.exit(1);});
