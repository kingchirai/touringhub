/* Self-contained PDF renderer. Receives an already-filtered tour snapshot only. */
(function(root){
root.buildTourPDF=async function(data,logoBytes){
 const {PDFDocument,StandardFonts,rgb}=root.PDFLib,doc=await PDFDocument.create();
 const regular=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold),logo=await doc.embedPng(logoBytes);
 const ink=rgb(.055,.065,.075),slate=rgb(.18,.21,.24),gray=rgb(.39,.42,.44),red=rgb(.91,.10,.13),line=rgb(.82,.83,.82),pale=rgb(.945,.94,.925),paper=rgb(.988,.984,.972),mist=rgb(.975,.972,.963),white=rgb(1,1,1),gold=rgb(.76,.62,.30);
 const W=595.28,H=841.89,L=40,R=W-40,CW=R-L;let page,y,count=0;
 const clean=v=>String(v??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[–—]/g,'-').replace(/÷/g,'/').replace(/[^\x20-\x7e\n£]/g,'');
 const cash=v=>v==null?'-':'$'+Math.round(v).toLocaleString('en-AU'),num=v=>v==null?'-':Math.round(v).toLocaleString('en-AU'),sum=(a,k)=>a.reduce((s,r)=>s+(Number(r[k])||0),0),ratio=(v,s)=>s>0?(v/s).toFixed(2)+'x':'-';
 const text=(s,x,top,size=10,font=regular,color=ink)=>page.drawText(clean(s),{x,y:H-top-size,size,font,color});
 const rect=(x,top,width,height,color)=>page.drawRectangle({x,y:H-top-height,width,height,color});
 const round=(x,top,width,height,r,color,border)=>page.drawRoundedRectangle({x,y:H-top-height,width,height,borderRadius:r,color,borderColor:border,borderWidth:border?.3:0});
 const rule=top=>page.drawLine({start:{x:L,y:H-top},end:{x:R,y:H-top},color:line,thickness:.6});
 function wrap(s,width,size=9,font=regular){let out=[],current='';for(const word of clean(s).split(/\s+/)){if(font.widthOfTextAtSize((current?current+' ':'')+word,size)<=width){current+=(current?' ':'')+word;}else{if(current)out.push(current);current='';for(const ch of word){if(font.widthOfTextAtSize(current+ch,size)>width){out.push(current);current='';}current+=ch;}}}if(current)out.push(current);return out.length?out:[''];}
 function newPage(){page=doc.addPage([W,H]);count++;rect(0,0,W,H,paper);rect(0,0,W,8,red);const lw=154,lh=lw*logo.height/logo.width;page.drawImage(logo,{x:L,y:H-30-lh,width:lw,height:lh});text('TEAMWRK TOURING',R-124,28,7,bold,red);text('CAMPAIGN PERFORMANCE REPORT',R-124,40,7,bold,slate);text(data.generated,R-124,53,7,regular,gray);rule(82);y=103;}
 function ensure(height){if(y+height>H-65)newPage();}
 function para(s,size=9,color=gray){const lines=wrap(s,CW,size);for(const t of lines){ensure(size+5);text(t,L,y,size,regular,color);y+=size+5;}}
 function section(no,title){ensure(70);y+=15;round(L,y,20,20,10,red);text(no,L+4,y+5,7,bold,white);text(title,L+30,y,18,bold,ink);y+=28;rule(y);y+=16;}
 function table(headers,rows,widths){
  function head(){ensure(42);rect(L,y,CW,24,slate);let x=L;headers.forEach((h,i)=>{text(h,x+7,y+7,6.6,bold,white);x+=widths[i];});y+=24;}
  head();for(const [rowIndex,row] of rows.entries()){const lines=row.map((v,i)=>wrap(v,widths[i]-14,8.4,i===0?bold:regular));const height=Math.max(...lines.map(a=>a.length))*12+13;if(y+height>H-65){newPage();head();}if(rowIndex%2===0)rect(L,y,CW,height,mist);let x=L;lines.forEach((ls,i)=>{ls.forEach((s,j)=>text(s,x+7,y+7+j*12,8.4,i===0?bold:regular));x+=widths[i];});y+=height;rule(y);}
  y+=8;
 }
 newPage();text('THE CAMPAIGN, IN FOCUS',L,y,8,bold,red);y+=21;
 for(const t of wrap(data.tour,CW,34,bold)){text(t,L,y,34,bold);y+=39;}y+=6;
 para('Meta reporting period: '+data.dateRange+'   |   '+data.campaigns.length+' matched campaigns   |   Currency: AUD',8);
 para('Meta refreshed: '+data.refreshed+'   |   Audience Republic imported: '+data.imported,8);y+=13;
 if(String(data.summary||'').trim()){
  const lines=wrap(data.summary,CW-34,9),height=39+lines.length*13;ensure(height+12);round(L,y,CW,height,3,white,line);rect(L,y,4,height,red);text('CAMPAIGN SUMMARY',L+16,y+13,8,bold,red);let sy=y+29;for(const lineText of lines){text(lineText,L+16,sy,9,regular,slate);sy+=13;}y+=height+18;
 } else y+=6;
 const spend=sum(data.campaigns,'spend'),value=sum(data.campaigns,'revenue');
 ensure(110);const widths=[215,150,CW-365],metrics=[['PURCHASE VALUE',data.metaOK?cash(value):'-','Meta-attributed revenue'],['TOTAL AD SPEND',data.metaOK?cash(spend):'-','All matched objectives'],['BLENDED ROAS',data.metaOK?ratio(value,spend):'-','Value / total ad spend']];let mx=L;
 metrics.forEach((m,i)=>{round(mx,y,widths[i],98,3,i===0?ink:white,line);rect(mx,y,widths[i],4,i===0?red:gold);text(m[0],mx+14,y+18,7.4,bold,i===0?white:gray);let size=i===0?29:24;while(bold.widthOfTextAtSize(m[1],size)>widths[i]-28)size--;text(m[1],mx+14,y+37,size,bold,i===0?white:ink);text(m[2],mx+14,y+77,7,regular,i===0?white:gray);mx+=widths[i];});y+=115;
 const emails=data.messages.filter(m=>m.type==='Email'),sms=data.messages.filter(m=>m.type==='SMS');
 [emails,sms].forEach((rows,i)=>{const x=L+i*(CW+12)/2,w=(CW-12)/2;round(x,y,w,88,3,white,line);rect(x,y,4,88,i?slate:red);text(i?'SMS AUDIENCE':'EMAIL AUDIENCE',x+15,y+13,7.4,bold,gray);text(data.audienceOK?num(sum(rows,'recipients')):'-',x+15,y+30,26,bold);text('Recipients across '+rows.length+' sends',x+15,y+61,8,regular,gray);});y+=100;
 const trackr=data.trackr||null;
 section('01','Ticket sales performance');
 if(!trackr)para('No Trackr sales snapshot is linked to this tour yet.');
 else{
  ensure(74);const ticketMetrics=[['TOTAL TICKETS SOLD',num(trackr.totalSold)],['% OF CAPACITY SOLD',trackr.capacityPct==null?'-':Number(trackr.capacityPct).toFixed(1)+'%'],['% OF FORECAST SOLD',trackr.forecastPct==null?'-':Number(trackr.forecastPct).toFixed(1)+'%'],['14-DAY DAILY AVERAGE',trackr.avgDailySales==null?'-':Number(trackr.avgDailySales).toFixed(1)]];let tx=L,tw=CW/ticketMetrics.length;ticketMetrics.forEach((m,i)=>{round(tx,y,tw-4,59,3,i===0?ink:white,line);rect(tx,y,tw-4,3,i===0?red:gold);text(m[0],tx+9,y+10,6.4,bold,i===0?white:gray);let size=18;while(bold.widthOfTextAtSize(m[1],size)>tw-20)size--;text(m[1],tx+9,y+25,size,bold,i===0?white:ink);tx+=tw;});y+=73;
  const showRows=Array.isArray(trackr.shows)?trackr.shows:[];
  if(showRows.length){text('SALES NEEDED PER DAY FOR SELL OUT',L,y,9,bold,gray);y+=17;table(['SHOW','SOLD','% CAPACITY','% FORECAST','NEEDED / DAY'],showRows.map(s=>[(s.venue||'Venue')+(s.city?' | '+s.city:'')+(s.date?' | '+s.date:''),num(s.sold),s.capacityPct==null?'-':Number(s.capacityPct).toFixed(1)+'%',s.forecastPct==null?'-':Number(s.forecastPct).toFixed(1)+'%',s.requiredPerDay==null?'-':num(s.requiredPerDay)+'/day']),[CW-220,48,62,62,48]);}
  else para('Trackr supplied no show-by-show detail in the latest snapshot.');
  para('Trackr snapshot: '+(trackr.updatedAt?new Date(trackr.updatedAt).toLocaleString('en-AU'):'Date unavailable')+'. Daily average is calculated from Trackr’s last 14 days of sales history.',8);
  const press=Array.isArray(trackr.press)?trackr.press:[];if(press.length){section('01A','Media & press');press.forEach((item,i)=>para((i+1)+'. '+item.title+' — '+item.url,8,ink));}
 }
 section('02','Meta campaign performance');
 if(!data.metaOK)para('Meta data unavailable.');else if(!data.campaigns.length)para('No matching Meta campaigns in this snapshot.');
 for(const type of ['conversion','event','engagement']){const rows=data.campaigns.filter(c=>c.kind===type);if(!rows.length)continue;ensure(95);text(type==='conversion'?'Conversion campaigns':type==='event'?'Event response campaigns':'Post engagement campaigns',L,y,10,bold);y+=20;
  if(type==='conversion')table(['CAMPAIGN','SPEND','VALUE','ROAS','PURCHASES'],rows.map(c=>[c.name,cash(c.spend),cash(c.revenue),ratio(c.revenue,c.spend),num(c.purchases)]),[CW-275,70,85,55,65]);
  else if(type==='event')table(['CAMPAIGN','SPEND','RESPONSES'],rows.map(c=>[c.name,cash(c.spend),num(c.eventResponses)]),[CW-200,90,110]);
  else table(['CAMPAIGN','REACH','INTERACTIONS'],rows.map(c=>[c.name,num(c.reach),num(c.interactions)]),[CW-200,90,110]);
 }
 const date=v=>v&&!isNaN(Date.parse(v))?new Date(v).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'Date unavailable';
 for(const [rows,type,no] of [[emails,'Email','03'],[sms,'SMS','04']]){if(type==='SMS'&&!rows.length)ensure(220);section(no,type+' communications');para(rows.length+' sends | '+num(sum(rows,'recipients'))+' recipients across sends'+(type==='Email'?' | '+num(sum(rows,'opens'))+' opens':'')+' | '+num(sum(rows,'clicks'))+' clicks');y+=7;
 if(!data.audienceOK)para('Audience Republic data unavailable.');else if(!rows.length)para('No matched '+type+' sends in the imported export.');else table(type==='Email'?['SEND / DATE (UTC)','RECIPIENTS','OPENS','CLICKS']:['SEND / DATE (UTC)','RECIPIENTS','CLICKS'],[...rows].sort((a,b)=>String(b.sentAt).localeCompare(String(a.sentAt))).map(m=>[m.name+' | '+date(m.sentAt)+(type==='Email'&&m.subject?' | '+m.subject:''),num(m.recipients),...(type==='Email'?[num(m.opens),num(m.clicks)]:[num(m.clicks)])]),type==='Email'?[CW-210,80,65,65]:[CW-170,90,80]);}
 const note='Only campaigns, sends and ticket sales matched to '+data.tour+' are included. Recipient totals are across sends, not unique people or confirmed deliveries. Meta, communications and Trackr may cover different periods. Meta purchase value is attributed revenue, not verified ticket sales or profit. Blended ROAS uses all matched spend; conversion ROAS uses each campaign\'s spend. Ticket sales data comes from the linked public Trackr page. A dash means unavailable data or no spend for a ratio.';
 ensure(46+wrap(note,CW,8).length*13);y+=14;rule(y);y+=15;text('READING THIS REPORT',L,y,8,bold);y+=17;para(note,8);
 const pages=doc.getPages();pages.forEach((p,i)=>{page=p;rule(H-43);text('TEAMWRK TOURING  /  '+clean(data.tour).slice(0,65),L,H-32,7,regular,gray);text('CONFIDENTIAL',R-104,H-32,7,bold,red);text((i+1)+' / '+pages.length,R-32,H-32,7,regular,gray);});
 doc.setTitle(data.tour+' - Campaign report');doc.setAuthor('Teamwrk Touring');return doc.save();
};
})(typeof window!=='undefined'?window:globalThis);
