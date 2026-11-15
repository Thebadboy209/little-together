import * as THREE from 'three';
import { firebaseConfig } from './firebase-config.js';

// Little Together: a fully procedural, asset-free 3D cozy-city demo.
// Online rooms use the separate Firebase rules supplied with the project.
const $ = id => document.getElementById(id);
const show = (id, yes=true) => $(id).classList.toggle('hidden',!yes);
const escapeHTML = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const rand=(a,b)=>Math.random()*(b-a)+a;
const distance=(x,z,a,b)=>Math.hypot(x-a,z-b);
const avatars = [
  {id:'bunny',name:'Bông',tag:'Thỏ kem',emoji:'🐰',main:0xffebc8,ear:0xffc9d8},
  {id:'bear',name:'Mây',tag:'Gấu trắng',emoji:'🐻‍❄️',main:0xfff9e6,ear:0xffd8d9},
  {id:'cat',name:'Miu',tag:'Mèo nơ',emoji:'🐱',main:0xfff4eb,ear:0xf6c5d4},
  {id:'hedge',name:'Nhím',tag:'Nhím xanh',emoji:'🦔',main:0xfff7e8,ear:0x92bcca},
  {id:'pudding',name:'Pudding',tag:'Bé nâu',emoji:'🐹',main:0xffe1af,ear:0xf0c1b3}
];
const spots=[
  {id:'plaza',name:'Quảng trường Hoa',emoji:'🌸',x:0,z:0,r:11,tip:'Chụp ảnh • gặp gỡ',action:'photo'},
  {id:'lake',name:'Hồ Mây',emoji:'🎣',x:25,z:15,r:9.7,tip:'Cùng câu cá thư giãn',action:'fish'},
  {id:'fashion',name:'Tiệm Phối Đồ',emoji:'👒',x:-22,z:-10,r:7.2,tip:'Mua mũ và phụ kiện',action:'shop'},
  {id:'cafe',name:'Café Cánh Hoa',emoji:'☕',x:18,z:-12,r:7.4,tip:'Gọi đồ uống, ngồi nghỉ',action:'cafe'},
  {id:'bakery',name:'Tiệm Bánh Bơ',emoji:'🥐',x:26,z:-28,r:7.4,tip:'Ăn bánh, mua đồ ăn',action:'bakery'},
  {id:'garden',name:'Vườn Nắng',emoji:'🌻',x:12,z:29,r:9.5,tip:'Trồng hoa, tưới cây',action:'garden'},
  {id:'arcade',name:'Nhà Trò Chơi',emoji:'🎯',x:-2,z:-25,r:7.6,tip:'Thử phản xạ, nhận xu',action:'arcade'},
  {id:'park',name:'Công viên Lá',emoji:'🌳',x:-28,z:19,r:9,tip:'Ghế dài, picnic',action:'park'},
  {id:'home',name:'Nhà Nhỏ',emoji:'🏡',x:-25,z:-29,r:7.5,tip:'Ngồi nghỉ, thư giãn',action:'home'}
];
const goods={
  hats:[
    {id:'none',name:'Không đội mũ',emoji:'🌷',price:0},
    {id:'bow',name:'Nơ pastel',emoji:'🎀',price:25},
    {id:'flower',name:'Hoa cài đầu',emoji:'🌼',price:30},
    {id:'cap',name:'Mũ bucket',emoji:'🧢',price:45},
    {id:'crown',name:'Vương miện hoa',emoji:'👑',price:65},
    {id:'sprout',name:'Mầm cây',emoji:'🌱',price:20},
    {id:'star',name:'Sao nhỏ',emoji:'⭐',price:35},
    {id:'beret',name:'Mũ beret',emoji:'👒',price:50}
  ],
  food:[
    {id:'tea',name:'Trà sữa dâu',emoji:'🧋',price:12},
    {id:'coffee',name:'Cacao ấm',emoji:'☕',price:10},
    {id:'juice',name:'Nước cam',emoji:'🍊',price:9},
    {id:'cake',name:'Bánh dâu',emoji:'🍰',price:14},
    {id:'bread',name:'Bánh croissant',emoji:'🥐',price:11},
    {id:'donut',name:'Bánh vòng',emoji:'🍩',price:13},
    {id:'sandwich',name:'Sandwich',emoji:'🥪',price:16},
    {id:'icecream',name:'Kem mây',emoji:'🍦',price:12}
  ]
};
const fishTypes=[
  {name:'Cá vàng',emoji:'🐠',rarity:'Thường',reward:7},{name:'Cá chép hồng',emoji:'🐟',rarity:'Thường',reward:9},
  {name:'Cá bạc',emoji:'🐟',rarity:'Thường',reward:8},{name:'Cá cầu vồng',emoji:'🌈',rarity:'Hiếm',reward:23},
  {name:'Cá sao băng',emoji:'✨',rarity:'Cực hiếm',reward:45},{name:'Cá ngọc',emoji:'💎',rarity:'Hiếm',reward:28}
];
const storageKey='little-together-city-v2';
let soundOn=true,audioCtx=null;
function beep(note=480,seconds=.09){if(!soundOn)return;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),gain=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(note,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(note*.72,audioCtx.currentTime+seconds);gain.gain.setValueAtTime(.032,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+seconds);o.connect(gain);gain.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+seconds)}catch{}}
$('sound-btn').onclick=()=>{soundOn=!soundOn;$('sound-btn').textContent=soundOn?'🔊':'🔇';if(soundOn)beep(650)};
let save={coins:100,owned:['none'],hat:'none',food:{},fish:{},seeds:2,flowers:0,quest:0};
try{save={...save,...JSON.parse(localStorage.getItem(storageKey)||'{}')}}catch{}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(save))}catch{} $('coins').textContent=save.coins}
const configured=!!(firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId);
let chosen='bunny',nickname='Player',scene,camera,renderer,clock,player=null,opponent=null,elapsed=0,ground,water,clouds=[],windmills=[],animatedFlowers=[];
let actionStamp=Date.now(),input={x:0,y:0},pointerId=null,keys=new Set(),inGame=false,online=false,room='',slot='',host=false,auth,db,rt,uid='',unsubs=[],disconnectHandle=null,lastSync=0,toastTimer,fishLock=false,modalOpen=false;
const boundaries={x:44,z:37};
const solids=[];
const geoBall=new THREE.SphereGeometry(1,16,12);
function material(c,params={}){return new THREE.MeshStandardMaterial({color:c,roughness:.86,metalness:0,...params})}
function addMesh(parent,geom,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geom,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function ball(parent,c,x,y,z,sx=1,sy=1,sz=1){const m=addMesh(parent,geoBall,material(c),x,y,z);m.scale.set(sx,sy,sz);return m}
function cube(parent,c,x,y,z,sx=1,sy=1,sz=1){return addMesh(parent,new THREE.BoxGeometry(sx,sy,sz),material(c),x,y,z)}
function cyl(parent,c,x,y,z,r=.3,h=1,r2=r,segments=12){return addMesh(parent,new THREE.CylinderGeometry(r,r2,h,segments),material(c),x,y,z)}
function rounded(parent,c,x,y,z,sx,sy,sz){const m=addMesh(parent,new THREE.BoxGeometry(sx,sy,sz,1,1,1),material(c),x,y,z);return m}
function label(text,x,y,z,width=3.8,background='#fffaf0',fg='#59765f'){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;const cx=canvas.getContext('2d');cx.fillStyle=background;cx.beginPath();cx.roundRect(12,13,488,130,42);cx.fill();cx.fillStyle=fg;cx.font='bold 52px sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(text,256,82,465);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const plane=new THREE.Mesh(new THREE.PlaneGeometry(width,width*160/512),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));plane.position.set(x,y,z);scene.add(plane);return plane;
}
function localGroup(x,z){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);return g}
function tree(x,z,s=1,kind=0){const g=localGroup(x,z);cyl(g,0xa78369,0,.76*s,0,.23*s,1.5*s);const t=kind%3;if(t===0){ball(g,0x92bfa3,0,2.02*s,0,.97*s,.88*s,.93*s);ball(g,0xb9d9af,-.43*s,1.85*s,.19*s,.65*s,.62*s,.6*s);ball(g,0xa5c8a0,.42*s,2.16*s,-.18*s,.65*s,.62*s,.65*s)}else if(t===1){for(let j=0;j<3;j++)ball(g,j===0?0xe7b8ba:j===1?0xf1cfca:0xc4dba8,(j-1)*.49*s,(2.02+(j%2)*.22)*s,0,.75*s,.78*s,.76*s)}else{const cone=addMesh(g,new THREE.ConeGeometry(1.12*s,2.5*s,9),material(0x9cb9a0),0,2.18*s,0);cone.rotation.y=.25}return g}
function flower(x,z,c=0xf7c0c8){const g=localGroup(x,z);cyl(g,0x83ad7b,0,.13,0,.028,.29);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(g,c,Math.cos(a)*.10,.33,Math.sin(a)*.10,.095,.085,.085)}ball(g,0xffe299,0,.34,0,.065,.07,.065);animatedFlowers.push({g,offset:rand(0,6)})}
function bench(x,z,angle=0){const g=localGroup(x,z);g.rotation.y=angle;cube(g,0xb77e63,0,.53,0,2,.18,.72);cube(g,0xb77e63,0,.99,-.28,2,.82,.15);for(const a of [-.72,.72]){cube(g,0x795a4f,a,.24,0,.12,.53,.52);cube(g,0x795a4f,a,.71,-.31,.12,.6,.1)}}
function lantern(x,z){const g=localGroup(x,z);cyl(g,0x777b6e,0,1.25,0,.065,2.5);ball(g,0xfff7d0,0,2.62,0,.32,.35,.32);cyl(g,0x7d8070,0,2.92,0,.3,.12)}
function building(x,z,w,d,color,roof,sign,icon,kind){const g=localGroup(x,z);cube(g,0xd8c8ad,0,.18,0,w+.8,.36,d+.9);cube(g,color,0,1.65,0,w,3.3,d);const r=addMesh(g,new THREE.ConeGeometry(Math.max(w,d)*.79,2,4),material(roof),0,4.1,0);r.rotation.y=Math.PI/4;
 cube(g,0x96776a,0,1.32,d/2+.055,1.22,2.22,.13);cube(g,0xe6eadb,0,1.42,d/2+.14,.82,1.64,.035);for(const dx of [-w*.31,w*.31]){cube(g,0xf5f3d4,dx,2.22,d/2+.09,.9,1.18,.09);cube(g,0xc1d8d3,dx,2.22,d/2+.15,.67,.93,.03);cube(g,0xffffff,dx,2.22,d/2+.18,.045,.94,.04);cube(g,0xffffff,dx,2.22,d/2+.18,.66,.045,.04)}
 for(let side of [-1,1]){cyl(g,0xeac2ad,side*(w/2+.35),.6,d/2+.22,.43,.58);ball(g,kind==='cafe'?0xa4c59f:0xe9c6bb,side*(w/2+.35),1.07,d/2+.22,.54,.46,.54)}
 cube(g,roof,0,3.3,d/2+.35,w*.83,.65,.38);const signLabel=label(icon+' '+sign,x,4.75,z+d/2+1.4,Math.min(w+1,5.7));solids.push({x,z,halfX:w/2+.27,halfZ:d/2+.25});return g}
function path(x,z,w,d){const m=cube(scene,0xeadfbe,x,-.065,z,w,.06,d);m.receiveShadow=true;return m}
function pond(x,z,r){const shore=cyl(scene,0xf6e4b5,x,.018,z,r+.95,.09,r+.95,48);water=cyl(scene,0x8bc9c8,x,.081,z,r,.055,r,48);water.material=material(0x83bec0,{transparent:true,opacity:.91,roughness:.27});const ring=addMesh(scene,new THREE.RingGeometry(r-.4,r-.2,64),new THREE.MeshBasicMaterial({color:0xc8f7db,transparent:true,opacity:.57,side:THREE.DoubleSide}),x,.113,z);ring.rotation.x=-Math.PI/2;for(let j=0;j<4;j++){const a=1.15+j*.35;ball(scene,0x8eb8a2,x+Math.cos(a)*(r+.35),.17,z+Math.sin(a)*(r+.35),.5,.2,.36)}
 const pier=localGroup(x-r-.6,z+.5);for(let k=0;k<6;k++)cube(pier,0xb68a67,-k*.63,.28,0,.6,.18,2.4);for(let k of [0,5])for(let f of [-.95,.95])cyl(pier,0x8c755e,-k*.63,.3,f,.09,.65);return shore}
function fountain(x,z){const g=localGroup(x,z);cyl(g,0xf4e0d9,0,.24,0,2.4,.45,2.4,32);cyl(g,0x9bd0cd,0,.51,0,1.94,.12,1.94,32);cyl(g,0xf0e7dd,0,1.1,0,.41,1.25,.62,24);ball(g,0xb2dcd9,0,1.72,0,.27,.33,.27);for(let j=0;j<10;j++){const a=j*Math.PI/5;ball(g,0xb3dcdb,Math.cos(a)*1.4,.56,Math.sin(a)*1.4,.12,.14,.12)}}
function table(x,z){const g=localGroup(x,z);cyl(g,0xa88b6c,0,.64,0,.87,.12);cyl(g,0x8f735e,0,.34,0,.12,.61);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;cyl(g,0xb7a189,Math.cos(a)*1.3,.41,Math.sin(a)*1.3,.4,.11);cyl(g,0x917b67,Math.cos(a)*1.3,.2,Math.sin(a)*1.3,.095,.42)}}
function gardenBed(x,z){const g=localGroup(x,z);cube(g,0xb99474,0,.17,0,2.5,.38,1.75);cube(g,0x795a43,0,.39,0,2.25,.1,1.47);for(let i=0;i<5;i++)ball(g,0x88ad7b,rand(-1,1),.51,rand(-.5,.5),.23,.23,.21);return g}
function createCity(){scene=new THREE.Scene();scene.background=new THREE.Color(0xd5ebdc);scene.fog=new THREE.Fog(0xd5ebdc,41,102);scene.add(new THREE.HemisphereLight(0xfffdf1,0xa3bdac,2));const sun=new THREE.DirectionalLight(0xfff7e0,2.55);sun.position.set(-18,32,18);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-31;sun.shadow.camera.right=31;sun.shadow.camera.top=31;sun.shadow.camera.bottom=-31;sun.shadow.bias=-.0007;scene.add(sun);
 ground=cube(scene,0xb6d8a9,0,-.62,0,94,1.2,80);ground.receiveShadow=true;
 // A connected network of paths makes the map navigable rather than empty.
 path(0,0,6,70);path(0,0,76,5.2);path(-22,-21,4.6,32);path(22,-21,4.6,32);path(-22,18,4.6,24);path(22,18,4.6,26);path(-13,28,32,4.3);path(13,-29,38,4.3);path(-24,11,16,3.5);path(24,11,15,3.5);
 const pondX=25,pondZ=15;pond(pondX,pondZ,6.4);
 building(-22,-10,7.8,6.7,0xe6c6d1,0xc98f9a,'FASHION','♥','fashion');
 building(18,-12,7.5,6.7,0xf2dcb9,0x9dae96,'CAFÉ','☕','cafe');
 building(26,-28,7.5,6.8,0xffe7b2,0xd3a079,'BAKERY','✦','bakery');
 building(-2,-25,8.0,6.7,0xc9d9dc,0x9ea6c9,'ARCADE','★','arcade');
 building(-25,-29,7.4,6.8,0xe9d5be,0xc58e91,'COZY HOME','♡','home');
 fountain(0,0);for(const [x,z,a] of [[-5,5,0],[5,5,Math.PI],[0,-6,1.57]])bench(x,z,a);
 for(const [x,z] of [[-31,19],[-27,23],[-24,16],[-30,13]]){tree(x,z,1.05,1)}bench(-28,19,0);table(-30,16);
 for(let i=0;i<5;i++)gardenBed(9+i*2.5,28+(i%2)*2.4);for(let i=0;i<4;i++)tree(8+i*4,34,.8,i);
 for(const [x,z] of [[14,-5],[21,-6],[22,-19],[27,-20],[-28,-4],[-17,-4],[-14,-22],[-33,-32],[2,-33],[7,4],[-11,7]])lantern(x,z);
 table(12,-9);table(25,-10);table(22,-34);
 // Trees, shrubs and flowers are made from reusable procedural geometry.
 const seed=()=>Math.random();for(let i=0;i<48;i++){const x=rand(-44,44),z=rand(-36,36);if(Math.abs(x)<7||Math.abs(z)<6||spots.some(s=>distance(x,z,s.x,s.z)<s.r+1.4))continue;tree(x,z,rand(.7,1.2),Math.floor(seed()*3))}
 for(let i=0;i<66;i++){const x=rand(-43,43),z=rand(-35,35);if(Math.abs(x)<3||Math.abs(z)<2||spots.some(s=>distance(x,z,s.x,s.z)<s.r*.7))continue;flower(x,z,[0xf7bcc5,0xfff0b3,0xc8d8f6,0xffffff][i%4])}
 for(let i=0;i<12;i++){const g=localGroup(rand(-43,43),rand(-35,35));ball(g,0xffffff,0,0,0,.2,.12,.1)}
 // Decorative market stalls and a bridge approach near the lake.
 const stall=localGroup(-11,17);cube(stall,0xcba78a,0,1,0,4,1.9,2.7);cube(stall,0xe8b7ab,0,2.13,0,4.5,.3,3.1);cyl(stall,0x967660,0,2.55,0,.4,.6);label('✿ MARKET',-11,3,18.8,3.4);
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;$('game').appendChild(renderer.domElement);
 camera=new THREE.OrthographicCamera(-12,12,12,-12,.1,180);camera.position.set(12,19,17);camera.lookAt(0,0,0);resize();addEventListener('resize',resize);
 clock=new THREE.Clock();animate();
}
function resize(){if(!renderer)return;const aspect=innerWidth/Math.max(1,innerHeight);const viewHeight=innerWidth<680?20:24;camera.left=-viewHeight*aspect/2;camera.right=viewHeight*aspect/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight)}
function attachHat(model,id){if(!model)return;const top=model.userData.headgear;top.clear();if(id==='none')return;
 if(id==='bow'){for(const side of [-1,1])ball(top,0xe9a1b4,side*.35,.18,0,.35,.25,.17);ball(top,0xecc2b8,0,.18,.12,.16,.16,.18)}
 if(id==='flower'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(top,0xf4baad,.58+Math.cos(a)*.2,.18+Math.sin(a)*.2,.16,.17,.16,.12)}ball(top,0xf6da7f,.58,.18,.28,.13,.13,.13)}
 if(id==='cap'||id==='beret'){ball(top,id==='cap'?0x9fb7d7:0xd2b8c9,0,.20,0,.83,.29,.73);if(id==='cap')ball(top,0x9fb7d7,0,.11,.58,.6,.07,.32)}
 if(id==='crown'){for(let j=-2;j<=2;j++)cyl(top,0xecc77b,j*.26,.2,0,.12,.38+(j===0?.2:0),.15,6)}
 if(id==='sprout'){cyl(top,0x83aa77,0,.23,0,.055,.42);ball(top,0x9fcc98,-.22,.42,0,.33,.13,.19);ball(top,0x9fcc98,.21,.42,.03,.31,.13,.19)}
 if(id==='star'){const star=addMesh(top,new THREE.OctahedronGeometry(.3),material(0xf2dc91),0,.28,.03);star.rotation.z=.3}
}
function makeCharacter(avatarId,name,hat='none'){
 const a=avatars.find(v=>v.id===avatarId)||avatars[0];const root=localGroup(0,0),body=new THREE.Group();root.add(body);
 const torso=ball(body,a.main,0,.84,0,.79,.76,.67);ball(body,0xfff8e7,0,.74,.44,.54,.49,.24);
 const head=new THREE.Group();head.position.set(0,1.87,.06);body.add(head);ball(head,a.main,0,0,0,.95,.88,.82);
 const cheeks=[];for(const s of [-1,1]){ball(head,0x34302f,s*.36,.03,.74,.096,.12,.08);ball(head,0xf4b5be,s*.64,-.23,.54,.21,.16,.1);ball(head,0xffffff,s*.39,.09,.807,.035,.041,.019);const arm=ball(body,a.main,s*.78,1.00,.25,.29,.42,.28);arm.rotation.z=s*.24;cheeks.push(arm)}
 ball(head,0x6a5149,0,-.14,.82,.09,.06,.07);const mouth=addMesh(head,new THREE.TorusGeometry(.1,.024,5,12,Math.PI),material(0x7c5854),0,-.30,.82);mouth.rotation.z=Math.PI;
 if(a.id==='bunny'){for(let s of [-1,1]){const e=ball(head,a.main,s*.37,.96,-.10,.28,.75,.22);e.rotation.z=s*-.10;const inner=ball(head,0xf5b8c9,s*.37,1.01,.08,.16,.52,.08);inner.rotation.z=s*-.1}}
 else if(a.id==='cat'){for(let s of [-1,1]){const ear=addMesh(head,new THREE.ConeGeometry(.42,.69,3),material(a.main),s*.58,.83,-.08);ear.rotation.z=s*-.22;ball(head,0xe9c2ca,s*.55,.76,.17,.23,.24,.12)}for(let s of [-1,1])for(let i=0;i<2;i++)cube(head,0x7d645f,s*.76,-.12+i*.1,.52,.29,.026,.025)}
 else if(a.id==='hedge'){for(let i=0;i<16;i++){const ang=i*Math.PI*2/16;const spike=addMesh(head,new THREE.ConeGeometry(.20,.48,5),material(0x8bb9cc),Math.cos(ang)*.83,Math.sin(ang)*.72,-.32);spike.rotation.z=-ang-Math.PI/2}for(const s of [-1,1])ball(head,a.main,s*.79,.2,.14,.22,.37,.2)}
 else if(a.id==='bear'){for(const s of [-1,1]){ball(head,a.main,s*.70,.63,-.15,.30,.32,.23);ball(head,0xf4d7df,s*.72,.68,.05,.14,.15,.1)}}
 else if(a.id==='pudding'){for(const s of [-1,1])ball(head,a.main,s*.74,.61,-.08,.28,.29,.21);ball(head,0x85614a,0,.83,0,.71,.13,.64)}
 const legs=[];for(const s of [-1,1])legs.push(ball(body,a.main,s*.39,.3,0,.33,.30,.35));
 const headgear=new THREE.Group();headgear.position.set(0,1.06,0);head.add(headgear);
 // Props are attached to the animated arm rather than floating in the scene.
 const rod=new THREE.Group();rod.position.set(.17,-.21,.12);cheeks[1].add(rod);
 const pole=cyl(rod,0xa47b62,.08,.90,.18,.035,1.95);pole.rotation.z=-.2;
 const lineMat=new THREE.LineBasicMaterial({color:0xe8ecdf});
 const lineGeom=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.09,1.85,.21),new THREE.Vector3(-.3,.13,1.03)]);
 rod.add(new THREE.Line(lineGeom,lineMat));ball(rod,0xf4acac,-.3,.12,1.03,.11,.11,.11);rod.visible=false;
 const snack=new THREE.Group();snack.position.set(.11,-.35,.32);cheeks[1].add(snack);
 cyl(snack,0xeec2aa,0,.08,0,.22,.32);ball(snack,0xfff0ca,0,.34,0,.24,.21,.24);ball(snack,0xe8adba,0,.48,0,.08,.09,.08);snack.visible=false;
 const shadow=addMesh(root,new THREE.CircleGeometry(.9,20),new THREE.MeshBasicMaterial({color:0x4e7257,transparent:true,opacity:.15,depthWrite:false}),0,.035,0);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
 root.userData={avatar:a.id,name,hat,body,head,headgear,arms:cheeks,legs,rod,snack,shadow,target:new THREE.Vector3(),targetYaw:0,action:'idle',actionAt:0,walkCycle:0,jumpTime:-1,displayName:null};attachHat(root,hat);
 // Name plates are sprites, always facing the camera.
 const cn=document.createElement('canvas');cn.width=256;cn.height=64;const ctx=cn.getContext('2d');ctx.fillStyle='#fffdf0e8';ctx.beginPath();ctx.roundRect(3,3,250,55,26);ctx.fill();ctx.fillStyle='#547563';ctx.textAlign='center';ctx.font='bold 29px sans-serif';ctx.fillText(name.slice(0,18),128,41,225);const tx=new THREE.CanvasTexture(cn);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthTest:false}));sprite.scale.set(2.5,.63,1);sprite.position.y=3.44;root.add(sprite);root.userData.displayName=sprite;
 return root;
}
function animateCharacter(c,dt,moving,time){if(!c)return;const d=c.userData;d.walkCycle+=dt*(moving?11:3);const t=d.walkCycle;
 const action=(performance.now()-d.actionAt<2200)?d.action:'idle';d.rod.visible=action==='fish';d.snack.visible=action==='eat';let bob=moving?Math.abs(Math.sin(t))*.085:Math.sin(time*2.1)*.035;
 for(let i=0;i<2;i++){const sign=i===0?-1:1;d.legs[i].position.z=moving?Math.sin(t+Math.PI*i)*.18:0;d.arms[i].rotation.x=moving?Math.sin(t+Math.PI*i)*.48:0;d.arms[i].rotation.z=sign*.24;}
 if(action==='wave'){d.arms[1].rotation.z=-2.4;d.arms[1].rotation.x=Math.sin(time*15)*.5;}
 if(action==='dance'){d.arms[0].rotation.z=1.65;d.arms[1].rotation.z=-1.65;d.body.rotation.z=Math.sin(time*10)*.17;bob+=Math.abs(Math.sin(time*10))*.11}
 else{d.body.rotation.z+=(0-d.body.rotation.z)*Math.min(1,dt*8)}
 if(action==='sit'){d.body.position.y+=( -.27-d.body.position.y)*Math.min(1,dt*9);d.legs[0].position.z=.4;d.legs[1].position.z=.4;bob=0}
 else {d.body.position.y+=(0-d.body.position.y)*Math.min(1,dt*9)}
 if(action==='eat'){d.arms[1].rotation.z=-1.7;d.arms[1].rotation.x=Math.sin(time*9)*.2}
 if(action==='fish'){d.arms[1].rotation.z=-1.15;d.arms[0].rotation.z=.75;bob=.02}
 if(d.jumpTime>=0){d.jumpTime+=dt;bob+=Math.sin(Math.min(1,d.jumpTime/.66)*Math.PI)*.75;if(d.jumpTime>.66)d.jumpTime=-1}
 const desiredY=(action==='sit' ? -.27 : 0)+bob;d.body.position.y+=(desiredY-d.body.position.y)*Math.min(1,dt*12);d.body.position.y=clamp(d.body.position.y,-.3,.8);
 d.head.rotation.z=moving?Math.sin(t)*.045:Math.sin(time*1.6)*.025;
}
function setAction(type){if(!player)return;beep(360);player.userData.action=type;player.userData.actionAt=performance.now();actionStamp=Date.now();sendState(true)}
function announce(s){beep(610);$('toast').textContent=s;show('toast');clearTimeout(toastTimer);toastTimer=setTimeout(()=>show('toast',false),2600)}
function nearestSpot(){if(!player)return spots[0];return spots.reduce((best,s)=>distance(player.position.x,player.position.z,s.x,s.z)<distance(player.position.x,player.position.z,best.x,best.z)?s:best,spots[0])}
function activeSpot(){const spot=nearestSpot();return distance(player.position.x,player.position.z,spot.x,spot.z)<spot.r?spot:null}
function toastPlace(){const s=activeSpot();$('place-name').textContent=s?`${s.emoji} ${s.name}`:'🌿 Đường mòn';$('place-tip').textContent=s?s.tip:'Đi đến một cửa hàng hoặc mở bản đồ'}
function solid(x,z){if(Math.abs(x)>boundaries.x||Math.abs(z)>boundaries.z)return true;if(distance(x,z,25,15)<6.5)return true;return solids.some(o=>Math.abs(x-o.x)<o.halfX+.42&&Math.abs(z-o.z)<o.halfZ+.42)}
function goTo(s){const candidates={lake:[16,17],fashion:[-22,-4.5],cafe:[18,-6],bakery:[26,-21.9],garden:[10,24],arcade:[-2,-19],park:[-28,10],home:[-25,-22.7],plaza:[0,7]};const p=candidates[s.id]||[s.x,s.z];player.position.set(p[0],0,p[1]);sendState(true);closeModal();toastPlace();announce(`Đã đến ${s.name} ✨`)}
function saveCoins(n){save.coins=Math.max(0,save.coins+n);persist()}
function modal(head,title,desc,body){$('modal-body').innerHTML=`<div class="modal-emoji">${head}</div><h2>${escapeHTML(title)}</h2><p>${escapeHTML(desc)}</p>${body}`;show('modal-overlay');modalOpen=true}
function closeModal(){show('modal-overlay',false);modalOpen=false;fishLock=false}
$('modal-close').onclick=closeModal;
function renderShop(){const html=`<div class="mini-tabs"><button class="selected">Mũ & phụ kiện</button><button id="shop-gesture">🎭 Tạo dáng</button></div><div class="catalog">${goods.hats.map(it=>`<button class="item ${save.owned.includes(it.id)?'owned':''}" data-hat="${it.id}"><span class="emoji">${it.emoji}</span><span class="detail"><b>${it.name}</b><small>${save.hat===it.id?'✓ Đang dùng':save.owned.includes(it.id)?'Đã sở hữu':`${it.price} xu`}</small></span></button>`).join('')}</div><p class="helper">Trang phục/mũ hiển thị trực tiếp trên nhân vật 3D và đồng bộ cho người chơi cùng phòng.</p>`;
 modal('👒','Tiệm Phối Đồ','Chọn phụ kiện có thể mua bằng xu trong game.',html);
 document.querySelectorAll('[data-hat]').forEach(b=>b.onclick=()=>{const h=goods.hats.find(i=>i.id===b.dataset.hat);if(!save.owned.includes(h.id)){if(save.coins<h.price){announce('Chưa đủ xu để mua món này 🪙');return}saveCoins(-h.price);save.owned.push(h.id);announce(`Đã mua ${h.name}!`)}save.hat=h.id;attachHat(player,h.id);persist();sendState(true);renderShop()});
 $('shop-gesture').onclick=()=>openEmotes();
}
function buyFood(type){const list=type==='cafe'?goods.food.slice(0,4):goods.food.slice(3);modal(type==='cafe'?'☕':'🥐',type==='cafe'?'Café Cánh Hoa':'Tiệm Bánh Bơ','Mua món ngon và dùng từ balo khi muốn.',`<div class="catalog">${list.map(i=>`<button class="item" data-food="${i.id}"><span class="emoji">${i.emoji}</span><span class="detail"><b>${i.name}</b><small>🪙 ${i.price} xu</small></span></button>`).join('')}</div><p class="helper">Ăn/uống kích hoạt cử chỉ 3D. Đồ ăn lưu trên trình duyệt của bạn.</p>`);document.querySelectorAll('[data-food]').forEach(b=>b.onclick=()=>{const it=goods.food.find(x=>x.id===b.dataset.food);if(save.coins<it.price){announce('Không đủ xu 🪙');return}saveCoins(-it.price);save.food[it.id]=(save.food[it.id]||0)+1;persist();announce(`Đã mua ${it.emoji} ${it.name}`)})}
function openBag(){const foods=Object.entries(save.food).filter(([k,n])=>n>0);modal('🎒','Balo của bạn','Các món đồ đã thu thập trong hành trình.',`<div class="subtitle">🍰 Đồ ăn</div><div class="list">${foods.length?foods.map(([k,n])=>{const o=goods.food.find(it=>it.id===k);return `<div class="rowitem"><span>${o?.emoji||'🍪'} ${escapeHTML(o?.name||k)} ×${n}</span><button data-eat="${k}">Ăn ngay</button></div>`}).join(''):'<div class="rowitem">Chưa có đồ ăn. Ghé tiệm bánh nhé!</div>'}</div><div class="subtitle">🐟 Bộ sưu tập cá</div><div class="list">${Object.entries(save.fish).length?Object.entries(save.fish).map(([n,v])=>`<div class="rowitem">🐟 ${escapeHTML(n)} <b>×${v}</b></div>`).join(''):'<div class="rowitem">Chưa bắt được cá nào.</div>'}</div><div class="subtitle">🌻 Khu vườn</div><div class="rowitem">Hạt giống: ${save.seeds||0} · Hoa thu hoạch: ${save.flowers||0}</div>`);
 document.querySelectorAll('[data-eat]').forEach(b=>b.onclick=()=>{const id=b.dataset.eat;if(!save.food[id])return;save.food[id]--;persist();setAction('eat');closeModal();announce('Ngon quá! ✨')});}
function openGarden(){modal('🌻','Vườn Nắng','Trồng hoa, chăm sóc và thu hoạch để kiếm thêm xu.',`<div class="catalog"><button class="item" id="plant"><span class="emoji">🌱</span><span class="detail"><b>Trồng hạt</b><small>Còn ${save.seeds} hạt</small></span></button><button class="item" id="water"><span class="emoji">💧</span><span class="detail"><b>Tưới cây</b><small>+1 hạt và +4 xu</small></span></button><button class="item" id="harvest"><span class="emoji">🌼</span><span class="detail"><b>Thu hoạch</b><small>+10 xu / bông</small></span></button><button class="item" id="seed"><span class="emoji">🛍️</span><span class="detail"><b>Mua 3 hạt</b><small>12 xu</small></span></button></div><p class="helper">Bản demo: tiến trình vườn lưu cục bộ theo thiết bị, chưa chia sẻ trạng thái ô đất online.</p>`);
 $('plant').onclick=()=>{if(save.seeds<1){announce('Bạn hết hạt giống rồi!');return}save.seeds--;save.flowers=(save.flowers||0)+1;persist();setAction('wave');announce('Một bông hoa đang nở! 🌷');openGarden()};
 $('water').onclick=()=>{save.seeds++;saveCoins(4);setAction('wave');announce('Tưới cây thành công! +4 xu');openGarden()};
 $('harvest').onclick=()=>{if(save.flowers<1){announce('Hãy trồng hoa trước nhé');return}save.flowers--;saveCoins(10);announce('Thu hoạch hoa +10 xu 🌼');openGarden()};
 $('seed').onclick=()=>{if(save.coins<12){announce('Không đủ xu');return}saveCoins(-12);save.seeds+=3;persist();openGarden()};}
function openEmotes(){modal('🎭','Cử chỉ & hành động','Hai người đều thấy cử chỉ của nhau trong thế giới 3D.',`<div class="catalog">${[['wave','👋','Vẫy tay'],['dance','💃','Nhảy múa'],['sit','🪑','Ngồi xuống'],['eat','🍰','Ăn uống'],['happy','✨','Vui vẻ'],['fish','🎣','Tạo dáng câu cá']].map(([id,e,n])=>`<button class="item" data-action="${id}"><span class="emoji">${e}</span><span class="detail"><b>${n}</b><small>Animation 3D</small></span></button>`).join('')}</div>`);document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{setAction(b.dataset.action);closeModal();announce('Đã thực hiện cử chỉ ✨')})}
function openPhoto(){modal('📸','Photo Moment','Hai bạn có thể lưu ảnh chụp trực tiếp từ khung hình 3D.',`<div class="photo-preview">🐰 🌸 🐻</div><div class="modal-footer"><button class="main-btn" id="photo-save">📸 Chụp ảnh và lưu PNG</button></div><p class="helper">Đóng bảng này trước khi chụp; ảnh sẽ chỉ có cảnh 3D, không gồm nút điều khiển.</p>`);$('photo-save').onclick=()=>{closeModal();renderer.render(scene,camera);try{const a=document.createElement('a');a.href=renderer.domElement.toDataURL('image/png');a.download='little-together-memory.png';a.click();announce('Đã chụp ảnh kỷ niệm 📷')}catch{announce('Thiết bị không cho phép lưu ảnh')}}}
function openArcade(){let pct=0;modal('🎯','Thử tài phản xạ','Bấm đúng lúc thanh chuyển động vào vùng màu vàng để nhận 15 xu.',`<div class="meter"><div id="arcade-fill"></div></div><button class="main-btn" id="arcade-hit">CHẠM ĐÚNG LÚC!</button><p id="arcade-message" class="helper">Mục tiêu: vùng vàng (59–77%).</p>`);let active=true,start=performance.now();const tick=()=>{if(!active)return;const bar=$('arcade-fill');if(!bar)return;pct=(Math.sin((performance.now()-start)*.005)+1)*50;bar.style.width=pct+'%';requestAnimationFrame(tick)};tick();$('arcade-hit').onclick=()=>{active=false;const ok=pct>=59&&pct<=77;if(ok){saveCoins(15);setAction('happy');announce('Tuyệt vời! +15 xu 🎉')}else announce('Suýt trúng rồi! Thử lại nhé');$('arcade-message').textContent=ok?'Bạn đã thắng 15 xu!':'Lần này chưa trúng.';$('arcade-hit').textContent='Chơi lại';$('arcade-hit').onclick=openArcade}}
function openPark(){modal('🌳','Công viên Lá','Một góc yên bình để nghỉ ngơi và tạo dáng.',`<div class="catalog"><button class="item" id="park-sit"><span class="emoji">🪑</span><span class="detail"><b>Ngồi ghế</b><small>Nghỉ ngơi</small></span></button><button class="item" id="park-dance"><span class="emoji">🎶</span><span class="detail"><b>Nhảy múa</b><small>Vui vẻ</small></span></button><button class="item" id="park-photo"><span class="emoji">📸</span><span class="detail"><b>Chụp ảnh</b><small>Lưu kỷ niệm</small></span></button></div>`);$('park-sit').onclick=()=>{setAction('sit');closeModal()};$('park-dance').onclick=()=>{setAction('dance');closeModal()};$('park-photo').onclick=openPhoto}
function openHome(){modal('🏡','Nhà Nhỏ','Nơi nghỉ ngơi sau một ngày khám phá.',`<div class="catalog"><button class="item" id="home-sit"><span class="emoji">🛋️</span><span class="detail"><b>Ngồi thư giãn</b><small>Cozy time</small></span></button><button class="item" id="home-photo"><span class="emoji">📸</span><span class="detail"><b>Chụp ảnh chung</b><small>Photo Moment</small></span></button></div><p class="helper">Trang trí nội thất nhiều phòng chưa có trong bản chơi thử này.</p>`);$('home-sit').onclick=()=>{setAction('sit');closeModal()};$('home-photo').onclick=openPhoto}
function startFishing(){if(fishLock)return;fishLock=true;setAction('fish');let pct=0;modal('🎣','Cá đang cắn câu!','Nhấn khi thanh xanh chạm vùng vàng.',`<div class="meter"><div id="fish-meter"></div></div><button class="main-btn" id="catch-btn">KÉO CẦN!</button><p id="fish-message" class="helper">Cẩn thận, cá có thể chạy mất!</p>`);
 let active=true,start=performance.now();const tick=()=>{if(!active)return;const bar=$('fish-meter');if(!bar)return;pct=(Math.sin((performance.now()-start)*.004)+1)*50;bar.style.width=pct+'%';requestAnimationFrame(tick)};tick();$('catch-btn').onclick=()=>{active=false;fishLock=false;const ok=pct>=59&&pct<=77;const it=fishTypes[Math.random()<.07?5:Math.random()<.18?4:Math.floor(Math.random()*4)];if(ok){save.fish[it.name]=(save.fish[it.name]||0)+1;saveCoins(it.reward);persist();setAction('happy');modal(it.emoji,'Bắt được cá rồi! 🎉',`${it.name} · ${it.rarity} · +${it.reward} xu`,`<button class="main-btn" id="fish-again">🎣 Câu tiếp</button>`);$('fish-again').onclick=()=>{closeModal();startFishing()}}else{modal('💦','Cá thoát mất!','Thử canh đúng vùng vàng thêm lần nữa nhé.',`<button class="main-btn" id="fish-again">🎣 Thử lại</button>`);$('fish-again').onclick=()=>{closeModal();startFishing()}}}}
function interact(){if(!inGame||modalOpen)return;const s=activeSpot();if(!s){announce('Hãy đến gần một địa điểm hoặc mở bản đồ 🗺️');return}if(s.action==='fish')startFishing();else if(s.action==='shop')renderShop();else if(s.action==='cafe'||s.action==='bakery')buyFood(s.action);else if(s.action==='garden')openGarden();else if(s.action==='arcade')openArcade();else if(s.action==='photo')openPhoto();else if(s.action==='park')openPark();else if(s.action==='home')openHome()}
$('action-btn').onclick=interact;$('bag-btn').onclick=openBag;$('emote-btn').onclick=openEmotes;$('jump-btn').onclick=()=>{if(!player)return;player.userData.jumpTime=0;setAction('jump')};
$('map-btn').onclick=()=>{modal('🗺️','Bản đồ thị trấn','Nhấn địa điểm để đi nhanh đến nơi đó.',`<div class="mini-map">${spots.map(s=>`<button data-travel="${s.id}">${s.emoji} ${s.name}<small>${s.tip}</small></button>`).join('')}</div><p class="helper">Dịch chuyển tiện lợi để khám phá bản đồ lớn trên mobile.</p>`);document.querySelectorAll('[data-travel]').forEach(b=>b.onclick=()=>goTo(spots.find(s=>s.id===b.dataset.travel)))};
const pad=$('joystick'),stick=$('stick');function moveJoy(e){if(e.pointerId!==pointerId)return;const r=pad.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;const rad=r.width*.32,n=Math.max(1,Math.hypot(dx,dy)/rad),x=dx/n,y=dy/n;input.x=x/rad;input.y=y/rad;stick.style.transform=`translate(${x}px,${y}px)`}
pad.addEventListener('pointerdown',e=>{e.preventDefault();pointerId=e.pointerId;pad.setPointerCapture(e.pointerId);moveJoy(e)});pad.addEventListener('pointermove',moveJoy);function resetJoy(e){if(pointerId!==e.pointerId)return;pointerId=null;input.x=input.y=0;stick.style.transform='translate(0,0)'}pad.addEventListener('pointerup',resetJoy);pad.addEventListener('pointercancel',resetJoy);
addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement||modalOpen)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)){keys.add(k);e.preventDefault()}if(k==='e')interact()});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{keys.clear();input.x=input.y=0});
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.06);elapsed+=dt;
 if(inGame&&player){let x=input.x,z=input.y;if(keys.has('a')||keys.has('arrowleft'))x--;if(keys.has('d')||keys.has('arrowright'))x++;if(keys.has('w')||keys.has('arrowup'))z--;if(keys.has('s')||keys.has('arrowdown'))z++;const n=Math.hypot(x,z);let moving=n>.05;if(moving&&!modalOpen){x/=Math.max(1,n);z/=Math.max(1,n);const forward=new THREE.Vector3(-1,0,-1).normalize(),right=new THREE.Vector3(1,0,-1).normalize();const vx=right.x*x+forward.x*(-z),vz=right.z*x+forward.z*(-z);const sp=5.2;const xx=player.position.x+vx*sp*dt,zz=player.position.z+vz*sp*dt;if(!solid(xx,player.position.z))player.position.x=xx;if(!solid(player.position.x,zz))player.position.z=zz;const targetYaw=Math.atan2(vx,vz);player.rotation.y+=Math.atan2(Math.sin(targetYaw-player.rotation.y),Math.cos(targetYaw-player.rotation.y))*Math.min(1,dt*13)}else moving=false;
 animateCharacter(player,dt,moving,elapsed);const goal=new THREE.Vector3(player.position.x+12,19,player.position.z+17);camera.position.lerp(goal,Math.min(1,dt*3.8));camera.lookAt(player.position.x,0,player.position.z);toastPlace();if(online&&elapsed-lastSync>.19){lastSync=elapsed;sendState()}}
 if(opponent){opponent.position.lerp(opponent.userData.target,Math.min(1,dt*7));opponent.rotation.y+=Math.atan2(Math.sin(opponent.userData.targetYaw-opponent.rotation.y),Math.cos(opponent.userData.targetYaw-opponent.rotation.y))*Math.min(1,dt*8);animateCharacter(opponent,dt,opponent.position.distanceTo(opponent.userData.target)>.02,elapsed)}
 if(water){water.material.opacity=.88+Math.sin(elapsed*1.5)*.035;water.position.y=.082+Math.sin(elapsed*2)*.008}
 for(let i=0;i<animatedFlowers.length;i++){const f=animatedFlowers[i];f.g.rotation.z=Math.sin(elapsed+f.offset)*.06}renderer.render(scene,camera)}
function selectedAvatar(id){chosen=id;document.querySelectorAll('[data-avatar]').forEach(b=>b.classList.toggle('active',b.dataset.avatar===id))}
$('avatars').innerHTML=avatars.map(a=>`<button class="avatar-card ${a.id==='bunny'?'active':''}" data-avatar="${a.id}"><span class="avatar-face">${a.emoji}</span><b>${a.name}</b><small>${a.tag}</small></button>`).join('');document.querySelectorAll('[data-avatar]').forEach(b=>b.onclick=()=>selectedAvatar(b.dataset.avatar));
const inviteCode=new URLSearchParams(location.search).get('room');if(inviteCode&&/^[A-Z0-9]{6}$/i.test(inviteCode)){$('join-code').value=inviteCode.toUpperCase()}
function getName(){nickname=($('player-name').value||'Player').trim().slice(0,20)||'Player'}
function enterWorld(){getName();show('welcome-overlay',false);show('lobby-overlay',false);show('hud');show('controls');show('place-pill');inGame=true;if(player){scene.remove(player);player=null}player=makeCharacter(chosen,nickname,save.hat);player.position.set(-3,0,7);$('hud-name').textContent=nickname;$('hud-avatar').textContent=avatars.find(a=>a.id===chosen)?.emoji||'🐰';$('connection').textContent=online?`Online • ${room}`:'Chơi thử một mình';persist();toastPlace();sendState(true)}
$('solo-btn').onclick=()=>{online=false;enterWorld()};
function err(e,where='welcome-error'){console.error(e);$(where).textContent=(e?.code?e.code+': ':'')+(e?.message||String(e))}
function roomPlayer(){return {uid,name:nickname,avatar:chosen,hat:save.hat,x:Number((player?.position.x??-3).toFixed(2)),z:Number((player?.position.z??7).toFixed(2)),facing:Number((player?.rotation.y??0).toFixed(2)),action:player?.userData.action||'idle',actionAt:actionStamp,updatedAt:Date.now()}}
async function initFirebase(){if(!configured)throw new Error('Chưa có cấu hình Firebase.');if(rt)return;const [appmod,authmod,dbmod]=await Promise.all([import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js')]);rt=dbmod;const app=appmod.initializeApp(firebaseConfig);auth=authmod.getAuth(app);db=dbmod.getDatabase(app);if(!auth.currentUser)await authmod.signInAnonymously(auth);uid=auth.currentUser.uid}
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';function randomRoom(){let bytes=new Uint8Array(6);crypto.getRandomValues(bytes);return Array.from(bytes,n=>alphabet[n%alphabet.length]).join('')}
async function joinRoom(create=false){getName();$('welcome-error').textContent='';$('create-btn').disabled=$('join-btn').disabled=true;
 try{await initFirebase();let code=create?randomRoom():$('join-code').value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);if(code.length!==6)throw new Error('Mã phòng phải có 6 ký tự.');let mySlot;
 if(create){const ref=rt.ref(db,`rooms/${code}`),entry={host:uid,status:'waiting',createdAt:Date.now(),slots:{A:roomPlayer()}};const tx=await rt.runTransaction(ref,old=>old===null?entry:undefined,{applyLocally:false});if(!tx.committed)throw new Error('Mã phòng trùng, hãy tạo phòng mới.');mySlot='A';host=true}
 else{const roomRef=rt.ref(db,`rooms/${code}`);const snap=await rt.get(roomRef);if(!snap.exists())throw new Error('Không tìm thấy phòng.');if(snap.val().status!=='waiting')throw new Error('Phòng đã bắt đầu chơi.');if(snap.val().slots?.A?.uid===uid){mySlot='A';host=true}else{const ref=rt.ref(db,`rooms/${code}/slots/B`);const tx=await rt.runTransaction(ref,old=>old===null?roomPlayer():old?.uid===uid?old:undefined,{applyLocally:false});if(!tx.committed)throw new Error('Phòng đã có đủ 2 người.');mySlot='B';host=false}}
 room=code;slot=mySlot;online=true;const myRef=rt.ref(db,`rooms/${room}/slots/${slot}`);disconnectHandle=rt.onDisconnect(myRef);await disconnectHandle.remove();$('room-code').textContent=room;show('welcome-overlay',false);show('lobby-overlay');unsubs.push(rt.onValue(rt.ref(db,`rooms/${room}`),snapshot=>{const r=snapshot.val();if(!r){announce('Phòng đã đóng');leaveGame();return}const players=r.slots||{};$('room-players').innerHTML=Object.values(players).map(p=>`🌷 ${escapeHTML(p.name)} ${p.uid===uid?'(bạn)':''}`).join('<br>')||'Chờ người chơi';$('start-btn').disabled=!(host&&players.A&&players.B);$('start-btn').textContent=host?(players.B?'🌷 Vào thế giới cùng nhau':'Đang chờ người thứ 2...'):'Đang chờ chủ phòng bắt đầu...';if(r.status==='playing'&&!inGame)enterWorld();if(inGame){const p=players[slot==='A'?'B':'A'];if(p){if(!opponent||opponent.userData.avatar!==p.avatar){if(opponent)scene.remove(opponent);opponent=makeCharacter(p.avatar,p.name,p.hat);opponent.position.set(p.x||0,0,p.z||0)}opponent.userData.target.set(Number(p.x)||0,0,Number(p.z)||0);opponent.userData.targetYaw=Number(p.facing)||0;if(opponent.userData.hat!==p.hat){opponent.userData.hat=p.hat;attachHat(opponent,p.hat)}if(p.actionAt!==opponent.userData.lastRemoteActionAt){opponent.userData.lastRemoteActionAt=p.actionAt;opponent.userData.action=p.action;opponent.userData.actionAt=performance.now()}}else if(opponent){scene.remove(opponent);opponent=null;announce('Người chơi kia đã rời phòng')}}},e=>err(e,'lobby-error')));
 }catch(e){err(e);online=false;room='';slot=''}finally{$('create-btn').disabled=$('join-btn').disabled=false}}
$('create-btn').onclick=()=>joinRoom(true);$('join-btn').onclick=()=>joinRoom(false);
$('start-btn').onclick=async()=>{if(!host||!room)return;try{await rt.set(rt.ref(db,`rooms/${room}/status`),'playing')}catch(e){err(e,'lobby-error')}};
$('copy-link').onclick=async()=>{const url=new URL(location.href);url.searchParams.set('room',room);try{await navigator.clipboard.writeText(url.href);$('copy-link').textContent='✅ Đã sao chép link'}catch{announce('Trình duyệt chặn sao chép, dùng mã phòng phía trên')}};
async function sendState(force=false){if(!online||!rt||!player||!room||!slot)return;try{await rt.update(rt.ref(db,`rooms/${room}/slots/${slot}`),roomPlayer())}catch(e){if(force)err(e,'lobby-error')}}
async function cleanOnline(){for(const f of unsubs)f();unsubs=[];if(disconnectHandle){try{await disconnectHandle.cancel()}catch{}disconnectHandle=null}if(online&&db&&room&&slot){try{if(host)await rt.remove(rt.ref(db,`rooms/${room}`));else await rt.remove(rt.ref(db,`rooms/${room}/slots/${slot}`))}catch(e){console.warn('Leave room:',e)}}online=false;room='';slot='';host=false}
async function leaveGame(){await cleanOnline();inGame=false;show('hud',false);show('controls',false);show('place-pill',false);show('lobby-overlay',false);show('welcome-overlay');closeModal();if(player){scene.remove(player);player=null}if(opponent){scene.remove(opponent);opponent=null}}
$('leave-btn').onclick=leaveGame;$('back-btn').onclick=leaveGame;
createCity();persist();
