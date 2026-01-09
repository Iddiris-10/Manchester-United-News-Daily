const STORAGE_KEY = "mu_daily_blog_posts";
const TEAM = "Manchester United";
const AUTH_KEY = "mu_author_auth";
const PASSWORD_KEY = "mu_author_pw_hash";
const AUTHOR_NAME_KEY = "mu_author_name";

const searchInput = document.getElementById("search");
const datePicker = document.getElementById("datePicker");
const postForm = document.getElementById("postForm");
const titleInput = document.getElementById("title");
const categorySelect = document.getElementById("category");
const contentInput = document.getElementById("content");
const postsHeading = document.getElementById("postsHeading");
const postsList = document.getElementById("postsList");
const countEl = document.getElementById("count");
const authModal = document.getElementById("authModal");
const authBtn = document.getElementById("authBtn");
const changeBtn = document.getElementById("changeBtn");
const authStatus = document.getElementById("authStatus");
const authForm = document.getElementById("authForm");
const authPassword = document.getElementById("authPassword");
const authCancel = document.getElementById("authCancel");
const authError = document.getElementById("authError");
const changeModal = document.getElementById("changeModal");
const changeForm = document.getElementById("changeForm");
const changeCancel = document.getElementById("changeCancel");
const changeError = document.getElementById("changeError");
const loginNotice = document.getElementById("loginNotice");
const authBtnSmall = document.getElementById("authBtnSmall");
const publishWrapper = document.getElementById("publishWrapper");

const todayStr = () => new Date().toISOString().slice(0, 10);
const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function loadPosts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function setDatePickerDefaults() {
  datePicker.value = todayStr();
  datePicker.max = todayStr();
}

function postCard(p) {
  const el = document.createElement("article");
  el.className = "post";

  const header = document.createElement("div");
  header.className = "post-header";

  const badge = document.createElement("span");
  badge.className = `badge ${p.category}`;
  badge.textContent = p.category;

  const actions = document.createElement("div");
  actions.className = "post-actions";

  if (isAuth()) {
    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => deletePost(p.id));
    actions.appendChild(delBtn);
  }
  header.appendChild(badge);
  header.appendChild(actions);

  const title = document.createElement("h3");
  title.className = "post-title";
  title.textContent = p.title;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `${p.author ? p.author + ' • ' : ''}${TEAM} • ${p.date} • ${formatTime(p.createdAt)}`;

  const body = document.createElement("p");
  body.textContent = p.content;

  el.appendChild(header);
  el.appendChild(title);
  el.appendChild(meta);
  el.appendChild(body);
  return el;
}

function render() {
  const posts = loadPosts();
  const q = (searchInput.value || "").toLowerCase().trim();
  const date = datePicker.value || todayStr();
  const filtered = posts
    .filter(p => p.date === date)
    .filter(p => !q || `${p.title} ${p.content} ${p.category}`.toLowerCase().includes(q))
    .sort((a, b) => b.createdAt - a.createdAt);

  postsHeading.textContent = `Posts for ${date}`;
  countEl.textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;
  postsList.innerHTML = "";
  filtered.forEach(p => postsList.appendChild(postCard(p)));
}

function deletePost(id) {
  const posts = loadPosts().filter(p => p.id !== id);
  savePosts(posts);
  render();
}

function addPost({ title, category, content }) {
  const posts = loadPosts();
  const now = Date.now();
  const date = datePicker.value || todayStr();
  posts.push({ id: now, title, category, content, date, createdAt: now, author: getAuthorName() });
  savePosts(posts);
}

postForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const category = categorySelect.value;
  if (!title || !content) return;
  if (!isAuth()) {
    alert('You must be logged in as the author to publish posts.');
    return;
  }
  addPost({ title, category, content });
  titleInput.value = "";
  contentInput.value = "";
  categorySelect.value = "News";
  render();
});

searchInput.addEventListener("input", render);
datePicker.addEventListener("change", render);

function seedIfEmpty() {
  const posts = loadPosts();
  if (posts.length) return;
  const d = todayStr();
  const samples = [
    {
      title: "BREAKING: Ruben Amorim sacked after 1-1 draw to leeds",
      category: "News",
      content: "Manchester United have parted company with manager Ruben Amorim following Sunday’s 1-1 Premier League draw with leeds. The. Under 18's coach Darren Fletcher will take charge.",
      date: d,
      createdAt: Date.now() - 1000 * 60 * 60
    },
    {
      title: "Match report: leeds 1-1 United – Cunha's equalizer wasnot enough to save Amorim",
      category: "Match",
      content: "A Cunha leveller was not enough to save Amorim following another disappointing darw in the  league.",
      date: d,
      createdAt: Date.now() - 1000 * 60 * 30
    },
    {
      title: "Training focus ahead of weekend fixture",
      category: "Training",
      content: "High-intensity drills and set-piece routines as the team prepares for the upcoming match.",
      date: d,
      createdAt: Date.now() - 1000 * 60 * 60
    }
  ];
  savePosts(samples.map(s => ({ id: s.createdAt, ...s })));
}

function getAuthorName() { return localStorage.getItem(AUTHOR_NAME_KEY) || 'Author'; }

async function sha256hex(msg) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(msg));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function ensureDefaultPassword() {
  if (!localStorage.getItem(PASSWORD_KEY)) {
    const h = await sha256hex('admin123');
    localStorage.setItem(PASSWORD_KEY, h);
  }
  if (!localStorage.getItem(AUTHOR_NAME_KEY)) localStorage.setItem(AUTHOR_NAME_KEY, 'Author');
}

async function checkPassword(pw) {
  const stored = localStorage.getItem(PASSWORD_KEY);
  if (!stored) return false;
  const h = await sha256hex(pw);
  return h === stored;
}

async function setPassword(newPw) {
  const h = await sha256hex(newPw);
  localStorage.setItem(PASSWORD_KEY, h);
}

function isAuth() {
  return localStorage.getItem(AUTH_KEY) === "1";
}

function setAuth(val) {
  if (val) localStorage.setItem(AUTH_KEY, "1");
  else localStorage.removeItem(AUTH_KEY);
  updateAuthUI();
}

function updateAuthUI() {
  if (!authBtn) return;
  authBtn.textContent = isAuth() ? "Logout" : "Author Login";
  if (changeBtn) changeBtn.classList.toggle('hidden', !isAuth());
  if (authStatus) {
    if (isAuth()) { authStatus.classList.remove('hidden'); authStatus.textContent = `Logged in as ${getAuthorName()}`; }
    else authStatus.classList.add('hidden');
  }
  const publishBtn = postForm.querySelector('button[type=submit]');
  if (publishBtn) {
    publishBtn.disabled = !isAuth();
    publishBtn.classList.toggle('disabled', !isAuth());
  }
  if (publishWrapper) publishWrapper.classList.toggle('hidden', !isAuth());
  if (loginNotice) loginNotice.classList.toggle('hidden', isAuth());
}

if (authBtn) {
  authBtn.addEventListener('click', () => {
    if (isAuth()) return setAuth(false);
    if (!authModal) return alert('Auth modal not available');
    authModal.classList.remove('hidden');
    authPassword.value = '';
    authError.textContent = '';
    authPassword.focus();
  });
}
if (authCancel) {
  authCancel.addEventListener('click', () => authModal.classList.add('hidden'));
}
if (authBtnSmall) {
  authBtnSmall.addEventListener('click', () => {
    if (!authModal) return alert('Auth modal not available');
    authModal.classList.remove('hidden');
    authPassword.value = '';
    authError.textContent = '';
    authPassword.focus();
  });
}
if (authForm) {
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = authPassword.value || '';
    if (await checkPassword(v)) {
      setAuth(true);
      authModal.classList.add('hidden');
    } else {
      authError.textContent = 'Invalid password';
    }
  });
}

if (changeBtn) {
  changeBtn.addEventListener('click', () => {
    if (!changeModal) return alert('Change password modal not available');
    changeModal.classList.remove('hidden');
    document.getElementById('currentPw').value = '';
    document.getElementById('newPw').value = '';
    document.getElementById('confirmPw').value = '';
    changeError.textContent = '';
    document.getElementById('currentPw').focus();
  });
}
if (changeCancel) {
  changeCancel.addEventListener('click', () => changeModal.classList.add('hidden'));
}
if (changeForm) {
  changeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cur = document.getElementById('currentPw').value || '';
    const nw = document.getElementById('newPw').value || '';
    const conf = document.getElementById('confirmPw').value || '';
    if (!await checkPassword(cur)) {
      changeError.textContent = 'Current password invalid';
      return;
    }
    if (nw.length < 4) {
      changeError.textContent = 'New password too short';
      return;
    }
    if (nw !== conf) {
      changeError.textContent = 'Passwords do not match';
      return;
    }
    await setPassword(nw);
    changeModal.classList.add('hidden');
    alert('Password changed');
  });
}

// initialization: ensure we have a stored password hash before using auth
(async function init() {
  await ensureDefaultPassword();
  setDatePickerDefaults();
  seedIfEmpty();
  updateAuthUI();
  render();
})();