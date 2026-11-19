'use strict';
const $=s=>document.querySelector(s), cats=['PVC Card','Banking Service','Others Service'], pages=['ড্যাশবোর্ড','নতুন বিল','পণ্য ও সার্ভিস','কাস্টমার খাতা','ইনভয়েস','সেটিংস'], icons=['grid','plus','box','users','receipt','gear'];
const paths={grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',plus:'M12 4v16 M4 12h16',box:'m3 7 9-5 9 5v10l-9 5-9-5z M3 7l9 5 9-5 M12 12v10 M7 4.8l9 5',users:'M15 20v-2a5 5 0 0 0-10 0v2 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 7 M18 14q4 1 4 6',receipt:'M5 3h14v18l-3-2-4 2-4-2-3 2z M8 8h8 M8 12h8 M8 16h4',gear:'M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M9 15v6',wallet:'M3 6h17v14H3z M3 6l14-4v4 M15 11h6v5h-6z',card:'M2 5h20v14H2z M2 9h20 M5 14h5',bank:'m2 8 10-6 10 6z M5 10v8 M10 10v8 M15 10v8 M20 10v8 M2 21h20',phone:'m5 3 4 1 1 4-2 2q2 4 6 6l2-2 4 1 1 4q-1 4-6 2Q4 16 2 6z',bars:'M3 20h18 M6 17v-5 M12 17V5 M18 17V9'};
const ic=k=>'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+paths[k]+'"/></svg>';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bn=n=>Number(n).toLocaleString('bn-IN',{maximumFractionDigits:2}), money=n=>'₹'+bn(n/100), id=()=>crypto.randomUUID(), dateKey=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(d), date=d=>new Date(d).toLocaleDateString('bn-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short',year:'numeric'});
const start=()=>({products:[],sales:[],shop:{name:'Tarafdar Telecom',web:'emadulai.in',address:'',email:'',phone:'',logo:''}});
let state=start(),page=0,filter='',query='',cart=[],draft={},noticeTimer;
function notify(t){$('#toast').textContent=t;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#toast').textContent='',3500)}
const nav=(p,f='')=>{page=p;filter=f;query='';$('aside').classList.remove('open');render();scrollTo(0,0)};
const button=(label,fn,cls='')=>'<button type="button" class="'+cls+'" onclick="'+fn+'">'+label+'</button>';
const tile=(k,c='')=>'<span class="tile '+c+'">'+ic(k)+'</span>', empty=(k,t)=>'<div class="empty">'+ic(k)+esc(t)+'</div>';
const heading=(t,action='')=>'<div class="title"><h1>'+t+'</h1>'+action+'</div>';
function customers(){let m=new Map;for(let s of [...state.sales].reverse()){const key=s.phone||s.id;let c=m.get(key);if(!c){c={key,name:s.name,phone:s.phone,sales:[],due:0};m.set(key,c)}c.sales.push(s);c.due+=s.total-s.paid}return [...m.values()]}
function person(c){
  const call = c.phone ? '<a aria-label="কল করুন" href="tel:'+esc(c.phone)+'">'+ic('phone')+'</a>' : '';
  const detail = c.phone || c.sales[0].no;
  return '<div class="listrow">'+tile('users','violet')+'<div>'+button(esc(c.name),"historyView('"+c.key+"')",'link')+'<small>'+esc(detail)+'</small></div>'+call+'</div>';
}
function dashboard(){let now=new Date(),today=state.sales.filter(s=>dateKey(new Date(s.at))===dateKey(now)),sum=(ss)=>ss.reduce((a,s)=>a+s.total,0),qty=today.flatMap(s=>s.lines).reduce((a,l)=>a+l.qty,0),stock=state.products.filter(p=>p.stock!==null),low=stock.filter(p=>p.stock<=p.limit).length;
let days=Array.from({length:7},(_,i)=>new Date(+now-(6-i)*86400000)),values=days.map(d=>sum(state.sales.filter(s=>dateKey(new Date(s.at))===dateKey(d)))),max=Math.max(1,...values);
return heading('ড্যাশবোর্ড',button(ic('plus')+' নতুন বিল','nav(1)','primary'))+'<section class="hero"><div class="kicker">'+ic('wallet')+' আজকের মোট বিক্রি</div><strong>'+money(sum(today))+'</strong><small>আজকের ইনভয়েস · '+bn(today.length)+'টি</small><img alt="" src="shop.svg"></section><div class="stats">'+[['বিক্রি হওয়া আইটেম',bn(qty),'box','','আজকের পণ্য ও সার্ভিস'],['মজুত স্টক',bn(stock.reduce((a,p)=>a+p.stock,0)),'bars','green',low?bn(low)+'টি আইটেমে স্টক কম বা শেষ':'পণ্যের মোট ইউনিট'],['মোট বাকি',money(customers().reduce((a,c)=>a+c.due,0)),'wallet','orange','কাস্টমারের কাছে পাওনা']].map(([t,v,k,c,n])=>'<section class="card"><div class="statline"><span>'+t+'</span>'+tile(k,c)+'</div><strong>'+v+'</strong><small>'+n+'</small></section>').join('')+'</div><div class="lower"><section class="panel"><div class="title"><h2>বিক্রির হিসাব</h2><span class="tag">গত ৭ দিন</span></div><small>মোট বিক্রি</small><h2>'+money(values.reduce((a,b)=>a+b,0))+'</h2><div class="chart">'+values.map((v,i)=>'<div class="col" title="'+date(days[i])+' · '+money(v)+'" style="height:'+v/max*94+'%"></div>').join('')+'</div><div class="axis">'+days.map(d=>'<span>'+bn(+dateKey(d).slice(-2))+'</span>').join('')+'</div></section><section class="panel"><div class="title"><h2>সাম্প্রতিক কাস্টমার</h2>'+button('সব দেখুন','nav(3)','link')+'</div>'+(customers().slice(0,5).map(person).join('')||empty('users','প্রথম বিল তৈরি করলে এখানে কাস্টমারের নাম ও নম্বর দেখা যাবে।'))+'</section></div><h2>সার্ভিস বিভাগ</h2><div class="cats">'+cats.map((c,i)=>button(tile(['card','bank','box'][i],['','green','orange'][i])+'<div><b>'+c+'</b><small>'+bn(state.products.filter(p=>p.cat===c).length)+'টি পণ্য ও সার্ভিস</small></div>',"nav(2,'"+c+"')",'cat')).join('')+'</div>'}
function options(arr,val){return arr.map(c=>'<option '+(c===val?'selected':'')+'>'+esc(c)+'</option>').join('')}
function searchBar(category=false){return '<div class="actions"><input aria-label="খুঁজুন" placeholder="নাম বা নম্বর খুঁজুন…" value="'+esc(query)+'" oninput="query=this.value;refreshList()">'+(category?'<select aria-label="বিভাগ" onchange="filter=this.value;refreshList()"><option value="">সব বিভাগ</option>'+options(cats,filter)+'</select>':'')+'</div>'}
function productMatches(product, q) {
  return [product.name, product.description || ''].some(text => text.toLowerCase().includes(q));
}
function productDescription(product) {
  return product.description ? '<small style="white-space:pre-wrap;overflow-wrap:anywhere">' + esc(product.description) + '</small>' : '';
}
function list(){let q=query.trim().toLowerCase();if(page===2)return state.products.filter(p=>(!filter||p.cat===filter)&&productMatches(p,q)).map(p=>'<div class="listrow">'+(p.logo?'<img class="thumb" alt="" src="'+esc(p.logo)+'">':tile('box'))+'<div><b>'+esc(p.name)+'</b>'+productDescription(p)+'<small>'+esc(p.cat)+' · '+money(p.price)+' · '+(p.stock===null?'সার্ভিস':'স্টক '+bn(p.stock))+'</small>'+(p.stock!==null&&p.stock<=p.limit?'<span class="alert">'+(p.stock?'স্টক কম':'স্টক শেষ')+'</span>':'')+'</div>'+button('সম্পাদনা',"product('"+p.id+"')")+'</div>').join('')||empty('box','এই তালিকায় কোনো পণ্য বা সার্ভিস নেই।');
if(page===3)return customers().filter(c=>(c.name+c.phone).toLowerCase().includes(q)).map(person).join('')||empty('users','কোনো কাস্টমার পাওয়া যায়নি।');
return [...state.sales].reverse().filter(s=>(s.no+s.name+s.phone+s.mode).toLowerCase().includes(q)).map(saleRow).join('')||empty('receipt','কোনো ইনভয়েস পাওয়া যায়নি।')}
function saleRow(s){return '<div class="listrow">'+tile('receipt')+'<div><b>'+esc(s.no)+'</b><small>'+esc(s.name)+' · '+date(s.at)+' · '+money(s.total)+'</small></div>'+button('রসিদ',"showSale('"+s.id+"')")+'</div>'}
function refreshList(){ $('#list').innerHTML=list() }
function field(k,t,v='',attrs='',type='text'){return '<label>'+t+'<input name="'+k+'" type="'+type+'" value="'+esc(v)+'" '+attrs+'></label>'}
function dialog(body){let d=$('#modal');d.innerHTML=body;if(!d.open)d.showModal()}
const closeBtn=button('বন্ধ করুন',"document.querySelector('dialog').close()");
function product(key){let p=state.products.find(p=>p.id===key)||{cat:filter||cats[0],stock:null,limit:3};dialog('<div class="title"><h2>'+(key?'পণ্য / সার্ভিস সম্পাদনা':'নতুন পণ্য / সার্ভিস')+'</h2>'+closeBtn+'</div><form id="edit"><div class="formgrid">'+field('name','নাম',p.name,'required maxlength="100"')+'<label>বিভাগ<select name="cat">'+options(cats,p.cat)+'</select></label>'+field('price','দাম (₹)',p.price===undefined?'':p.price/100,'required min="0" max="99999999" step=".01"','number')+field('stock','স্টক (সার্ভিস হলে খালি রাখুন)',p.stock??'','min="0" max="9999999" step="1"','number')+field('limit','কম স্টকের সীমা',p.limit,'required min="0" max="9999999"','number')+'<label>লোগো<input type="file" name="logo" accept="image/png,image/jpeg,image/webp"></label><label class="full">পণ্য বা সার্ভিসের বিবরণ (ঐচ্ছিক)<textarea name="description" rows="3" maxlength="1500">'+esc(p.description||'')+'</textarea></label></div><button class="primary">সংরক্ষণ করুন</button></form>');$('#edit').onsubmit=async e=>{e.preventDefault();await submit(e.target,async f=>{let logo=await upload(f.get('logo'),p.logo),item={id:key||id(),name:required(f,'name'),description:f.get('description').trim(),cat:f.get('cat'),price:paise(f.get('price')),stock:f.get('stock')===''?null:+f.get('stock'),limit:+f.get('limit'),logo};await change(d=>{let i=d.products.findIndex(x=>x.id===key);if(i<0)d.products.push(item);else{if(JSON.stringify(d.products[i])!==JSON.stringify(p))throw Error('স্টক বদলেছে। তালিকা আবার খুলুন।');d.products[i]=item}});$('#modal').close();render();notify('সংরক্ষিত হয়েছে')})}}
function required(f,k){let v=String(f.get(k)||'').trim();if(!v)throw Error('প্রয়োজনীয় তথ্য লিখুন');return v}
function paise(n){let v=Math.round(Number(n)*100);if(!Number.isSafeInteger(v)||v<0)throw Error('সঠিক টাকা লিখুন');return v}
async function submit(form,fn){let b=form.querySelector('button.primary');if(b.disabled)return;b.disabled=true;try{await fn(new FormData(form))}catch(e){alert(e.message)}finally{b.disabled=false}}
async function upload(file,old){if(!file?.size)return old||'';if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5000000)throw Error('৫ MB-এর মধ্যে PNG, JPG বা WebP লোগো দিন');let img=await createImageBitmap(file),scale=Math.min(1,180/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);img.close();return c.toDataURL('image/png')}
function settings(){let s=state.shop;return heading('দোকানের সেটিংস')+'<section class="panel"><h2>রসিদের জন্য দোকানের তথ্য</h2><form id="profile"><div class="formgrid">'+field('name','দোকানের নাম',s.name,'required')+field('phone','মোবাইল নম্বর ১',s.phone,'','tel')+field('phone2','মোবাইল নম্বর ২ (ঐচ্ছিক)',s.phone2,'','tel')+field('email','ইমেল',s.email,'','email')+field('web','ওয়েবসাইট',s.web)+field('address','দোকানের ঠিকানা',s.address)+'<label>দোকানের লোগো<input name="logo" type="file" accept="image/png,image/jpeg,image/webp"></label><label class="full storefront-choice"><input type="checkbox" name="printStorefront" '+(s.printStorefront!==false?'checked':'')+'> রসিদে ড্যাশবোর্ডের দোকানের ছবি দেখান</label></div><button class="primary">সংরক্ষণ করুন</button></form></section><br><section class="panel"><h2>হিসাবের ব্যাকআপ</h2><p>হিসাব আপনার অ্যাডমিন অ্যাকাউন্টের ডেটাবেসে থাকে। নিয়মিত ব্যাকআপ ডাউনলোড করুন।</p><div class="actions">'+button('ব্যাকআপ ডাউনলোড','backup()')+'<label>ব্যাকআপ ফেরান<input type="file" accept=".json" onchange="restore(this)"></label></div></section>'}
function bill(){return heading('নতুন বিল')+'<div class="layoutbill"><section class="panel"><h2>পণ্য ও সার্ভিস বাছুন</h2><input placeholder="পণ্য বা সার্ভিস খুঁজুন…" aria-label="পণ্য খুঁজুন" oninput="catalog(this.value)"><div id="catalog"></div><hr><h3>কাস্টম সার্ভিস</h3><form id="custom">'+field('name','সার্ভিসের নাম','','required maxlength="100"')+field('price','দাম (₹)','','required min="0" max="99999999" step=".01"','number')+'<button>বিলে যোগ করুন</button></form></section><section class="panel"><h2>বিলের বিবরণ</h2><div id="lines"></div><form id="checkout"><div class="formgrid">'+field('name','কাস্টমারের নাম',draft.name,'required maxlength="100"')+field('phone','মোবাইল নম্বর (ঐচ্ছিক)',draft.phone,'pattern="[0-9]{10}" title="১০ সংখ্যার মোবাইল নম্বর" inputmode="numeric"','tel')+billAddressFields()+'<label>পেমেন্ট মোড<select name="mode">'+options(['Cash','COD','UPI'],draft.mode)+'</select></label>'+field('paid','পরিশোধিত টাকা (₹)',draft.paid??'','min="0" step=".01"','number')+'</div><p id="due"></p><button class="primary">ইনভয়েস তৈরি করুন</button></form></section></div>'}
function catalog(q=''){let ps=state.products.filter(p=>productMatches(p,q.toLowerCase()));$('#catalog').innerHTML=ps.map(p=>'<div class="listrow"><div>'+esc(p.name)+productDescription(p)+'<small>'+money(p.price)+' · '+esc(p.cat)+'</small></div>'+button('যোগ করুন',"addItem('"+p.id+"')")+'</div>').join('')||empty('box','পণ্য ও সার্ভিস বিভাগে আইটেম যোগ করুন বা কাস্টম সার্ভিস লিখুন।')}
function addItem(key){let p=state.products.find(x=>x.id===key),l=cart.find(x=>x.product===key);if(p.stock!==null&&(l?.qty||0)>=p.stock)return notify('পর্যাপ্ত স্টক নেই');if(l)l.qty++;else cart.push({product:key,name:p.name,price:p.price,qty:1});lines()}
const total=()=>cart.reduce((n,l)=>n+l.price*l.qty,0);
function lines(){ $('#lines').innerHTML=cart.map((l,i)=>'<div class="listrow"><div>'+esc(l.name)+'<small>'+money(l.price)+' × '+bn(l.qty)+'</small></div><div>'+button('−','adjust('+i+',-1)')+' '+button('+','adjust('+i+',1)')+'</div></div>').join('')+'<h3>মোট '+money(total())+'</h3>';due()}
function adjust(i,d){if(d===1&&cart[i].product)return addItem(cart[i].product);cart[i].qty+=d;if(!cart[i].qty)cart.splice(i,1);lines()}
function due(){let p=$('#checkout').elements.paid;p.max=total()/100;$('#due').textContent='বাকি '+money(total()-Math.round((Number(p.value)||0)*100))}
function commitBill(data,sale){if(!sale.lines.length)throw Error('বিলে অন্তত একটি আইটেম যোগ করুন');if(sale.paid>sale.total)throw Error('পরিশোধিত টাকা মোট বিলের চেয়ে বেশি');for(let l of sale.lines){if(!l.product)continue;let p=data.products.find(p=>p.id===l.product);if(!p||p.price!==l.price||p.name!==l.name)throw Error('পণ্য বদলেছে। বিল থেকে বাদ দিয়ে আবার যোগ করুন।');if(p.stock!==null){if(p.stock<l.qty)throw Error(l.name+' পর্যাপ্ত স্টক নেই');p.stock-=l.qty}}sale.no='TT-'+String(data.sales.length+1).padStart(5,'0');sale.shop={...data.shop};data.sales.push(sale)}
function bindBill(){catalog();lines();$('#custom').onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);try{cart.push({product:null,name:required(f,'name'),price:paise(f.get('price')),qty:1});lines();e.target.reset()}catch(err){notify(err.message)}};$('#checkout').oninput=e=>{draft=Object.fromEntries(new FormData(e.currentTarget));due()};$('#checkout').onsubmit=async e=>{e.preventDefault();await submit(e.target,async f=>{let sale={id:id(),at:new Date().toISOString(),name:required(f,'name'),phone:f.get('phone'),address:f.get('address').trim(),addressParts:readAddress(f),mode:f.get('mode'),paid:paise(f.get('paid')),total:total(),lines:structuredClone(cart)};await change(d=>commitBill(d,sale));cart=[];draft={};nav(4);showSale(sale.id)})}}
function billAddressFields() {
  const text = (key, label, limit = 100) =>
    field(key, label, draft[key], 'maxlength="' + limit + '"');
  return '<fieldset class="bill-address full"><legend>কাস্টমারের ঠিকানা (ঐচ্ছিক)</legend><div class="formgrid">' +
    text('address', 'বাড়ি, রাস্তা বা পাড়ার নাম', 300) +
    text('locality', 'গ্রাম / শহর') + text('postOffice', 'পোস্ট অফিস') +
    field('pin', 'পিনকোড', draft.pin, 'inputmode="numeric" maxlength="6" pattern="[0-9০-৯]{6}" title="৬ সংখ্যার পিনকোড দিন"') +
    text('district', 'জেলা') + text('region', 'রাজ্য') + '</div></fieldset>';
}
const addressKeys = ['locality', 'postOffice', 'pin', 'district', 'region'];
function readAddress(form) {
  const parts = Object.fromEntries(addressKeys.map(key => [key, (form.get(key) || '').trim()]));
  parts.pin = parts.pin.replace(/[০-৯]/g, digit => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));
  return parts;
}
function addressLines(sale) {
  const parts = sale.addressParts || {};
  const postal = [parts.postOffice && 'পোঃ ' + parts.postOffice, parts.pin && 'পিন ' + parts.pin];
  return [
    [sale.address, parts.locality].filter(Boolean).join(', '),
    postal.filter(Boolean).join(' · '),
    [parts.district, parts.region].filter(Boolean).join(', ')
  ].filter(Boolean);
}
function receipt(sale) {
  const shop = sale.shop;
  const paragraph = value => value ? '<p>' + esc(value) + '</p>' : '';
  const phones = [shop.phone, shop.phone2].filter(Boolean).join(' / ');
  const useStorefront = shop.printStorefront !== false || !shop.logo;
  const bannerImage = useStorefront ? './receipt-banner.svg' : esc(shop.logo);
  const row = (label, value) => '<div><span>' + label + '</span><b>' + value + '</b></div>';
  const items = sale.lines.map((line, index) =>
    '<tr><td>' + bn(index + 1) + '</td><td>' + esc(line.name) + '</td><td>' +
    bn(line.qty) + '</td><td>' + money(line.price) + '</td><td>' +
    money(line.price * line.qty) + '</td></tr>').join('');
  return '<article class="receipt invoice"><div class="receipt-banner">' +
    '<img class="banner-art' + (useStorefront ? '' : ' custom-art') + '" alt="" src="' + bannerImage + '">' +
    '<div class="banner-details"><h2>' + esc(shop.name) + '</h2>' + paragraph(shop.address) +
    paragraph(phones && 'ফোন: ' + phones) + paragraph(shop.email) + paragraph(shop.web) +
    '</div></div><div class="receipt-meta"><h3>বিক্রয় রসিদ</h3><div><b>' + esc(sale.no) +
    '</b> · ' + date(sale.at) + '</div></div>' +
    '<div class="invoice-buyer"><div><small>কাস্টমার</small><strong>' + esc(sale.name) +
    '</strong>' + paragraph(sale.phone) + addressLines(sale).map(paragraph).join('') +
    '</div><div class="invoice-mode"><small>পেমেন্ট পদ্ধতি</small><b>' + esc(sale.mode) +
    '</b></div></div><table><colgroup><col style="width:7%"><col><col style="width:12%">' +
    '<col style="width:19%"><col style="width:21%"></colgroup><thead><tr><th>ক্রম</th><th>পণ্য / সার্ভিস</th>' +
    '<th>সংখ্যা</th><th>দর</th><th>টাকা</th></tr></thead><tbody>' + items +
    '</tbody></table><div class="invoice-totals">' + row('মোট বিল', money(sale.total)) +
    row('পরিশোধিত', money(sale.paid)) + row('বাকি', money(sale.total - sale.paid)) +
    '</div></article>';
}
function showSale(key){let s=state.sales.find(s=>s.id===key),html=receipt(s);$('#paper').innerHTML=html;dialog('<div class="title">'+button('A4 প্রিন্ট / PDF','window.print()','primary')+closeBtn+'</div>'+html)}
function historyView(key){let c=customers().find(c=>c.key===key);dialog('<div class="title"><h2>'+esc(c.name)+'</h2>'+closeBtn+'</div><p>'+esc(c.phone||c.sales[0].no)+' · মোট বাকি '+money(c.due)+'</p><small>'+esc(addressLines(c.sales[0]).join(', '))+'</small>'+c.sales.map(saleRow).join(''))}
function backup(){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({version:1,data:state})],{type:'application/json'}));a.download='tarafdar-'+dateKey(new Date())+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
const validId=k=>typeof k==='string'&&/^[a-f0-9-]{36}$/i.test(k),nat=n=>Number.isSafeInteger(n)&&n>=0,str=s=>typeof s==='string',logo=s=>s===''||typeof s==='string'&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(s),profile=p=>p&&['name','phone','web','address','email'].every(k=>str(p[k]))&&(p.phone2===undefined||str(p.phone2))&&logo(p.logo);
function validData(d){return d&&profile(d.shop)&&Array.isArray(d.products)&&Array.isArray(d.sales)&&d.products.every(p=>validId(p.id)&&str(p.name)&&(p.description===undefined||str(p.description))&&cats.includes(p.cat)&&nat(p.price)&&(p.stock===null||nat(p.stock))&&nat(p.limit)&&logo(p.logo))&&d.sales.every(s=>validId(s.id)&&str(s.name)&&str(s.address)&&(s.addressParts===undefined||(s.addressParts&&addressKeys.every(k=>str(s.addressParts[k]))))&&(s.phone===''||(str(s.phone)&&/^\d{10}$/.test(s.phone)))&&/^TT-\d+$/.test(s.no)&&Number.isFinite(Date.parse(s.at))&&profile(s.shop)&&['Cash','COD','UPI'].includes(s.mode)&&nat(s.paid)&&nat(s.total)&&s.paid<=s.total&&Array.isArray(s.lines)&&s.lines.length&&s.lines.every(l=>(l.product===null||validId(l.product))&&str(l.name)&&nat(l.price)&&nat(l.qty)&&l.qty>0)&&s.lines.reduce((n,l)=>n+l.price*l.qty,0)===s.total)}
async function restore(input){try{let b=JSON.parse(await input.files[0].text());if(b.version!==1||!validData(b.data))throw Error('সঠিক ব্যাকআপ ফাইল বাছুন');if(!confirm('বর্তমান হিসাব বদলে ব্যাকআপের হিসাব ফেরাবেন?'))return;await change(d=>Object.assign(d,b.data));cart=[];draft={};render();notify('ব্যাকআপ ফেরানো হয়েছে')}catch(e){alert(e.message)}finally{input.value=''}}
function render(){$('#nav').innerHTML=pages.map((p,i)=>(i===0?'<div class="navlabel">প্রধান মেনু</div>':i===5?'<div class="navlabel">ব্যবস্থাপনা</div>':'')+button(ic(icons[i])+p,'nav('+i+')',page===i?'active':'')).join('');$('#crumb').textContent='দোকান পরিচালনা  /  '+pages[page];$('#today').textContent=date(Date.now());$('#main').innerHTML=page===0?dashboard():page===1?bill():page===5?settings():heading(pages[page],page===2?button(ic('plus')+' নতুন আইটেম','product()','primary'):'')+'<section class="panel">'+searchBar(page===2)+'<div id="list">'+list()+'</div></section>';if(page===1)bindBill();if(page===5)$('#profile').onsubmit=async e=>{e.preventDefault();await submit(e.target,async f=>{let shop={...Object.fromEntries(f),name:required(f,'name'),printStorefront:f.has('printStorefront'),logo:await upload(f.get('logo'),state.shop.logo)};await change(d=>d.shop=shop);notify('দোকানের তথ্য সংরক্ষিত হয়েছে')})}}
$('#menu').onclick=()=>$('aside').classList.toggle('open');
