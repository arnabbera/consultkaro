import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "/firebase-config.js";

const anchor = document.querySelector("[data-post-comments-anchor]") || document.querySelector("[data-post-share]");

if (anchor) {
  const app = getApps()[0] || initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const isCompanyDiscussion = anchor.hasAttribute("data-post-comments-anchor");
  const dynamicId = new URLSearchParams(location.search).get("id");
  const pathParts = location.pathname.split("/").filter(Boolean);
  const postId = (isCompanyDiscussion ? "consultkaro-company" : dynamicId || pathParts.at(-1) || "post").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const postTitle = isCompanyDiscussion ? "ConsultKaro" : document.querySelector("h1")?.textContent?.trim() || document.title;
  const sectionTitle = isCompanyDiscussion ? "Comments about ConsultKaro" : "Comments";
  const formIntro = isCompanyDiscussion
    ? "Share your experience or feedback about ConsultKaro. Your comment will be published immediately."
    : "Your comment will be published immediately.";
  const commentsRef = collection(db, "postComments", postId, "comments");

  const section = document.createElement("section");
  section.className = "post-comments";
  section.setAttribute("aria-labelledby", "comments-heading");
  section.innerHTML = `
    <div class="comments-heading-row">
      <div>
        <p class="comments-eyebrow">Reader discussion</p>
        <h2 id="comments-heading">${sectionTitle}</h2>
      </div>
      <span class="comment-count" id="commentCount">0 comments</span>
    </div>
    <div class="comments-list" id="commentsList" aria-live="polite"><p class="comments-empty">Loading comments…</p></div>
    <form class="comment-form" id="commentForm">
      <h3>Leave a comment</h3>
      <p>${formIntro}</p>
      <div class="comment-field">
        <label for="commentName">Your name</label>
        <input id="commentName" name="name" type="text" minlength="2" maxlength="60" autocomplete="name" required>
      </div>
      <div class="comment-field">
        <label for="commentMessage">Comment</label>
        <textarea id="commentMessage" name="message" minlength="3" maxlength="1000" rows="5" required></textarea>
      </div>
      <div class="comment-trap" aria-hidden="true">
        <label for="commentWebsite">Website</label>
        <input id="commentWebsite" name="website" type="text" tabindex="-1" autocomplete="off">
      </div>
      <button class="comment-submit" type="submit">Submit comment</button>
      <p class="comment-status" id="commentStatus" role="status" aria-live="polite"></p>
    </form>`;
  if (isCompanyDiscussion) anchor.replaceWith(section);
  else anchor.insertAdjacentElement("afterend", section);

  const form = section.querySelector("#commentForm");
  const status = section.querySelector("#commentStatus");
  const list = section.querySelector("#commentsList");
  const count = section.querySelector("#commentCount");

  function setStatus(message, kind = "") {
    status.textContent = message;
    status.className = `comment-status ${kind}`.trim();
  }

  function renderComments(snapshot) {
    const comments = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    count.textContent = `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`;
    list.replaceChildren();
    if (!comments.length) {
      const empty = document.createElement("p");
      empty.className = "comments-empty";
      empty.textContent = "No comments yet. You can start the discussion.";
      list.append(empty);
      return;
    }
    comments.forEach((comment) => {
      const article = document.createElement("article");
      article.className = "reader-comment";
      const header = document.createElement("div");
      const name = document.createElement("strong");
      const date = document.createElement("time");
      const message = document.createElement("p");
      name.textContent = comment.name;
      const created = comment.createdAt?.toDate?.();
      date.textContent = created ? created.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recently";
      if (created) date.dateTime = created.toISOString();
      message.textContent = comment.message;
      header.append(name, date);
      article.append(header, message);
      list.append(article);
    });
  }

  onSnapshot(
    query(commentsRef, where("status", "==", "approved")),
    renderComments,
    () => {
      list.innerHTML = '<p class="comments-empty">Comments are temporarily unavailable.</p>';
    },
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (form.website.value) return;
    const lastSubmitted = Number(localStorage.getItem("consultkaro-comment-submitted") || 0);
    if (Date.now() - lastSubmitted < 30000) {
      setStatus("Please wait a moment before submitting another comment.", "error");
      return;
    }
    const name = form.name.value.trim();
    const message = form.message.value.trim();
    if (name.length < 2 || message.length < 3) {
      setStatus("Please enter your name and a meaningful comment.", "error");
      return;
    }
    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    setStatus("Submitting your comment…");
    try {
      await addDoc(commentsRef, {
        name,
        message,
        postId,
        postTitle: postTitle.slice(0, 160),
        status: "approved",
        createdAt: serverTimestamp(),
      });
      localStorage.setItem("consultkaro-comment-submitted", String(Date.now()));
      form.reset();
      setStatus("Thank you. Your comment is now visible publicly.", "success");
    } catch (error) {
      setStatus(error.code === "permission-denied" ? "Comment submission is not active yet. Please try again later." : "Unable to submit your comment. Please try again.", "error");
    } finally {
      button.disabled = false;
    }
  });
}
