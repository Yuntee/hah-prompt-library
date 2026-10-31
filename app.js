const $ = (selector) => document.querySelector(selector);
export function renderPrompt(template, fields) {
  return template.replace(/\[(학년|교과|학습 목표|교사가 확인한 자료)\]/g, (_, key) => fields[key]?.trim() || (key === '교사가 확인한 자료' ? '아직 제공하지 않음. 필요한 자료는 먼저 교사에게 확인하도록 안내해.' : `[${key}]`));
}
export function matchingCases(cases, roles, query, role) {
  const q = query.trim().toLowerCase();
  return cases.filter(c => (role === 'all' || c.roles.includes(Number(role))) && [c.title,c.subtitle,c.subject,c.objective,...c.roles.map(id => roles.find(r=>r.id===id)?.title)].join(' ').toLowerCase().includes(q));
}
const escape = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderLessonFlow(c) {
 if (!c.lessonFlow) return `<div class="hah-stages">${c.stages.map((s,i)=>`<article class="hah-stage"><b>${['H₁ · 먼저','AI · 함께','H₂ · 다시'][i]}</b><p>${escape(s)}</p></article>`).join('')}</div>`;
 return `<section class="lesson-flow" aria-label="수업 흐름"><h3>수업 흐름</h3><p class="flow-context">아래 용어는 이 수업의 설계 관점을 설명합니다. 사진 자체가 특정 학습 효과를 입증하는 것은 아닙니다.${c.lessonFlow.some(stage=>stage.photos?.length)?' 사진 속 개인정보는 가림 처리했습니다.':''}</p>${c.lessonFlow.map((stage,i)=>`<article class="lesson-stage stage-${i}"><div class="lesson-stage-heading"><span class="lesson-step">${i+1}</span><div><h4>${escape(stage.title)}</h4><p>${escape(stage.context)}</p></div></div><ul class="lesson-activities">${stage.activities.map(a=>`<li>${escape(a)}</li>`).join('')}</ul>${stage.photos?.length?`<div class="lesson-photos">${stage.photos.map((photo,j)=>`<figure><button class="photo-open" data-photo="${i}:${j}" aria-label="${escape(photo.alt)} — 크게 보기"><img src="${escape(photo.src)}" alt="${escape(photo.alt)}" width="${Number(photo.width)||1200}" height="${Number(photo.height)||900}" loading="lazy" decoding="async"><span class="photo-enlarge" aria-hidden="true">크게 보기 ↗</span></button><figcaption>${escape(photo.caption)}</figcaption></figure>`).join('')}</div>`:''}</article>`).join('')}</section>`;
}

async function start() {
 const response = await fetch('/content.json');
 if (!response.ok) throw new Error('콘텐츠를 불러오지 못했습니다.');
 const {cases,roles} = await response.json();
 $('#role-filter').insertAdjacentHTML('beforeend',roles.map(r=>`<option value="${r.id}">${escape(r.title)}</option>`).join(''));
 $('#role-grid').innerHTML=roles.map(r=>{const count=cases.filter(c=>c.roles.includes(r.id)).length;return `<article class="role-card"><span class="role-num">${String(r.id).padStart(2,'0')}</span><div><h3>${escape(r.title)}</h3><p class="english">${escape(r.english)}</p><p>${escape(r.description)}</p><small>${escape(r.boundary)}</small><button data-role="${r.id}">${count?`연결된 사례 ${count}개 보기`:'연결 사례 준비 중 · 설명만 제공'} →</button></div></article>`}).join('');
 function filter() {
 const found=matchingCases(cases,roles,$('#search').value,$('#role-filter').value);
 $('#result-count').textContent=`원고 기반 ${cases.length}개 사례 중 ${found.length}개`;
 $('#empty').hidden=found.length>0;
 $('#cases').innerHTML=found.map(c=>`<article class="case-card"><div class="case-art ${c.id}" aria-hidden="true"><span class="art-icon">${c.id==='school'?'↝ ◇':c.id==='history'?'♜ ?':'◯ ▰'}</span><span class="art-caption">${c.id==='school'?'WALK · OBSERVE · WRITE':c.id==='history'?'ASK · IMAGINE · COMPARE':'OBSERVE · EXPLAIN · REFLECT'}</span></div><div class="case-body"><span class="category">초등 · ${escape(c.subject)} · ${escape(c.category)}</span><h3>${escape(c.title)}</h3><p>${escape(c.subtitle)}</p><div class="tags">${c.roles.map((id,i)=>`<span class="tag">${i?'':'주역할 · '}${escape(roles.find(r=>r.id===id).title)}</span>`).join('')}</div><button class="card-open" data-case="${c.id}">H-A-H 흐름과 프롬프트 <span>↗</span></button></div></article>`).join('');
 }
 $('#search').addEventListener('input',filter);$('#role-filter').addEventListener('change',filter);
 $('#reset').addEventListener('click',()=>{$('#search').value='';$('#role-filter').value='all';filter();$('#search').focus()});
 $('#role-grid').addEventListener('click',e=>{const b=e.target.closest('[data-role]');if(b){$('#role-filter').value=b.dataset.role;$('#search').value='';filter();$('#library').scrollIntoView();$('#role-filter').focus({preventScroll:true})}});
 $('#cases').addEventListener('click',e=>{const b=e.target.closest('[data-case]');if(b)openCase(cases.find(c=>c.id===b.dataset.case))});
 function openCase(c) {
 $('#detail').innerHTML=`<span class="category">초등 · ${escape(c.subject)} · 수업용 재구성</span><h2 id="detail-title">${escape(c.title)}</h2><p class="detail-intro">${escape(c.objective)}</p>${renderLessonFlow(c)}<p class="detail-note">${escape(c.check)}</p><h3>우리 수업에 맞춰 준비하기</h3><p class="detail-intro">교사가 설정한 뒤 학생이 대화할 챗봇용입니다. 아래 값은 이 기기 화면에서만 반영되며 저장·전송되지 않습니다.</p><div class="prompt-settings"><label>학년<select id="grade">${[1,2,3,4,5,6].map(n=>`<option ${n===5?'selected':''}>초등학교 ${n}학년</option>`).join('')}</select></label><label>교과<input id="subject" maxlength="80" value="${escape(c.subject)}"></label><label class="full">학습 목표<input id="objective" maxlength="500" value="${escape(c.objective)}"></label><label class="full">교사가 확인한 자료·문제·실험 조건 (개인정보 제외)<textarea id="materials" maxlength="6000" placeholder="수업에서 사용할 배경자료와 확인한 내용을 넣어 주세요. 특히 역사 문제 카드와 과학 실험 조건을 구체적으로 입력해 주세요."></textarea></label></div><h3>학생 챗봇용 프롬프트</h3><div class="prompt-actions"><button id="copy" class="button">프롬프트 복사 <span>⧉</span></button><span id="copy-status" role="status" aria-live="polite"></span></div><pre id="prompt-output" tabindex="0" aria-label="수업에 맞춰 생성된 프롬프트"></pre><p class="detail-source">윤신영의 강의 원고를 바탕으로 재구성. Chan(2026)의 기능과 연결하되 원논문 실험에 사용된 프롬프트는 아닙니다. 이 사이트에는 챗봇이 내장되어 있지 않습니다. 복사한 프롬프트를 학교에서 승인한 도구의 설정/지침에 넣고 교사가 먼저 시험해 주세요.</p>`;
 function update(){const fields={'학년':$('#grade').value,'교과':$('#subject').value,'학습 목표':$('#objective').value,'교사가 확인한 자료':$('#materials').value};$('#prompt-output').textContent=renderPrompt(c.prompt,fields);$('#copy-status').textContent=''}
 $('#detail').querySelectorAll('input,select,textarea').forEach(el=>el.addEventListener('input',update));update();
 $('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#prompt-output').textContent);$('#copy-status').textContent='복사했습니다. 챗봇 설정에 붙여 넣어 주세요.'}catch{$('#copy-status').textContent='자동 복사를 사용할 수 없습니다. 아래 프롬프트를 선택해 복사해 주세요.';const selection=window.getSelection();const range=document.createRange();range.selectNodeContents($('#prompt-output'));selection.removeAllRanges();selection.addRange(range);$('#prompt-output').focus()}});
 $('#detail').onclick=(event)=>{const button=event.target.closest('[data-photo]');if(!button)return;const [stage,index]=button.dataset.photo.split(':').map(Number);const photo=c.lessonFlow?.[stage]?.photos?.[index];if(!photo)return;$('#photo-title').textContent=photo.caption;const image=$('#photo-full');image.src=photo.src;image.alt=photo.alt;$('#photo-dialog').showModal();$('#close-photo').focus()};
 $('#case-dialog').showModal();$('#close-dialog').focus();
 }
 $('#close-photo').addEventListener('click',()=>$('#photo-dialog').close());
 $('#close-dialog').addEventListener('click',()=>$('#case-dialog').close());
 filter();
}
if (typeof document !== 'undefined') start().catch(()=>{$('#cases').innerHTML='<p role="alert">자료를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.</p>'});
