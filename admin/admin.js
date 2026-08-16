import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, getDownloadURL, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { ADMIN_EMAIL, firebaseConfig } from "/firebase-config.js";

const configured = !Object.values(firebaseConfig).some((value) => String(value).startsWith("REPLACE_WITH_"));
const loginPanel = document.querySelector("#loginPanel");
const editorPanel = document.querySelector("#editorPanel");
const authStatus = document.querySelector("#authStatus");
const publishStatus = document.querySelector("#publishStatus");
const form = document.querySelector("#postForm");
let auth;
let db;
let storage;

function setStatus(node, message, kind = "") {
  node.textContent = message;
  node.className = `status ${kind}`.trim();
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function preview(input, image) {
  input.addEventListener("change", () => {
    if (input.files[0]) image.src = URL.createObjectURL(input.files[0]);
  });
}

preview(document.querySelector("#landscapeImage"), document.querySelector("#landscapePreview"));
preview(document.querySelector("#portraitImage"), document.querySelector("#portraitPreview"));
document.querySelector("#title").addEventListener("input", (event) => {
  const slug = document.querySelector("#slug");
  if (!slug.dataset.edited) slug.value = slugify(event.target.value);
});
document.querySelector("#slug").addEventListener("input", (event) => { event.target.dataset.edited = "true"; });

if (!configured) {
  document.querySelector("#googleLogin").disabled = true;
  setStatus(authStatus, "Firebase setup is required before Google login can be used. Add the Web app values to firebase-config.js.", "error");
} else {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  document.querySelector("#googleLogin").addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user.email?.toLowerCase() !== ADMIN_EMAIL) {
        await signOut(auth);
        throw new Error("This Google account is not authorised.");
      }
    } catch (error) {
      setStatus(authStatus, error.message, "error");
    }
  });

  document.querySelector("#logout").addEventListener("click", () => signOut(auth));
  onAuthStateChanged(auth, async (user) => {
    const allowed = user?.email?.toLowerCase() === ADMIN_EMAIL && user.emailVerified;
    if (user && !allowed) await signOut(auth);
    loginPanel.classList.toggle("hidden", allowed);
    editorPanel.classList.toggle("hidden", !allowed);
    if (allowed) document.querySelector("#signedInAs").textContent = `Signed in as ${user.email}`;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const landscape = form.landscapeImage.files[0];
    const portrait = form.portraitImage.files[0];
    const slug = slugify(form.slug.value);
    if (!landscape || !portrait) return setStatus(publishStatus, "Both image versions are required.", "error");
    if ([landscape, portrait].some((file) => file.size > 5 * 1024 * 1024)) return setStatus(publishStatus, "Each image must be smaller than 5 MB.", "error");
    try {
      setStatus(publishStatus, "Uploading images…");
      const landscapeRef = ref(storage, `posts/${slug}/landscape-${Date.now()}-${landscape.name}`);
      const portraitRef = ref(storage, `posts/${slug}/portrait-${Date.now()}-${portrait.name}`);
      await Promise.all([uploadBytes(landscapeRef, landscape), uploadBytes(portraitRef, portrait)]);
      const [landscapeUrl, portraitUrl] = await Promise.all([getDownloadURL(landscapeRef), getDownloadURL(portraitRef)]);
      await setDoc(doc(db, "posts", slug), {
        title: form.title.value.trim(), slug, excerpt: form.excerpt.value.trim(), content: form.content.value.trim(),
        status: form.status.value, landscapeUrl, portraitUrl, authorEmail: auth.currentUser.email,
        publishedAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      form.reset();
      document.querySelectorAll(".preview img").forEach((img) => img.removeAttribute("src"));
      setStatus(publishStatus, "Post published successfully. It will now appear in the Posts section.", "success");
    } catch (error) {
      setStatus(publishStatus, error.message, "error");
    }
  });
}
