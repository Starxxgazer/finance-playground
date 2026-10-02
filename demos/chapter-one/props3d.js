// Original procedural models, created with Codex. No raster scene/model assets.
import * as T from './vendor/three.js';
const mats = new Map();
export function material(color, roughness = .72, metalness = 0) {
  const key = `${color}:${roughness}:${metalness}`;
  if (!mats.has(key)) mats.set(key, new T.MeshStandardMaterial({ color, roughness, metalness }));
  return mats.get(key);
}
export const M = {
  wood: material('#58402e',.48), edge: material('#362b25'), brass: material('#bd955a', .3, .72),
  cream: material('#e8dcc1'), paper: material('#f4e9cd'), ink: material('#526156'),
  green: material('#294238',.54), steel: material('#84918e', .32, .88), dark: material('#232e2e', .45, .5),
  plaster: material('#aaa18a'), floor: material('#514d3c',.78), bread: material('#bb7137'), crust: material('#e7ad60'),
};
// Procedural material grain is evaluated in model space, including micro-normal detail.
for (const [mat, wood] of [[M.wood, true], [M.plaster, false], [M.floor, true], [M.paper, false]]) {
  mat.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 grainPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ngrainPosition = position;');
    shader.fragmentShader = `varying vec3 grainPosition;
      float hashGrain(vec3 p) { return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453123); }
      float grainNoise(vec3 p) { vec3 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(hashGrain(i),hashGrain(i+vec3(1,0,0)),f.x),mix(hashGrain(i+vec3(0,1,0)),hashGrain(i+vec3(1,1,0)),f.x),f.y),mix(mix(hashGrain(i+vec3(0,0,1)),hashGrain(i+vec3(1,0,1)),f.x),mix(hashGrain(i+vec3(0,1,1)),hashGrain(i+vec3(1,1,1)),f.x),f.y),f.z); }
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float variation = grainNoise(grainPosition * vec3(${wood ? '2.0, 17.0, 35.0' : '90.0'}));
      float fineGrain = grainNoise(grainPosition * vec3(${wood ? '4.0, 30.0, 280.0' : '430.0'}));
      diffuseColor.rgb *= 0.84 + variation * .23 + fineGrain * .065;`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      float microGrain = grainNoise(grainPosition * vec3(${wood ? '3.0, 40.0, 300.0' : '180.0'}));
      vec3 grad = dFdx(microGrain) * cross(dFdy(vViewPosition),normal) + dFdy(microGrain) * cross(normal,dFdx(vViewPosition));
      normal = normalize(normal + grad * ${wood ? '.45' : '.12'});`);
  };
  mat.customProgramCacheKey = () => wood ? 'wood-grain-v2' : 'paper-plaster-grain-v2';
}
export function group(parent, x = 0, y = 0, z = 0) {
  const g = new T.Group(); g.position.set(x, y, z); parent?.add(g); return g;
}
export function box(parent, w, h, d, mat, x = 0, y = 0, z = 0, radius = .025) {
  const geo = radius ? new T.RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)) : new T.BoxGeometry(w, h, d);
  const mesh = new T.Mesh(geo, mat); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function cylinder(parent, r1, r2, h, mat, x = 0, y = 0, z = 0, segments = 24) {
  const mesh = new T.Mesh(new T.CylinderGeometry(r1, r2, h, segments), mat); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function sphere(parent, r, mat, x, y, z, scale = [1, 1, 1]) {
  const mesh = new T.Mesh(new T.SphereGeometry(r, 24, 16), mat); mesh.position.set(x, y, z); mesh.scale.set(...scale); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function text(parent, label, w, h, x, y, z, { color = '#eaddbd', background = null, size = 64 } = {}) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w);
  const ctx = c.getContext('2d'); if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, c.width, c.height); }
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `500 ${size}px "Noto Serif CJK SC", "Songti SC", serif`;
  label.split('\n').forEach((line, i, lines) => ctx.fillText(line, c.width / 2, c.height / 2 + (i - (lines.length - 1) / 2) * size * 1.65, 950));
  const map = new T.CanvasTexture(c); map.colorSpace = T.SRGBColorSpace;
  const mesh = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map, transparent: true, side: T.DoubleSide, depthWrite: false }));
  mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
function paperLines(g, y, x = 0, width = .65) {
  for (let i = 0; i < 7; i++) box(g, width * (i === 6 ? .55 : 1), .002, .008, material('#b2ac93'), x, y, -.32 + i * .09, 0);
}
export function folder(label = '留灯烘焙', color = M.green) {
  const g = group(); box(g, 1.05, .085, 1.4, color); box(g, .98, .038, 1.3, M.paper, .02, .055, 0);
  box(g, .95, .015, 1.26, M.paper, .03, .083, 0); paperLines(g, .094);
  box(g,.29,.026,.1,M.steel,0,.105,-.61,.012);
  tube(g,[[-.08,.12,-.65],[-.09,.18,-.63],[-.07,.20,-.54],[.07,.20,-.54],[.09,.18,-.63],[.08,.12,-.65]],.009,M.steel);
  for(const x of [-.11,.11])cylinder(g,.012,.012,.012,M.dark,x,.125,-.61,12);
  for(let i=0;i<4;i++)box(g,.97,.001,1.28,material(i%2?'#ded4b8':'#f0e6ca'),.02,.042+i*.008,0,0);

  const title = text(g, label, .78, .18, .03, .1, -.46, { color: '#394a40', size: 85 }); title.rotation.x = -Math.PI / 2;
  box(g, .045, .025, 1.32, M.brass, -.47, .075, 0);
  return g;
}
function tube(parent, points, radius, mat) {
  const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
  const mesh = new T.Mesh(new T.TubeGeometry(curve, 32, radius, 8, false), mat); mesh.castShadow = true; parent.add(mesh); return mesh;
}
function pencil(parent, x, y, z, angle = .2) {
  const g = group(parent, x, y, z); g.rotation.y = angle;
  const shaft = cylinder(g, .016, .016, .82, M.green, 0, 0, 0, 6); shaft.rotation.x = Math.PI / 2;
  const nib = cylinder(g, .016, 0, .1, M.wood, 0, 0, .46, 6); nib.rotation.x = Math.PI / 2;
  const lead = cylinder(g, .005, 0, .04, M.dark, 0, 0, .52, 6); lead.rotation.x = Math.PI / 2;
  box(g, .023, .016, .045, M.brass, 0, .003, -.42, .004); return g;
}
export function book() {
  const g = group();
  box(g, 1.7, .07, 1.2, M.edge, 0, 0, 0, .035);
  for (const side of [-1, 1]) {
    box(g, .79, .065, 1.12, M.cream, side * .42, .062, 0, .016);
    for (let i = 0; i < 7; i++) box(g, .785, .002, 1.109, material(i % 2 ? '#c9bea2' : '#e7ddc5'), side * .42, .035 + i * .009, 0, 0);
    const geo = new T.PlaneGeometry(.79, 1.1, 24, 20); const a = geo.attributes.position;
    for (let i = 0; i < a.count; i++) { const x = a.getX(i), z = a.getY(i); a.setXYZ(i, x, .098 + .045 * Math.sin((x / .79 + .5) * Math.PI) + .008 * Math.cos(z * 4), -z); }
    geo.computeVertexNormals(); const sheet = new T.Mesh(geo, M.paper); sheet.position.x = side * .42; sheet.castShadow = true; sheet.receiveShadow = true; g.add(sheet);
    for (let i = 0; i < 9; i++) tube(g, [[side*.07,.118,-.43+i*.1],[side*.36,.148,-.43+i*.1],[side*.76,.112,-.43+i*.1]], .0017, material('#b6b8a0'));
    for (let i = 0; i < 2; i++) tube(g, [[side*(.22+i*.32),.137,-.45],[side*(.22+i*.32),.141,0],[side*(.22+i*.32),.137,.45]], .0013, material('#b6b8a0'));
  }
  tube(g, [[0,.02,-.58],[0,.11,-.5],[0,.12,0],[0,.1,.57],[.09,-.03,.65]], .008, M.green);
  for (const z of [-.4,-.2,0,.2,.4]) tube(g, [[-.025,.104,z],[0,.12,z+.015],[.025,.104,z]], .003, M.cream);
  pencil(g, .57, .17, -.01, -.25);
  return g;
}
export function invitation() {
  const g = group(); box(g, 1.2, .025, .86, M.paper); box(g, 1.23, .025, .89, M.cream, 0, -.03, -.03);
  for(const z of [-.39,.39])box(g,1.12,.001,.003,M.ink,0,.014,z,0);
  for(const x of [-.56,.56])box(g,.003,.001,.78,M.ink,x,.014,0,0);
  const t = text(g, '开 业 邀 请 函\n店长：小禾\n日期：________', 1.1, .75, 0, .015, 0, { color: '#4a5d46', size: 85 }); t.rotation.x = -Math.PI / 2;
  return g;
}
export function breadTray() {
  const g = group(); box(g, 1.55, .045, .92, M.wood, 0, 0, 0, .045);
  for (const z of [-.43, .43]) box(g, 1.55, .07, .03, M.brass, 0, .045, z, .008);
  for (let i = 0; i < 3; i++) {
    const loaf = group(g, (i - 1) * .46, .145, 0); loaf.rotation.y = (i - 1) * .09;
    const geo = new T.SphereGeometry(.28, 48, 32), pos = geo.attributes.position;
    for (let j = 0; j < pos.count; j++) {
      const x=pos.getX(j), y=pos.getY(j), z=pos.getZ(j);
      const rough = 1 + .012 * Math.sin(x*139+z*71)*Math.cos(y*137) + .015*Math.sin(z*47+x*21);
      pos.setXYZ(j, x*.72*rough, Math.max(-.105,y*.66*rough), z*1.34*rough);
    }
    geo.computeVertexNormals();
    const bread = new T.Mesh(geo, M.bread); bread.castShadow = true; bread.receiveShadow = true; loaf.add(bread);
    for (let j = -1; j <= 1; j++) tube(loaf, [[-.13,.1,j*.15-.03],[-.05,.176,j*.15],[.06,.171,j*.15+.03],[.13,.11,j*.15+.05]], .019, M.crust);
    for (let j = 0; j < 18; j++) {
      const a = j * 2.399, r = .025 + (j % 5) * .022;
      const seed = sphere(loaf, .008, M.cream, Math.sin(a)*r, .172-r*.15, Math.cos(a)*r*2.4, [.45,.3,1.3]); seed.rotation.y=a;
    }
  }
  return g;
}
export function oven() {
  const g = group(); box(g, 1.75, 1.85, 1.22, M.steel, 0, 1.01, 0, .09);
  for (let j = 0; j < 2; j++) {
    box(g, 1.5, .6, .08, M.dark, 0, .62 + j * .79, .64);
    box(g, 1.26, .38, .02, material('#454a3c', .21, .45), 0, .62 + j * .79, .686);
    box(g, 1.25, .055, .11, M.brass, 0, .98 + j * .76, .74);
    for (let i = 0; i < 5; i++) box(g, .13, .018, .02, M.cream, -.47 + i * .24, .43 + j * .79, .705);
  }
  for (const x of [-.62, .62]) for (const z of [-.4, .4]) cylinder(g, .075, .08, .18, M.dark, x, .09, z);
  for (const x of [-.76,.76]) for (const y of [.18,1.01,1.81]) {
    const screw = cylinder(g, .017, .017, .012, M.dark, x, y, .628, 12); screw.rotation.x=Math.PI/2;
    box(g, .019, .003, .004, M.steel, x, y, .638, 0);
  }
  for (let i=0;i<12;i++) box(g,.07,.014,.014,M.dark,-.62+i*.112,1.92,.616,.003);
  for (const y of [.62,1.41]) {
    const dial=cylinder(g,.056,.056,.065,M.dark,.67,y,.704); dial.rotation.x=Math.PI/2;
    box(g,.008,.04,.007,M.cream,.67,y+.009,.74,.002);
    for (const yy of [-.18,.18]) box(g,.055,.11,.05,M.steel,-.76,y+yy,.7,.014);
  }
  const sticker = text(g, '设备维护\n老孟 · 服务点', .46, .32, .48, 1.91, .618, { color: '#334a40', background: '#dfd6b9', size: 95 });
  return g;
}
export function wrench() {
  const g=group();
  const shape=new T.Shape();
  shape.moveTo(-.09,.48); shape.lineTo(-.10,-.38); shape.bezierCurveTo(-.27,-.49,-.27,-.70,-.16,-.83);
  shape.lineTo(-.12,-.62);shape.lineTo(.04,-.55);shape.lineTo(.16,-.68);shape.lineTo(.14,-.90);
  shape.bezierCurveTo(.38,-.72,.30,-.49,.10,-.38);shape.lineTo(.09,.48);
  shape.bezierCurveTo(.29,.55,.27,.82,0,.85);shape.bezierCurveTo(-.27,.82,-.29,.55,-.09,.48);
  const hole=new T.Path();for(let i=0;i<7;i++){const a=i*Math.PI/3;const x=Math.cos(a)*.12,y=.655+Math.sin(a)*.12;if(i===0)hole.moveTo(x,y);else hole.lineTo(x,y);}shape.holes.push(hole);
  const geo=new T.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.009,bevelThickness:.008,curveSegments:24});
  geo.rotateX(-Math.PI/2);const mesh=new T.Mesh(geo,M.steel);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);
  box(g,.095,.003,.63,material('#657572',.48,.7),0,.063,0,.02);
  const engraving=text(g,'CHROME VANADIUM',.064,.55,0,.066,0,{color:'#394f4e',size:59});engraving.rotation.x=-Math.PI/2;
  for(let i=0;i<13;i++)tube(g,[[-.07+(i%4)*.045,.064,-.41-i*.015],[-.055+(i%4)*.045,.064,-.445-i*.014]],.0009,material('#c1c7ba',.4,.75));
  return g;
}
export function machine() {
  const g = group(); box(g, 1.2, .2, .9, M.dark, 0, .1, 0); box(g, .45, 1.15, .47, M.green, -.3, .7, -.1);
  const housing = cylinder(g, .33, .33, 1, M.steel, 0, 1.24, 0); housing.rotation.z = Math.PI / 2;
  cylinder(g, .27, .19, .37, M.steel, .32, .47, .13);
  for (let i = 0; i < 8; i++) box(g, .016, .38, .016, M.dark, -.4 + i * .1, 1.23, .32, 0);
  return g;
}
export function boxes() {
  const g = group(); const cardboard = material('#ad8559');
  for (let i = 0; i < 3; i++) {
    const b = group(g, i === 1 ? .48 : -.18, i === 2 ? .65 : 0, i === 1 ? .28 : 0); b.rotation.y = i * .11;
    box(b, .83, .65, .74, cardboard, 0, .325, 0); box(b, .13, .008, .75, M.cream, 0, .655, 0);
    box(b, .25, .18, .007, M.paper, -.13, .34, .375);
  } return g;
}
export function marking() {
  const g = group(); for (const z of [-.7, .7]) box(g, 2.3, .009, .04, M.cream, 0, 0, z, 0);
  for (const x of [-1.13, 1.13]) box(g, .04, .009, 1.4, M.cream, x, 0, 0, 0);
  const tape = new T.Mesh(new T.TorusGeometry(.14, .035, 10, 28), M.cream); tape.rotation.x = Math.PI / 2; tape.position.set(1, .04, .89); g.add(tape); return g;
}
export function person(role) {
  const g = group(); const shirt = material(role==='meng'?'#59645e':'#bfb5a2',.95);
  const cloth = material(role==='chen'?'#504235':'#31443e',.98), skin=material('#9b7861',.93), hair=material(role==='chen'?'#4c4a43':'#242722',.94);
  const leather=material('#272822',.42), trousers=material('#343a37',.97);
  // Adult proportions: seven-and-a-half heads, tapered shoulders, bent elbows.
  for(const side of [-1,1]) {
    const thigh=cylinder(g,.086,.073,.47,trousers,side*.104,.64,0,20);thigh.rotation.z=side*.025;
    const calf=cylinder(g,.073,.06,.39,trousers,side*.12,.23,.018,20);calf.rotation.x=-.03;
    sphere(g,.1,leather,side*.12,.055,.077,[.78,.55,1.55]);
    box(g,.143,.018,.25,M.edge,side*.12,.013,.071,.026);
    for(let i=0;i<4;i++) box(g,.072,.008,.006,material('#585549'),side*.12,.113-i*.007,.11+i*.022,.002);
  }
  const torso=cylinder(g,.19,.165,.58,shirt,0,1.13,-.008,32);torso.scale.z=.65;
  sphere(g,.17,shirt,0,1.37,-.01,[1.2,.45,.75]);
  cylinder(g,.053,.065,.12,skin,0,1.48,-.005);
  // The sculpted head tapers into the jaw instead of using a toy sphere.
  const profile=[[0,0],[.048,.013],[.076,.055],[.082,.117],[.079,.175],[.06,.208],[0,.222]];
  const head=new T.Mesh(new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),32),skin);head.position.set(0,1.52,.001);head.scale.z=.94;head.castShadow=true;g.add(head);
  sphere(g,.079,hair,0,1.707,-.012,[1.04,.58,1]);
  if(role==='xiaohe') {
    for(const side of [-1,1]) sphere(g,.065,hair,side*.055,1.631,-.026,[.42,1.3,.9]);
  } else {
    sphere(g,.07,hair,0,1.657,-.043,[1.03,.85,.61]);
    for(let i=0;i<9;i++) tube(g,[[-.069+i*.016,1.721,-.03],[-.063+i*.015,1.747,.005],[-.059+i*.013,1.723,.038]],.003,hair);
  }
  for(const side of [-1,1]) {
    sphere(g,.022,skin,side*.079,1.624,-.004,[.35,1,.5]);
    sphere(g,.019,material('#b3977c'),side*.034,1.641,.067,[1,.29,.25]);
    sphere(g,.007,material('#252e2a'),side*.034,1.641,.072,[.53,.7,.3]);
    tube(g,[[side*.015,1.66,.075],[side*.035,1.664,.071],[side*.051,1.659,.064]],.003,hair);
  }
  sphere(g,.023,skin,0,1.616,.077,[.42,1,.8]);
  tube(g,[[-.024,1.581,.063],[0,1.578,.072],[.024,1.581,.063]],.0025,material('#6e5040'));
  // Cloth apron with a curved hem, stitched edges, pocket and tied straps.
  const apronGeo=new T.PlaneGeometry(.35,.73,18,24),ap=apronGeo.attributes.position;
  for(let i=0;i<ap.count;i++){ const x=ap.getX(i),y=ap.getY(i);ap.setZ(i,.14+.016*Math.cos(x*75)*(1-(y+.365)/.73)+.035*Math.cos(x*9)); }
  apronGeo.computeVertexNormals();const apronMat=cloth.clone();apronMat.side=T.DoubleSide;
  const apron=new T.Mesh(apronGeo,apronMat);apron.position.set(0,1.055,0);apron.castShadow=true;g.add(apron);
  for(const side of [-1,1]) {
    tube(g,[[side*.12,1.41,.103],[side*.11,1.45,-.04],[side*.13,1.31,-.09]],.012,cloth);
    tube(g,[[side*.172,1.4,.14],[side*.172,1.08,.15],[side*.172,.704,.16]],.0018,material('#8a8974'));
    const upper=group(g,side*.22,1.32,0);upper.rotation.z=side*.12;
    cylinder(upper,.081,.065,.31,shirt,side*.013,-.11,.002,20);
    cylinder(upper,.066,.065,.04,M.cream,side*.013,-.263,.002,20);
    const fore=group(g,side*.245,1.06,.023);fore.rotation.x=-.5;fore.rotation.z=side*.17;
    cylinder(fore,.054,.041,.26,skin,0,-.11,0,20);
    sphere(fore,.054,skin,0,-.271,.003,[.78,1.1,.45]);
    for(let j=0;j<4;j++) {const finger=cylinder(fore,.008,.006,.058,skin,-.026+j*.016,-.323,.005,8);finger.rotation.x=.16;}
    const thumb=cylinder(fore,.011,.007,.05,skin,side*.046,-.277,.014,10);thumb.rotation.z=side*.5;
  }
  box(g,.17,.15,.014,cloth,.014,1.01,.185,.007);
  tube(g,[[-.073,1.086,.196],[.012,1.079,.2],[.1,1.086,.196]],.002,material('#9e9780'));
  for(const side of [-1,1]) {const collar=box(g,.075,.1,.018,M.cream,side*.049,1.421,.074,.007);collar.rotation.z=side*.32;}
  for(const y of [1.31,1.24,1.17]) sphere(g,.008,M.cream,0,y,.137);
  return g;
}
export function plant(parent, x, y, z, scale = 1) {
  const g=group(parent,x,y,z);g.scale.setScalar(scale);
  const clay=material('#64523f',.86);
  const potProfile=[[.13,0],[.145,.025],[.20,.3],[.218,.31],[.218,.34],[.193,.34],[.182,.3],[.13,.025]];
  const pot=new T.Mesh(new T.LatheGeometry(potProfile.map(p=>new T.Vector2(...p)),40),clay);pot.castShadow=true;g.add(pot);
  cylinder(g,.18,.18,.012,material('#262a20'),0,.3,0);
  for(let i=0;i<12;i++){
    const a=i*2.4, h=.45+(i%5)*.095, lx=Math.sin(a)*.25,lz=Math.cos(a)*.25;
    tube(g,[[0,.31,0],[lx*.35,h*.75,lz*.35],[lx,h,lz]],.006,material('#354635'));
    const geo=new T.PlaneGeometry(.15,.37,10,20),p=geo.attributes.position;
    for(let j=0;j<p.count;j++){const xx=p.getX(j),yy=p.getY(j);const t=yy/.37+.5;p.setXYZ(j,xx*Math.pow(Math.max(0,Math.sin(t*Math.PI)),.7),yy,.04*Math.sin(t*Math.PI)+xx*xx*1.8);}
    geo.computeVertexNormals();const leafMat=material(i%2?'#334b32':'#425840',.68).clone();leafMat.side=T.DoubleSide;
    const leaf=new T.Mesh(geo,leafMat);leaf.position.set(lx,h,lz);leaf.rotation.set(-.8,a,.25*Math.sin(a));leaf.castShadow=true;leaf.receiveShadow=true;g.add(leaf);
  }
}
export function cup(parent,x,y,z) {
  const g=group(parent,x,y,z), ceramic=new T.MeshPhysicalMaterial({color:'#c9c4ad',roughness:.21,clearcoat:.55});
  const profile=[[.073,0],[.08,.006],[.102,.16],[.107,.17],[.106,.18],[.096,.18],[.089,.03],[.074,.02]];
  const mesh=new T.Mesh(new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),40),ceramic);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);
  tube(g,[[.094,.15,0],[.155,.16,0],[.165,.07,0],[.091,.048,0]],.013,ceramic);
  cylinder(g,.09,.09,.003,material('#312e21',.18),0,.137,0);
  cylinder(g,.16,.155,.016,ceramic,0,-.009,0);
  return g;
}
export function table(parent, x, z, width = 3.1) {
  const g = group(parent, x, 0, z); box(g, width, .14, 1.4, M.wood, 0, 1.25, 0);
  for (const px of [-width / 2 + .16, width / 2 - .16]) for (const pz of [-.5, .5]) box(g, .1, 1.2, .1, M.dark, px, .6, pz);
  return g;
}
export const factories = {
  'bakery-account': () => folder('公司账户 · 记录'), 'bakery-book': book,
  'bakery-chen': () => person('chen'), 'bakery-poster': () => person('xiaohe'),
  'bakery-recipe': breadTray, 'bakery-oven': oven,
  'supplier-contract': () => folder('烤箱合同', M.wood), 'supplier-payments': () => folder('收款核对', M.dark),
  'supplier-meng': () => person('meng'), 'supplier-photo': wrench,
  'supplier-delivery': () => folder('旧送货单', M.cream), 'supplier-machine': machine,
  'newshop-budget': () => folder('新店筹备预算'), 'newshop-schedule': () => folder('施 工 排 期', M.wood),
  'newshop-xiaohe': () => person('xiaohe'), 'newshop-invitation': invitation,
  'newshop-mark': marking, 'newshop-leaflet': boxes,
};
