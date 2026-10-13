import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { OrbitControls } from './vendor/OrbitControls.js';

// Two independent local GLBs share lighting, but keep separate transforms.
export async function mountSeal(container, { interactive = false, dark = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', '抬高臀部的立体海豹与独立的菱形孔金币');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 60);
  camera.position.set(1.9, 2.7, 9.5);
  const target = new THREE.Vector3(-.25, 1.65, 0);
  camera.lookAt(target);
  // A local studio environment gives metal broad reflections, without HDR downloads.
  const studio = new THREE.Scene(); studio.background = new THREE.Color(0x989084);
  const softboxes = [[-4,5,3,7,4,6],[4,3,1,3,6,4],[0,4,-5,5,3,3]];
  softboxes.forEach(([x,y,z,w,h,intensity]) => {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(intensity,intensity,intensity),side:THREE.DoubleSide}));
    panel.position.set(x,y,z); panel.lookAt(0,1,0); studio.add(panel);
  });
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, .06);
  scene.environment = environment.texture; pmrem.dispose();
  studio.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
  scene.add(new THREE.HemisphereLight(0xf8faff, 0x8d857b, 2.3));
  const key = new THREE.DirectionalLight(0xfff5df, 4.2);
  key.position.set(-3, 6, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: .1, far: 20 });
  key.shadow.normalBias = .025; key.shadow.bias = -.0001;
  key.shadow.radius = 4; scene.add(key);
  const rim = new THREE.DirectionalLight(0xcbd8ff, 3);
  rim.position.set(3, 3, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, .8);
  fill.position.set(4, 1, 5); scene.add(fill);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: 0x383b37, opacity: dark ? .30 : .16 }));
  ground.rotation.x = -Math.PI/2; ground.position.y = -.018; ground.receiveShadow = true; scene.add(ground);
  const loader = new GLTFLoader();
  const [sealAsset, coinAsset] = await Promise.all([
    loader.loadAsync('./models/seal.glb?v=17'), loader.loadAsync('./models/coin.glb?v=17')
  ]);
  const model = new THREE.Group(); model.name = 'Seal and coin / separate objects';
  const seal = sealAsset.scene, coin = coinAsset.scene;
  seal.name = 'Seal'; coin.name = 'Coin';
  coin.position.set(-.80, 3.26, .035); coin.rotation.set(.035,-.18,-.10);
  model.add(seal, coin); scene.add(model);
  container.dataset.objects = 'Seal,Coin';
  model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  let controls;
  if (interactive) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target); controls.enableDamping = true;
    controls.enablePan = false; controls.minDistance = 5.5; controls.maxDistance = 14;
    controls.minPolarAngle = .25; controls.maxPolarAngle = Math.PI*.53;
    controls.update();
  }
  let frame = 0, visible = true;
  function render() {
    frame = 0;
    if (!visible) return;
    const moving = controls?.update();
    renderer.render(scene, camera);
    if (moving) requestRender();
  }
  function requestRender() { if (!frame) frame = requestAnimationFrame(render); }
  controls?.addEventListener('change', requestRender);
  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h); camera.aspect = w/h;
    // Keep the whole horizontal silhouette in view on tall phone screens.
    camera.fov = THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(17))*Math.max(1,1.5/camera.aspect)));
    camera.updateProjectionMatrix(); requestRender();
  };
  const observer = new ResizeObserver(resize); observer.observe(container); resize();
  container.dataset.loaded = 'true';
  return {
    setProgress(gather, split, reduced) {
      visible = gather > 0 && split < 1.5;
      model.rotation.y = reduced ? -.08 : -.24 + gather*.24 + split*.85;
      model.rotation.z = reduced ? 0 : Math.sin(split*Math.PI)*.035;
      model.position.y = split*.10;
      // The coin lifts and turns on its own before the gold chapter cards unfold.
      coin.position.y = 3.26 + (reduced ? 0 : split*.58);
      coin.rotation.y = reduced ? -.18 : -.18 + split*Math.PI*.9;
      coin.rotation.z = reduced ? -.10 : -.10 + split*.20;
      seal.rotation.z = reduced ? 0 : Math.sin(split*Math.PI)*-.025;
      model.scale.setScalar(1-split*.2);
      requestRender();
    },
    view(name) {
      const views = { reference:[0,1.8,10.2], perspective:[1.9,2.7,9.5], back:[-2.5,2.8,-9.7], side:[9.8,2.6,.2] };
      camera.position.fromArray(views[name] || views.perspective);
      camera.lookAt(target); controls?.update(); requestRender();
    },
    setWireframe(on) { model.traverse(o=>{if(o.isMesh)o.material.wireframe=on;}); requestRender(); },
    dispose() { observer.disconnect(); controls?.dispose(); cancelAnimationFrame(frame); environment.dispose(); model.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}}); renderer.dispose(); }
  };
}

if (document.querySelector('#seal-stage')) {
  mountSeal(document.querySelector('#seal-stage'), { interactive: true }).then(api => {
    document.querySelector('#load-state').textContent = '拖动旋转 · 滚轮缩放';
    document.querySelectorAll('[data-view]').forEach(button => button.onclick = () => {
      api.view(button.dataset.view);
      document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b===button)));
    });
    document.querySelector('#wireframe').onchange = e => api.setWireframe(e.target.checked);
  }).catch(error => {
    document.querySelector('#load-state').textContent = '3D 预览暂时无法加载，可以下载下方 GLB 文件。';
    console.error(error);
  });
}

if (document.querySelector('#seal-core')) {
  let api;
  const update = () => {
    if (!api) return;
    const host = document.querySelector('#seal-core');
    api.setProgress(Number(host.dataset.gather || 0), Number(host.dataset.split || 0), host.dataset.reduced === 'true');
  };
  window.addEventListener('seal-progress', update);
  mountSeal(document.querySelector('#seal-core'), { dark: true }).then(result => { api=result; update(); }).catch(error => {
    document.querySelector('#seal-core').classList.add('fallback'); console.error(error);
  });
}
