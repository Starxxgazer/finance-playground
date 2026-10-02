import * as T from './vendor/three.js';
import { SCENES } from './data.js';
import { M, material, group, box, cylinder, text, plant, table, factories, breadTray, invitation, cup } from './props3d.js';

export function createWorld({ host, onInspect, onError, onRestore }) {
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap; renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.18;
  const canvas = renderer.domElement; canvas.id = 'scene-canvas'; canvas.setAttribute('aria-label', '三维调查场景'); host.append(canvas);
  const pmrem = new T.PMREMGenerator(renderer), room = new T.RoomEnvironment();
  const environment = pmrem.fromScene(room, .06); room.dispose(); pmrem.dispose();
  const world = new T.Scene(); world.background = new T.Color('#1b2929'); world.environment = environment.texture; world.environmentIntensity = .16;
  const camera = new T.PerspectiveCamera(58, 1, .1, 100);
  const inspectScene = new T.Scene(); inspectScene.background = new T.Color('#182421'); inspectScene.environment = environment.texture; inspectScene.environmentIntensity = .85;
  const inspectCamera = new T.PerspectiveCamera(38, 1, .1, 40);
  inspectScene.add(new T.HemisphereLight('#fff0cc', '#324a4b', 1.1));
  const key = new T.DirectionalLight('#ffe7bf', 2.2); key.position.set(2, 4, 5); inspectScene.add(key);
  const rim = new T.DirectionalLight('#aecedb', 1.7); rim.position.set(-3, 2, -3); inspectScene.add(rim);
  const controls = new T.OrbitControls(inspectCamera, canvas); controls.enabled = false; controls.enablePan = false;
  controls.enableDamping = true; controls.dampingFactor = .12; controls.minDistance = 2.5; controls.maxDistance = 8;
  controls.addEventListener('change', () => { canvas.dataset.rotation = inspectCamera.position.toArray().map(v => v.toFixed(3)).join(','); requestRender(); });
  const composer = new T.EffectComposer(renderer, new T.WebGLRenderTarget(1, 1, { samples: 4, type: T.HalfFloatType })); composer.addPass(new T.RenderPass(world, camera));
  const ao = new T.SSAOPass(world, camera, 1, 1, 16); ao.kernelRadius = 5; ao.minDistance = .002; ao.maxDistance = .13; composer.addPass(ao);
  const bloom = new T.UnrealBloomPass(new T.Vector2(1, 1), .19, .5, 1.35); composer.addPass(bloom);
  const outline = new T.OutlinePass(new T.Vector2(1, 1), world, camera); outline.edgeStrength = 4; outline.edgeThickness = 1.2; outline.edgeGlow = 0; outline.pulsePeriod = 0;
  outline.visibleEdgeColor.set('#efd6a0'); outline.hiddenEdgeColor.set('#000000'); composer.addPass(outline); composer.addPass(new T.OutputPass());
  const raycaster = new T.Raycaster(), pointer = new T.Vector2(), bounds = new T.Box3(), v = new T.Vector3();
  const objects = new Map(), cache = new Map();
  let current = '', sceneRoot, inspected, inspectionRoot, hovered = '', frame = 0, disposed = false, lost = false;
  let active = false, resizeObserver, currentHost = host;
  const tooltip = document.querySelector('#object-tooltip'), events = new AbortController();
  function requestRender() { if (!frame && !disposed && !lost && !document.hidden) frame = requestAnimationFrame(draw); }
  function draw() {
    frame = 0; if (disposed || lost) return;
    if (inspected) { controls.update(); renderer.render(inspectScene, inspectCamera); }
    else composer.render();
    host.dataset.ready = 'true';
  }
  function light(parent, x, z) {
    const g = group(parent, x, 0, z);
    cylinder(g, .011, .011, .45, M.dark, 0, 3.57, 0);
    cylinder(g, .055, .08, .13, M.brass, 0, 3.37, 0);
    const profile = [[0,0],[.1,0],[.13,.12],[.18,.23],[.32,.29],[.39,.3],[.40,.32],[.39,.34]];
    const shade = new T.Mesh(new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,3.38-y)),48), M.green); shade.castShadow=true;g.add(shade);
    const bulbMaterial = new T.MeshStandardMaterial({color:'#ffdb9c',emissive:'#ffc36a',emissiveIntensity:3});
    cylinder(g,.11,.11,.025,bulbMaterial,0,3.085,0);
    const bulb = new T.SpotLight('#ffd094', 70, 12, .88, .7, 2); bulb.position.set(x,3.08,z); bulb.target.position.set(x,0,z);
    bulb.castShadow=x<0; bulb.shadow.mapSize.set(1024,1024); bulb.shadow.normalBias=.025; parent.add(bulb,bulb.target);
    const fill = new T.PointLight('#ffd7a0',3,7,2);fill.position.set(x,2.7,z);parent.add(fill);
  }
  function shell(parent, kind) {
    // A full room around the camera: no exposed dollhouse edges or miniature base.
    box(parent,18,.22,20,M.edge,0,-.16,3.5);
    for(let i=0;i<24;i++) for(let j=0;j<5;j++) {
      const x=-5.85+i*.5,z=-3.7+j*3.1;
      box(parent,.495,.055,3.095,kind==='newshop'?M.plaster:M.floor,x,-.016,z,.004);
    }
    box(parent,7.3,3.9,.23,M.plaster,-2.45,1.95,-4.15);
    box(parent,4.95,1,.23,M.plaster,3.625,.5,-4.15);
    box(parent,4.95,.55,.23,M.plaster,3.625,3.67,-4.15);
    box(parent,.18,3.9,18,M.plaster,-6,1.95,3);
    box(parent,.18,3.9,18,M.plaster,6,1.95,3);
    box(parent,12,.18,17,M.plaster,0,3.96,3);
    box(parent,12,.84,.06,M.green,0,.42,-4.0);
    for(let i=0;i<40;i++) box(parent,.028,.73,.035,M.edge,-5.8+i*.3,.43,-3.963,0);
    for(const y of [.08,.86]) box(parent,12,.048,.11,M.wood,0,y,-3.94,.008);
    for(const x of [-5.8,-2,1.1,5.85]) box(parent,.12,3.85,.19,M.edge,x,1.925,-3.89,.018);
    // Outside is also geometry: blue evening, rain-dark buildings and a few lit windows.
    box(parent,22,13,.3,material('#152d36'),0,4,-12);
    for(let i=0;i<8;i++) {
      box(parent,1.35,6+(i%3),1.1,material(i%2?'#203a40':'#2c4546'),-5+i*1.9,2,-9-(i%2));
      for(let j=0;j<4;j++) box(parent,.38,.58,.03,new T.MeshStandardMaterial({color:'#786c4f',emissive:'#b19c68',emissiveIntensity:.35}),-5+i*1.9,.7+j*1.2,-8.425-(i%2));
    }
    const glass = new T.MeshPhysicalMaterial({color:'#a7bcc0',roughness:.09,metalness:.25,transparent:true,opacity:.16,clearcoat:1,depthWrite:false});
    for(const x of [2.3,4.6]) {
      for(const dx of [-1.075,0,1.075]) box(parent,.09,2.32,.24,M.edge,x+dx,2.16,-3.89,.012);
      for(const y of [1.02,2.23,3.31]) box(parent,2.24,.09,.24,M.edge,x,y,-3.89,.012);
      box(parent,2.15,2.24,.012,glass,x,2.16,-3.98,0);
      box(parent,2.43,.12,.42,M.wood,x,.98,-3.8,.025);
      for(let i=0;i<15;i++) box(parent,.005,.045+(i%3)*.055,.003,material('#84969a',.1,.3),x-.94+i*.132,1.18+((i*7)%13)*.21,-3.955,0);
      box(parent,.025,.18,.07,M.brass,x+.85,2.42,-3.72,.009);
    }
    const windowLight = new T.DirectionalLight('#9dc2d3',1.65);windowLight.position.set(3,5,-7);windowLight.target.position.set(-2,0,4);windowLight.castShadow=true;
    windowLight.shadow.mapSize.set(2048,2048);Object.assign(windowLight.shadow.camera,{left:-8,right:8,top:6,bottom:-6,near:.5,far:24});windowLight.shadow.normalBias=.025;windowLight.shadow.bias=-.0001;
    parent.add(windowLight,windowLight.target);
    parent.add(new T.HemisphereLight('#b9c7c9','#302b21',.32));
    const bounce = new T.DirectionalLight('#dbc29a',.65);bounce.position.set(1,3,6);parent.add(bounce);
    light(parent,-2,.2);light(parent,2,-1.3);
    if(kind!=='newshop') plant(parent,4.45,1.07,-3.63,.6);
    // Exposed ceiling joists and brass conduits anchor the room at human scale.
    for(const z of [-3.7,.2,4.1]) box(parent,12,.2,.16,M.edge,0,3.78,z,.018);
    const wire=cylinder(parent,.014,.014,10,M.brass,-5.8,3.58,1.2);wire.rotation.x=Math.PI/2;
  }
  function prop(root, id, x, y, z, rotation = 0) {
    const g = factories[id](); if (/account|contract|payments|budget|schedule|delivery/.test(id)) g.scale.setScalar(.58); if (id==='bakery-book') g.scale.setScalar(.63); if (/-(chen|poster|meng|xiaohe)$/.test(id)) g.scale.setScalar(1.1); if (id==='newshop-invitation') g.scale.setScalar(.55); g.position.set(x, y, z); g.rotation.y = rotation; g.userData.hotspot = id; root.add(g); return g;
  }
  function build(kind) {
    const root = group(); shell(root, kind);
    if (['bakery', 'opening', 'ending'].includes(kind)) {
      box(root, 7.8, .99, 1.3, M.green, -.2, .495, 1.05, .025); box(root, 8.05, .1, 1.53, M.wood, -.2, 1.04, 1.05);
      for (let i = 0; i < 6; i++) { box(root, 1.17, .74, .04, M.edge, -3.47 + i * 1.3, .49, 1.721); box(root, 1.08, .64, .045, M.green, -3.47 + i * 1.3, .49, 1.744); }
      box(root, 7.8, .055, .055, M.brass, -.2, .15, 1.74);
      prop(root, 'bakery-account', 2.36, 1.13, 1.16, -.13); prop(root, 'bakery-book', .45, 1.14, 1.09, .1);
      prop(root, 'bakery-recipe', -2.6, 1.13, 1.06, .04); prop(root, 'bakery-oven', -4.2, 0, -2.67);
      prop(root, 'bakery-chen', -.65, 0, -1.15, .15); prop(root, 'bakery-poster', 2.08, 0, -1.42, -.3);
      for (const y of [1.15, 2.04, 2.92]) {
        box(root, 3.75, .08, .7, M.wood, -.8, y, -3.57);
        for (const x of [-1.75, -.12]) { const tray = breadTray(); tray.position.set(x, y + .05, -3.58); tray.scale.setScalar(.8); root.add(tray); }
      }
      // A framed menu and hanging preparation tools give the side wall depth.
      const menu = group(root, -5.86, 2.42, -.45); menu.rotation.y = Math.PI / 2;
      box(menu, 1.65, 1.42, .1, M.wood); box(menu, 1.48, 1.25, .04, M.green, 0, 0, .075);
      text(menu, '今 日 出 炉\n海盐面包 · 黄油吐司\n慢慢发酵，趁热吃。', 1.35, 1.1, 0, 0, .1, { size: 91 });
      box(root, .4, .1, 2.3, M.wood, -5.74, 1.28, -.5);
      for (let i = 0; i < 3; i++) { const jar = group(root, -5.7, 1.53, -1.15 + i * .65); cylinder(jar, .14, .15, .38, M.cream); cylinder(jar, .16, .16, .055, M.wood, 0, .21, 0); }
      text(root, '留 灯 烘 焙', 3.2, .45, -.8, 3.63, -4.015, { color: '#46564b', size: 110 }); plant(root, 3.9, 0, -2.5, 1.65);
      table(root,4.45,2.75,1.55);cup(root,4.3,1.34,2.8);
      // A low glass bread display with brass hinges and separate wooden joinery.
      const displayGlass=new T.MeshPhysicalMaterial({color:'#bdd1cc',roughness:.075,metalness:.12,transparent:true,opacity:.15,clearcoat:1,depthWrite:false});
      box(root,2.05,.78,.015,displayGlass,-2.6,1.54,1.72,0);
      box(root,2.05,.015,1.25,displayGlass,-2.6,1.94,1.1,0);
      for(const x of [-3.65,-1.55]){
        box(root,.025,.84,.025,M.brass,x,1.54,1.73,.004);
        box(root,.025,.025,1.26,M.brass,x,1.95,1.11,.004);
        box(root,.014,.78,1.23,displayGlass,x,1.54,1.1,0);
      }
      box(root,2.12,.028,.028,M.brass,-2.6,1.95,1.73,.006);
      const tile=material('#8b9284',.42);
      for(let row=0;row<4;row++) for(let col=0;col<10;col++)box(root,.32,.14,.012,tile,-5.63+col*.33,1.06+row*.15,-4.019,.008);
      for(const x of [-5.6,-3.0]){box(root,.03,.44,.12,M.brass,x,2.3,-3.86);box(root,.18,.02,.23,M.edge,x,2.07,-3.83);}
      // Linen towel, flour jars, paper bags and utensils are all modeled geometry.
      const towel=box(root,.46,.02,.64,material('#aaa58e',.98),-1.05,1.103,1.29,.012);towel.rotation.y=.1;
      for(let i=0;i<5;i++)box(root,.01,.003,.61,M.green,-1.23+i*.027,1.115,1.29,.002);
      const utensils=group(root,-4.99,1.33,-3.05);cylinder(utensils,.085,.072,.21,M.steel,0,0,0);
      for(let i=0;i<4;i++){const handle=cylinder(utensils,.014,.014,.42,M.wood,-.04+i*.028,.2,0,12);handle.rotation.z=(i-2)*.14;}
      for(let i=0;i<3;i++){const bag=group(root,3.15+i*.16,1.1,.85+i*.11);box(bag,.25,.34,.16,material('#9b8059'),0,.17,0,.008);box(bag,.26,.025,.17,M.cream,0,.35,0,.004);}
      const prep=table(root,-4.72,-3,2.1);
      for(let i=0;i<3;i++){const jar=group(root,-5.32+i*.43,1.46,-3.15);cylinder(jar,.14,.14,.3,M.cream);cylinder(jar,.145,.145,.04,M.wood,0,.17,0);}

      if (kind === 'ending') { const card = invitation(); card.position.set(1.4, 1.14, 1); root.add(card); }
    } else if (kind === 'supplier') {
      table(root, .2, .75, 6.8); prop(root, 'supplier-contract', -1.3, 1.37, .98, .08);
      prop(root, 'supplier-payments', 1.35, 1.37, .97, -.18); prop(root, 'supplier-photo', -.25, 1.38, .63, -.5);
      prop(root, 'supplier-machine', -3.75, 1.33, -2.3); table(root, -3.9, -2.25, 2.4); prop(root, 'supplier-meng', .55, 0, -1.65, .1);
      const delivery = prop(root, 'supplier-delivery', 3.7, 1.65, -2.3, -.1); delivery.rotation.x = Math.PI / 2;
      box(root, 3.8, 1.5, .12, M.edge, -.1, 2.8, -3.96);
      for (let i = 0; i < 8; i++) { cylinder(root, .026, .026, .34 + (i % 3) * .09, M.steel, -1.55 + i * .42, 2.83, -3.83); box(root, .16, .09, .05, M.steel, -1.55 + i * .42, 3.03 + (i % 3) * .045, -3.81); }
      text(root, '设 备 服 务', 2.6, .38, -.1, 3.77, -3.96, { size: 100 });
      for (let j = 0; j < 3; j++) { box(root, 2.05, .075, 1, M.steel, 4.4, .3 + j * .78, -1.2); for (let i = 0; i < 3; i++) box(root, .5, .4, .64, material('#8b795f'), 3.73 + i * .67, .54 + j * .78, -1.2); }
      for (const x of [3.35, 5.45]) box(root, .07, 2.6, .07, M.dark, x, 1.3, -.72);
    } else {
      table(root, -.7, -.3, 3.2); prop(root, 'newshop-budget', -1.1, 1.37, -.04, .12); prop(root, 'newshop-invitation', .07, 1.37, -.14, -.2);
      const schedule = prop(root, 'newshop-schedule', -3.1, 2.4, -3.88); schedule.rotation.x = Math.PI / 2;
      prop(root, 'newshop-xiaohe', 2.1, 0, -1.65, -.35); prop(root, 'newshop-mark', .4, .019, 2.25); prop(root, 'newshop-leaflet', -4, 0, -.2);
      for (let i = 0; i < 5; i++) { const plank = box(root, .2, 2.8, .09, M.wood, -5.3 + i * .23, 1.35, -2.6); plank.rotation.x = -.16; plank.rotation.z = -.07; }
      text(root, '留灯 · 新的开始', 3.3, .42, -.3, 3.45, -4.01, { color: '#495e52', size: 92 });
    }
    return root;
  }
  function setScene(id) {
    if (current === id) { sync(); return; }
    if (inspected) endInspect(); setHover(''); if (sceneRoot) world.remove(sceneRoot);
    if (!cache.has(id)) cache.set(id, build(id)); sceneRoot = cache.get(id); world.add(sceneRoot); current = id;
    objects.clear(); sceneRoot.traverse(node => { if (node.userData.hotspot) objects.set(node.userData.hotspot, node); });
    host.dataset.scene = id; renderer.shadowMap.needsUpdate = true; resize();
  }
  function resize() {
    if (disposed || lost) return; const rect = currentHost.getBoundingClientRect(); if (!rect.width || !rect.height) return;
    const w = rect.width, h = rect.height; renderer.setSize(w, h); composer.setSize(w, h);
    camera.aspect = host.clientWidth / host.clientHeight; inspectCamera.aspect = w / h; inspectCamera.updateProjectionMatrix();
    const mobile = camera.aspect < 1;
    camera.fov = mobile ? 63 : 55;
    camera.position.set(mobile ? 2.8 : 3.25, mobile ? 3.2 : 2.45, mobile ? 13.2 : 7.25);
    camera.lookAt(-.25,1.35,-1.2);
    if(current==='opening') { camera.position.set(3.9,2.6,mobile?12.5:7.8); camera.lookAt(.25,1.6,-1.1); }
    if(current==='ending') { camera.position.set(3.8,3.3,mobile?9:5.4);camera.lookAt(.9,1.25,.45); }
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(); renderer.shadowMap.needsUpdate = true; sync(); requestRender();
  }
  function project(id) {
    const object = objects.get(id); if (!object) return null;
    object.updateWorldMatrix(true, true); bounds.setFromObject(object); bounds.getCenter(v); if (/-(chen|poster|meng|xiaohe)$/.test(id)) v.y = bounds.max.y - .08; if (id === 'newshop-mark') object.localToWorld(v.set(1.13, .009, 0)); v.project(camera);
    const r = host.getBoundingClientRect(); return { x: (v.x + 1) * r.width / 2, y: (1 - v.y) * r.height / 2, visible: v.z > -1 && v.z < 1 };
  }
  function sync() {
    active = document.body.dataset.phase === 'explore' && !document.querySelector('#screen').classList.contains('talking') && !document.querySelector('#overlay').open;
    if (!active) setHover('');
    const gameRect = document.querySelector('#game').getBoundingClientRect(), r = host.getBoundingClientRect();
    for (const el of document.querySelectorAll('.hotspot')) {
      const p = project(el.dataset.id); if (!p) { el.style.visibility = 'hidden'; continue; }
      el.style.setProperty('--x', `${p.x + r.left - gameRect.left}px`); el.style.setProperty('--y', `${p.y + r.top - gameRect.top}px`); el.style.visibility = p.visible ? '' : 'hidden';
    }
    // UI-only updates do not redraw the unchanged scene behind a dialog.
  }
  function setHover(id) {
    if (hovered === id) return; hovered = id; host.dataset.hovered = id;
    outline.selectedObjects = id && objects.has(id) ? [objects.get(id)] : [];
    canvas.style.cursor = id ? 'pointer' : 'default'; tooltip.hidden = !id;
    if (id) { const h = Object.values(SCENES).flatMap(s => s.hotspots).find(h => h.id === id); tooltip.textContent = `${h.label} · 查看`; const p = project(id), r = host.getBoundingClientRect(); tooltip.style.left = `${Math.min(innerWidth - 190, Math.max(16, p.x + r.left))}px`; tooltip.style.top = `${p.y + r.top + 32}px`; }
    requestRender();
  }
  function hit(event) {
    if (!active || inspected || document.querySelector('#overlay').open) return '';
    const r = canvas.getBoundingClientRect(); pointer.set((event.clientX - r.left) / r.width * 2 - 1, 1 - (event.clientY - r.top) / r.height * 2); raycaster.setFromCamera(pointer, camera);
    // Include occluders so hidden objects cannot be selected through furniture.
    const hits = raycaster.intersectObject(sceneRoot, true).filter(h => h.object.isMesh && h.object.material.opacity !== 0);
    for (const h of hits) { let n = h.object; while (n && n !== sceneRoot) { if (n.userData.hotspot) return n.userData.hotspot; n = n.parent; } if (!h.object.material.transparent) return ''; }
    return '';
  }
  canvas.addEventListener('pointermove', event => { if (!inspected) setHover(hit(event)); }, { signal: events.signal });
  canvas.addEventListener('pointerleave', () => { if (!inspected) setHover(''); }, { signal: events.signal });
  canvas.addEventListener('click', event => { const id = hit(event); if (id) onInspect(id); }, { signal: events.signal });
  document.addEventListener('focusin', e => { if (active && e.target.matches('.hotspot')) setHover(e.target.dataset.id); }, { signal: events.signal });
  document.addEventListener('focusout', e => { if (e.target.matches('.hotspot')) setHover(''); }, { signal: events.signal });
  function inspect(id, viewport) {
    endInspect(); setHover(''); const source = objects.get(id); if (!source) return;
    inspectionRoot = group(inspectScene); const clone = source.clone(true); clone.position.set(0, 0, 0); clone.rotation.set(0, 0, 0); inspectionRoot.add(clone);
    bounds.setFromObject(clone); const size = bounds.getSize(new T.Vector3()), center = bounds.getCenter(new T.Vector3()); clone.position.sub(center);
    inspectionRoot.scale.setScalar(2.25 / Math.max(size.x, size.y, size.z)); inspected = id; currentHost = viewport; viewport.append(canvas); canvas.dataset.inspected = id;
    canvas.setAttribute('aria-label', '物件三维预览，可拖动旋转'); canvas.tabIndex = 0; controls.enabled = true; controls.enableDamping = !matchMedia('(prefers-reduced-motion: reduce)').matches && !document.body.classList.contains('reduce-motion');
    controls.target.set(0, 0, 0); resetInspect(); resizeObserver.observe(viewport); resize();
  }
  function resetInspect() { inspectCamera.position.set(2.3, 2.45, 3.4); controls.target.set(0, 0, 0); controls.update(); controls.saveState(); requestRender(); }
  function rotate(direction) {
    if (!inspected) return; const spherical = new T.Spherical().setFromVector3(inspectCamera.position.clone().sub(controls.target));
    spherical.theta += direction * Math.PI / 8; inspectCamera.position.copy(new T.Vector3().setFromSpherical(spherical).add(controls.target)); controls.update(); requestRender();
  }
  function endInspect() {
    if (!inspected) return; resizeObserver.unobserve(currentHost); inspectScene.remove(inspectionRoot); inspectionRoot = null; inspected = null;
    controls.enabled = false; currentHost = host; host.append(canvas); delete canvas.dataset.inspected; canvas.removeAttribute('tabindex'); canvas.setAttribute('aria-label', '三维调查场景'); resize();
  }
  canvas.addEventListener('keydown', e => { if (!inspected) return; if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); rotate(e.key === 'ArrowLeft' ? -1 : 1); } if (e.key === 'Home') { e.preventDefault(); resetInspect(); } }, { signal: events.signal });
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; host.dataset.ready = 'false'; onError('三维画面暂时中断，仍可通过“场景物件”查看资料。'); }, { signal: events.signal });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; onRestore?.(); renderer.shadowMap.needsUpdate = true; resize(); }, { signal: events.signal });
  document.addEventListener('visibilitychange', requestRender, { signal: events.signal });
  resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  function dispose() {
    disposed = true; cancelAnimationFrame(frame); events.abort(); resizeObserver.disconnect(); controls.dispose();
    const geometries = new Set(), materials = new Set(), textures = new Set();
    for (const root of cache.values()) root.traverse(n => { n.shadow?.dispose(); if (n.geometry) geometries.add(n.geometry); if (n.material) { materials.add(n.material); if (n.material.map) textures.add(n.material.map); } });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
    composer.passes.forEach(p => p.dispose()); composer.dispose(); environment.dispose(); renderer.dispose();
  }
  window.addEventListener('pagehide', e => { if (!e.persisted) dispose(); }, { signal: events.signal });
  window.addEventListener('pageshow', requestRender, { signal: events.signal });
  return { setScene, sync, inspect, endInspect, rotate, resetInspect, project, dispose };
}
