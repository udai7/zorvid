// Dashboard logic: auth, drag-drop upload, live progress polling, hls.js playback.
const API = "/api";
const $ = (sel) => document.querySelector(sel);

let token = localStorage.getItem("vp_token") || null;
let pollTimer = null;
let hls = null;

// ---- Auth ----------------------------------------------------------------
function setAuthed(authed) {
  $("#auth").hidden = authed;
  $("#app").hidden = !authed;
  const status = $("#auth-status");
  status.innerHTML = authed ? `signed in <button id="logout">log out</button>` : "";
  if (authed) {
    $("#logout").onclick = logout;
    startPolling();
  } else if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function logout() {
  token = null;
  localStorage.removeItem("vp_token");
  $("#cards").innerHTML = "";
  setAuthed(false);
}

$("#auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const action = e.submitter?.dataset.action || "login";
  const email = $("#email").value.trim();
  const password = $("#password").value;
  $("#auth-error").textContent = "";
  try {
    const res = await fetch(`${API}/auth/${action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `${action} failed`);
    token = data.token;
    localStorage.setItem("vp_token", token);
    setAuthed(true);
  } catch (err) {
    $("#auth-error").textContent = err.message;
  }
});

// Authenticated fetch helper.
function authFetch(path, opts = {}) {
  return fetch(`${API}${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), authorization: `Bearer ${token}` },
  });
}

// ---- Upload (drag-drop + click) -----------------------------------------
const dz = $("#dropzone");
const fileInput = $("#file-input");
dz.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => fileInput.files[0] && upload(fileInput.files[0]));
["dragover", "dragenter"].forEach((ev) =>
  dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("dragover"); })
);
["dragleave", "drop"].forEach((ev) =>
  dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("dragover"); })
);
dz.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) upload(file);
});

async function upload(file) {
  const form = new FormData();
  form.append("title", file.name);
  form.append("file", file);
  const res = await authFetch("/videos", { method: "POST", body: form });
  if (res.status === 401) return logout();
  await refresh();
}

// ---- Polling + rendering -------------------------------------------------
function startPolling() {
  refresh();
  pollTimer = setInterval(refresh, 1000);
}

async function refresh() {
  const res = await authFetch("/videos");
  if (res.status === 401) return logout();
  const { videos } = await res.json();
  render(videos);
}

const TERMINAL = new Set(["completed", "failed"]);

function render(videos) {
  const cards = $("#cards");
  if (!videos.length) {
    cards.innerHTML = `<p style="color:var(--muted)">No videos yet — upload one above.</p>`;
    return;
  }
  cards.innerHTML = videos.map(cardHtml).join("");
  videos.forEach((v) => {
    cards.querySelector(`[data-play="${v.id}"]`)?.addEventListener("click", () => play(v));
    cards.querySelector(`[data-del="${v.id}"]`)?.addEventListener("click", () => del(v.id));
    cards.querySelector(`[data-vis="${v.id}"]`)?.addEventListener("click", () => toggleVis(v));
  });
}

function cardHtml(v) {
  const progress = v.progress ?? 0;
  const done = v.status === "completed";
  const failed = v.status === "failed";
  return `
    <div class="video-card">
      <div class="row">
        <h3>${escapeHtml(v.title || v.original_filename)}</h3>
        <span class="badge ${v.status}">${v.status}</span>
      </div>
      <div class="progress"><span style="width:${progress}%"></span></div>
      <div class="stage">${failed ? "" : `${v.stage || "queued"} · ${progress}%`}</div>
      ${failed && v.error_message ? `<div class="errmsg">${escapeHtml(v.error_message)}</div>` : ""}
      <div class="actions">
        ${done ? `<button data-play="${v.id}">▶ Play</button>` : ""}
        ${done ? `<button class="btn-secondary" data-vis="${v.id}">${v.visibility === "public" ? "Make private" : "Make public"}</button>` : ""}
        <button class="btn-danger" data-del="${v.id}">Delete</button>
      </div>
    </div>`;
}

async function del(id) {
  await authFetch(`/videos/${id}`, { method: "DELETE" });
  refresh();
}

async function toggleVis(v) {
  const visibility = v.visibility === "public" ? "private" : "public";
  await authFetch(`/videos/${v.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ visibility }),
  });
  refresh();
}

// ---- Playback (hls.js) ---------------------------------------------------
async function play(v) {
  const res = await authFetch(`/videos/${v.id}/stream`);
  if (!res.ok) return;
  const { url, token: streamToken } = await res.json();

  const modal = $("#player-modal");
  const video = $("#player");
  $("#player-title").textContent = v.title || v.original_filename;
  $("#player-meta").textContent = v.metadata ? JSON.stringify(v.metadata, null, 2) : "";
  modal.hidden = false;

  if (hls) { hls.destroy(); hls = null; }

  // Private streams need the short-lived token on every (nested) request.
  const xhrSetup = streamToken
    ? (xhr) => xhr.setRequestHeader("authorization", `Bearer ${streamToken}`)
    : undefined;

  if (window.Hls && window.Hls.isSupported()) {
    hls = new window.Hls({ xhrSetup });
    hls.loadSource(url);
    hls.attachMedia(video);
  } else {
    // Safari: native HLS (only works for public URLs without custom headers).
    video.src = url;
  }
}

function closePlayer() {
  $("#player-modal").hidden = true;
  $("#player").pause();
  if (hls) { hls.destroy(); hls = null; }
}
$("#player-close").addEventListener("click", closePlayer);
$("#player-modal").addEventListener("click", (e) => {
  if (e.target.id === "player-modal") closePlayer();
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

// ---- Boot ----------------------------------------------------------------
setAuthed(!!token);
