(function(){
  var CFG=window.CHJ_CONFIG||{}, API=CFG.API_URL||'', ZALO='https://zalo.me/'+(CFG.ZALO_PHONE||'0912268667');
  var TOKEN_KEY='chj_pl_token', SIZE_KEY='chj_pl_size', BTN_TEXT='NHẬN BẢNG GIÁ KIM CƯƠNG CHJ NGAY';
  var $=function(s){return document.querySelector(s)};
  var ov=$('#ov'), form=$('#lead'), submitBtn=$('#submit'), items=[], cur=[], shown=0, PAGE=24, lastFocus=null;

  function store(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}}
  function load(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function toast(msg){var t=$('#toast');t.textContent=msg;t.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(function(){t.style.display='none'},3200)}
  function track(ev,p){try{fbq('track',ev,p||{})}catch(e){}}
  function vnd(n){return n.toLocaleString('vi-VN')+'đ'}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

  // Nguồn khách (UTM, fbclid...) lưu ngay khi vào trang để gửi kèm lead.
  var UTM={};
  try{
    var sp=new URLSearchParams(location.search);
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','gclid'].forEach(function(k){if(sp.get(k))UTM[k]=sp.get(k)});
    if(Object.keys(UTM).length||!sessionStorage.getItem('chj_utm')){UTM.referrer=document.referrer||'';sessionStorage.setItem('chj_utm',JSON.stringify(UTM))}
    else UTM=JSON.parse(sessionStorage.getItem('chj_utm'));
  }catch(e){}

  // Gọi Apps Script: POST text/plain để trình duyệt không cần preflight CORS.
  function api(action,payload){
    return fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({action:action},payload||{})),redirect:'follow'})
      .then(function(r){return r.json()});
  }

  /* ---- chưa kết nối dữ liệu ---- */
  if(!API){
    $('#offline').hidden=false;
  }else{
    // Khoảng giá thật của nhóm 5 ly (công khai, không lộ từng viên)
    fetch(API+'?action=stats').then(function(r){return r.json()}).then(function(d){
      if(d.ok&&d.ly5){
        $('#range5-v').textContent=(d.ly5.min/1e6).toFixed(1).replace('.',',')+' triệu đến '+(d.ly5.max/1e6).toFixed(1).replace('.',',')+' triệu đồng';
        $('#range5-n').textContent=d.ly5.count+' viên còn hàng · cùng kích thước, khác màu, độ sạch và huỳnh quang';
        $('#range5').hidden=false;
      }
    }).catch(function(){});
  }

  /* ---- modal + form (chỉ ở trang chủ) ---- */
  if(form){
  function openForm(){
    if(!API){toast('Website chưa kết nối dữ liệu. Vui lòng nhắn Zalo.');return}
    lastFocus=document.activeElement;
    var t=load(TOKEN_KEY);
    track('ViewContent',{content_name:'Bang gia kim cuong GIA'});
    if(t){location.href='thanks.html';return}
    showModal();
  }
  function showModal(){ov.classList.add('on');document.body.style.overflow='hidden';setTimeout(function(){$('#name').focus()},50)}
  function hideModal(){ov.classList.remove('on');document.body.style.overflow='';if(lastFocus)lastFocus.focus()}
  document.querySelectorAll('.js-open').forEach(function(b){b.addEventListener('click',openForm)});
  $('#close').addEventListener('click',hideModal);
  ov.addEventListener('click',function(e){if(e.target===ov)hideModal()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&ov.classList.contains('on'))hideModal()});

  /* ---- kiểm tra form ---- */
  var PHONE=/^(0|\+?84)(3|5|7|8|9)\d{8}$/, EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function setErr(k,msg){var f=form.querySelector('[data-k="'+k+'"]');if(!f)return;f.classList.toggle('bad',!!msg);f.querySelector('.err').textContent=msg||''}
  function values(){return{name:form.name.value.trim(),phone:form.phone.value.replace(/[\s.\-()]/g,''),email:form.email.value.trim(),size:form.size.value,budget:form.budget.value,purpose:form.purpose.value,consent:form.consent.checked,website:form.website.value}}
  function validate(v){
    var e={};
    if(v.name.length<2)e.name='Vui lòng nhập họ và tên.';
    if(!PHONE.test(v.phone))e.phone='Số điện thoại chưa đúng (VD: 0912 345 678).';
    if(!EMAIL.test(v.email))e.email='Vui lòng nhập email đúng định dạng để nhận bảng giá.';
    if(!v.size)e.size='Vui lòng chọn kích thước.';
    if(!v.budget)e.budget='Vui lòng chọn ngân sách.';
    if(!v.purpose)e.purpose='Vui lòng chọn mục đích.';
    if(!v.consent)e.consent='Vui lòng đồng ý để CHJ liên hệ tư vấn.';
    return e;
  }
  function showErrors(e){['name','phone','email','size','budget','purpose','consent'].forEach(function(k){setErr(k,e[k])});var first=form.querySelector('.f.bad input,.f.bad select');if(first)first.focus()}
  function formError(msg){var b=$('#formerr');b.textContent=msg||'';b.classList.toggle('on',!!msg)}
  function resetBtn(){submitBtn.disabled=false;submitBtn.textContent=BTN_TEXT}

  form.addEventListener('submit',function(ev){
    ev.preventDefault();formError('');
    var v=values(),e=validate(v);showErrors(e);
    if(Object.keys(e).length)return;
    submitBtn.disabled=true;submitBtn.textContent='Đang gửi…';
    v.utm=UTM;
    // Chỉ khi Apps Script xác nhận đã ghi vào Sheet (có token) mới mở bảng giá.
    api('lead',v).then(function(d){
      if(d&&d.ok&&d.token){
        store(TOKEN_KEY,d.token);store(SIZE_KEY,v.size);
        try{sessionStorage.setItem('chj_mail',JSON.stringify({status:d.emailStatus||'failed',email:v.email}));sessionStorage.setItem('chj_lead_fired','1')}catch(e){}
        location.href='thanks.html';
      }else{
        if(d&&d.errors)showErrors(d.errors);
        formError((d&&d.error)||'Chưa gửi được thông tin. Vui lòng kiểm tra lại các ô và thử lần nữa.');
        resetBtn();
      }
    }).catch(function(){formError('Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại, hoặc nhắn Zalo 0912 268 667.');resetBtn()});
  });

  }

  /* ---- bảng giá (chỉ ở trang cảm ơn) ---- */
  function fetchStock(token){
    api('stock',{token:token}).then(function(d){
      if(d&&d.error==='expired'){store(TOKEN_KEY,null);location.replace('index.html');return}
      if(!d||!d.ok||!d.items)throw 1;
      items=d.items;$('#loading').hidden=true;renderList();
    }).catch(function(){$('#loading').hidden=true;$('#loaderr').hidden=false});
  }
  var M={ly:$('#f-ly'),color:$('#f-color'),clarity:$('#f-clarity'),fl:$('#f-fl'),sort:$('#f-sort')};
  function fillOpts(sel,label,vals,fmt){sel.innerHTML='<option value="">'+label+'</option>'+vals.map(function(x){return'<option value="'+x+'">'+(fmt?fmt(x):x)+'</option>'}).join('')}
  var FLN={N:'Không (None)',Faint:'Faint (nhẹ)',Medium:'Medium (vừa)',Strong:'Strong (mạnh)'};
  var CL=['IF','VVS1','VVS2','VS1','VS2'];
  function uniq(k){return items.map(function(x){return x[k]}).filter(function(v,i,a){return a.indexOf(v)===i})}
  function renderList(){
    fillOpts(M.ly,'Mọi kích thước',uniq('ly').sort(function(a,b){return a-b}),function(x){return x.toFixed(1)+' ly'});
    fillOpts(M.color,'Mọi màu',uniq('color').sort());
    fillOpts(M.clarity,'Mọi độ sạch',uniq('clarity').sort(function(a,b){return CL.indexOf(a)-CL.indexOf(b)}));
    fillOpts(M.fl,'Mọi huỳnh quang',['N','Faint','Medium','Strong'].filter(function(x){return uniq('fl').indexOf(x)>-1}),function(x){return FLN[x]});
    var s=load(SIZE_KEY)||'', m=s.match(/^(\d(?:\.\d)?)/);
    M.ly.value='';
    if(m&&s.indexOf('–')<0&&s!=='Khác'&&uniq('ly').indexOf(parseFloat(m[1]))>-1)M.ly.value=m[1];
    $('#pricelist').classList.add('on');
    draw(true);
  }
  function filtered(){
    var ly=M.ly.value,c=M.color.value,cl=M.clarity.value,fl=M.fl.value,s=M.sort.value;
    var out=items.filter(function(x){return(!ly||x.ly===parseFloat(ly))&&(!c||x.color===c)&&(!cl||x.clarity===cl)&&(!fl||x.fl===fl)});
    out.sort(function(a,b){return s==='desc'?b.price-a.price:s==='ct'?b.ct-a.ct||a.price-b.price:a.price-b.price});
    return out;
  }
  function card(x,i){
    var hold=x.st==='hold', gia=/^\d{10}$/.test(x.gia_no)?'<a class="gia" href="https://www.gia.edu/report-check?reportno='+x.gia_no+'" target="_blank" rel="noopener">GIA '+x.gia_no+'</a>':'GIA '+esc(x.gia_no);
    return '<article class="dia"><div class="top"><div class="sz">'+x.ly.toFixed(1)+' ly <small>· '+x.ct.toFixed(2)+' ct</small></div><div class="pr">'+vnd(x.price)+'</div></div>'+
      (hold?'<div><span class="badge">Đang có khách giữ</span></div>':'')+
      '<div class="spec"><div><span>Màu</span><b>'+esc(x.color)+'</b></div><div><span>Độ sạch</span><b>'+esc(x.clarity)+'</b></div><div><span>Huỳnh quang</span><b>'+esc(x.fl)+'</b></div></div>'+
      '<div class="meta">'+esc(x.shape)+' · '+esc(x.cut)+'/'+esc(x.pol)+'/'+esc(x.sym)+' · '+esc(x.ms)+' mm · '+gia+'</div>'+
      '<button class="btn" type="button" data-ask="'+i+'">'+(hold?'Hỏi viên tương tự qua Zalo':'Tư vấn viên này qua Zalo')+'</button>'+
      '<button class="btn ghost" type="button" data-png="'+i+'">Tải ảnh thẻ kim cương (PNG)</button></article>';
  }
  function draw(reset){
    if(reset){cur=filtered();shown=0;$('#grid').innerHTML=''}
    var next=cur.slice(shown,shown+PAGE);
    $('#grid').insertAdjacentHTML('beforeend',next.map(function(x,k){return card(x,shown+k)}).join(''));
    shown+=next.length;
    $('#count').textContent=cur.length?('Hiển thị '+shown+' / '+cur.length+' viên phù hợp'):'';
    if(!cur.length)$('#grid').innerHTML='<div class="empty">Chưa có viên khớp bộ lọc này. Hãy nới bộ lọc hoặc nhắn Zalo 0912 268 667 để CHJ tìm giúp bạn.</div>';
    $('#more').style.display=shown<cur.length?'inline-block':'none';
  }
  if($('#pricelist')){
    Object.keys(M).forEach(function(k){M[k].addEventListener('change',function(){draw(true)})});
    $('#more').addEventListener('click',function(){draw(false)});
  }

  /* ---- Zalo + ghi nhận viên quan tâm ---- */
  function zaloText(x){
    return 'Tôi vừa xem bảng giá trên website CHJ. Tôi quan tâm viên kim cương '+x.ly.toFixed(1)+' ly, '+x.color+', '+x.clarity+', mã GIA '+x.gia_no+', giá '+vnd(x.price)+'. Nhờ CHJ tư vấn giúp tôi về chất lượng, tình trạng hàng và phương án lên trang sức.';
  }
  function openZalo(text){
    if(text&&navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){toast('Đã sao chép tin nhắn, hãy dán vào Zalo để CHJ tư vấn nhanh')},function(){})}
    window.open(ZALO,'_blank','noopener');
    track('Contact');
  }

  /* ---- ảnh PNG từ thẻ kim cương ---- */
  var logoImg=null;
  function getLogo(){return new Promise(function(res){if(logoImg)return res(logoImg);var i=new Image();i.onload=function(){logoImg=i;res(i)};i.onerror=function(){res(null)};i.src='images/logo-chj.png'})}
  function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
  function makePNG(x){
    var SERIF='"Noto Serif",Georgia,serif', SANS='"Segoe UI",Arial,sans-serif';
    var fonts=document.fonts&&document.fonts.load?Promise.all([document.fonts.load('700 40px "Noto Serif"')]).catch(function(){}):Promise.resolve();
    return Promise.all([fonts,getLogo()]).then(function(r){
      var W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;var c=cv.getContext('2d');
      c.fillStyle='#FAF7F0';c.fillRect(0,0,W,H);
      var g=c.createLinearGradient(0,0,W,260);g.addColorStop(0,'#0B1F3A');g.addColorStop(1,'#14305A');c.fillStyle=g;c.fillRect(0,0,W,260);
      if(r[1]){c.fillStyle='#fff';rr(c,60,50,160,160,24);c.fill();c.drawImage(r[1],68,58,144,144)}
      c.fillStyle='#fff';c.font='700 44px '+SERIF;c.textBaseline='alphabetic';c.fillText('CHJ DIAMOND',250,115);
      c.fillStyle='#D9BF8C';c.font='500 28px '+SANS;c.fillText('Chung Hiếu Jewelry · Kim cương thiên nhiên GIA',250,165);
      c.fillStyle='#B8935A';c.font='700 24px '+SANS;c.fillText('THẺ KIM CƯƠNG',250,205);
      c.fillStyle='#0B1F3A';c.font='700 96px '+SERIF;c.fillText(x.ly.toFixed(1)+' ly',70,420);
      c.fillStyle='#5E6678';c.font='500 40px '+SANS;c.fillText(x.ct.toFixed(2)+' ct · '+x.shape+' · Kim cương thiên nhiên',70,485);
      c.fillStyle='#B8935A';c.font='700 84px '+SERIF;c.fillText(vnd(x.price),70,620);
      var rows=[['MÀU',x.color],['ĐỘ SẠCH',x.clarity],['HUỲNH QUANG',x.fl],['CUT / POLISH / SYM',x.cut+'/'+x.pol+'/'+x.sym],['KÍCH THƯỚC (MM)',x.ms],['MÃ GIA',x.gia_no]];
      rows.forEach(function(rw,i){
        var col=i%2,row=Math.floor(i/2),bx=60+col*480,by=690+row*150;
        c.fillStyle='#fff';rr(c,bx,by,460,126,18);c.fill();c.strokeStyle='#E3DACA';c.lineWidth=2;c.stroke();
        c.fillStyle='#5E6678';c.font='600 24px '+SANS;c.fillText(rw[0],bx+26,by+44);
        c.fillStyle='#0B1F3A';c.font='700 40px '+SERIF;c.fillText(String(rw[1]),bx+26,by+98);
      });
      var d=new Date();c.fillStyle='#5E6678';c.font='500 26px '+SANS;
      c.fillText('Giá tham khảo ngày '+d.toLocaleDateString('vi-VN')+', CHJ xác nhận lại tình trạng hàng khi tư vấn.',60,1200);
      c.fillStyle='#0B1F3A';rr(c,60,1230,960,80,40);c.fill();
      c.fillStyle='#D9BF8C';c.font='700 36px '+SANS;c.textAlign='center';c.fillText('Tư vấn Zalo / Hotline: 0912 268 667',W/2,1282);c.textAlign='left';
      return new Promise(function(res){cv.toBlob(res,'image/png')});
    });
  }
  function savePNG(x){
    makePNG(x).then(function(blob){
      if(!blob){toast('Chưa tạo được ảnh, vui lòng thử lại');return}
      var name='CHJ-GIA-'+String(x.gia_no).replace(/[^\w-]/g,'')+'.png', file=null;
      try{file=new File([blob],name,{type:'image/png'})}catch(e){}
      if(file&&navigator.canShare&&navigator.canShare({files:[file]})&&/Mobi|Android/i.test(navigator.userAgent)){
        navigator.share({files:[file],title:'Kim cương GIA – CHJ'}).catch(function(){});
      }else{
        var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();
        setTimeout(function(){URL.revokeObjectURL(a.href)},4000);toast('Đã tải ảnh thẻ kim cương');
      }
    });
  }

  if($('#grid'))$('#grid').addEventListener('click',function(e){
    var ask=e.target.closest('[data-ask]'), png=e.target.closest('[data-png]');
    if(png){var p=cur[+png.getAttribute('data-png')];if(p)savePNG(p);return}
    if(!ask)return;
    var x=cur[+ask.getAttribute('data-ask')];if(!x)return;
    openZalo(zaloText(x));
    var t=load(TOKEN_KEY);
    if(t)try{api('interest',{token:t,itemId:x.id}).catch(function(){})}catch(err){}
  });
  /* ---- khởi động trang cảm ơn ---- */
  if($('#pricelist')){
    var tk=load(TOKEN_KEY);
    if(!API||!tk){location.replace('index.html')}
    else{
      var mail=null;try{mail=JSON.parse(sessionStorage.getItem('chj_mail')||'null')}catch(e){}
      var line=$('#ty-mail');
      if(mail&&mail.email&&(mail.status==='sent'||mail.status==='recent')){
        line.textContent='Bảng giá kim cương CHJ '+(mail.status==='sent'?'đã được gửi tới email ':'đã được gửi trước đó tới email ')+mail.email+'. Nếu chưa thấy, bạn hãy kiểm tra cả mục Spam hoặc Quảng cáo. Bảng giá cũng hiển thị ngay bên dưới.';
      }else if(mail){
        line.textContent='Chưa gửi được email cho bạn, nhưng bảng giá kim cương CHJ hiển thị ngay bên dưới và CHJ sẽ liên hệ hỗ trợ.';
      }
      try{if(sessionStorage.getItem('chj_lead_fired')==='1'){sessionStorage.setItem('chj_lead_fired','0');track('Lead',{content_name:'Bang gia kim cuong GIA',value:0,currency:'VND'})}}catch(e){}
      fetchStock(tk);
      document.querySelectorAll('.js-open').forEach(function(b){b.addEventListener('click',function(){$('#pricelist').scrollIntoView({behavior:'smooth'})})});
    }
  }
  document.querySelectorAll('[data-zalo]').forEach(function(a){a.href=ZALO;a.addEventListener('click',function(){track('Contact')})});
})();
