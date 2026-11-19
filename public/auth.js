'use strict';
// Sessions are held only in memory. Reloading the page requires a new login.
let accessToken = '';
let revision = 0;
let saving = false;
let expiryTimer;
const loginForm = document.getElementById('loginForm');
const loginStatus = document.getElementById('loginStatus');
const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(shopBackend.url)
  && shopBackend.publishableKey.startsWith('sb_publishable_');

async function request(path, options = {}) {
  const headers = { apikey: shopBackend.publishableKey, ...options.headers };
  if (accessToken) headers.Authorization = 'Bearer ' + accessToken;
  if (options.body) headers['Content-Type'] = 'application/json';
  const response = await fetch(shopBackend.url + path, {
    ...options, headers, cache: 'no-store', credentials: 'omit', redirect: 'error'
  });
  if (response.status === 401 && accessToken) location.reload();
  if (!response.ok) throw Error('অনুরোধ সফল হয়নি। সংযোগ এবং অ্যাকাউন্টের অনুমতি পরীক্ষা করুন।');
  return response;
}
const rowPath = '/rest/v1/tarafdar_shop?id=eq.1';
async function readShop() {
  const response = await request(rowPath + '&select=ledger,revision');
  const rows = await response.json();
  if (rows.length !== 1) throw Error('এই অ্যাকাউন্টে দোকান পরিচালনার অনুমতি নেই।');
  const record = rows[0];
  if (record.ledger !== null && !validData(record.ledger)) throw Error('হিসাব লোড করা যায়নি।');
  state = record.ledger ?? start();
  revision = record.revision;
}
async function change(update) {
  if (!accessToken || saving) throw Error('আগের কাজটি শেষ হওয়া পর্যন্ত অপেক্ষা করুন।');
  saving = true;
  try {
    const next = structuredClone(state);
    update(next);
    let rows;
    try {
      const response = await request(rowPath + '&revision=eq.' + revision + '&select=revision', {
        method: 'PATCH', headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ ledger: next, revision: revision + 1 })
      });
      rows = await response.json();
    } catch {
      alert('সংরক্ষণের ফল নিশ্চিত হয়নি। আবার লগইন করে সর্বশেষ বিল মিলিয়ে দেখুন।');
      location.reload();
      throw Error('হিসাব পুনরায় খুলুন।');
    }
    if (rows.length !== 1) {
      await readShop();
      render();
      throw Error('অন্য ডিভাইসে হিসাব বদলেছে। সর্বশেষ হিসাব দেখে আবার সংরক্ষণ করুন।');
    }
    state = next;
    revision = rows[0].revision;
  } finally {
    saving = false;
  }
}
loginForm.onsubmit = async event => {
  event.preventDefault();
  const button = loginForm.querySelector('button');
  button.disabled = true;
  loginStatus.textContent = 'লগইন হচ্ছে…';
  try {
    const fields = new FormData(loginForm);
    const response = await request('/auth/v1/token?grant_type=password', {
      method: 'POST', body: JSON.stringify({ email: fields.get('email').trim(), password: fields.get('password') })
    });
    const session = await response.json();
    accessToken = session.access_token;
    await readShop();
    render();
    loginForm.reset();
    document.getElementById('gate').hidden = true;
    document.getElementById('layout').hidden = false;
    expiryTimer = setTimeout(() => location.reload(), session.expires_in * 1000);
  } catch (error) {
    accessToken = '';
    loginStatus.textContent = error.message + ' ইমেল ও পাসওয়ার্ড যাচাই করুন।';
  } finally {
    button.disabled = false;
  }
};
document.getElementById('logout').onclick = async () => {
  if (saving) return notify('হিসাব সংরক্ষণ হচ্ছে। একটু অপেক্ষা করুন।');
  document.getElementById('modal').close();
  document.getElementById('layout').hidden = true;
  document.getElementById('paper').replaceChildren();
  try { await request('/auth/v1/logout?scope=local', { method: 'POST', signal: AbortSignal.timeout(5000) }); }
  finally { clearTimeout(expiryTimer); location.reload(); }
};
if (!configured) {
  loginForm.querySelector('button').disabled = true;
  loginStatus.textContent = 'প্রথম সেটআপ বাকি। config.js-এ Supabase Project URL ও Publishable key দিন।';
}
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
