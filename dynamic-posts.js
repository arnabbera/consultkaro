import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { collection, getDocs, getFirestore, limit, query, where } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "/firebase-config.js";

if (!Object.values(firebaseConfig).some((value) => String(value).startsWith("REPLACE_WITH_"))) {
  const db = getFirestore(initializeApp(firebaseConfig));
  const feed = document.querySelector("[data-dynamic-posts]");
  if (feed) {
    try {
      const snapshot = await getDocs(query(collection(db, "posts"), where("status", "==", "published"), limit(30)));
      const items = [...snapshot.docs].sort((a, b) => (a.data().publishedAt?.seconds || 0) - (b.data().publishedAt?.seconds || 0));
      items.forEach((item) => {
        const post = item.data();
        const card = document.createElement("article");
        card.className = "post-card";
        card.dataset.postSlug = item.id;
        const href = `/post/?id=${encodeURIComponent(item.id)}`;
        card.innerHTML = `<a href="${href}"><picture><source media="(max-width:760px)" srcset="${post.portraitUrl}"><img src="${post.landscapeUrl}" alt="" loading="lazy"></picture></a><div class="post-card-body"><p class="post-date">Latest post</p><h2><a href="${href}"></a></h2><p class="excerpt"></p><a class="read-more" href="${href}">Read full post</a></div>`;
        card.querySelector("h2 a").textContent = post.title;
        card.querySelector(".excerpt").textContent = post.excerpt;
        const staticLink = feed.querySelector(`a[href="/posts/${item.id}/"]`);
        const staticCard = staticLink?.closest(".post-card");
        if (staticCard) staticCard.replaceWith(card);
        else feed.prepend(card);
      });
    } catch (error) { console.error("Unable to load admin posts", error); }
  }
}
