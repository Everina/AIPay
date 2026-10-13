const names={a:'用户调研',b:'产品设计与路线决策',c:'测试和评测'};const $=s=>document.querySelector(s);const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));const ease=t=>{t=clamp(t);return t*t*(3-2*t)};const ramp=(a,b,n)=>ease((n-a)/(b-a));const mix=(a,b,t)=>a+(b-a)*t;
function evidencePreview(index){
 const item=workEvidence[index];if(!item)return '';
 let visual='';
 if(item.kind==='screen')visual='<div class="mini-upload" aria-label="商品上架界面矢量示意"><div class="mini-upload-head">SkillPay <span>商品上架</span></div><div class="mini-upload-file"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h8l4 4v14H8zM16 3v5h4M4 7v14" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><span>Skill 文件</span></div><div class="mini-upload-fields"><span>基本信息<i></i><i></i></span><span>买断制<b>¥ 10</b></span></div><div class="mini-upload-submit">提交审核 →</div></div>';
 if(item.kind==='research')visual='<div class="mini-research"><strong>8<span>位受访者</span></strong><div>用户洞察<br>↓<br>创作者分层<br>↓<br><b>阶段整体规划</b></div></div>';
 if(item.kind==='states')visual='<div class="mini-states"><b>草稿</b><span>↓</span><b>审核中</b><span>↓</span><b>销售中</b><small>审核失败 · 归档 · 版本生效</small></div>';
 if(item.kind==='creator')visual='<div class="mini-creator"><section><span>PUBLIC SHOWCASE</span><b>创作者公开货架</b><i>作品展示 · 个人主页 · 分享</i></section><section><span>VERSION CONTROL</span><b>商品多版本</b><i>持续更新 · 版本生效 · 管理</i></section></div>';
 if(item.kind==='features')visual='<div class="mini-features"><b>我的技能</b><b>申请退款</b><b>用户评价</b><b>创作者经营</b><span>消费者购后体验 ↔ 创作者反馈</span></div>';
 if(item.kind==='roadmap')visual='<div class="mini-roadmap"><div><i>01</i><b>商业化基础设施</b></div><div><i>02</i><b>创作者信任市场</b></div><div><i>03</i><b>生产与运营平台</b></div><small>产品路线规划</small></div>';
 if(item.kind==='discovery')visual='<div class="mini-discovery"><div><i>01</i><b>SkillHub</b><span>发现 · 理解</span></div><div><i>02</i><b>社区</b><span>连接 · 口碑</span></div><div><i>03</i><b>增长</b><span>触达 · 活跃</span></div></div>';
 if(item.kind==='evaluation')visual='<div class="mini-metrics"><div><strong>92.35<small>%</small></strong><span>最终成功 · 157/170</span></div><div><b>83.53%</b><span>一次成功 · 142/170</span></div></div>';
 return `<aside class="card-evidence evidence-${item.kind}" aria-label="${item.label}">${visual}<div class="evidence-caption">${item.label}</div></aside>`;
}
$('#cards').innerHTML=milestones.map((m,i)=>`<article class="milestone stream-${m[0]}${workEvidence[i]?' has-evidence':''}" tabindex="0" role="group" aria-label="第 ${i+1} 个节点：${m[2].replace('\n','')}" data-index="${i}"><div class="card-top"><span class="stream"><i></i>${names[m[0]]}</span><span>${m[1]}</span></div><div class="card-art" aria-hidden="true"><i></i><i></i><i></i></div><h2>${m[2].replace('\n','<br>')}</h2><p class="card-summary">${m[3]}</p>${evidencePreview(i)}<div class="card-detail"><b>行动</b>${m[4]}<br><b>贡献</b>${m[5]}</div><div class="card-tail"><span>${workReview.items[i].cross?'＋ '+workReview.items[i].cross:'WORK / '+String(i+1).padStart(2,'0')}</span><button class="read-more" type="button" data-detail="${i}" aria-label="查看第 ${i+1} 个工作节点的陈述${workEvidence[i]?'与材料':''}" disabled>${workEvidence[i]?'陈述与材料':'完整陈述'} ↗</button></div><span class="card-mark" aria-hidden="true">${String(i+1).padStart(2,'0')}</span></article>`).join('');
Object.entries(reflectionTopics).forEach(([section,items])=>{
 $(`.${section}-cards`).innerHTML=items.map((item,index)=>`<article class="${section==='growth'?'insight':'future-card'} reflection-card"><span class="reflection-label">${item.label}</span><div class="reflection-art art-${index+1}" aria-hidden="true"><i></i><i></i><i></i></div><h3>${item.headline.replace('\n','<br>')}</h3><p>${item.summary}</p><div class="reflection-bottom"><span>${item.note}</span><button class="topic-read" data-section="${section}" data-topic="${index}" aria-label="阅读完整陈述：${item.title}">完整陈述 ↗</button></div></article>`).join('');
});
const readingLayer=document.createElement('div');readingLayer.id='reading-layer';$('#stage').append(readingLayer);
const cards=[...document.querySelectorAll('.milestone')],insights=[...document.querySelectorAll('.insight')],futures=[...document.querySelectorAll('.future-card')];const count=milestones.length;let cycle=900,workEnd=count*900,total=13000,W=innerWidth,H=innerHeight,raf=0,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
// Apply the same spatial tilt to cards and guide curves, before perspective projection.
function orbitPose(d,mobile,lane=0){
 const theta=d*.76+lane*.04, pitch=8*Math.PI/180, roll=-16*Math.PI/180;
 const x=Math.sin(theta)*(mobile?470:740), y=(Math.cos(theta)-1)*115+d*32+lane*24, z=(Math.cos(theta)-1)*570;
 const py=y*Math.cos(pitch)-z*Math.sin(pitch), pz=y*Math.sin(pitch)+z*Math.cos(pitch);
 return {x:x*Math.cos(roll)-py*Math.sin(roll),y:x*Math.sin(roll)+py*Math.cos(roll),z:pz,rx:8,ry:-Math.sin(theta)*46,rz:-16};
}
let chapterLayouts=[];
function size(){W=innerWidth;H=innerHeight;cycle=Math.max(760,H*1.16);workEnd=cycle*count;total=workEnd+6500;$('#journey').style.height=total+H+'px';measureChapters();draw()}
function go(y){window.scrollTo({top:clamp(y,0,total),behavior:reduced?'instant':'smooth'})}
function focusCard(i){go(i*cycle+cycle*.4)}
cards.forEach((c,i)=>{c.addEventListener('click',()=>focusCard(i));c.addEventListener('keydown',e=>{if(e.target===c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();focusCard(i)}})});
// Native dialog keeps long-form detail readable without moving the story.
const detailDialog=$('#milestone-dialog');let detailTrigger=null,priorOverflow='';
function openStatement(button,number,title,meta,paragraphs,evidence){
 $('#detail-number').textContent=number;$('#detail-title').textContent=title;$('#detail-meta').textContent=meta;
 $('#detail-body').replaceChildren(...paragraphs.map(text=>{const p=document.createElement('p');p.textContent=text;return p}));
 detailDialog.classList.toggle('with-evidence',Boolean(evidence));if(evidence)appendEvidence($('#detail-body'),evidence);
 detailTrigger=button;priorOverflow=document.body.style.overflow;document.body.style.overflow='hidden';detailDialog.showModal();$('.detail-scroll').scrollTop=0;$('#journey').inert=true;
}
document.querySelectorAll('.read-more').forEach(button=>button.addEventListener('click',e=>{
 e.stopPropagation();const index=Number(button.dataset.detail),item=workReview.items[index];
 openStatement(button,`MILESTONE ${String(index+1).padStart(2,'0')} / ${count}`,item.title,`2026 年 ${item.fullDate||item.date} · ${item.lanes}`,item.paragraphs,workEvidence[index]);
}));
document.querySelectorAll('.topic-read').forEach(button=>button.addEventListener('click',()=>{
 const section=button.dataset.section,index=Number(button.dataset.topic),item=reflectionTopics[section][index];
 openStatement(button,`${section==='growth'?'GROWTH':'WHAT’S NEXT'} / ${String(index+1).padStart(2,'0')}`,item.title,section==='growth'?'我的成长':'未来期待',item.paragraphs);
}));
$('#close-detail').onclick=()=>detailDialog.close();
detailDialog.addEventListener('click',e=>{if(e.target===detailDialog){const r=detailDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)detailDialog.close()}});
detailDialog.addEventListener('close',()=>{$('#journey').inert=false;document.body.style.overflow=priorOverflow;detailTrigger?.focus({preventScroll:true})});
const stageStops=()=>[...milestones.map((_,i)=>i*cycle+cycle*.4),workEnd+900,workEnd+1750,workEnd+3550,workEnd+5950];
$('#next').onclick=()=>{const stops=stageStops();go(stops.find(s=>s>scrollY+50)??total)};$('#prev').onclick=()=>go([...stageStops()].reverse().find(s=>s<scrollY-50)??0);$('#restart').onclick=()=>go(0);$('.brand').onclick=e=>{e.preventDefault();go(0)};
function measureChapters(){
 chapterLayouts=['growth','future'].map(name=>{
  const topic=$('#'+name),grid=$('.'+name+'-cards'),first=grid.children[0];
  return {x:topic.offsetLeft+grid.offsetLeft+grid.clientWidth/2,y:topic.offsetTop+grid.offsetTop+grid.clientHeight/2,
   height:W<600?grid.clientHeight:first.offsetHeight,gap:parseFloat(getComputedStyle(grid).columnGap)||24};
 });
}
function drawChapters(after,split,mobile){
 const origins=[1850,4250];
 ['growth','future'].forEach((name,k)=>{
  const t=after-origins[k],dir=k?1:-1,portal=$('.p-'+name),host=portal.querySelector('.chapter-coin'),topic=$('#'+name),layout=chapterLayouts[k];
  const approach=ramp(0,350,t),turn=ramp(350,650,t),coinOut=ramp(600,720,t),enter=ramp(750,800,t),leave=k?0:ramp(2250,2600,t);
  const park=k?ramp(1850,2220,after):0;
  const initialX=mobile?dir*20:dir*W*.205,initialY=mobile?dir*115:dir*34;
  let x=mix(mobile?-25:W*.11,initialX,split),py=mix(mobile?5:-70,initialY,split),scale=mix(.24,mobile?.82:1,split);
  // The future coin waits in the upper-right while the growth chapter is read.
  x=mix(x,W/2-(mobile?50:75),park);py=mix(py,-H/2+(mobile?166:170),park);scale=mix(scale,.24,park);
  const finalScale=mobile?1.08:1.25,coinOffset=mobile?48:60;
  x=mix(x,layout.x-W/2,approach);py=mix(py,layout.y-H/2+coinOffset*finalScale,approach);scale=mix(scale,finalScale,approach);
  let opacity=ramp(1000,1400,after)*(1-coinOut);
  if(k)opacity*=mix(1,.38,park*(1-approach));
  portal.style.opacity=opacity;
  portal.style.transform=`translate3d(${x}px,${py}px,0) rotateY(${reduced?0:dir*(1-split)*62}deg) rotateZ(${reduced?0:dir*(1-split)*-13}deg) scale(${scale})`;
  const labels=(1-ramp(0,250,t))*(k?1-park:1);
  [...portal.children].filter(el=>el!==host).forEach(el=>el.style.opacity=labels);
  host.dataset.turn=turn;host.dataset.stretch=ramp(550,750,t);host.style.setProperty('--halo',1-turn);
  const spine=$('#'+name+'-spine');
  spine.style.left=layout.x+'px';spine.style.top=layout.y+'px';spine.style.height=layout.height+'px';
  spine.style.opacity=reduced?0:ramp(580,660,t)*(1-ramp(1000,1280,t))*(1-leave);
  spine.style.transform=`translate(-50%,-50%) scaleY(${mix(.40,1,ramp(600,850,t))})`;
  spine.style.setProperty('--sweep',ramp(600,1200,t)*100+'%');
  topic.style.opacity=enter*(1-leave);topic.style.transform=`translateY(${-leave*35}px)`;
  const title=topic.querySelector('.topic-title');title.style.opacity=ramp(850,1180,t);title.style.transform=`translateY(${(1-ramp(850,1180,t))*15}px)`;
  const ready=t>=1350&&leave<.1;
  topic.style.pointerEvents=ready?'auto':'none';topic.inert=!ready;topic.setAttribute('aria-hidden',enter<.1||leave>.9);
  const group=k?futures:insights;
  group.forEach((card,j)=>{
   const open=ramp(750+j*100,1250+j*100,t),side=j?1:-1;
   card.style.transformOrigin=mobile?'50% 50%':j?'0% 50%':'100% 50%';
   card.style.opacity=reduced?open:1;
   card.style.transform=reduced?'none':mobile?`rotateY(${side*(1-open)*88}deg) scaleX(${mix(.025,1,open)})`:
    `translateX(${-side*layout.gap/2*(1-open)}px) rotateY(${side*(1-open)*89.8}deg)`;
   card.style.setProperty('--shine',Math.sin(open*Math.PI)*.7);
   card.style.setProperty('--glint',mix(-130,130,open)+'%');
   [...card.children].forEach((el,n)=>{
    const reveal=ramp(.50+n*.025,.86+n*.025,open);
    el.style.opacity=el.classList.contains('reflection-art')?reveal*.45:reveal;
    el.style.transform=`translateY(${reduced?0:(1-reveal)*9}px)`;
   });
  });
  const closing=topic.querySelector('.closing');if(closing)closing.style.opacity=ramp(1400,1750,t);
 });
}
function draw(){raf=0;let y=clamp(scrollY,0,total),q=Math.min(y/cycle,count-.0001),i=Math.floor(q),f=q-i,cursor=i+ramp(.8,1,f),settle=ramp(.06,.2,f)*(1-ramp(.7,.8,f)),focus=ramp(.2,.34,f)*(1-ramp(.64,.7,f));let after=y-workEnd,gather=ramp(0,850,after),split=ramp(950,1650,after),dark=ramp(-300,850,after);let intro=1-ramp(.02,.31,q);$('.work-intro').style.opacity=intro;$('.work-intro').setAttribute('aria-hidden',intro<.1);$('.work-intro').style.transform=`translateY(${-intro*0+ (1-intro)*-25}px)`;
const shade=Math.round(mix(216,20,dark));$('#stage').style.backgroundColor=`rgb(${shade},${Math.round(mix(219,25,dark))},${Math.round(mix(214,26,dark))})`;$('#stage').style.color=dark>.5?'#e6e9e0':'#242b26';$('.ambient').style.opacity=1-dark*.86;
let mobile=W<600,baseW=mobile?340:420,baseScale=mobile?Math.min((W-32)/340,1.15):Math.min(1.95,(W*.72)/420,(H-240)/290),orbitScale=mobile?.68:Math.min(1,W/1200);if(reduced){focus=f<.8?1:0;settle=focus;}
cards.forEach((c,j)=>{let d=j-cursor,pose=orbitPose(d,mobile);let x=pose.x,yy=pose.y,z=pose.z,rx=pose.rx,ry=pose.ry,rz=pose.rz,sc=orbitScale;let fc=j===i?focus:0,align=j===i?settle:0;const introShift=intro*(mobile?125:W*.22);x+=introShift;yy+=intro*(mobile?110:40);x=mix(x,0,align);yy=mix(yy,mobile?28:24,align);z=mix(z,0,align);rx=mix(rx,0,align);ry=mix(ry,0,align);rz=mix(rz,0,align);sc=mix(sc,baseScale,fc);
if(after>=0){let a=j/count*Math.PI*2+gather*.5;let tx=Math.cos(a)*130,ty=Math.sin(a)*100; x=mix(x,tx+(mobile?45:W*.1),gather);yy=mix(yy,ty+(mobile?80:0),gather);z=mix(z,Math.sin(a)*90-120,gather);sc=mix(sc,.16,gather);rx=mix(rx,0,gather);ry=mix(ry,j%2?50:-40,gather);rz=mix(rz,j*40,gather)}
let opacity=(1-ramp(600,1000,after));if(j!==i)opacity*=1-focus*.76;if(Math.abs(d)>6.5&&after<0)opacity=0;if(reduced&&after<0&&j!==i)opacity=0;
c.style.transform=`translate3d(${x}px,${yy}px,${reduced?0:z}px) rotateZ(${reduced?0:rz}deg) rotateX(${reduced?0:rx}deg) rotateY(${reduced?0:ry}deg) scale(${sc})`;c.style.opacity=opacity;c.style.pointerEvents=opacity>.3?'auto':'none';c.tabIndex=opacity>.3?0:-1;c.setAttribute('aria-hidden',opacity<.05);c.style.filter='none';c.style.zIndex=j===i?40:Math.round(10+z/100);c.querySelector('.card-detail').style.opacity=fc;c.querySelector('.card-tail').style.opacity=fc;c.querySelector('.read-more').disabled=fc<.95||after>=0;c.querySelector('.card-mark').style.opacity=mix(.12,.035,fc);c.querySelector('h2').style.marginTop=`${mix(c.classList.contains('has-evidence')?24:37,c.classList.contains('has-evidence')?16:20,fc)}px`;c.querySelector('.card-art').style.opacity=mix(.3,.13,fc);
// At the reading stop, render the same live DOM at layout zoom outside the
// perspective scene. This avoids enlarging a cached 420px GPU texture.
const reading=fc===1&&align===1&&after<0;
if(reading){
 if(c.parentElement!==readingLayer)readingLayer.append(c);
 c.classList.add('is-reading');c.style.zoom=sc;c.style.transform='none';
 c.style.margin='0';c.style.left=(W/2/sc-baseW/2)+'px';
 c.style.top=(($('#stage').clientHeight*.51+yy)/sc-145)+'px';
}else{
 if(c.parentElement===readingLayer)$('#cards').append(c);
 c.classList.remove('is-reading');c.style.removeProperty('zoom');
 c.style.removeProperty('margin');c.style.removeProperty('left');c.style.removeProperty('top');
}
});
const rail=$('#rails');rail.style.opacity=(1-dark)*(1-focus*.7)*.35;if(y<workEnd&&!reduced){[...rail.children].forEach((p,k)=>{let pts=[];for(let n=-8;n<=8;n+=.08){let pose=orbitPose(n,mobile,k-1),pr=1500/(1500-pose.z);let xx=W/2+(pose.x+intro*(mobile?125:W*.22))*pr,yy=H*.51+(pose.y+intro*(mobile?110:40))*pr;pts.push(`${pts.length?'L':'M'}${xx.toFixed(1)},${yy.toFixed(1)}`)}p.setAttribute('d',pts.join(' '))})}else rail.style.opacity=0;
let coreO=ramp(160,730,after)*(1-ramp(1100,1650,after));$('#core').style.opacity=coreO;$('#core').style.transform=`translate3d(${mobile?0:W*.15}px,${mobile?90:35}px,0) scale(${mix(.84,1,gather)*(1-split*.12)})`;
const sealHost=$('#seal-core');sealHost.dataset.gather=coreO>0?gather:0;sealHost.dataset.split=split;sealHost.dataset.reduced=reduced;window.dispatchEvent(new Event('seal-progress'));
$('.gather-copy').style.opacity=ramp(200,700,after)*(1-ramp(1000,1450,after));$('.gather-copy').setAttribute('aria-hidden',after<200||after>1450);$('.gather-copy').style.transform=`translateY(${(1-gather)*30}px)`;
drawChapters(after,split,mobile);
$('#legend').style.opacity=1-ramp(600,1100,after);$('#counter').textContent=after<0?`${String(i+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}`:after<1850?'汇聚':after<4250?'成长':'期待';$('#prev').disabled=y<50;$('#next').disabled=y>total-60;
$('#chapter-name').style.paddingRight=(!mobile&&after>=1850&&after<4600)?'58px':'0';
$('#chapter-index').textContent=after<0?'01 / THE WORK':after<1850?'02 / CONVERGENCE':after<4250?'03 / GROWTH':'04 / WHAT’S NEXT';$('#chapter-name').textContent=after<0?'发生的每一步，都在积累。':after<1850?'三条工作线，一个正在形成的自己。':after<4250?'稳住心态，把细节做扎实。':'持续协作，形成共同的方向。';$('.progress i').style.transform=`scaleX(${y/total})`;
}
window.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(draw)},{passive:true});window.addEventListener('resize',size);size();
// Direct links let the presenter open a specific milestone without replaying the story.
const linkedMilestone=Number(new URLSearchParams(location.search).get('milestone'));
if(Number.isInteger(linkedMilestone)&&linkedMilestone>=1&&linkedMilestone<=count){
 requestAnimationFrame(()=>window.scrollTo({top:(linkedMilestone-1)*cycle+cycle*.4,behavior:'instant'}));
}
