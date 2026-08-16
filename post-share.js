(function () {
  "use strict";

  var shareBox = document.querySelector("[data-post-share]");
  if (!shareBox) return;

  var canonical = document.querySelector('link[rel="canonical"]');
  var url = canonical ? canonical.href : window.location.href.split("#")[0];
  var heading = document.querySelector("h1");
  var title = heading ? heading.textContent.trim() : document.title;
  var encodedUrl = encodeURIComponent(url);
  var encodedText = encodeURIComponent(title);

  var links = {
    facebook: "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl,
    x: "https://twitter.com/intent/tweet?url=" + encodedUrl + "&text=" + encodedText,
    whatsapp: "https://wa.me/?text=" + encodeURIComponent(title + " " + url)
  };

  Object.keys(links).forEach(function (network) {
    var link = shareBox.querySelector('[data-share="' + network + '"]');
    if (link) link.href = links[network];
  });

  var status = shareBox.querySelector(".share-status");

  function showStatus(message) {
    if (!status) return;
    status.textContent = message;
    window.setTimeout(function () { status.textContent = ""; }, 4000);
  }

  function copyPostLink() {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(url);
    }

    var input = document.createElement("textarea");
    input.value = url;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
    return Promise.resolve();
  }

  var copyButton = shareBox.querySelector('[data-share="copy"]');
  if (copyButton) {
    copyButton.addEventListener("click", function () {
      copyPostLink().then(function () {
        showStatus("Post link copied.");
      }).catch(function () {
        showStatus("Copy failed. Please copy the address from your browser.");
      });
    });
  }

  var instagramButton = shareBox.querySelector('[data-share="instagram"]');
  if (instagramButton) {
    instagramButton.addEventListener("click", function () {
      var instagramWindow = window.open("https://www.instagram.com/", "_blank", "noopener");
      copyPostLink().then(function () {
        showStatus("Post link copied. Paste it into Instagram.");
      }).catch(function () {
        showStatus("Instagram opened. Copy this page address to share it.");
      });
      if (instagramWindow) instagramWindow.opener = null;
    });
  }

  var nativeButton = shareBox.querySelector('[data-share="native"]');
  if (nativeButton) {
    if (!navigator.share) nativeButton.hidden = true;
    nativeButton.addEventListener("click", function () {
      navigator.share({ title: title, text: title, url: url }).catch(function (error) {
        if (error && error.name !== "AbortError") showStatus("Sharing is not available. Please use Copy link.");
      });
    });
  }
}());
