import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { ADMIN_EMAIL, firebaseConfig } from "/firebase-config.js";

const loginPanel = document.querySelector("#loginPanel");
const dashboard = document.querySelector("#editorPanel");
const postEditor = document.querySelector("#postEditorPanel");
const preparedPosts = document.querySelector("#preparedPosts");
const authStatus = document.querySelector("#authStatus");
const publishStatus = document.querySelector("#publishStatus");
const form = document.querySelector("#postForm");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });
let drafts = [];
let currentPost = null;
let databasePermissionBlocked = false;

function setStatus(node, message, kind = "") { node.textContent = message; node.className = `status ${kind}`.trim(); }
function showDashboard() { dashboard.classList.remove("hidden"); postEditor.classList.add("hidden"); }
function showPreview(id, url) { const image = document.querySelector(id); if (url) image.src = url; else image.removeAttribute("src"); }
function watchPreview(inputId, imageId) { document.querySelector(inputId).addEventListener("change", (event) => { if (event.target.files[0]) showPreview(imageId, URL.createObjectURL(event.target.files[0])); }); }
watchPreview("#landscapeImage", "#landscapePreview");
watchPreview("#portraitImage", "#portraitPreview");

async function getSavedPost(slug) {
  try {
    return await getDoc(doc(db, "posts", slug));
  } catch (error) {
    if (error.code === "permission-denied") {
      databasePermissionBlocked = true;
      return null;
    }
    throw error;
  }
}

function permissionMessage() {
  return "Prepared posts are available, but Firestore publishing permissions are not active yet. Deploy the repository Firestore rules before publishing.";
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(image.src); resolve(image); };
    image.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
    image.src = URL.createObjectURL(file);
  });
}

async function optimizeImage(file, width, height, maximumBytes = 290000) {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#07101d";
  context.fillRect(0, 0, width, height);
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = Math.round(image.naturalWidth * scale);
  const drawHeight = Math.round(image.naturalHeight * scale);
  context.drawImage(image, Math.round((width - drawWidth) / 2), Math.round((height - drawHeight) / 2), drawWidth, drawHeight);
  for (const quality of [0.88, 0.8, 0.72, 0.64, 0.56]) {
    const dataUrl = canvas.toDataURL("image/webp", quality);
    const bytes = Math.ceil((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
    if (bytes <= maximumBytes) return dataUrl;
  }
  throw new Error(`${file.name} could not be compressed below the safe publishing size. Please use a simpler or smaller image.`);
}

async function loadPreparedPosts() {
  preparedPosts.innerHTML = "<p>Loading prepared posts…</p>";
  const response = await fetch("/admin/prepared-posts.json", { cache: "no-store" });
  drafts = await response.json();
  preparedPosts.innerHTML = "";
  databasePermissionBlocked = false;
  if (!drafts.length) { preparedPosts.innerHTML = "<p>No prepared posts are waiting. Ask ChatGPT to create the next post.</p>"; return; }
  for (const draft of drafts) {
    const saved = await getSavedPost(draft.slug);
    const state = saved?.exists() ? saved.data().status : "prepared";
    const card = document.createElement("article");
    card.className = "prepared-post";
    card.innerHTML = `<div><h2></h2><p></p><span class="prepared-badge"></span></div><button class="btn" type="button">Edit & add images</button>`;
    card.querySelector("h2").textContent = draft.title;
    card.querySelector("p").textContent = draft.excerpt;
    card.querySelector(".prepared-badge").textContent = state;
    card.querySelector("button").addEventListener("click", () => editPreparedPost(draft));
    preparedPosts.append(card);
  }
  if (databasePermissionBlocked) {
    const notice = document.createElement("p");
    notice.className = "status error permissions-notice";
    notice.textContent = permissionMessage();
    preparedPosts.prepend(notice);
  }
}

async function editPreparedPost(draft) {
  const saved = await getSavedPost(draft.slug);
  currentPost = { ...draft, ...(saved?.exists() ? saved.data() : {}) };
  form.title.value = currentPost.title || ""; form.slug.value = draft.slug; form.excerpt.value = currentPost.excerpt || ""; form.content.value = currentPost.content || ""; form.status.value = currentPost.status || "draft";
  form.landscapeImage.value = ""; form.portraitImage.value = "";
  showPreview("#landscapePreview", currentPost.landscapeUrl); showPreview("#portraitPreview", currentPost.portraitUrl);
  document.querySelector("#editorTitle").textContent = currentPost.title;
  dashboard.classList.add("hidden"); postEditor.classList.remove("hidden");
  setStatus(publishStatus, databasePermissionBlocked ? permissionMessage() : "Review the prepared content and add or replace both images.", databasePermissionBlocked ? "error" : "");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelector("#googleLogin").addEventListener("click", async () => { try { const result = await signInWithPopup(auth, provider); if (result.user.email?.toLowerCase() !== ADMIN_EMAIL) { await signOut(auth); throw new Error("This Google account is not authorised."); } } catch (error) { setStatus(authStatus, error.message, "error"); } });
document.querySelector("#logout").addEventListener("click", () => signOut(auth));
document.querySelector("#backToPosts").addEventListener("click", showDashboard);

onAuthStateChanged(auth, async (user) => {
  const allowed = user?.email?.toLowerCase() === ADMIN_EMAIL && user.emailVerified;
  if (user && !allowed) await signOut(auth);
  loginPanel.classList.toggle("hidden", allowed); dashboard.classList.toggle("hidden", !allowed); postEditor.classList.add("hidden");
  if (allowed) { try { await loadPreparedPosts(); } catch (error) { preparedPosts.textContent = `Unable to load prepared posts: ${error.message}`; } }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault(); if (!currentPost) return;
  const landscape = form.landscapeImage.files[0]; const portrait = form.portraitImage.files[0];
  if ([landscape, portrait].filter(Boolean).some((file) => file.size > 5 * 1024 * 1024)) return setStatus(publishStatus, "Each image must be smaller than 5 MB.", "error");
  if ((!landscape && !currentPost.landscapeUrl) || (!portrait && !currentPost.portraitUrl)) return setStatus(publishStatus, "Please add both the 16:9 and 9:16 images before publishing.", "error");
  try {
    setStatus(publishStatus, "Optimising images and saving the post…");
    let landscapeUrl = currentPost.landscapeUrl; let portraitUrl = currentPost.portraitUrl;
    if (landscape) landscapeUrl = await optimizeImage(landscape, 1600, 900);
    if (portrait) portraitUrl = await optimizeImage(portrait, 900, 1600);
    const combinedImageCharacters = (landscapeUrl?.length || 0) + (portraitUrl?.length || 0);
    if (combinedImageCharacters > 820000) throw new Error("The two optimised images are still too large to publish safely. Please select simpler images.");
    await setDoc(doc(db, "posts", currentPost.slug), { title: form.title.value.trim(), slug: currentPost.slug, excerpt: form.excerpt.value.trim(), content: form.content.value.trim(), status: form.status.value, landscapeUrl, portraitUrl, preparedBy: currentPost.preparedBy || "ChatGPT", authorEmail: auth.currentUser.email, publishedAt: currentPost.publishedAt || serverTimestamp(), updatedAt: serverTimestamp() });
    currentPost = { ...currentPost, landscapeUrl, portraitUrl, status: form.status.value };
    setStatus(publishStatus, "Changes saved successfully. The post is available in the Posts section.", "success");
    await loadPreparedPosts();
  } catch (error) {
    const message = error.code === "permission-denied" ? permissionMessage() : error.message;
    setStatus(publishStatus, message, "error");
  }
});
