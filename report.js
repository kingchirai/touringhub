'use strict';
const tours=[['MKTO',['mkto']],['Brother Ali',['brother ali','brotherali']],['Dan Does Footy',['dan does footy','ddf']],['28 Days',['28 days','28dayspt2']],['VSPY VSPY',['vspy']],['SOULWAVE',['soulwave']],['You Am I',['you am i','yai']],['harrykirby',['harrykirby','harry kirby']],['Less Than Jake',['less than jake','ltj','circus down under']],['Talib Kweli',['talib kweli','talib']],['The Black Seeds',['the black seeds','black seeds']],['Eric Hutchinson',['eric hutchinson','eric hutch']],['Shapeshifter',['shapeshifter']],['Good Things Festival',['good things']],['Clutch',['clutch']],['Will Sparks',['will sparks','classics','will2027']]];
const $=s=>document.querySelector(s), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>v==null?'—':new Intl.NumberFormat('en-AU',{maximumFractionDigits:0}).format(v);
const money=v=>v==null?'—':new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(v);
const total=(rows,key)=>rows.reduce((s,r)=>s+(Number(r[key])||0),0);
const ratio=(value,spend)=>spend>0?(value/spend).toFixed(2)+'x':'—';
const date=v=>v&&!isNaN(Date.parse(v))?new Date(v).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'Not available';
let meta={campaigns:[]},audience={messages:[]},metaOK=false,audienceOK=false,selected=null;
const campaigns=t=>(meta.campaigns||[]).filter(c=>t[1].some(alias=>(c.name||'').toLowerCase().includes(alias)));
const sends=t=>(audience.messages||[]).filter(m=>m.tour===t[0]);
const kind=c=>c.kind||(/event[\s_-]*(resp|response)/i.test(c.name)?'event':/post[\s_-]*eng|engagement/i.test(c.name)?'engagement':'conversion');
const table=(headers,rows,cls='')=>`<table class="${cls}"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const metric=(label,value,note)=>`<div class="metric"><span class="label">${label}</span><strong>${value}</strong><small>${note}</small></div>`;
const heading=(no,title)=>`<div class="section-title"><span>${no}</span><h2>${title}</h2></div>`;
function campaignSection(rows){
  if(!metaOK)return '<p class="empty">Meta data unavailable. Run the dashboard workflow and reload.</p>';
  if(!rows.length)return '<p class="empty">No matching Meta campaigns in this snapshot.</p>';
  return ['conversion','event','engagement'].map(type=>{
    const group=rows.filter(c=>kind(c)===type);if(!group.length)return '';
    if(type==='event')return '<h3>Event response campaigns</h3>'+table(['Campaign','Spend','Event responses'],group.map(c=>[esc(c.name),money(c.spend),num(c.eventResponses)]));
    if(type==='engagement')return '<h3>Post engagement campaigns</h3>'+table(['Campaign','Reach','Interactions'],group.map(c=>[esc(c.name),num(c.reach),num(c.interactions)]));
    return '<h3>Conversion campaigns</h3>'+table(['Campaign','Spend','Purchase value','ROAS','Purchases'],group.map(c=>[esc(c.name),money(c.spend),`<b>${money(c.revenue)}</b>`,ratio(c.revenue,c.spend),num(c.purchases)]));
  }).join('');
}
function commsSection(rows,type){
  if(!audienceOK)return '<p class="empty">Audience Republic data unavailable. Check the imported JSON file.</p>';
  if(!rows.length)return `<p class="empty">No matched ${type} sends in the imported export.</p>`;
  return table(type==='Email'?['Send / date (UTC)','Recipients','Opens','Clicks']:['Send / date (UTC)','Recipients','Clicks'],[...rows].sort((a,b)=>String(b.sentAt).localeCompare(String(a.sentAt))).map(m=>[
    `${esc(m.name)}<small>${date(m.sentAt)}</small>${type==='Email'&&m.subject?`<small>${esc(m.subject)}</small>`:''}`,num(m.recipients),...(type==='Email'?[num(m.opens),num(m.clicks)]:[num(m.clicks)])
  ]),'comms');
}
function reportHTML(t){
  const c=campaigns(t),a=sends(t),emails=a.filter(m=>m.type==='Email'),sms=a.filter(m=>m.type==='SMS');
  const spend=total(c,'spend'),value=total(c,'revenue');
  const savedSummary=localStorage.getItem('tour_summary_'+t[0])||'';
  const audienceTile=(rows,label)=>`<div class="tile"><p class="eyebrow">${label} audience</p><strong>${audienceOK?num(total(rows,'recipients')):'—'}</strong><p>Recipients across ${rows.length} sends</p><p>${label==='Email'?num(total(rows,'opens'))+' opens · ':''}${num(total(rows,'clicks'))} clicks</p></div>`;
  return `<article class="report" data-tour="${esc(t[0])}"><header class="report-brand"><img src="${esc(new URL('assets/teamwrk-touring.png',document.baseURI).href)}" alt="Teamwrk Touring"><span>Tour performance<br>Campaign report / ${date(new Date().toISOString())}</span></header><div class="report-title"><p class="eyebrow">The campaign, in focus</p><h1>${esc(t[0])}</h1><p>Meta reporting period: ${esc(meta.dateRange||'All time')} · ${c.length} matched campaigns · Currency: AUD</p><p>Meta refreshed: ${date(meta.updatedAt)} · Audience Republic imported: ${date(audience.importedAt)}</p></div><div class="summary-box"><label for="campaign-summary-input" class="summary-label">Campaign summary</label><textarea id="campaign-summary-input" class="summary-input" placeholder="Add a custom summary or personal note for this campaign report (e.g. key highlights, strategy takeaways, audience notes)...">${esc(savedSummary)}</textarea></div><div class="hero">${metric('Purchase value',metaOK?money(value):'—','Meta-attributed revenue, not profit')}${metric('Total ad spend',metaOK?money(spend):'—','All matched campaign objectives')}${metric('Blended ROAS',metaOK?ratio(value,spend):'—','Purchase value ÷ total ad spend')}</div><div class="channel-summary">${audienceTile(emails,'Email')}${audienceTile(sms,'SMS')}</div><section class="section">${heading('01','Meta campaign performance')}${campaignSection(c)}</section><section class="section">${heading('02','Email communications')}<p class="section-note">${emails.length} matched sends · ${num(total(emails,'recipients'))} recipients across sends · ${num(total(emails,'opens'))} opens · ${num(total(emails,'clicks'))} clicks</p>${commsSection(emails,'Email')}</section><section class="section">${heading('03','SMS communications')}<p class="section-note">${sms.length} matched sends · ${num(total(sms,'recipients'))} recipients across sends · ${num(total(sms,'clicks'))} clicks</p>${commsSection(sms,'SMS')}</section><div class="notes"><b>Reading this report</b><br>Only campaigns and communications matched to ${esc(t[0])} are included. Recipient totals are summed across sends, not unique people or confirmed deliveries. Email and SMS reflect the imported export, which may cover a different period from Meta. Meta purchase value is attributed revenue, not independently verified ticket sales or profit. Blended ROAS includes all matched campaign spend; individual conversion ROAS uses that campaign's spend. A dash indicates unavailable data or a ratio with no spend.</div><footer class="report-footer"><span>TEAMWRK TOURING</span><span>${esc(t[0])} / Campaign results</span></footer></article>`;
}
function openTour(index){
  selected=tours[index];
  $('#report-label').textContent=selected[0]+' / Campaign report';
  $('#report-content').innerHTML=reportHTML(selected);
  const input=$('#campaign-summary-input');
  if(input){
    input.oninput=()=>{
      if(selected)localStorage.setItem('tour_summary_'+selected[0],input.value);
    };
  }
  $('#report-dialog').showModal();
}
$('#close').onclick=()=>{$('#report-dialog').close();selected=null;};
$('#report-dialog').addEventListener('close',()=>{selected=null;});
$('#download').onclick=async()=>{
  if(!selected)return;
  const input=$('#campaign-summary-input');
  const summaryText=input?input.value.trim():(localStorage.getItem('tour_summary_'+selected[0])||'').trim();
  const tour=selected, snapshot={tour:tour[0],summary:summaryText,campaigns:campaigns(tour).map(c=>({...c,kind:kind(c)})),messages:sends(tour).map(m=>({...m})),metaOK,audienceOK,dateRange:meta.dateRange||'All time',refreshed:date(meta.updatedAt),imported:date(audience.importedAt),generated:date(new Date().toISOString())};
  const button=$('#download');button.disabled=true;button.textContent='Preparing PDF...';
  try{const response=await fetch('assets/teamwrk-touring.png');if(!response.ok)throw Error('Logo unavailable');const bytes=await buildTourPDF(snapshot,await response.arrayBuffer());const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));const link=document.createElement('a');link.href=url;link.download=tour[0].replace(/[^a-z0-9]+/gi,'-')+'-Campaign-Report-'+new Date().toISOString().slice(0,10)+'.pdf';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  catch(error){console.error('PDF generation failed',error);alert('The PDF could not be created. Please reload and try again. Check that the logo and PDF scripts were uploaded.');}
  finally{button.disabled=false;button.textContent='Download tour PDF';}
};
async function loadJSON(path){const response=await fetch(path,{cache:'no-store'});if(!response.ok)throw Error(response.status);return response.json();}
Promise.allSettled([loadJSON('data/meta-insights.json'),loadJSON('data/audience-republic.json')]).then(([m,a])=>{
  if(m.status==='fulfilled'&&Array.isArray(m.value.campaigns)){meta=m.value;metaOK=true;}
  if(a.status==='fulfilled'&&Array.isArray(a.value.messages)){audience=a.value;audienceOK=true;}
  $('#status').textContent=metaOK&&audienceOK?'Meta + Audience Republic loaded':'Some reporting data unavailable';
  $('#updated').textContent='Meta refreshed: '+date(meta.updatedAt);
  $('#cards').innerHTML=tours.map((t,i)=>`<button class="card" data-index="${i}"><p class="eyebrow">${campaigns(t).length} Meta campaigns · ${sends(t).length} comms</p><h2>${esc(t[0])}</h2><p>${metaOK?money(total(campaigns(t),'spend'))+' ad spend':'Meta data unavailable'}</p><strong>Open tour report <span class="arrow">→</span></strong></button>`).join('');
  document.querySelectorAll('[data-index]').forEach(b=>b.onclick=()=>openTour(Number(b.dataset.index)));
});
