const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000,DB=path.join(__dirname,'data.json'),IDX=path.join(__dirname,'index.html');
const hash=(pw,s)=>crypto.scryptSync(String(pw),s,32).toString('hex');
function save(){fs.writeFileSync(DB+'.tmp',JSON.stringify(D));fs.renameSync(DB+'.tmp',DB)}
let D;try{D=JSON.parse(fs.readFileSync(DB))}catch(e){const salt=crypto.randomBytes(8).toString('hex');
D={products:[],orders:[],cfg:{salt,pw:hash(process.env.ADMIN_PASSWORD||'admin123',salt),wa:'07 94 20 15 32',pd:450,ph:550,ig:'https://www.instagram.com/by._syraa?exln=MW9qNHI4NGM3cmZjZw==',tt:'https://www.tiktok.com/@by._syraa?_r=1&_t=ZS-9ASvr5xSYAm'}};save()}
const S=new Map(),H=new Map();
const rl=(k,max,ms)=>{const n=Date.now(),a=(H.get(k)||[]).filter(t=>n-t<ms);a.push(n);H.set(k,a);return a.length<=max};
const str=(v,n)=>String(v==null?'':v).trim().slice(0,n);
http.createServer(async(req,res)=>{
const send=(c,o)=>{res.writeHead(c,{'Content-Type':'application/json'});res.end(JSON.stringify(o))};
const ip=(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();
const u=req.url.split('?')[0];
if(!u.startsWith('/api/')){try{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(fs.readFileSync(IDX))}catch(e){res.writeHead(500);return res.end('index.html missing')}}
const auth=()=>(S.get((req.headers.authorization||'').slice(7))||0)>Date.now();
const body=()=>new Promise(r=>{let b='',n=0;req.on('data',c=>{n+=c.length;if(n>6e6){req.destroy();return}b+=c});req.on('end',()=>{try{r(JSON.parse(b||'{}'))}catch(e){r({})}})});
const m=req.method,C=D.cfg;
if(m==='GET'&&u==='/api/state')return send(200,{products:D.products,cfg:{wa:C.wa,pd:C.pd,ph:C.ph,ig:C.ig,tt:C.tt}});
if(m==='POST'&&u==='/api/login'){if(!rl('l'+ip,8,6e5))return send(429,{error:'rate'});const b=await body();
const a=Buffer.from(hash(b.pw||'',C.salt)),c=Buffer.from(C.pw);
if(a.length===c.length&&crypto.timingSafeEqual(a,c)){const t=crypto.randomBytes(24).toString('hex');S.set(t,Date.now()+432e5);return send(200,{token:t})}return send(401,{error:'bad'})}
if(m==='POST'&&u==='/api/order'){if(!rl('o'+ip,10,36e5))return send(429,{error:'rate'});const b=await body();
const name=str(b.name,80),phone=str(b.phone,20),wil=str(b.wil,40),addr=str(b.addr,400);
if(!name||!/^[0-9+ ]{8,16}$/.test(phone)||!wil||!addr||!Array.isArray(b.items)||!b.items.length||b.items.length>30)return send(400,{error:'bad'});
const dt=b.dt==='desk'?'desk':'home',items=[];let sum=0;
for(const i of b.items){const p=D.products.find(x=>x.id==i.id),q=Math.floor(+i.q);if(!p||!(q>=1&&q<=20))return send(400,{error:'bad'});
if(p.type==='pyj'){if(!p.sizes||!(p.sizes[i.s]>=q))return send(409,{error:'stock'})}else if(!(p.stock>=q))return send(409,{error:'stock'});
items.push({p,s:p.type==='pyj'?i.s:'',q})}
for(const {p,s,q} of items){if(p.type==='pyj')p.sizes[s]-=q;else p.stock-=q;sum+=p.price*q}
const n=D.orders.reduce((a,o)=>Math.max(a,o.n),0)+1;
D.orders.push({n,name,phone,wil,addr,dt,note:str(b.note,300),items:items.map(({p,s,q})=>({name:p.name,s,q,price:p.price})),total:sum+(dt==='home'?C.ph:C.pd),st:0,date:new Date().toLocaleString('fr-DZ')});
save();return send(200,{n})}
if(!auth())return send(401,{error:'auth'});
if(m==='GET'&&u==='/api/orders')return send(200,{orders:D.orders});
const b=await body();
if(m==='PUT'&&u==='/api/orders'&&Array.isArray(b)){D.orders=b;save();return send(200,{ok:1})}
if(m==='PUT'&&u==='/api/products'&&Array.isArray(b)){D.products=b;save();return send(200,{ok:1})}
if(m==='PUT'&&u==='/api/cfg'){C.wa=str(b.wa,30);C.pd=+b.pd||0;C.ph=+b.ph||0;if(b.pw){if(String(b.pw).length<6)return send(400,{error:'short'});C.pw=hash(b.pw,C.salt)}save();return send(200,{ok:1})}
send(404,{error:'nf'})}).listen(PORT,()=>console.log('Syra store on http://localhost:'+PORT));
