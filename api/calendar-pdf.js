import PDFDocument from 'pdfkit';

const TZ='Asia/Dhaka';
const PAGE={size:'A4',layout:'landscape',margins:{top:24,left:28,right:28,bottom:22}};

function json(res,status,data){
  res.statusCode=status;
  res.setHeader('content-type','application/json; charset=utf-8');
  res.setHeader('cache-control','no-store');
  res.end(JSON.stringify(data));
}

async function readBody(req){
  let s='';
  for await(const chunk of req){
    s+=chunk;
    if(s.length>900000)throw new Error('payload_too_large');
  }
  return s?JSON.parse(s):{};
}

function cleanEvents(value){
  if(!Array.isArray(value))return [];
  return value.map(x=>{
    const title=String(x?.title||'').trim().slice(0,160);
    const date=new Date(x?.date);
    if(!title||Number.isNaN(date.getTime()))return null;
    return {
      title,
      date:date.toISOString(),
      status:x?.status==='tentative'?'tentative':x?.status==='pending'?'pending':'confirmed',
      displayTime:String(x?.displayTime||'').trim().slice(0,40)
    };
  }).filter(Boolean).slice(0,600);
}

function cleanMonths(value){
  if(!Array.isArray(value))return [];
  return [...new Set(
    value.map(x=>String(x||'').trim()).filter(x=>/^\d{4}-(0[1-9]|1[0-2])$/.test(x))
  )].sort().slice(0,24);
}

function localParts(iso){
  const parts=new Intl.DateTimeFormat('en-US',{
    timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(new Date(iso));
  const map={};
  for(const p of parts)if(p.type!=='literal')map[p.type]=p.value;
  return {
    year:Number(map.year),month:Number(map.month)-1,day:Number(map.day),
    hour:Number(map.hour||0),minute:Number(map.minute||0)
  };
}

function monthKey(date){
  const p=localParts(date);
  return p.year+'-'+String(p.month+1).padStart(2,'0');
}

function monthRange(events){
  const keys=[...new Set(events.map(e=>monthKey(e.date)))].sort();
  if(!keys.length)return [];
  const [sy,sm]=keys[0].split('-').map(Number);
  const [ey,em]=keys[keys.length-1].split('-').map(Number);
  const out=[];
  let y=sy,m=sm-1;
  while(y<ey||(y===ey&&m<=em-1)){
    out.push({year:y,month:m});
    m++;
    if(m>11){m=0;y++}
  }
  return out;
}

function shortTitle(title){
  const exact={
    'Medical & Dental':'MAT',
    'DU IBA':'DU-IBA',
    'Aviation and Aerospace University Bangladesh (AAUB)':'AAUB',
    'Dhaka University A / Science':'DU-A',
    'Dhaka University B / Arts, Law & Social Science':'DU-B',
    'Dhaka University Fine Arts':'DU-Fine Arts',
    'Dhaka University C / Business':'DU-C',
    'Khulna University A / Science':'KU-A',
    'Khulna University B / Life Science':'KU-B',
    'Khulna University C / Humanities':'KU-C',
    'Khulna University D / Business':'KU-D',
    'MIST C Unit':'MIST-C',
    'MIST A & B':'MIST-A/B',
    'Jagannath University A / Science':'JnU-A',
    'Jagannath University B / Humanities':'JnU-B',
    'Jagannath University C / Business':'JnU-C',
    'Jagannath University D / Social Science':'JnU-D',
    'Jagannath University E / Fine Arts':'JnU-E',
    'Agriculture Cluster':'ACAS',
    'Rajshahi University A / Humanities':'RU-A',
    'Rajshahi University B / Business':'RU-B',
    'Rajshahi University C / Science':'RU-C',
    'Chittagong University A / Science':'CU-A',
    'Chittagong University B':'CU-B',
    'Chittagong University B1':'CU-B1',
    'Chittagong University B2':'CU-B2',
    'Chittagong University C / Business':'CU-C',
    'Chittagong University D':'CU-D',
    'Chittagong University D1':'CU-D1',
    'Comilla University A':'CoU-A',
    'Comilla University B':'CoU-B',
    'Comilla University C':'CoU-C',
    'SUST A':'SUST-A',
    'SUST B':'SUST-B',
    'BUP BBA General':'BUP-BBA',
    'GST A / Science':'GST-A',
    'GST B / Humanities':'GST-B',
    'GST C / Business':'GST-C',
    'GST D / Architecture':'GST-D'
  };
  if(exact[title])return exact[title];
  if(/^BUP\s+/.test(title))return title.replace(/^BUP\s+/,'BUP-').replace(/\s+/g,'-');
  if(/^(BUET|KUET|RUET|CUET|BUTEX)$/.test(title))return title;
  return title.replace(/\s+University\s+/i,'-').replace(/\s*\/\s*.*/,'').replace(/\s+/g,'-').slice(0,20);
}

function fitText(doc,text,width){
  let out=String(text||'');
  if(doc.widthOfString(out)<=width)return out;
  while(out.length>2&&doc.widthOfString(out+'…')>width)out=out.slice(0,-1);
  return out+'…';
}

function drawMonth(doc,year,month,events,pageNumber,totalPages){
  doc.addPage(PAGE);

  const pageW=doc.page.width,pageH=doc.page.height;
  const left=28,right=28,top=24;
  const contentW=pageW-left-right;
  const monthName=new Date(year,month,1).toLocaleString('en-US',{month:'long',year:'numeric'});
  const monthEvents=events.filter(e=>{
    const p=localParts(e.date);
    return p.year===year&&p.month===month;
  });

  // Header
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(17)
    .text('Admission Calendar',left,top,{width:contentW*.62});
  doc.font('Helvetica').fontSize(7.5)
    .text('Admission by DBT • 2026–27 • Bangladesh time',left,top+21,{width:contentW*.62});

  doc.font('Helvetica-Bold').fontSize(15)
    .text(monthName,left,top,{width:contentW,align:'right'});
  doc.font('Helvetica').fontSize(7.5)
    .text(monthEvents.length+' selected exam'+(monthEvents.length===1?'':'s'),left,top+21,{width:contentW,align:'right'});

  // Compact legend
  const legendY=top+42;
  doc.lineWidth(.7).rect(left,legendY,9,9).stroke('#000000');
  doc.font('Helvetica').fontSize(7.2).text('Confirmed',left+14,legendY+1);
  doc.lineWidth(1.6).rect(left+82,legendY,9,9).stroke('#000000');
  doc.font('Helvetica').fontSize(7.2).text('Notice pending / not confirmed',left+96,legendY+1);
  doc.font('Helvetica').fontSize(7.2)
    .text('Black & white print layout • one month per page',left,legendY+1,{width:contentW,align:'right'});

  // Grid geometry
  const gridY=legendY+20;
  const headerH=19;
  const footerH=20;
  const gridH=pageH-gridY-footerH-16;
  const cellW=contentW/7;
  const cellH=(gridH-headerH)/6;
  const week=['SUN','MON','TUE','WED','THU','FRI','SAT'];

  doc.lineWidth(.65);
  for(let i=0;i<7;i++){
    const x=left+i*cellW;
    doc.fillColor('#f2f2f2').rect(x,gridY,cellW,headerH).fill();
    doc.fillColor('#000000').rect(x,gridY,cellW,headerH).stroke();
    doc.font('Helvetica-Bold').fontSize(7.4).text(week[i],x,gridY+6,{width:cellW,align:'center'});
  }

  const first=new Date(year,month,1);
  const startDay=first.getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();

  for(let i=0;i<42;i++){
    const row=Math.floor(i/7),col=i%7;
    const x=left+col*cellW;
    const y=gridY+headerH+row*cellH;
    doc.lineWidth(.65).fillColor('#ffffff').rect(x,y,cellW,cellH).fill();
    doc.fillColor('#000000').rect(x,y,cellW,cellH).stroke();

    const day=i-startDay+1;
    if(day<1||day>daysInMonth)continue;

    doc.font('Helvetica-Bold').fontSize(8).text(String(day),x+4,y+4,{width:18});

    const todays=monthEvents.filter(e=>localParts(e.date).day===day);
    let yy=y+16;
    const usable=Math.max(34,cellH-20);
    const showCount=Math.min(todays.length,10);
    const dense=showCount>5;
    const rowStep=dense?Math.max(6.1,Math.min(9.2,usable/Math.max(1,showCount))):12.3;
    const boxH=Math.max(5.4,rowStep-1.2);
    const fontSize=dense?Math.max(4.6,Math.min(5.8,boxH-2.2)):6.3;
    for(const e of todays.slice(0,showCount)){
      const confirmed=e.status==='confirmed';
      doc.lineWidth(confirmed?.65:1.35).rect(x+4,yy,cellW-8,boxH).stroke('#000000');
      doc.font('Helvetica-Bold').fontSize(fontSize).fillColor('#000000');
      const label=fitText(doc,shortTitle(e.title),cellW-15);
      doc.text(label,x+7,yy+Math.max(1,(boxH-fontSize)/2-.2),{width:cellW-14,height:boxH-1,lineBreak:false});
      yy+=rowStep;
    }
    if(todays.length>showCount){
      const overflow=todays.length-showCount;
      doc.font('Helvetica-Bold').fontSize(5.2).fillColor('#000000')
        .text('+'+overflow+' more selected',x+5,Math.min(y+cellH-7,yy),{width:cellW-10,align:'right'});
    }
  }

  const footer='Thin border = confirmed • Thick border = notice pending / not confirmed • Always check the latest official notice before the exam.';
  doc.font('Helvetica').fontSize(6.4).fillColor('#000000')
    .text(footer,left,pageH-17,{width:contentW-90,align:'left'});
  doc.font('Helvetica-Bold').fontSize(6.4)
    .text('Page '+pageNumber+' of '+totalPages,left,pageH-17,{width:contentW,align:'right'});
}

export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{ok:false,error:'method_not_allowed'});
  try{
    const body=await readBody(req);
    const events=cleanEvents(body.events);
    if(!events.length)return json(res,400,{ok:false,error:'no_events'});

    const requestedMonths=cleanMonths(body.months);
    const months=requestedMonths.length
      ?requestedMonths.map(key=>{
          const [year,month]=key.split('-').map(Number);
          return {year,month:month-1};
        })
      :monthRange(events);
    if(!months.length)return json(res,400,{ok:false,error:'no_months'});

    const doc=new PDFDocument({
      autoFirstPage:false,
      size:PAGE.size,
      layout:PAGE.layout,
      margins:PAGE.margins,
      info:{Title:'Admission Calendar 2026-27',Author:'Admission by DBT',Subject:'Selected admission exam calendar'}
    });
    const chunks=[];
    doc.on('data',chunk=>chunks.push(chunk));
    const done=new Promise((resolve,reject)=>{
      doc.on('end',resolve);
      doc.on('error',reject);
    });

    months.forEach((m,i)=>drawMonth(doc,m.year,m.month,events,i+1,months.length));
    doc.end();
    await done;

    const pdf=Buffer.concat(chunks);
    res.statusCode=200;
    res.setHeader('content-type','application/pdf');
    res.setHeader('content-disposition','attachment; filename="Admission-Calendar-Selected.pdf"');
    res.setHeader('content-length',String(pdf.length));
    res.setHeader('cache-control','no-store');
    res.setHeader('x-content-type-options','nosniff');
    res.end(pdf);
  }catch(e){
    return json(res,500,{ok:false,error:e?.message||'pdf_error'});
  }
}
