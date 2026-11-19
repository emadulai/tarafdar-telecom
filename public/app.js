'use strict';
const $=s=>document.querySelector(s), cats=['PVC Card','Banking Service','Others Service'], pages=['Dashboard','New Bill','Products & Services','Customer Ledger','Invoices','Settings'], icons=['grid','plus','box','users','receipt','gear'];
const paths={grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',plus:'M12 4v16 M4 12h16',box:'m3 7 9-5 9 5v10l-9 5-9-5z M3 7l9 5 9-5 M12 12v10 M7 4.8l9 5',users:'M15 20v-2a5 5 0 0 0-10 0v2 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 7 M18 14q4 1 4 6',receipt:'M5 3h14v18l-3-2-4 2-4-2-3 2z M8 8h8 M8 12h8 M8 16h4',gear:'M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M9 15v6',wallet:'M3 6h17v14H3z M3 6l14-4v4 M15 11h6v5h-6z',card:'M2 5h20v14H2z M2 9h20 M5 14h5',bank:'m2 8 10-6 10 6z M5 10v8 M10 10v8 M15 10v8 M20 10v8 M2 21h20',phone:'m5 3 4 1 1 4-2 2q2 4 6 6l2-2 4 1 1 4q-1 4-6 2Q4 16 2 6z',bars:'M3 20h18 M6 17v-5 M12 17V5 M18 17V9'};
const ic=k=>'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+paths[k]+'"/></svg>';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bn=n=>Number(n).toLocaleString('en-IN',{maximumFractionDigits:2}), money=n=>'₹'+bn(n/100), id=()=>crypto.randomUUID(), dateKey=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(d), date=d=>new Date(d).toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short',year:'numeric'});
const start=()=>({products:[],sales:[],shop:{name:'Tarafdar Telecom',web:'www.emadulai.in',address:'',email:'',phone:'',logo:''}});
let state=start(),page=0,filter='',query='',cart=[],draft={},noticeTimer;
function notify(t){$('#toast').textContent=t;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#toast').textContent='',3500)}
const nav=(p,f='')=>{if(correction && page===1 && p!==1){if(!confirm('Leave without saving corrections?'))return;endCorrection()}page=p;filter=f;query='';$('aside').classList.remove('open');render();scrollTo(0,0)};
const button=(label,fn,cls='')=>'<button type="button" class="'+cls+'" onclick="'+fn+'">'+label+'</button>';
const tile=(k,c='')=>'<span class="tile '+c+'">'+ic(k)+'</span>', empty=(k,t)=>'<div class="empty">'+ic(k)+esc(t)+'</div>';
const heading=(t,action='')=>'<div class="title"><h1>'+t+'</h1>'+action+'</div>';
function customers(data=state) {
  const groups=new Map();
  function group(record) {
    const key=record.phone || record.customerKey || record.id;
    if(!groups.has(key)) groups.set(key,{...record,key,sales:[],due:0});
    return groups.get(key);
  }
  for(const sale of [...data.sales].reverse()) {
    if(sale.customerRemoved) continue;
    const customer=group(sale);
    customer.sales.push(sale);
    customer.due+=sale.total-sale.paid;
  }
  for(const profile of data.contacts || []) {
    const customer=group(profile);
    Object.assign(customer,profile);
  }
  return [...groups.values()];
}
function person(c){
  const call = c.phone ? '<a aria-label="Call" href="tel:'+esc(c.phone)+'">'+ic('phone')+'</a>' : '';
  const detail = c.phone || (c.sales[0]?.no || 'New Customer');
  return '<div class="listrow">'+tile('users','violet')+'<div>'+button(esc(c.name),"historyView('"+c.key+"')",'link')+'<small>'+esc(detail)+'</small></div>'+call+'</div>';
}
function dashboard(){let now=new Date(),today=state.sales.filter(s=>dateKey(new Date(s.at))===dateKey(now)),sum=(ss)=>ss.reduce((a,s)=>a+shopRevenue(s),0),qty=today.flatMap(s=>s.lines).reduce((a,l)=>a+l.qty,0),stock=state.products.filter(p=>p.stock!==null),low=stock.filter(p=>p.stock<=p.limit).length;
let days=Array.from({length:7},(_,i)=>new Date(+now-(6-i)*86400000)),values=days.map(d=>sum(state.sales.filter(s=>dateKey(new Date(s.at))===dateKey(d)))),max=Math.max(1,...values);
return heading('Dashboard',button(ic('plus')+' New Bill','nav(1)','primary'))+'<section class="hero"><div class="kicker">'+ic('wallet')+' Today’s sales</div><strong>'+money(sum(today))+'</strong><small>Invoices today · '+bn(today.length)+'</small><img alt="" src="shop.svg"></section><div class="stats">'+[['Items sold',bn(qty),'box','','Products and services sold today'],['Stock on hand',bn(stock.reduce((a,p)=>a+p.stock,0)),'bars','green',low?bn(low)+' items low or out of stock':'Total units in stock'],['Total due',money(state.sales.reduce((a,s)=>a+s.total-s.paid,0)),'wallet','orange','Outstanding customer balances']].map(([t,v,k,c,n])=>'<section class="card"><div class="statline"><span>'+t+'</span>'+tile(k,c)+'</div><strong>'+v+'</strong><small>'+n+'</small></section>').join('')+'</div><div class="lower"><section class="panel"><div class="title"><h2>Sales overview</h2><span class="tag">Last 7 days</span></div><small>Total sales</small><h2>'+money(values.reduce((a,b)=>a+b,0))+'</h2><div class="chart">'+values.map((v,i)=>'<div class="col" title="'+date(days[i])+' · '+money(v)+'" style="height:'+v/max*94+'%"></div>').join('')+'</div><div class="axis">'+days.map(d=>'<span>'+bn(+dateKey(d).slice(-2))+'</span>').join('')+'</div></section><section class="panel"><div class="title"><h2>Recent customers</h2>'+button('View all','nav(3)','link')+'</div>'+(customers().filter(c=>c.sales.length).slice(0,5).map(person).join('')||empty('users','Customers appear here after their first invoice.'))+'</section></div><h2>Service categories</h2><div class="cats">'+cats.map((c,i)=>button(tile(['card','bank','box'][i],['','green','orange'][i])+'<div><b>'+c+'</b><small>'+bn(state.products.filter(p=>p.cat===c).length)+' products and services</small></div>',"nav(2,'"+c+"')",'cat')).join('')+'</div>'}
function options(arr,val){return arr.map(c=>'<option '+(c===val?'selected':'')+'>'+esc(c)+'</option>').join('')}
function searchBar(category=false){return '<div class="actions"><input aria-label="Search" placeholder="Search by name or number…" value="'+esc(query)+'" oninput="query=this.value;refreshList()">'+(category?'<select aria-label="Category" onchange="filter=this.value;refreshList()"><option value="">All categories</option>'+options(cats,filter)+'</select>':'')+'</div>'}
function productMatches(product, q) {
  return [product.name, product.description || ''].some(text => text.toLowerCase().includes(q));
}
function productDescription(product) {
  return product.description ? '<small style="white-space:pre-wrap;overflow-wrap:anywhere">' + esc(product.description) + '</small>' : '';
}
function list(){let q=query.trim().toLowerCase();if(page===2)return state.products.filter(p=>(!filter||p.cat===filter)&&productMatches(p,q)).map(p=>'<div class="listrow">'+(p.logo?'<img class="thumb" alt="" src="'+esc(p.logo)+'">':tile('box'))+'<div><b>'+esc(p.name)+'</b>'+productDescription(p)+'<small>'+esc(p.cat)+' · '+money(p.price)+' · '+(p.stock===null?'Service':'Stock '+bn(p.stock))+'</small>'+(p.stock!==null&&p.stock<=p.limit?'<span class="alert">'+(p.stock?'Low stock':'Out of stock')+'</span>':'')+'</div>'+button('Edit',"product('"+p.id+"')")+'</div>').join('')||empty('box','No products or services found.');
if(page===3)return customers().filter(c=>(c.name+c.phone).toLowerCase().includes(q)).map(person).join('')||empty('users','No customers found.');
return [...state.sales].reverse().filter(s=>(s.no+s.name+s.phone+s.mode).toLowerCase().includes(q)).map(saleRow).join('')||empty('receipt','No invoices found.')}
function saleRow(s){return '<div class="listrow">'+tile('receipt')+'<div><b>'+esc(s.no)+'</b><small>'+esc(s.name)+' · '+date(s.at)+' · '+money(s.total)+'</small></div>'+button('Receipt',"showSale('"+s.id+"')")+'</div>'}
function refreshList(){ $('#list').innerHTML=list() }
function field(k,t,v='',attrs='',type='text'){return '<label>'+t+'<input name="'+k+'" type="'+type+'" value="'+esc(v)+'" '+attrs+'></label>'}
function dialog(body){let d=$('#modal');d.innerHTML=body;if(!d.open)d.showModal()}
const closeBtn=button('Close',"document.querySelector('dialog').close()");
function product(key){let p=state.products.find(p=>p.id===key)||{cat:filter||cats[0],stock:null,limit:3};dialog('<div class="title"><h2>'+(key?'Edit product or service':'New product or service')+'</h2>'+closeBtn+'</div><form id="edit"><div class="formgrid">'+field('name','Name',p.name,'required maxlength="100"')+'<label>Category<select name="cat">'+options(cats,p.cat)+'</select></label>'+field('price','Price (₹)',p.price===undefined?'':p.price/100,'required min="0" max="99999999" step=".01"','number')+field('stock','Stock (leave blank for a service)',p.stock??'','min="0" max="9999999" step="1"','number')+field('limit','Low-stock threshold',p.limit,'required min="0" max="9999999"','number')+'<label>Logo<input type="file" name="logo" accept="image/png,image/jpeg,image/webp"></label><label class="full">Description (optional)<textarea name="description" rows="3" maxlength="1500">'+esc(p.description||'')+'</textarea></label></div><button class="primary">Save</button>'+(key?button('Remove product',"removeProduct('"+key+"')"):'')+'</form>');$('#edit').onsubmit=async e=>{e.preventDefault();await submit(e.target,async f=>{let logo=await upload(f.get('logo'),p.logo),item={id:key||id(),name:required(f,'name'),description:f.get('description').trim(),cat:f.get('cat'),price:paise(f.get('price')),stock:f.get('stock')===''?null:+f.get('stock'),limit:+f.get('limit'),logo};await change(d=>{let i=d.products.findIndex(x=>x.id===key);if(i<0)d.products.push(item);else{if(JSON.stringify(d.products[i])!==JSON.stringify(p))throw Error('Stock has changed. Reopen the list.');d.products[i]=item}});$('#modal').close();render();notify('Saved')})}}
function required(f,k){let v=String(f.get(k)||'').trim();if(!v)throw Error('Complete the required field');return v}
function paise(n){let v=Math.round(Number(n)*100);if(!Number.isSafeInteger(v)||v<0)throw Error('Enter a valid amount');return v}
async function submit(form,fn){let b=form.querySelector('button.primary');if(b.disabled)return;b.disabled=true;try{await fn(new FormData(form))}catch(e){alert(e.message)}finally{b.disabled=false}}
async function upload(file,old){if(!file?.size)return old||'';if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5000000)throw Error('Choose a PNG, JPG or WebP logo up to 5 MB');let img=await createImageBitmap(file),scale=Math.min(1,180/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);img.close();return c.toDataURL('image/png')}
function settings(){let s=state.shop;return heading('Shop settings')+'<section class="panel"><h2>Shop details for receipts</h2><form id="profile"><div class="formgrid">'+field('name','Shop name',s.name,'required')+field('phone','Mobile number 1',s.phone,'','tel')+field('phone2','Mobile number 2 (optional)',s.phone2,'','tel')+field('email','Email',s.email,'','email')+field('web','Website',s.web)+field('address','Shop address',s.address)+'<label>Shop logo<input name="logo" type="file" accept="image/png,image/jpeg,image/webp"></label><label class="full storefront-choice"><input type="checkbox" name="printStorefront" '+(s.printStorefront!==false?'checked':'')+'> Show the storefront artwork on receipts</label></div><button class="primary">Save</button></form></section><br><section class="panel"><h2>Ledger backup</h2><p>Your ledger is stored in your admin account database. Download a backup regularly.</p><div class="actions">'+button('Download backup','backup()')+'<label>Restore backup<input type="file" accept=".json" onchange="restore(this)"></label></div></section>'}
function bill(){return heading(correction?'Edit invoice · '+esc(correction.original.no):'New Bill', correction?button('Cancel','nav(4)'):'')+'<div class="layoutbill"><section class="panel"><h2>Select products and services</h2><input placeholder="Search for a product or service…" aria-label="Search products and services" oninput="catalog(this.value)"><div id="catalog"></div><hr><h3>Custom service</h3><form id="custom">'+field('name','Service name','','required maxlength="100"')+field('price','Price (₹)','','required min="0" max="99999999" step=".01"','number')+'<button>Add to bill</button></form></section><section class="panel"><h2>Bill details</h2><div id="lines"></div><form id="checkout"><input type="hidden" name="customerKey" value="'+esc(draft.customerKey||'')+'"><div class="formgrid">'+field('name','Customer name',draft.name,'required maxlength="100"')+field('phone','Mobile number (optional)',draft.phone,'pattern="[0-9]{10}" title="Enter a 10-digit mobile number" inputmode="numeric"','tel')+billAddressFields()+ownerField(draft.ownerId)+'<label>Payment mode<select name="mode">'+options(['Cash','COD','UPI'],draft.mode)+'</select></label>'+field('paid','Amount paid (₹)',draft.paid??'','min="0" step=".01"','number')+'</div>'+'<p id="due"></p><button class="primary">'+(correction?'Save corrections':'Create invoice')+'</button></form></section></div>'}
function catalog(q='') {
  const term=q.trim().toLowerCase();
  const stock=state.products.filter(p=>productMatches(p,term)).map(p=>
    '<div class="listrow"><div>'+esc(p.name)+productDescription(p)+'<small>'+money(p.price)+' · '+esc(p.cat)+'</small></div>'+button('Add',"addItem('"+p.id+"')")+'</div>');
  const services=[];
  if(term) masterGroups.forEach((group,g)=>group.services.forEach((item,i)=>{
    if(item.name.toLowerCase().includes(term))services.push('<div class="listrow"><div>'+esc(item.name)+'<small>'+esc(group.title)+' · '+rateLabel(item)+'</small></div>'+button('Select','chooseService('+g+','+i+')')+'</div>');
  }));
  $('#catalog').innerHTML=[...stock,...services].join('')||empty('box',term?'No matches. You can add a custom service.':'Type a service name to add it to this bill.');
}
function addItem(key){let p=state.products.find(x=>x.id===key),l=cart.find(x=>x.product===key);if(!p)return notify('This product is no longer listed');if(p.stock!==null&&(l?.qty||0)>=p.stock+(correction?productUnits(correction.original.lines,key):0))return notify('Insufficient stock');if(l)l.qty++;else cart.push({product:key,name:p.name,price:p.price,qty:1,sourceName:p.name,sourcePrice:p.price});lines()}
const total=()=>cart.reduce((n,l)=>n+l.price*l.qty,0);
function lines(){ if(!cart.some(l=>l.pvc)) cart=cart.filter(l=>!l.delivery); $('#lines').innerHTML=cart.map((l,i)=>'<div class="listrow"><div>'+esc(l.name)+lineDetails(l)+'<small>'+money(l.price)+' × '+bn(l.qty)+'</small></div><div>'+button('Edit','editBillLine('+i+')')+' '+button('−','adjust('+i+',-1)')+' '+(l.delivery?'':button('+','adjust('+i+',1)'))+'</div></div>').join('')+deliveryControl()+'<h3>Total '+money(total())+'</h3>';due()}
function adjust(i,d){if(cart[i].delivery){if(d<0)setDelivery('0');return}if(d===1&&cart[i].product)return addItem(cart[i].product);cart[i].qty+=d;if(!cart[i].qty)cart.splice(i,1);lines()}
function due(){let p=$('#checkout').elements.paid;p.max=total()/100;$('#due').textContent='Balance due '+money(total()-Math.round((Number(p.value)||0)*100))}
function commitBill(data,sale){if(!sale.lines.length)throw Error('Add at least one item');if(sale.paid>sale.total)throw Error('Amount paid exceeds the bill total');for(let l of sale.lines){if(!l.product)continue;let p=data.products.find(p=>p.id===l.product);if(!p||p.price!==(l.sourcePrice??l.price)||p.name!==(l.sourceName??l.name))throw Error('The product has changed. Remove it and add it again.');if(p.stock!==null){if(p.stock<l.qty)throw Error(l.name+' Insufficient stock');p.stock-=l.qty}}sale.no='TT-'+String(data.sales.length+1).padStart(5,'0');sale.shop={...data.shop};data.sales.push(sale)}
function bindBill(){bindPinLookup($("#checkout"));catalog();lines();$('#custom').onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);try{cart.push({product:null,name:required(f,'name'),price:paise(f.get('price')),qty:1});lines();e.target.reset()}catch(err){notify(err.message)}};$('#checkout').oninput=e=>{draft=Object.fromEntries(new FormData(e.currentTarget));due()};$('#checkout').onsubmit=async e=>{e.preventDefault();await submit(e.target,async f=>{let sale={id:id(),at:new Date().toISOString(),customerKey:f.get('customerKey')||null,name:required(f,'name'),ownerId:billingOwner(f),phone:f.get('phone'),address:f.get('address').trim(),addressParts:readAddress(f),mode:f.get('mode'),paid:paise(f.get('paid')),total:total(),lines:structuredClone(cart)};const original=correction?.original;await change(d=>original?correctSale(d,original,sale):commitBill(d,sale));if(original){endCorrection()}else{cart=[];draft={}}nav(4);showSale(original?.id??sale.id)})}}
function billAddressFields(values=draft) {
  const text = (key, label, limit = 100) => field(key,label,values[key],'maxlength="'+limit+'"');
  return '<fieldset class="bill-address full"><legend>Customer address <span>(optional)</span></legend><div class="address-fields">' +
    field('pin','West Bengal PIN code',values.pin,'inputmode="numeric" maxlength="6" pattern="[0-9\u09e6-\u09ef]{6}" title="Enter a 6-digit PIN code"') +
    '<label data-pin-choice hidden>Choose post office<select></select></label>' +
    '<small data-pin-status role="status"></small>' +
    '<div class="address-street">'+text('address','House, street or neighbourhood',300)+'</div>' +
    text('locality','Village or town') + text('postOffice','Post office') +
    text('district','District') + text('region','State') + '</div></fieldset>';
}
const addressKeys = ['locality', 'postOffice', 'pin', 'district', 'region'];
function readAddress(form) {
  const parts = Object.fromEntries(addressKeys.map(key => [key, (form.get(key) || '').trim()]));
  parts.pin = parts.pin.replace(/[\u09e6-\u09ef]/g, digit => String('\u09e6\u09e7\u09e8\u09e9\u09ea\u09eb\u09ec\u09ed\u09ee\u09ef'.indexOf(digit)));
  return parts;
}
function addressLines(sale) {
  const parts = sale.addressParts || {};
  const place = [parts.locality, parts.postOffice && 'P.O. ' + parts.postOffice].filter(Boolean).join(', ');
  const area = [parts.district, parts.region].filter(Boolean).join(', ');
  return [sale.address, place, [area, parts.pin].filter(Boolean).join(' ')]
    .map(value=>String(value||'').trim()).filter(Boolean);
}
function postalBlock(sale) {
  const lines=addressLines(sale);
  return lines.length ? '<address class="postal-block">'+lines.map(line=>'<div>'+esc(line)+'</div>').join('')+'</address>' : '';
}
function receipt(sale) {
  const shop = { ...sale.shop };
  for (const key of ['address', 'phone', 'phone2', 'email', 'web']) {
    if (!shop[key]?.trim()) shop[key] = state.shop[key] || '';
  }
  const paragraph = value => value ? '<p>' + esc(value) + '</p>' : '';
  const phones = [shop.phone, shop.phone2].filter(Boolean).join(' / ');
  const useStorefront = shop.printStorefront !== false || !shop.logo;
  const bannerImage = useStorefront ? './receipt-banner.svg' : esc(shop.logo);
  const row = (label, value) => '<div><span>' + label + '</span><b>' + value + '</b></div>';
  const items = sale.lines.map((line, index) =>
    '<tr><td>' + bn(index + 1) + '</td><td>' + esc(line.name) + lineDetails(line) + '</td><td>' +
    bn(line.qty) + '</td><td>' + money(line.price) + '</td><td>' +
    money(line.price * line.qty) + '</td></tr>').join('');
  return '<article class="receipt invoice"><div class="receipt-banner">' +
    '<img class="banner-art' + (useStorefront ? '' : ' custom-art') + '" alt="" src="' + bannerImage + '">' +
    '<div class="banner-details"><h2>' + esc(shop.name) + '</h2>' + String(shop.address).split(/\r?\n/).map(paragraph).join('') +
    paragraph(phones && 'Phone: ' + phones) + paragraph(shop.email) + paragraph(shop.web) +
    '</div></div><div class="receipt-meta"><h3>Sales receipt</h3><div><b>' + esc(sale.no) +
    '</b> · ' + date(sale.at) + '</div></div>' +
    '<div class="invoice-buyer"><div class="bill-to"><small>Bill to</small><strong>' + esc(sale.name) +
    '</strong>' + paragraph(sale.phone) + postalBlock(sale) +
    '</div><div class="invoice-mode"><small>Payment method</small><b>' + esc(sale.mode) +
    '</b></div></div><table><colgroup><col style="width:7%"><col><col style="width:12%">' +
    '<col style="width:19%"><col style="width:21%"></colgroup><thead><tr><th>No.</th><th>Product or service</th>' +
    '<th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>' + items +
    '</tbody></table><div class="receipt-settlement">' + signatureFooter(sale) + '<div class="invoice-totals">' + row('Bill total', money(sale.total)) +
    row('Paid', money(sale.paid)) + row('Balance due', money(sale.total - sale.paid)) +
    '</div></div></article>';
}
function showSale(key){let s=state.sales.find(s=>s.id===key),html=receipt(s);$('#paper').innerHTML=html;dialog('<div class="title">'+button('A4 Print / PDF','window.print()','primary')+button('Edit invoice',"beginCorrection('"+s.id+"')")+closeBtn+'</div>'+html)}
function historyView(key){let c=customers().find(c=>c.key===key);dialog('<div class="title"><h2>'+esc(c.name)+'</h2>'+closeBtn+'</div><p>'+esc(c.phone||(c.sales[0]?.no || 'New Customer'))+' · Total due '+money(c.due)+'</p>'+postalBlock(c)+'<div class="actions">'+button('New Bill',"contactBill('"+key+"')")+button('Edit',"contactForm('"+key+"')")+button('Delete personal details',"removeContact('"+key+"')")+'</div>'+c.sales.map(saleRow).join(''))}
function backup(){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({version:1,data:state})],{type:'application/json'}));a.download='tarafdar-'+dateKey(new Date())+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
const validId=k=>typeof k==='string'&&/^[a-f0-9-]{36}$/i.test(k),nat=n=>Number.isSafeInteger(n)&&n>=0,str=s=>typeof s==='string',logo=s=>s===''||typeof s==='string'&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(s),profile=p=>p&&['name','phone','web','address','email'].every(k=>str(p[k]))&&(p.phone2===undefined||str(p.phone2))&&logo(p.logo);
function validData(d){return d&&(!d.contacts||(Array.isArray(d.contacts)&&d.contacts.every(c=>validId(c.id)&&str(c.name)&&str(c.address)&&(c.phone===''||/^\d{10}$/.test(c.phone)))))&&(!d.retiredProducts||(Array.isArray(d.retiredProducts)&&d.retiredProducts.every(p=>validId(p.id)&&(p.stock===null||nat(p.stock)))))&&profile(d.shop)&&Array.isArray(d.products)&&Array.isArray(d.sales)&&d.products.every(p=>validId(p.id)&&str(p.name)&&(p.description===undefined||str(p.description))&&cats.includes(p.cat)&&nat(p.price)&&(p.stock===null||nat(p.stock))&&nat(p.limit)&&logo(p.logo))&&d.sales.every(s=>validId(s.id)&&str(s.name)&&str(s.address)&&(s.addressParts===undefined||(s.addressParts&&addressKeys.every(k=>str(s.addressParts[k]))))&&(s.phone===''||(str(s.phone)&&/^\d{10}$/.test(s.phone)))&&/^TT-\d+$/.test(s.no)&&Number.isFinite(Date.parse(s.at))&&profile(s.shop)&&['Cash','COD','UPI'].includes(s.mode)&&nat(s.paid)&&nat(s.total)&&s.paid<=s.total&&Array.isArray(s.lines)&&s.lines.length&&s.lines.every(l=>(l.product===null||validId(l.product))&&str(l.name)&&nat(l.price)&&nat(l.qty)&&l.qty>0)&&s.lines.reduce((n,l)=>n+l.price*l.qty,0)===s.total)}
async function restore(input){try{let b=JSON.parse(await input.files[0].text());if(b.version!==1||!validData(b.data))throw Error('Choose a valid backup');if(!confirm('Replace the current ledger with this backup?'))return;await change(d=>Object.assign(d,{contacts:[],retiredProducts:[]},b.data));cart=[];draft={};render();notify('Backup restored')}catch(e){alert(e.message)}finally{input.value=''}}
function render(){$('#nav').innerHTML=pages.map((p,i)=>(i===0?'<div class="navlabel">Main menu</div>':i===5?'<div class="navlabel">Management</div>':'')+button(ic(icons[i])+p,'nav('+i+')',page===i?'active':'')).join('');$('#crumb').textContent='Shop management  /  '+pages[page];$('#today').textContent=date(Date.now());$('#main').innerHTML=page===0?dashboard():page===1?bill():page===5?settings():heading(pages[page],page===2?button(ic('plus')+' New item','product()','primary'):page===3?button('New Customer','contactForm()','primary'):'')+(page===2?masterPanel():'')+'<section class="panel">'+searchBar(page===2)+'<div id="list">'+list()+'</div></section>';if(page===2)showPriceList(0);if(page===1)bindBill();if(page===5)$('#profile').onsubmit=async e=>{e.preventDefault();await submit(e.target,async f=>{let shop={...Object.fromEntries(f),name:required(f,'name'),printStorefront:f.has('printStorefront'),logo:await upload(f.get('logo'),state.shop.logo)};await change(d=>d.shop=shop);notify('Shop details saved')})}}
$('#menu').onclick=()=>$('aside').classList.toggle('open');


const masterGroups = [
  {
    "title": "PAN Card Services",
    "services": [
      {
        "name": "New PAN Card Application",
        "rate": "180",
        "suggested": false
      },
      {
        "name": "PAN Card Correction",
        "rate": "180",
        "suggested": false
      },
      {
        "name": "Lost PAN Card Complete Service",
        "rate": "400",
        "suggested": false
      },
      {
        "name": "PAN Card Reprint Assistance",
        "rate": "150",
        "suggested": true
      },
      {
        "name": "e-PAN Download & Print",
        "rate": "30",
        "suggested": true
      },
      {
        "name": "PAN Card Status Check",
        "rate": "10",
        "suggested": true
      },
      {
        "name": "PAN-Aadhaar Linking Assistance",
        "rate": "50",
        "suggested": true
      },
      {
        "name": "PAN PVC Card Printing",
        "rate": "PVC",
        "suggested": false
      }
    ]
  },
  {
    "title": "Voter Card Services",
    "services": [
      {
        "name": "New Voter Card Application",
        "rate": "120",
        "suggested": false
      },
      {
        "name": "Voter Card Correction",
        "rate": "120",
        "suggested": false
      },
      {
        "name": "Voter Card Address Change",
        "rate": "120",
        "suggested": false
      },
      {
        "name": "Voter Mobile Number Link / Update",
        "rate": "50",
        "suggested": false
      },
      {
        "name": "e-EPIC Download & Print",
        "rate": "30",
        "suggested": true
      },
      {
        "name": "Voter Card Status Check",
        "rate": "10",
        "suggested": true
      },
      {
        "name": "Voter List Name Search",
        "rate": "10",
        "suggested": true
      },
      {
        "name": "Voter PVC Card Printing",
        "rate": "PVC",
        "suggested": false
      },
      {
        "name": "Voter Card Replacement Assistance",
        "rate": "100",
        "suggested": true
      }
    ]
  },
  {
    "title": "Banking & Financial Services",
    "services": [
      {
        "name": "Cash Withdrawal",
        "rate": "W",
        "suggested": false
      },
      {
        "name": "Cash Deposit",
        "rate": "%",
        "suggested": false
      },
      {
        "name": "Money Transfer",
        "rate": "%",
        "suggested": false
      },
      {
        "name": "PhonePe Money Transfer",
        "rate": "%",
        "suggested": false
      },
      {
        "name": "Balance Enquiry",
        "rate": "5",
        "suggested": false
      },
      {
        "name": "DBT Link / NPCI Seeding Assistance",
        "rate": "50",
        "suggested": false
      },
      {
        "name": "Airtel Payments Bank Account Opening",
        "rate": "200",
        "suggested": false
      },
      {
        "name": "NSDL Account Opening",
        "rate": "150",
        "suggested": false
      },
      {
        "name": "Kotak Mahindra Bank Classic Zero Balance Account",
        "rate": "D2000",
        "suggested": false
      },
      {
        "name": "Kotak Mahindra Bank Classic Zero Balance Account",
        "rate": "D5000",
        "suggested": false
      },
      {
        "name": "Kotak Mahindra Bank Super Zero Balance Account",
        "rate": "D10000",
        "suggested": false
      },
      {
        "name": "Loan Application Assistance",
        "rate": "0",
        "suggested": false
      },
      {
        "name": "Mini Statement",
        "rate": "10",
        "suggested": true
      },
      {
        "name": "Aadhaar Bank Linking Assistance",
        "rate": "50",
        "suggested": true
      },
      {
        "name": "Insurance Application Assistance",
        "rate": "100",
        "suggested": true
      },
      {
        "name": "Credit Card Application Assistance",
        "rate": "100",
        "suggested": true
      }
    ]
  },
  {
    "title": "Aadhaar Card Services",
    "services": [
      {
        "name": "Aadhaar Print + Lamination",
        "rate": "50",
        "suggested": false
      },
      {
        "name": "Biometric Update Appointment Booking",
        "rate": "50",
        "suggested": false
      },
      {
        "name": "Aadhaar Mobile Number Change Assistance",
        "rate": "100",
        "suggested": false
      },
      {
        "name": "Mobile Update Appointment Booking",
        "rate": "50",
        "suggested": false
      },
      {
        "name": "Aadhaar Address Update Assistance",
        "rate": "50",
        "suggested": false
      },
      {
        "name": "Aadhaar Name / DOB Update Appointment",
        "rate": "50",
        "suggested": false
      },
      {
        "name": "Aadhaar Download",
        "rate": "10",
        "suggested": false
      },
      {
        "name": "Aadhaar Status Check",
        "rate": "10",
        "suggested": false
      },
      {
        "name": "Aadhaar Document Update Assistance",
        "rate": "50",
        "suggested": true
      },
      {
        "name": "Aadhaar PVC Card Printing",
        "rate": "PVC",
        "suggested": false
      }
    ]
  },
  {
    "title": "Recharge & Bill Payment Services",
    "services": [
      {
        "name": "Mobile Recharge",
        "rate": "R",
        "suggested": false
      },
      {
        "name": "Electricity Bill Payment",
        "rate": "%",
        "suggested": false
      },
      {
        "name": "EMI / Loan Installment Payment",
        "rate": "%",
        "suggested": false
      },
      {
        "name": "DTH Recharge",
        "rate": "%",
        "suggested": false
      },
      {
        "name": "Gas Bill Payment",
        "rate": "%",
        "suggested": false
      },
      {
        "name": "Water Bill Payment",
        "rate": "%",
        "suggested": false
      },
      {
        "name": "Broadband Bill Payment",
        "rate": "%",
        "suggested": false
      },
      {
        "name": "FASTag Recharge",
        "rate": "%",
        "suggested": false
      },
      {
        "name": "Credit Card Bill Payment",
        "rate": "%",
        "suggested": false
      },
      {
        "name": "Insurance Premium Payment",
        "rate": "%",
        "suggested": false
      },
      {
        "name": "Postpaid Mobile Bill Payment",
        "rate": "%",
        "suggested": true
      },
      {
        "name": "Landline Bill Payment",
        "rate": "%",
        "suggested": true
      },
      {
        "name": "Other Bill / Payment Services",
        "rate": "%",
        "suggested": false
      }
    ]
  },
  {
    "title": "Printing, Xerox & Document Services",
    "services": [
      {
        "name": "Black & White Xerox (Per Page)",
        "rate": "3",
        "suggested": false
      },
      {
        "name": "WhatsApp Document Print (Per Page)",
        "rate": "5",
        "suggested": false
      },
      {
        "name": "Colour Printout (Per Page)",
        "rate": "10",
        "suggested": false
      },
      {
        "name": "Aadhaar Print + Lamination",
        "rate": "50",
        "suggested": false
      },
      {
        "name": "Small Lamination",
        "rate": "10",
        "suggested": false
      },
      {
        "name": "Medium Lamination",
        "rate": "20",
        "suggested": true
      },
      {
        "name": "A4 Lamination",
        "rate": "30",
        "suggested": true
      },
      {
        "name": "Large Lamination",
        "rate": "50",
        "suggested": false
      },
      {
        "name": "Document Scanning (Per Page)",
        "rate": "10",
        "suggested": true
      },
      {
        "name": "PDF Editing (Simple)",
        "rate": "30",
        "suggested": true
      },
      {
        "name": "PDF Merge / Split",
        "rate": "20",
        "suggested": true
      },
      {
        "name": "Document Upload",
        "rate": "20",
        "suggested": true
      },
      {
        "name": "Email Account Creation",
        "rate": "30",
        "suggested": true
      },
      {
        "name": "Simple Online Form Fill-up",
        "rate": "50",
        "suggested": true
      },
      {
        "name": "Complex Online Form Fill-up",
        "rate": "150",
        "suggested": true
      }
    ]
  },
  {
    "title": "Photo Printing Services",
    "services": [
      {
        "name": "Passport Size Photo — 3 Pieces",
        "rate": "20",
        "suggested": false
      },
      {
        "name": "Passport Size Photo — 6 Pieces",
        "rate": "30",
        "suggested": false
      },
      {
        "name": "Joint Photo — 5 Pieces",
        "rate": "30",
        "suggested": false
      },
      {
        "name": "Passport Photo Background Editing",
        "rate": "20",
        "suggested": true
      },
      {
        "name": "Photo Resize / Crop",
        "rate": "10",
        "suggested": true
      },
      {
        "name": "Photo Editing",
        "rate": "30",
        "suggested": true
      }
    ]
  },
  {
    "title": "All Types of PVC Card Services",
    "services": [
      {
        "name": "Aadhaar PVC Card",
        "rate": "PVC",
        "suggested": false
      },
      {
        "name": "PAN PVC Card",
        "rate": "PVC",
        "suggested": false
      },
      {
        "name": "Voter PVC Card",
        "rate": "PVC",
        "suggested": false
      },
      {
        "name": "ABHA PVC Card",
        "rate": "PVC",
        "suggested": false
      },
      {
        "name": "Ayushman PVC Card",
        "rate": "PVC",
        "suggested": false
      },
      {
        "name": "ABC / APAAR PVC Card",
        "rate": "PVC",
        "suggested": false
      },
      {
        "name": "Ration PVC Card",
        "rate": "PVC",
        "suggested": false
      },
      {
        "name": "Driving Licence PVC Card",
        "rate": "PVC",
        "suggested": false
      },
      {
        "name": "Student ID PVC Card",
        "rate": "PVC",
        "suggested": false
      },
      {
        "name": "Employee ID PVC Card",
        "rate": "PVC",
        "suggested": false
      },
      {
        "name": "Custom PVC Card",
        "rate": "PVC",
        "suggested": false
      },
      {
        "name": "Other PVC Card",
        "rate": "PVC",
        "suggested": false
      }
    ]
  },
  {
    "title": "Health & Ayushman Services",
    "services": [
      {
        "name": "ABHA Card Creation",
        "rate": "0",
        "suggested": true
      },
      {
        "name": "ABHA Card Download",
        "rate": "0",
        "suggested": true
      },
      {
        "name": "ABHA PVC Card Printing",
        "rate": "PVC",
        "suggested": false
      },
      {
        "name": "Ayushman Bharat Eligibility Check",
        "rate": "0",
        "suggested": true
      },
      {
        "name": "Ayushman Card Application Assistance",
        "rate": "0",
        "suggested": true
      },
      {
        "name": "Ayushman Card Download",
        "rate": "0",
        "suggested": true
      },
      {
        "name": "Ayushman PVC Card Printing",
        "rate": "PVC",
        "suggested": false
      },
      {
        "name": "Health Report Download & Print",
        "rate": "20",
        "suggested": true
      },
      {
        "name": "Hospital Appointment Assistance",
        "rate": "50",
        "suggested": true
      }
    ]
  },
  {
    "title": "Government & Certificate Services",
    "services": [
      {
        "name": "Income Certificate Application Assistance",
        "rate": "100",
        "suggested": true
      },
      {
        "name": "Residential Certificate Assistance",
        "rate": "100",
        "suggested": true
      },
      {
        "name": "Caste Certificate Application Assistance",
        "rate": "120",
        "suggested": true
      },
      {
        "name": "EWS Certificate Application Assistance",
        "rate": "120",
        "suggested": true
      },
      {
        "name": "Birth Certificate Assistance",
        "rate": "150",
        "suggested": true
      },
      {
        "name": "Death Certificate Assistance",
        "rate": "150",
        "suggested": true
      },
      {
        "name": "Marriage Certificate Assistance",
        "rate": "150",
        "suggested": true
      },
      {
        "name": "Police Clearance Certificate Application Assistance",
        "rate": "150",
        "suggested": true
      },
      {
        "name": "Ration Card New Application Assistance",
        "rate": "100",
        "suggested": true
      },
      {
        "name": "Ration Card Correction Assistance",
        "rate": "100",
        "suggested": true
      },
      {
        "name": "Ration Card Address Change Assistance",
        "rate": "100",
        "suggested": true
      },
      {
        "name": "e-Shram Registration Assistance",
        "rate": "50",
        "suggested": true
      },
      {
        "name": "Udyam Registration",
        "rate": "0",
        "suggested": false
      },
      {
        "name": "Trade Licence Application Assistance",
        "rate": "150",
        "suggested": true
      },
      {
        "name": "Labour Card Application Assistance",
        "rate": "100",
        "suggested": true
      }
    ]
  },
  {
    "title": "Education & Student Services",
    "services": [
      {
        "name": "School Admission Form",
        "rate": "100",
        "suggested": true
      },
      {
        "name": "College Admission Form",
        "rate": "150",
        "suggested": true
      },
      {
        "name": "Scholarship Application Assistance",
        "rate": "100",
        "suggested": true
      },
      {
        "name": "Student Credit Card Application Assistance",
        "rate": "150",
        "suggested": true
      },
      {
        "name": "Exam Form Fill-up",
        "rate": "100",
        "suggested": true
      },
      {
        "name": "Admit Card Download & Print",
        "rate": "20",
        "suggested": true
      },
      {
        "name": "Result Download & Print",
        "rate": "20",
        "suggested": true
      },
      {
        "name": "Marksheet Printing",
        "rate": "20",
        "suggested": true
      },
      {
        "name": "ABC / APAAR ID Assistance",
        "rate": "50",
        "suggested": true
      },
      {
        "name": "University Registration Assistance",
        "rate": "150",
        "suggested": true
      },
      {
        "name": "Job Exam Application",
        "rate": "120",
        "suggested": true
      },
      {
        "name": "Resume / Biodata Creation",
        "rate": "100",
        "suggested": true
      }
    ]
  },
  {
    "title": "Transport, Travel & Other Services",
    "services": [
      {
        "name": "Driving Licence Application Assistance",
        "rate": "200",
        "suggested": true
      },
      {
        "name": "Learner Licence Application Assistance",
        "rate": "150",
        "suggested": true
      },
      {
        "name": "Driving Licence Renewal Assistance",
        "rate": "200",
        "suggested": true
      },
      {
        "name": "Vehicle Tax Payment Assistance",
        "rate": "100",
        "suggested": true
      },
      {
        "name": "Traffic Challan Payment Assistance",
        "rate": "50",
        "suggested": true
      },
      {
        "name": "Passport Application Assistance",
        "rate": "200",
        "suggested": true
      },
      {
        "name": "Passport Appointment Assistance",
        "rate": "100",
        "suggested": true
      },
      {
        "name": "Train Ticket Booking Assistance",
        "rate": "100",
        "suggested": true
      },
      {
        "name": "Bus Ticket Booking Assistance",
        "rate": "50",
        "suggested": true
      },
      {
        "name": "Flight Ticket Booking Assistance",
        "rate": "200",
        "suggested": true
      },
      {
        "name": "Hotel Booking Assistance",
        "rate": "100",
        "suggested": true
      },
      {
        "name": "Online Shopping Order Assistance",
        "rate": "30",
        "suggested": true
      },
      {
        "name": "Online Complaint / Grievance Filing",
        "rate": "100",
        "suggested": true
      }
    ]
  }
];
function masterPanel() {
  return '<section class="panel"><h2>Service Price List</h2><small>November 2026</small><label>Category<select onchange="showPriceList(Number(this.value))">'+
    masterGroups.map((group,i)=>'<option value="'+i+'">'+esc(group.title)+'</option>').join('')+
    '</select></label><div id="masterList"></div></section>';
}
function rateLabel(item) {
  let text;
  if(item.rate.startsWith('D')) text='Free opening · Initial deposit '+money(Number(item.rate.slice(1))*100);
  else if(item.rate==='PVC') text='₹75 per card · Regular ₹100';
  else if(item.rate==='%' || item.rate==='W') text='1% · Minimum ₹10';
  else if(item.rate==='R') text='No extra charge';
  else text=Number(item.rate) ? money(Number(item.rate)*100) : 'Free';
  return text+(item.suggested?' · Suggested':'');
}
function showPriceList(index) {
  $('#masterList').innerHTML=masterGroups[index].services.map(item=>
    '<div class="listrow"><div><b>'+esc(item.name)+'</b><small>'+rateLabel(item)+'</small></div></div>').join('');
}
function tariffQuote(service, amount, override) {
  const {rate} = service;
  const deposit = rate.startsWith('D');
  const variable = ['%','R','W'].includes(rate);
  const base = deposit ? Number(rate.slice(1))*100 : variable ? amount : 0;
  const fee = rate==='PVC' ? 7500 : deposit || rate==='R' ? 0 :
    variable ? Math.max(1000, Math.round(amount/100)) : Number(rate)*100;
  const charge = service.suggested && override !== null ? override : fee;
  const principal = variable && rate!=='W' ? base : 0;
  return {base,charge,principal,price:principal+charge};
}
function chooseService(groupIndex,itemIndex) {
  const item=masterGroups[groupIndex].services[itemIndex];
  dialog('<div class="title"><h2>'+esc(item.name)+'</h2>'+closeBtn+'</div><form id="masterForm"><div id="masterInputs"></div><p id="masterQuote" aria-live="polite"></p><button>Add to bill</button></form>');
  const form=$('#masterForm');
  function quote() {
    const amount=paise(form.elements.amount?.value || 0);
    const value=form.elements.override?.value;
    return tariffQuote(item,amount,value ? paise(value) : null);
  }
  function preview() {
    const {charge,base,price}=quote(), rate=item.rate;
    const label = rate.startsWith('D') ? 'Customer bank deposit ' : rate==='W' ? 'Withdrawal ' : 'Transaction ';
    $('#masterQuote').textContent=(base ? label+money(base)+' · ' : '')+
      'Shop price / fee '+money(charge)+' · Bill amount '+money(price);
  }
  function inputs() {
    $('#masterInputs').innerHTML=(['%','R','W'].includes(item.rate) ? field('amount','Transaction amount (₹)','','required min=".01" max="99999999" step=".01"','number') : '')+
      (item.suggested ? field('override','Override suggested fee (₹)','','min="0" max="99999999" step=".01"','number') : '');
    preview();
  }
  form.oninput=()=>{if(form.checkValidity()) preview(); else $('#masterQuote').textContent='Enter a valid amount';};
  form.onsubmit=e=>{
    e.preventDefault();
    const {base,charge,principal,price}=quote();
    const detail=item.rate.startsWith('D') ? 'Initial bank deposit ' : item.rate==='W' ? 'Withdrawal ' : 'Transaction ';
    const name=item.name;
    cart.push({product:null,name,price,qty:1,principal,transactionAmount:base,transactionLabel:detail,pvc:item.rate==='PVC'});
    $('#modal').close();
    lines();
  };
  inputs();
}
function deliveryControl() {
  if (!cart.some(l=>l.pvc)) return '';
  return '<label>PVC delivery<select onchange="setDelivery(this.value)"><option value="0">Standard · Within 15 days · Free</option><option value="1" '+(cart.some(l=>l.delivery)?'selected':'')+'>Emergency · Within 7 days · ₹50 per order</option></select></label>';
}
function setDelivery(value) {
  cart=cart.filter(l=>!l.delivery);
  if(value==='1' && cart.some(l=>l.pvc)) cart.push({product:null,name:'PVC emergency delivery (within 7 days)',price:5000,qty:1,delivery:true});
  lines();
}
function shopRevenue(sale) {
  return sale.total-sale.lines.reduce((n,l)=>n+(l.principal||0)*l.qty,0);
}


function lineDetails(line) {
  if (!line.transactionAmount) return '';
  return '<small style="display:block">' + esc(line.transactionLabel) + money(line.transactionAmount) +
    ' · Fee ' + money(line.price - (line.principal || 0)) + '</small>';
}

function editBillLine(index) {
  const line = cart[index];
  const principal = line.principal || 0;
  const amountLabel = line.transactionAmount ? 'Shop service fee (₹)' : 'Unit price (₹)';
  dialog('<div class="title"><h2>Edit bill item</h2>' + closeBtn + '</div><form id="billLineEditor">' +
    field('name','Product or service name',line.name,'required maxlength="200"') +
    field('price',amountLabel,(line.price-principal)/100,'required min="0" max="99999999" step=".01"','number') +
    (principal ? '<p>Transaction principal '+money(principal)+'. The shop fee is added to this amount.</p>' : '') +
    '<button class="primary">Apply to bill</button></form>');
  $('#billLineEditor').onsubmit = event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const name = required(form,'name');
      const fee = paise(form.get('price'));
      line.name = name;
      line.price = principal + fee;
      $('#modal').close();
      lines();
    } catch (error) {
      notify(error.message);
    }
  };
}


let correction = null;
function beginCorrection(key) {
  const original = state.sales.find(sale => sale.id === key);
  if (!original || correction) return;
  correction = {original: structuredClone(original), pendingCart: cart, pendingDraft: draft};
  cart = structuredClone(original.lines);
  draft = {...original, ...original.addressParts, paid: original.paid / 100};
  $('#modal').close();
  nav(1);
}
function endCorrection() {
  cart = correction.pendingCart;
  draft = correction.pendingDraft;
  correction = null;
}
function productUnits(lines, key) {
  return lines.reduce((sum,line) => sum + (line.product === key ? line.qty : 0), 0);
}
function correctSale(data, original, revised) {
  const index = data.sales.findIndex(sale => sale.id === original.id);
  if (index < 0 || JSON.stringify(data.sales[index]) !== JSON.stringify(original))
    throw Error('This invoice has changed. Cancel the correction and reopen the latest receipt.');
  if (!revised.lines.length) throw Error('Keep at least one item on the bill.');
  if (!nat(revised.total) || !nat(revised.paid) || revised.paid > revised.total)
    throw Error('Check the total and amount paid.');
  const keys = new Set([...original.lines, ...revised.lines].map(line => line.product).filter(Boolean));
  const updates = [];
  for (const key of keys) {
    const extra = productUnits(revised.lines, key) - productUnits(original.lines, key);
    if (!extra) continue;
    const product = data.products.find(item => item.id === key) || (data.retiredProducts||[]).find(item=>item.id===key);
    if (!product) throw Error('The linked product could not be found.');
    if (product.stock === null) continue;
    if (product.stock < extra) throw Error(product.name + ' Insufficient stock.');
    updates.push([product,product.stock-extra]);
  }
  for (const [product,stock] of updates) product.stock = stock;
  data.sales[index] = {...original,...revised,customerRemoved:original.customerRemoved && revised.name===original.name && !revised.phone && !revised.address && !Object.values(revised.addressParts||{}).some(Boolean),id:original.id,no:original.no,at:original.at,shop:original.shop};
}

const billingOwners = [
  {id:'emadul',name:'Emadul Tarafdar',phone:'+91 9679325977'},
  {id:'rabiul',name:'Rabiul Tarafdar',phone:'+91 8918360812'}
];

function ownerField(selected) {
  return '<label>Billed by<select name="ownerId" required><option value="">Select an owner</option>' +
    billingOwners.map(owner => '<option value="'+owner.id+'" '+(owner.id===selected?'selected':'')+'>'+
      esc(owner.name)+'</option>').join('')+'</select></label>';
}

function billingOwner(form) {
  const id = form.get('ownerId');
  if (!billingOwners.some(owner => owner.id === id)) throw Error('Select the owner issuing this invoice.');
  return id;
}

function signatureFooter(sale) {
  const owner = billingOwners.find(owner => owner.id === sale.ownerId);
  if (!owner) return '';
  return '<div class="receipt-sign"><div class="sign-space"></div><small>Authorised signature</small><strong>' +
    esc(owner.name)+'</strong><span>'+esc(owner.phone)+'</span></div>';
}


function finishManagement() {
  $('#modal').close();
  $('#paper').replaceChildren();
  render();
}
async function removeProduct(key) {
  const item=state.products.find(p=>p.id===key);
  if(!item || !confirm('“'+item.name+'” from the product list? Existing invoices will be retained.')) return;
  try {
    await change(data=>{
      if(JSON.stringify(data.products.find(p=>p.id===key))!==JSON.stringify(item))throw Error('Product details have changed. Reopen the item.');
      data.products=data.products.filter(p=>p.id!==key);
      if(data.sales.some(s=>s.lines.some(l=>l.product===key)))
        (data.retiredProducts??=[]).push({id:key,stock:item.stock});
    });
    finishManagement();
  } catch(error){alert(error.message)}
}
function contactBill(key) {
  const c=customers().find(entry=>entry.key===key);
  if(!c)return;
  if(draft.name && !confirm('Replace the customer details on the current bill?'))return;
  draft={...draft,name:c.name,phone:c.phone,address:c.address,...Object.fromEntries(addressKeys.map(k=>[k,c.addressParts?.[k]||''])),customerKey:c.phone?'':key};
  $('#modal').close();nav(1);
}
function updateContact(data, previous, details) {
  if(previous && JSON.stringify(customers(data).find(c=>c.key===previous.key))!==JSON.stringify(previous)) throw Error('The customer record has changed. Reopen the ledger.');
  const contacts=data.contacts??=[];
  const known=previous && contacts.find(c=>(c.phone||c.id)===previous.key);
  if(details?.phone && customers(data).some(c=>c.phone===details.phone && c.key!==previous?.key))
    throw Error('A customer already uses this mobile number. Open that customer in the ledger.');
  const recordId=known?.id || (previous && validId(previous.key)?previous.key:id());
  if(known)contacts.splice(contacts.indexOf(known),1);
  if(details)contacts.push({...details,id:recordId});
  for(const sale of previous?.sales || []) {
    const record=data.sales.find(s=>s.id===sale.id);
    if(details) Object.assign(record,details,{customerKey:recordId});
    else Object.assign(record,{name:'Personal details removed',phone:'',address:'',addressParts:undefined,customerKey:null,customerRemoved:true});
  }
}
function contactForm(key) {
  const previous=customers().find(c=>c.key===key);
  const c=previous||{};
  dialog('<div class="title"><h2>'+ (previous?'Edit customer':'New Customer')+'</h2>'+closeBtn+'</div><form id="contactEditor">'+
    field('name','Name',c.name,'required maxlength="100"')+field('phone','Mobile (optional)',c.phone,'pattern="[0-9]{10}" inputmode="numeric"','tel')+
    billAddressFields({...c,...c.addressParts})+(previous?.sales.length?'<p>This will update the customer details on '+bn(previous.sales.length)+' invoices.</p>':'')+
    '<button class="primary">Save</button></form>');
  bindPinLookup($('#contactEditor'));
  $('#contactEditor').onsubmit=e=>{
    e.preventDefault();
    submit(e.target,async f=>{
      const details={name:required(f,'name'),phone:f.get('phone').trim(),address:f.get('address').trim(),addressParts:readAddress(f)};
      await change(data=>updateContact(data,previous,details));
      finishManagement();
    });
  };
}
async function removeContact(key) {
  const c=customers().find(entry=>entry.key===key);
  if(!c || !confirm('Remove '+c.name+'’s name, mobile number and address from the ledger and '+bn(c.sales.length)+' linked invoices? Invoice totals and balances will be retained.'))return;
  try {
    await change(data=>updateContact(data,c,null));
    if(draft.customerKey===key || (c.phone && draft.phone===c.phone) || (correction && c.sales.some(s=>s.id===correction.original.id)))draft={};
    finishManagement();
  } catch(error){alert(error.message)}
}

const postalCache = new Map([['743442', [
  'Bamanibad','Bermajur','Boyermari','Choto Sehara','Dakshin Akratola','Dheknamari',
  'Ghatihara','Ghoshpara','Jhopkhali','Kalinagar Hat','Kanmari','Kharihatabad',
  'Mathbari Abad','Nalkora','Nazat Hatkhola','Nityaberia','Purba Sankardaha','South Sikargheri'
].map(postOffice=>({postOffice,district:'North 24 Parganas',region:'West Bengal'}))]]);

async function postalMatches(pin, signal) {
  if(postalCache.has(pin)) return postalCache.get(pin);
  const response=await fetch('https://api.pincodeapi.in/api/v1/pincode/'+pin,{signal,credentials:'omit',referrerPolicy:'no-referrer'});
  if(response.status===404) return [];
  if(!response.ok) throw Error('Postal directory unavailable');
  const payload=await response.json();
  if(!payload.success || String(payload.data?.pincode)!==pin || !Array.isArray(payload.data.post_offices)) throw Error('Invalid postal response');
  const rows=payload.data.post_offices.map(row=>({postOffice:row.office_name,district:row.district,region:row.state}))
    .filter(row=>Object.values(row).every(value=>typeof value==='string' && value.trim()));
  const matches=rows.filter(row=>row.region.trim().toLowerCase()==='west bengal');
  for(const row of matches) row.region='West Bengal';
  if(matches.length) postalCache.set(pin,matches);
  return matches;
}
function bindPinLookup(form) {
  const fields=form.elements, pin=fields.pin;
  const status=form.querySelector('[data-pin-status]'), choice=form.querySelector('[data-pin-choice]');
  const select=choice.querySelector('select');
  let sequence=0, controller, matches=[];
  const names=['postOffice','district','region'];
  const autoValues={};
  function fill(name,value) {
    fields[name].value=value;
    autoValues[name]=value;
    fields[name].dispatchEvent(new Event('input',{bubbles:true}));
  }
  select.onchange=()=>{
    if(select.value==='') return;
    const row=matches[Number(select.value)];
    names.forEach(name=>fill(name,row[name]));
    status.textContent='Postal address filled. Check the details before saving.';
  };
  pin.addEventListener('input',async ()=>{
    const serial=++sequence;
    controller?.abort();
    pin.value=pin.value.replace(/[\u09e6-\u09ef]/g,c=>String(c.charCodeAt(0)-0x09e6));
    const code=pin.value;
    matches=[]; choice.hidden=true; status.textContent='';
    for(const name of names) {
      if(autoValues[name] && fields[name].value===autoValues[name]) fill(name,'');
    }
    if(!/^[1-9]\d{5}$/.test(code)) return;
    controller=new AbortController();
    const request=controller, timeout=setTimeout(()=>request.abort(),8000);
    const before=Object.fromEntries(names.map(n=>[n,fields[n].value]));
    status.textContent='Looking up PIN code…';
    try {
      const rows=await postalMatches(code,request.signal);
      if(serial!==sequence || !form.isConnected) return;
      if(!rows.length){status.textContent='No West Bengal post office found for this PIN.';return}
      matches=rows;
      for(const name of names) {
        if(rows.every(row=>row[name]===rows[0][name]) && fields[name].value===before[name] && !fields[name].value) fill(name,rows[0][name]);
      }
      if(rows.length>1 || names.some(n=>fields[n].value!==rows[0][n])) {
        select.replaceChildren(new Option('Select a post office',''),...rows.map((row,i)=>new Option(row.postOffice+' · '+row.district,String(i))));
        choice.hidden=false;
        status.textContent='Choose the correct post office or enter the address manually.';
      } else status.textContent='Postal address filled. Check the details before saving.';
    } catch {
      if(serial===sequence && form.isConnected) status.textContent='Lookup unavailable. You can enter the address manually.';
    } finally {clearTimeout(timeout)}
  });
}

