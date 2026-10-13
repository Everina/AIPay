function appendEvidence(container,evidence){
 const element=(tag,text,className)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;return el;};
 const root=element('div',null,'detail-evidence');container.append(root);
 root.append(element('div','交付材料与验证记录','evidence-kicker'));
 const appendFigure=(parent,figure)=>{
  const el=element('figure',null,'evidence-figure'),a=element('a');a.href=figure.src;a.target='_blank';a.rel='noopener';a.setAttribute('aria-label','查看原图：'+figure.title);
  const img=element('img');img.src=figure.src;img.alt=figure.title;img.loading='lazy';a.append(img);
  const caption=element('figcaption');caption.append(element('strong',figure.title),element('span',figure.caption),element('small','点击图片查看原图 ↗'));
  el.append(a,caption);parent.append(el);
 };
 for(const block of evidence.blocks||[]){
  const section=element('section',null,'evidence-section');section.append(element('h3',block.heading));
  if(block.type==='payment'&&!block.figure){
   section.append(element('p','每轮保留样本与验收口径；阶段快照不等于同条件对照实验。','evidence-note'));
   const rounds=element('ol',null,'payment-rounds');rounds.setAttribute('aria-label','支付链路五次评测时间轴');
   evidence.rounds.forEach(round=>{const card=element('li');card.append(element('span',round.date),element('strong',round.metric),element('small',round.label));rounds.append(card);});section.append(rounds);
  }
  if(block.type==='cloud'){
   const comparison=element('div',null,'cloud-snapshots');
   [['40.00%','任务判定口径 · 24/60','8 月 28 日对照评测'],['6.33%','可比较能力条目 · 10/158','后续专项评测']].forEach(([value,scope,label])=>{const card=element('div');card.append(element('span',label),element('strong',value),element('small',scope));comparison.append(card);});section.append(comparison,element('p','统计单位不同，分别报告，不直接计算降幅。','evidence-note'));
  }
  if(block.figure)appendFigure(section,block.figure);
  if(block.table){
   const scroll=element('div',null,'evidence-table-scroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',block.heading+'数据表，可横向滚动');
   const table=element('table');table.append(element('caption',block.heading));
   const head=element('thead'),headRow=element('tr');block.table.headers.forEach(text=>{const th=element('th',text);th.scope='col';headRow.append(th);});head.append(headRow);table.append(head);
   const body=element('tbody');block.table.rows.forEach(row=>{const tr=element('tr');row.forEach((text,i)=>{const cell=element(i?'td':'th',text);if(!i)cell.scope='row';tr.append(cell);});body.append(tr);});table.append(body);scroll.append(table);section.append(scroll);
  }
  (block.paragraphs||[]).forEach(text=>section.append(element('p',text)));
  if(block.note)section.append(element('p',block.note,'evidence-note'));
  root.append(section);
 }
 for(const figure of evidence.figures||[])appendFigure(root,figure);
}
