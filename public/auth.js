'use strict';
// Keep the session in this tab across reloads. Never store the password.
let accessToken = '';
let revision = 0;
let saving = false;
let currentSession = null;
let refreshing = null;
const sessionKey = 'tarafdar-admin:' + shopBackend.url;
const loginForm = document.getElementById('loginForm');
const loginStatus = document.getElementById('loginStatus');
const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(shopBackend.url)
  && shopBackend.publishableKey.startsWith('sb_publishable_');

function remember(session) {
  if (!session.access_token || !session.refresh_token) throw Error('Session unavailable.');
  const next = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at || Math.floor(Date.now()/1000) + session.expires_in
  };
  sessionStorage.setItem(sessionKey, JSON.stringify(next));
  currentSession = next;
  accessToken = next.access_token;
}

function forget() {
  sessionStorage.removeItem(sessionKey);
  currentSession = null;
  accessToken = '';
}

async function refreshSession() {
  const previous = currentSession;
  const response = await fetch(shopBackend.url + '/auth/v1/token?grant_type=refresh_token', {
    method: 'POST', headers: {apikey: shopBackend.publishableKey, 'Content-Type': 'application/json'},
    body: JSON.stringify({refresh_token: previous.refresh_token}), cache: 'no-store', redirect: 'error'
  });
  if (currentSession !== previous) throw Error('Session changed.');
  if (!response.ok) {
    if ([400,401,403].includes(response.status)) {
      forget();
      location.reload();
    }
    throw Error('Could not renew your session. Check your connection.');
  }
  const session = await response.json();
  if (currentSession === previous) remember(session);
}
async function request(path, options = {}) {
  if (path.startsWith('/rest/') && currentSession && currentSession.expires_at * 1000 <= Date.now()+60000) {
    if (!refreshing) refreshing = refreshSession().finally(() => { refreshing = null; });
    await refreshing;
  }
  const headers = { apikey: shopBackend.publishableKey, ...options.headers };
  if (accessToken) headers.Authorization = 'Bearer ' + accessToken;
  if (options.body) headers['Content-Type'] = 'application/json';
  const response = await fetch(shopBackend.url + path, {
    ...options, headers, cache: 'no-store', credentials: 'omit', redirect: 'error'
  });
  if (response.status === 401 && path.startsWith('/rest/')) { forget(); location.reload(); }
  if (!response.ok) throw Error('Request failed. Check your connection and account permissions.');
  return response;
}
const rowPath = '/rest/v1/tarafdar_shop?id=eq.1';
async function readShop() {
  const response = await request(rowPath + '&select=ledger,revision');
  const rows = await response.json();
  if (rows.length !== 1) throw Error('This account cannot access the shop.');
  const record = rows[0];
  if (record.ledger !== null && !validData(record.ledger)) throw Error('Could not load the ledger.');
  state = record.ledger ?? start();
  revision = record.revision;
}
async function change(update) {
  if (!accessToken || saving) throw Error('Please wait for the current operation to finish.');
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
      alert('The save could not be confirmed. Sign in again and check your latest invoice.');
      location.reload();
      throw Error('Reopen the ledger.');
    }
    if (rows.length !== 1) {
      await readShop();
      render();
      throw Error('The ledger changed on another device. Review the latest ledger and save again.');
    }
    state = next;
    revision = rows[0].revision;
  } finally {
    saving = false;
  }
}
async function showShop() {
  await readShop();
  render();
  loginForm.reset();
  loginStatus.textContent = '';
  document.getElementById('gate').hidden = true;
  document.getElementById('layout').hidden = false;
}
loginForm.onsubmit = async event => {
  event.preventDefault();
  const button = loginForm.querySelector('button');
  button.disabled = true;
  loginStatus.textContent = 'Signing in…';
  try {
    const fields = new FormData(loginForm);
    const response = await request('/auth/v1/token?grant_type=password', {
      method: 'POST', body: JSON.stringify({ email: fields.get('email').trim(), password: fields.get('password') })
    });
    const session = await response.json();
    remember(session);
    await showShop();
  } catch (error) {
    forget();
    loginStatus.textContent = error.message + ' Check your email and password.';
  } finally {
    button.disabled = false;
  }
};
document.getElementById('logout').onclick = async () => {
  if (saving) return notify('Saving the ledger. Please wait.');
  document.getElementById('modal').close();
  document.getElementById('layout').hidden = true;
  document.getElementById('paper').replaceChildren();
  const token = accessToken;
  forget();
  try { await request('/auth/v1/logout?scope=local', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(5000) }); }
  finally { location.reload(); }
};
if (!configured) {
  loginForm.querySelector('button').disabled = true;
  loginStatus.textContent = 'Setup required. Add your Supabase project URL and publishable key to config.js.';
}
if (configured) restoreLogin();
async function restoreLogin() {
  const button = loginForm.querySelector('button');
  button.disabled = true;
  try {
    const saved = sessionStorage.getItem(sessionKey);
    if (!saved) return;
    remember(JSON.parse(saved));
    loginStatus.textContent = 'Restoring your session…';
    await showShop();
  } catch (error) {
    loginStatus.textContent = 'Could not open the ledger. Check your connection, refresh or sign in again.';
  } finally {
    button.disabled = false;
  }
}
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });

