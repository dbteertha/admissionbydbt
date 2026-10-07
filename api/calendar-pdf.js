import PDFDocument from 'pdfkit';

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
    if(s.length>800000)throw new Error('payload_too_large');
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
      displayTime:String(x?.displayTime||'').slice(0,40)
    };
  }).filter(Boolean).slice(0,500);
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
  return title.replace(/\s+University\s+/i,'-').replace(/\s*\/\s*.*/,'').replace(/\s+/g,'-').slice(0,18);
}

function monthKey(date){
  const d=new Date(date);
  const local=new Date(d.toLocaleString('en-US',{timeZone:'Asia/Dhaka'}));
  return local.getFullYear()+'-'+String(local.getMonth()+1).padStart(2,'0');
}

function cleanMonths(value){
  if(!Array.isArray(value))return [];
  return [...new Set(value.map(x=>String(x||'').trim()).filter(x=>/^\d{4}-(0[1-9]|1[0-2])$/.test(x)))].sort().slice(0,24);
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

function localParts(iso){
  const d=new Date(iso);
  const s=d.toLocaleString('en-US',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
  const m=s.match(/(\d+)\/(\d+)\/(\d+),?\s+(\d+):(\d+)/);
  if(!m)return null;
  return {month:+m[1]-1,day:+m[2],year:+m[3],hour:+m[4],minute:+m[5]};
}

function wrapLines(doc,text,width,maxLines=3){
  const words=String(text).split(/\s+/).filter(Boolean);
  const lines=[];let line='';
  for(const word of words){
    const next=line?line+' '+word:word;
    if(doc.widthOfString(next)<=width){line=next;continue}
    if(line)lines.push(line);
    line=word;
    if(lines.length>=maxLines-1)break;
  }
  if(line&&lines.length<maxLines)lines.push(line);
  if(words.length&&lines.length===maxLines){
    let last=lines[maxLines-1];
    while(last.length>2&&doc.widthOfString(last+'...')>width)last=last.slice(0,-1);
    lines[maxLines-1]=last+'...';
  }
  return lines;
}

function drawMonth(doc,year,month,events,isFirst){
  if(!isFirst)doc.addPage({size:'A4',layout:'landscape',margins:{top:26,left:28,right:28,bottom:24}});
  const pageW=doc.page.width;
  const pageH=doc.page.height;
  const left=28,right=28,top=24;
  const contentW=pageW-left-right;

  const monthName=new Date(year,month,1).toLocaleString('en-US',{month:'long',year:'numeric'});
  doc.fillColor('#000000');
  doc.font('Helvetica-Bold').fontSize(17).text('Admission Calendar',left,top,{continued:false});
  doc.font('Helvetica').fontSize(8).text('Admission by DBT - 2026-27',left,top+22);
  doc.font('Helvetica-Bold').fontSize(15).text(monthName,left,top,{width:contentW,align:'right'});

  const legendY=top+42;
  doc.font('Helvetica').fontSize(7.5);
  doc.rect(left,legendY,9,9).stroke('#000000');
  doc.text('Confirmed / verified',left+14,legendY+1);
  doc.rect(left+115,legendY,9,9).lineWidth(1.8).stroke('#000000');
  doc.text('Date listed - full notice not out',left+129,legendY+1);
  doc.text('Each month is printed on one page.',left,legendY+15,{width:contentW,align:'right'});

  const gridY=legendY+28;
  const headerH=19;
  const gridH=pageH-gridY-34;
  const cellW=contentW/7;
  const rows=6;
  const cellH=(gridH-headerH)/rows;
  const days=['SUN','MON','TUE','WED','THU','FRI','SAT'];

  doc.lineWidth(.7);
  for(let i=0;i<7;i++){
    const x=left+i*cellW;
    doc.rect(x,gridY,cellW,headerH).fillAndStroke('#f2f2f2','#000000');
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(7.5).text(days[i],x,gridY+6,{width:cellW,align:'center'});
  }

  const first=new Date(year,month,1);
  const startDay=first.getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const monthEvents=events.filter(e=>{
    const p=localParts(e.date);
    return p&&p.year===year&&p.month===month;
  });

  for(let i=0;i<42;i++){
    const row=Math.floor(i/7),col=i%7;
    const x=left+col*cellW;
    const y=gridY+headerH+row*cellH;
    doc.fillColor('#ffffff').rect(x,y,cellW,cellH).fillAndStroke('#000000','#000000');

    const day=i-startDay+1;
    if(day<1||day>daysInMonth)continue;

    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8).text(String(day),x+4,y+4,{width:16});

    const todays=monthEvents.filter(e=>{
      const p=localParts(e.date);
      return p&&p.day===day;
    }).slice(0,5);

    let yy=y+17;
    for(const e of todays){
      const confirmed=e.status!=='tentative'&&e.status!=='pending';
      doc.lineWidth(confirmed?.7:1.6);
      doc.rect(x+4,yy,cellW-8,13).stroke('#000000');
      doc.font('Helvetica-Bold').fontSize(6.8).fillColor('#000000')
        .text(shortTitle(e.title),x+7,yy+3,{width:cellW-14,height:8,ellipsis:true});
      yy+=16;
    }
    if(monthEvents.filter(e=>{const p=localParts(e.date);return p&&p.day===day}).length>5){
      doc.font('Helvetica').fontSize(6).text('+ more',x+5,yy,{width:cellW-10});
    }
  }

  doc.font('Helvetica').fontSize(6.5).fillColor('#000000')
    .text('Thin border = confirmed. Thick border = date listed / full notice not out. Check the latest official notice before the exam.',left,pageH-19,{width:contentW,align:'center'});
}

export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{ok:false,error:'method_not_allowed'});
  try{
    const body=await readBody(req);
    const events=cleanEvents(body.events);
    if(!events.length)return json(res,400,{ok:false,error:'no_events'});

    const requestedMonths=cleanMonths(body.months);
    const months=requestedMonths.length
      ?requestedMonths.map(key=>{const [year,month]=key.split('-').map(Number);return {year,month:month-1}})
      :monthRange(events);
    if(!months.length)return json(res,400,{ok:false,error:'no_months'});
    const doc=new PDFDocument({
      autoFirstPage:false,
      size:'A4',
      layout:'landscape',
      margins:{top:26,left:28,right:28,bottom:24},
      info:{Title:'Admission Calendar 2026-27',Author:'Admission by DBT'}
    });
    const chunks=[];
    doc.on('data',c=>chunks.push(c));
    const done=new Promise((resolve,reject)=>{doc.on('end',resolve);doc.on('error',reject)});

    months.forEach((m,i)=>drawMonth(doc,m.year,m.month,events,i===0));
    doc.end();
    await done;

    const pdf=Buffer.concat(chunks);
    res.statusCode=200;
    res.setHeader('content-type','application/pdf');
    res.setHeader('content-disposition','attachment; filename="Admission-Calendar-2026-27.pdf"');
    res.setHeader('cache-control','no-store');
    res.end(pdf);
  }catch(e){
    return json(res,500,{ok:false,error:e?.message||'pdf_error'});
  }
}
