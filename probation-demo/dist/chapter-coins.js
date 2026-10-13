import * as THREE from 'three';

import { GLTFLoader } from './vendor/GLTFLoader.js';

// Reuse the seal's coin geometry for a continuous visual handoff.
const coinAsset=await new GLTFLoader().loadAsync('./models/coin.glb?v=17');
const hosts=[...document.querySelectorAll('[data-chapter-coin]')];
for(const [index,host] of hosts.entries()){
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  host.append(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,30);
  camera.position.set(0,.35,5.4);camera.lookAt(0,0,0);
  const studio=new THREE.Scene();studio.background=new THREE.Color(.30,.26,.18);
  [[-4,5,4,6,5,5],[4,3,0,3,5,3],[0,5,-5,6,2,5]].forEach(([x,y,z,w,h,k])=>{
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(k,k*.93,k*.78),side:THREE.DoubleSide}));
    mesh.position.set(x,y,z);mesh.lookAt(0,0,0);studio.add(mesh);
  });
  const generator=new THREE.PMREMGenerator(renderer),environment=generator.fromScene(studio,.05);scene.environment=environment.texture;generator.dispose();
  studio.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
  scene.add(new THREE.HemisphereLight(0xffeed0,0x644414,2));
  const key=new THREE.DirectionalLight(0xffefd0,3.2);key.position.set(-3,5,4);scene.add(key);
  const rim=new THREE.DirectionalLight(0xffc558,4);rim.position.set(3,3,-4);scene.add(rim);
  const coin=coinAsset.scene.clone(true);coin.scale.setScalar(1.55);
  coin.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.emissive=new THREE.Color(0xc98016);o.material.emissiveIntensity=.09;}});
  scene.add(coin);
  let frame=0;
  function render(){
    frame=0;if(Number(host.parentElement.style.opacity)<=0)return;
    const core=document.querySelector('#seal-core'),split=Number(core.dataset.split||0),reduced=core.dataset.reduced==='true';
    const direction=index===0?-1:1;
    const turn=Number(host.dataset.turn||0),stretch=Number(host.dataset.stretch||0);
    coin.rotation.y=reduced?direction*.18:direction*(.26+(1-split)*1.0)*(1-turn)+Math.PI/2*turn;
    coin.scale.y=1.55*(1+stretch*.32);
    // The actual 3D edge meets the luminous card hinge before the coin fades.
    coin.scale.z=1.55*(1-turn*.75);
    coin.rotation.z=reduced?0:direction*.045*(1-turn);
    coin.position.y=reduced?0:Math.sin(split*Math.PI)*.08;
    renderer.render(scene,camera);
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(render);}
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();schedule();}
  new ResizeObserver(resize).observe(host);resize();
  window.addEventListener('seal-progress',schedule);
  host.dataset.loaded='true';
}
