import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "/firebase-config.js";

const id = new URLSearchParams(location.search).get("id");
const title = document.querySelector("#postTitle");
if (!id || Object.values(firebaseConfig).some((value) => String(value).startsWith("REPLACE_WITH_"))) {
  title.textContent = "Post unavailable";
} else {
  try {
    const snapshot = await getDoc(doc(getFirestore(initializeApp(firebaseConfig)), "posts", id));
    if (!snapshot.exists() || snapshot.data().status !== "published") throw new Error("Post not found");
    const post = snapshot.data();
    document.title = `${post.title} | ConsultKaro`;
    title.textContent = post.title;
    document.querySelector("#postExcerpt").textContent = post.excerpt;
    document.querySelector("#postImage").src = post.landscapeUrl;
    document.querySelector("#postImage").alt = post.title;
    document.querySelector("#portraitSource").srcset = post.portraitUrl;
    const content = document.querySelector("#postContent");
    post.content.split(/\n\s*\n/).filter(Boolean).forEach((paragraph) => {
      const p = document.createElement("p"); p.textContent = paragraph; content.append(p);
    });
  } catch (error) { title.textContent = "Post not found"; document.querySelector("#postExcerpt").textContent = "This post may have been removed or is not yet published."; }
}
