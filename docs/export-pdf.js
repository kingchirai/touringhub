/* Self-contained PDF renderer. Receives an already-filtered tour snapshot only. */
(function(root){
root.buildTourPDF=async function(data,logoBytes){
 const {PDFDocument,StandardFonts,rgb}=root.PDFLib,doc=await PDFDocument.create();
 const regular=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold),logo=await doc.embedPng(logoBytes);
 const ink=rgb(.09,.09,.09),gray=rgb(.39,.39,.39),red=rgb(.93,.11,.14),line=rgb(.86,.86,.85),pale=rgb(.96,.96,.95),white=rgb(1,1,1);
 const W=595.28,H=841.89,L=40,R=W-40,CW=R-L;let page,y,count=0;
 const clean=v=>String(v??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[–—]/g,'-').replace(/÷/g,'/').replace(/[^\x20-\x7e\n£]/g,'');
 const cash=v=>v==null?'-':'$'+Math.round(v).toLocaleString('en-AU'),num=v=>v==null?'-':Math.round(v).toLocaleString('en-AU'),sum=(a,k)=>a.reduce((s,r)=>s+(Number(r[k])||0),0),ratio=(v,s)=>s>0?(v/s).toFixed(2)+'x':'-';
 const text=(s,x,top,size=10,font=regular,color=ink)=>page.drawText(clean(s),{x,y:H-top-size,size,font,color});
 const rect=(x,top,width,height,color)=>page.drawRectangle({x,y:H-top-height,width,height,color});
 const rule=top=>page.drawLine({start:{x:L,y:H-top},end:{x:R,y:H-top},color:line,thickness:.6});
 function wrap(s,width,size=9,font=regular){let out=[],current='';for(const word of clean(s).split(/\s+/)){if(font.widthOfTextAtSize((current?current+' ':'')+word,size)<=width){current+=(current?' ':'')+word;}else{if(current)out.push(current);current='';for(const ch of word){if(font.widthOfTextAtSize(current+ch,size)>width){out.push(current);current='';}current+=ch;}}}if(current)out.push(current);return out.length?out:[''];}
 function newPage(){page=doc.addPage([W,H]);count++;const lw=185,lh=lw*logo.height/logo.width;page.drawImage(logo,{x:L,y:H-32-lh,width:lw,height:lh});text('CAMPAIGN REPORT',R-132,34,8,bold,gray);text(data.generated,R-132,48,8,regular,gray);rule(88);y=108;}
 function ensure(height){if(y+height>H-65)newPage();}
 function para(s,size=9,color=gray){const lines=wrap(s,CW,size);for(const t of lines){ensure(size+5);text(t,L,y,size,regular,color);y+=size+5;}}
 function section(no,title){ensure(70);y+=15;text(no,L,y,10,bold,red);text(title,L+27,y-3,17,bold);y+=28;rule(y);y+=15;}
 function table(headers,rows,widths){
  function head(){ensure(42);rect(L,y,CW,24,pale);let x=L;headers.forEach((h,i)=>{text(h,x+7,y+7,7,bold,gray);x+=widths[i];});y+=24;}
  head();for(const row of rows){const lines=row.map((v,i)=>wrap(v,widths[i]-14,8.4,i===0?bold:regular));const height=Math.max(...lines.map(a=>a.length))*12+12;if(y+height>H-65){newPage();head();}let x=L;lines.forEach((ls,i)=>{ls.forEach((s,j)=>text(s,x+7,y+6+j*12,8.4,i===0?bold:regular));x+=widths[i];});y+=height;rule(y);}
  y+=8;
 }
 newPage();text('THE CAMPAIGN, IN FOCUS',L,y,8,bold,red);y+=21;
 for(const t of wrap(data.tour,CW,34,bold)){text(t,L,y,34,bold);y+=39;}y+=6;
 para('Meta: '+data.dateRange+' | '+data.campaigns.length+' matched campaigns | Currency: AUD',8);
 para('Meta refreshed: '+data.refreshed+' | Audience Republic imported: '+data.imported,8);y+=18;

 if(data.summary && data.summary.trim()){
  ensure(50);
  text('CAMPAIGN SUMMARY',L,y,8,bold,red);y+=14;
  const paragraphs=data.summary.trim().split('\n');
  for(const p of paragraphs){
   if(p.trim()){
    const lines=wrap(p.trim(),CW,9,regular);
    for(const lineText of lines){
     ensure(14);
     text(lineText,L,y,9,regular,ink);
     y+=13;
    }
    y+=4;
   }
  }
  y+=10;
 }

 const spend=sum(data.campaigns,'spend'),value=sum(data.campaigns,'revenue');
 ensure(110);const widths=[215,150,CW-365],metrics=[['PURCHASE VALUE',data.metaOK?cash(value):'-','Meta-attributed revenue'],['TOTAL AD SPEND',data.metaOK?cash(spend):'-','All matched objectives'],['BLENDED ROAS',data.metaOK?ratio(value,spend):'-','Value / total ad spend']];let mx=L;
 metrics.forEach((m,i)=>{rect(mx,y,widths[i],98,i===0?ink:pale);rect(mx,y,widths[i],3,red);text(m[0],mx+14,y+17,8,bold,i===0?white:gray);let size=i===0?29:24;while(bold.widthOfTextAtSize(m[1],size)>widths[i]-28)size--;text(m[1],mx+14,y+36,size,bold,i===0?white:ink);text(m[2],mx+14,y+77,7,regular,i===0?white:gray);mx+=widths[i];});y+=114;
 const emails=data.messages.filter(m=>m.type==='Email'),sms=data.messages.filter(m=>m.type==='SMS');
 [emails,sms].forEach((rows,i)=>{const x=L+i*(CW+12)/2,w=(CW-12)/2;rect(x,y,w,88,pale);text(i?'SMS AUDIENCE':'EMAIL AUDIENCE',x+14,y+12,8,bold,gray);text(data.audienceOK?num(sum(rows,'recipients')):'-',x+14,y+28,26,bold);text('Recipients across '+rows.length+' sends',x+14,y+60,8,regular,gray);});y+=98;
 section('01','Meta campaign performance');
 if(!data.metaOK)para('Meta data unavailable.');else if(!data.campaigns.length)para('No matching Meta campaigns in this snapshot.');
 for(const type of ['conversion','event','engagement']){const rows=data.campaigns.filter(c=>c.kind===type);if(!rows.length)continue;ensure(95);text(type==='conversion'?'Conversion campaigns':type==='event'?'Event response campaigns':'Post engagement campaigns',L,y,10,bold);y+=20;
  if(type==='conversion')table(['CAMPAIGN','SPEND','VALUE','ROAS','PURCHASES'],rows.map(c=>[c.name,cash(c.spend),cash(c.revenue),ratio(c.revenue,c.spend),num(c.purchases)]),[CW-275,70,85,55,65]);
  else if(type==='event')table(['CAMPAIGN','SPEND','RESPONSES'],rows.map(c=>[c.name,cash(c.spend),num(c.eventResponses)]),[CW-200,90,110]);
  else table(['CAMPAIGN','REACH','INTERACTIONS'],rows.map(c=>[c.name,num(c.reach),num(c.interactions)]),[CW-200,90,110]);
 }
 const date=v=>v&&!isNaN(Date.parse(v))?new Date(v).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'Date unavailable';
 for(const [rows,type,no] of [[emails,'Email','02'],[sms,'SMS','03']]){if(type==='SMS'&&!rows.length)ensure(220);section(no,type+' communications');para(rows.length+' sends | '+num(sum(rows,'recipients'))+' recipients across sends'+(type==='Email'?' | '+num(sum(rows,'opens'))+' opens':'')+' | '+num(sum(rows,'clicks'))+' clicks');y+=7;
 if(!data.audienceOK)para('Audience Republic data unavailable.');else if(!rows.length)para('No matched '+type+' sends in the imported export.');else table(type==='Email'?['SEND / DATE (UTC)','RECIPIENTS','OPENS','CLICKS']:['SEND / DATE (UTC)','RECIPIENTS','CLICKS'],[...rows].sort((a,b)=>String(b.sentAt).localeCompare(String(a.sentAt))).map(m=>[m.name+' | '+date(m.sentAt)+(type==='Email'&&m.subject?' | '+m.subject:''),num(m.recipients),...(type==='Email'?[num(m.opens),num(m.clicks)]:[num(m.clicks)])]),type==='Email'?[CW-210,80,65,65]:[CW-170,90,80]);}
 const note='Only campaigns and sends matched to '+data.tour+' are included. Recipient totals are across sends, not unique people or confirmed deliveries. Meta and imported communications may cover different periods. Meta purchase value is attributed revenue, not verified ticket sales or profit. Blended ROAS uses all matched spend; conversion ROAS uses each campaign\'s spend. A dash means unavailable data or no spend for a ratio.';
 ensure(46+wrap(note,CW,8).length*13);y+=14;rule(y);y+=15;text('READING THIS REPORT',L,y,8,bold);y+=17;para(note,8);
 const pages=doc.getPages();pages.forEach((p,i)=>{page=p;rule(H-43);text('TEAMWRK TOURING | '+clean(data.tour).slice(0,65),L,H-32,7,regular,gray);text((i+1)+' / '+pages.length,R-32,H-32,7,regular,gray);});
 doc.setTitle(data.tour+' - Campaign report');doc.setAuthor('Teamwrk Touring');return doc.save();
};
})(typeof window!=='undefined'?window:globalThis);
