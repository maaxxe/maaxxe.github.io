const STORAGE_KEY = 'restaurant-menu-data-v2';
const categoryLabels = { entree:'Entrée', plat:'Plat', dessert:'Dessert', boisson:'Boisson', accompagnement:'Accompagnement', autre:'Autre' };
let data;
let activeFilter = 'all';
let dragTagId = null;
const DEFAULT_PUBLISH_ENDPOINT = 'https://chez-lucette-publisher.maaxxe.workers.dev';

function getPublishEndpoint() {
  return (window.RESTAURANT_ADMIN_CONFIG?.publishEndpoint || DEFAULT_PUBLISH_ENDPOINT || '').trim();
}


const $ = id => document.getElementById(id);

function escapeHtml(value='') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function dateKey(date) { const y=date.getFullYear(), m=String(date.getMonth()+1).padStart(2,'0'), d=String(date.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; }
function formatDate(s, opts={}) { return new Intl.DateTimeFormat('fr-FR', opts).format(new Date(`${s}T12:00:00`)); }
function uid() { return `t_${Date.now()}_${Math.random().toString(36).slice(2,7)}`; }

function defaultDay(date) {
  const weekday = date.getDay();
  // Modèle initial Chez Lucette : jeudi, vendredi et dimanche le midi ; samedi midi + soir.
  const lunch = [4, 5, 6, 0].includes(weekday);
  const dinner = weekday === 6;
  return { date: dateKey(date), lunch, dinner, lunchItems: [], dinnerItems: [] };
}

function normalizeData(d) {
  d.restaurant ||= {name:'Chez Lucette', subtitle:'Cuisine conviviale • Plombières-les-Bains', address:'Passage Voltaire, 88370 Plombières-les-Bains', phone:'07 66 37 00 20'};
  d.settings ||= {displayDays:7}; d.tags ||= []; d.days ||= [];
  const today=dateKey(new Date());
  d.days=d.days.filter(x=>x.date>=today);
  const map = new Map(d.days.map(x => [x.date, x]));
  for (let i=0;i<14;i++) { const dt=new Date(); dt.setHours(12,0,0,0); dt.setDate(dt.getDate()+i); const k=dateKey(dt); if(!map.has(k)) d.days.push(defaultDay(dt)); }
  d.days.sort((a,b)=>a.date.localeCompare(b.date));
  return d;
}

async function loadData() {
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) return normalizeData(JSON.parse(local));
  const res = await fetch('data/menu.json', {cache:'no-store'});
  return normalizeData(await res.json());
}

function persistDraft() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function toast(message) { const t=$('toast'); t.textContent=message; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 1800); }

function renderFilters() {
  const cats = ['all', ...Object.keys(categoryLabels)];
  $('categoryFilters').innerHTML = cats.map(c => `<button class="filter-chip ${activeFilter===c?'active':''}" data-filter="${c}">${c==='all'?'Toutes':categoryLabels[c]}</button>`).join('');
  document.querySelectorAll('[data-filter]').forEach(btn => btn.onclick = () => { activeFilter=btn.dataset.filter; renderFilters(); renderTagLibrary(); });
}

function renderTagLibrary() {
  const tags = data.tags.filter(t => activeFilter==='all' || t.category===activeFilter);
  $('tagLibrary').innerHTML = tags.length ? tags.map(t => `<div class="tag-item" draggable="true" data-tag-id="${t.id}">
    <div class="tag-main"><span class="tag-name">${escapeHtml(t.name)}</span><span class="tag-meta">${t.price!=='' && t.price!=null ? Number(t.price).toFixed(2).replace('.',',')+' €' : 'Sans prix'}</span></div>
    <span class="cat-pill">${categoryLabels[t.category]||'Autre'}</span>
  </div>`).join('') : '<p class="help-text">Aucune étiquette dans cette catégorie.</p>';

  document.querySelectorAll('.tag-item').forEach(el => {
    el.addEventListener('dragstart', e => { dragTagId=el.dataset.tagId; e.dataTransfer.setData('text/plain', dragTagId); e.dataTransfer.effectAllowed='copy'; });
    el.addEventListener('click', () => openTagDialog(el.dataset.tagId));
  });
}

function renderRestaurantFields() {
  $('restaurantNameInput').value=data.restaurant.name||'';
  $('restaurantSubtitleInput').value=data.restaurant.subtitle||'';
  $('addressInput').value=data.restaurant.address||'';
  $('phoneInput').value=data.restaurant.phone||'';
  $('displayDays').value=data.settings.displayDays||7;
  $('displayDaysValue').textContent=data.settings.displayDays||7;
}

function assignedHtml(ids) {
  const map=new Map(data.tags.map(t=>[t.id,t]));
  const items=ids.map(id=>map.get(id)).filter(Boolean);
  if(!items.length) return '<div class="drop-hint">Glissez ici les plats à afficher</div>';
  return items.map(t=>`<div class="assigned-tag" data-assigned-id="${t.id}"><div><strong>${escapeHtml(t.name)}</strong><small>${categoryLabels[t.category]||'Autre'}</small></div><button class="remove-assigned" title="Retirer">×</button></div>`).join('');
}

function renderDays() {
  const count=Number(data.settings.displayDays||7);
  $('planningTitle').textContent=`Les ${count} prochain${count>1?'s':''} jour${count>1?'s':''}`;
  const days=data.days.slice(0,count);
  $('adminDays').innerHTML=days.map((day,index)=>`<article class="admin-day" data-day-index="${index}">
    <div class="admin-day-head">
      <div class="admin-day-title"><strong>${formatDate(day.date,{weekday:'long'})}</strong><small>${formatDate(day.date,{day:'numeric',month:'long',year:'numeric'})}</small></div>
      <div class="day-controls">
        <label class="switch-label"><input type="checkbox" data-toggle="lunch" ${day.lunch?'checked':''}> Midi</label>
        <label class="switch-label"><input type="checkbox" data-toggle="dinner" ${day.dinner?'checked':''}> Soir</label>
      </div>
    </div>
    <div class="service-grid">
      <section class="admin-service ${day.lunch?'':'disabled'}"><div class="service-head"><h3>Service du midi</h3></div><div class="drop-zone" data-service="lunch">${assignedHtml(day.lunchItems)}</div></section>
      <section class="admin-service ${day.dinner?'':'disabled'}"><div class="service-head"><h3>Service du soir</h3></div><div class="drop-zone" data-service="dinner">${assignedHtml(day.dinnerItems)}</div></section>
    </div>
  </article>`).join('');

  document.querySelectorAll('.admin-day').forEach((card, localIndex)=>{
    const day=data.days[localIndex];
    card.querySelectorAll('[data-toggle]').forEach(input=>input.addEventListener('change',()=>{ day[input.dataset.toggle]=input.checked; persistDraft(); renderDays(); }));
    card.querySelectorAll('.drop-zone').forEach(zone=>{
      zone.addEventListener('dragover',e=>{e.preventDefault(); if(!day[zone.dataset.service]) return; zone.classList.add('drag-over');});
      zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
      zone.addEventListener('drop',e=>{
        e.preventDefault(); zone.classList.remove('drag-over');
        const service=zone.dataset.service; if(!day[service]) { toast('Activez d’abord ce service'); return; }
        const id=e.dataTransfer.getData('text/plain')||dragTagId; const key=service==='lunch'?'lunchItems':'dinnerItems';
        if(id && !day[key].includes(id)) day[key].push(id);
        persistDraft(); renderDays();
      });
      zone.querySelectorAll('.assigned-tag').forEach(el=>{
        el.querySelector('.remove-assigned').onclick=()=>{ const key=zone.dataset.service==='lunch'?'lunchItems':'dinnerItems'; day[key]=day[key].filter(id=>id!==el.dataset.assignedId); persistDraft(); renderDays(); };
      });
    });
  });
}

function openTagDialog(id=null) {
  const tag=id?data.tags.find(t=>t.id===id):null;
  $('dialogTitle').textContent=tag?'Modifier le plat':'Nouveau plat';
  $('tagId').value=tag?.id||''; $('tagName').value=tag?.name||''; $('tagCategory').value=tag?.category||'plat'; $('tagDescription').value=tag?.description||''; $('tagPrice').value=tag?.price??'';
  $('deleteTagBtn').classList.toggle('hidden', !tag);
  $('tagDialog').showModal();
}
function closeTagDialog(){ $('tagDialog').close(); }

function saveTag(e) {
  e.preventDefault();
  const id=$('tagId').value;
  const tag={id:id||uid(), name:$('tagName').value.trim(), category:$('tagCategory').value, description:$('tagDescription').value.trim(), price:$('tagPrice').value===''?'':Number($('tagPrice').value)};
  if(!tag.name) return;
  if(id) { const i=data.tags.findIndex(t=>t.id===id); data.tags[i]=tag; } else data.tags.push(tag);
  persistDraft(); closeTagDialog(); renderTagLibrary(); renderDays(); toast(id?'Étiquette modifiée':'Étiquette créée');
}

function deleteTag() {
  const id=$('tagId').value; if(!id) return;
  data.tags=data.tags.filter(t=>t.id!==id);
  data.days.forEach(d=>{ d.lunchItems=d.lunchItems.filter(x=>x!==id); d.dinnerItems=d.dinnerItems.filter(x=>x!==id); });
  persistDraft(); closeTagDialog(); renderTagLibrary(); renderDays(); toast('Étiquette supprimée');
}

function exportJson() {
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='menu.json'; a.click(); URL.revokeObjectURL(url); toast('JSON exporté');
}

function importJson(file) {
  if(!file) return; const reader=new FileReader(); reader.onload=()=>{ try { data=normalizeData(JSON.parse(reader.result)); persistDraft(); renderAll(); toast('JSON importé'); } catch { toast('Fichier JSON invalide'); } }; reader.readAsText(file);
}

function openPublishDialog() {
  const openDays=data.days.slice(0,data.settings.displayDays).filter(d=>d.lunch||d.dinner).length;
  const assignments=data.days.slice(0,data.settings.displayDays).reduce((n,d)=>n+d.lunchItems.length+d.dinnerItems.length,0);
  $('publishSummary').innerHTML=`<strong>${openDays}</strong> jour(s) avec au moins un service ouvert<br><strong>${assignments}</strong> plat(s) placé(s) sur le planning<br><strong>${data.tags.length}</strong> étiquette(s) disponibles`;
  const publishEndpoint = getPublishEndpoint();
  $('publishModeText').textContent = publishEndpoint
    ? 'Worker connecté : après confirmation, le menu sera envoyé vers GitHub et publié automatiquement.'
    : 'Mode local : le Worker de publication n’est pas configuré. Les changements restent dans ce navigateur.';
  $('adminPassword').closest('label').classList.toggle('hidden', !publishEndpoint);
  $('publishDialog').showModal();
}

async function confirmPublish() {
  persistDraft();
  const publishEndpoint = getPublishEndpoint();
  if (!publishEndpoint) {
    $('publishDialog').close();
    toast('Enregistré localement — Worker non configuré');
    return;
  }

  const password=$('adminPassword').value;
  if (!password) { toast('Saisissez le mot de passe administrateur'); return; }

  const btn=$('confirmPublishBtn');
  const oldText=btn.textContent;
  btn.disabled=true; btn.textContent='Publication…';
  try {
    const res=await fetch(publishEndpoint, {
      method:'POST',
      headers:{'Content-Type':'application/json','X-Admin-Password':password},
      body:JSON.stringify(data)
    });
    const result=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(result.error || `Erreur HTTP ${res.status}`);
    $('publishDialog').close();
    $('adminPassword').value='';
    toast(result.commit ? `Publié — commit ${result.commit.slice(0,7)}` : 'Publié sur GitHub');
  } catch(err) {
    console.error(err);
    toast(`Publication impossible : ${err.message}`);
  } finally {
    btn.disabled=false; btn.textContent=oldText;
  }
}

function resetData() {
  if(!confirm('Revenir au fichier menu.json d’origine ?')) return;
  localStorage.removeItem(STORAGE_KEY); location.reload();
}

function bind() {
  $('newTagBtn').onclick=()=>openTagDialog(); $('tagForm').addEventListener('submit',saveTag); $('cancelTagBtn').onclick=closeTagDialog; $('deleteTagBtn').onclick=deleteTag;
  $('displayDays').oninput=e=>{data.settings.displayDays=Number(e.target.value); $('displayDaysValue').textContent=e.target.value; persistDraft(); renderDays();};
  ['restaurantNameInput','restaurantSubtitleInput','addressInput','phoneInput'].forEach(id=>$(id).addEventListener('input',()=>{ data.restaurant.name=$('restaurantNameInput').value; data.restaurant.subtitle=$('restaurantSubtitleInput').value; data.restaurant.address=$('addressInput').value; data.restaurant.phone=$('phoneInput').value; persistDraft(); }));
  $('exportBtn').onclick=exportJson; $('importInput').onchange=e=>importJson(e.target.files[0]); $('resetBtn').onclick=resetData; $('publishBtn').onclick=openPublishDialog;
  $('cancelPublishBtn').onclick=()=> $('publishDialog').close(); $('closePublishBtn').onclick=()=> $('publishDialog').close(); $('confirmPublishBtn').onclick=confirmPublish;
}

async function updateWorkerStatus() {
  const endpoint = getPublishEndpoint();
  const status = $('workerStatus');
  if (!status) return;
  if (!endpoint) {
    status.textContent = 'Worker non configuré';
    status.className = 'worker-status offline';
    return;
  }
  status.textContent = 'Vérification du Worker…';
  status.className = 'worker-status checking';
  try {
    const res = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) throw new Error('Worker indisponible');
    status.textContent = 'Worker connecté';
    status.className = 'worker-status online';
  } catch (err) {
    console.warn('Vérification Worker:', err);
    status.textContent = 'Worker configuré — test indisponible';
    status.className = 'worker-status checking';
  }
}

function renderAll(){ renderFilters(); renderTagLibrary(); renderRestaurantFields(); renderDays(); }
loadData().then(d=>{data=d; bind(); renderAll(); updateWorkerStatus();});
