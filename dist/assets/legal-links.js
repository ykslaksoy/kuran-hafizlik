/**
 * Injects Kullanım Şartları links into Ayarlar and the Veli/Hoca kayıt form
 * without modifying the recovered Expo bundle.
 */
(function () {
  var TERMS_HREF = "/kullanim-sartlari";
  var TERMS_EN_HREF = "/terms-of-use";

  function pathMatches(re) {
    return re.test(location.pathname || "/");
  }

  function findTextNode(root, text) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      if (node.textContent && node.textContent.indexOf(text) !== -1) {
        return node.parentElement;
      }
    }
    return null;
  }

  function injectAyarlarLink() {
    if (!pathMatches(/\/ayarlar\/?$/)) return;
    if (document.getElementById("hy-terms-settings-card")) return;
    var privacyTitle = findTextNode(document.body, "Gizlilik");
    if (!privacyTitle) return;
    var privacyCard = privacyTitle.closest("div");
    if (!privacyCard || !privacyCard.parentElement) return;

    var card = document.createElement("div");
    card.id = "hy-terms-settings-card";
    card.setAttribute("data-hy-legal", "settings");
    card.style.cssText =
      "border-radius:12px;padding:14px;margin:0 16px 12px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.06);";
    card.innerHTML =
      '<div style="font-weight:800;margin-bottom:8px;color:#1a3d2e;">Kullanım Şartları</div>' +
      '<div style="font-size:14px;line-height:20px;color:#666;margin-bottom:8px;">Hizmeti kullanırken geçerli kurallar ve yasaklar.</div>' +
      '<a href="' +
      TERMS_HREF +
      '" style="font-weight:800;color:#2d6a4f;text-decoration:none;">Metni oku →</a>' +
      ' · <a href="' +
      TERMS_EN_HREF +
      '" style="font-weight:700;color:#2d6a4f;text-decoration:none;">English</a>';

    privacyCard.parentElement.insertBefore(card, privacyCard.nextSibling);
  }

  function isKayitTabActive() {
    var tabs = document.querySelectorAll("div");
    for (var i = 0; i < tabs.length; i++) {
      var el = tabs[i];
      if (el.textContent !== "Kayıt") continue;
      var style = window.getComputedStyle(el);
      if (style.color === "rgb(255, 255, 255)" || el.style.color === "#fff") {
        return true;
      }
    }
    return false;
  }

  function injectSignupNotice() {
    if (!pathMatches(/\/hesap\/giris/)) return;
    var existing = document.getElementById("hy-terms-signup-notice");
    if (!isKayitTabActive()) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    var submit = findTextNode(document.body, "Kayıt ol");
    if (!submit) return;
    var btn = submit.closest("div");
    while (btn && btn.textContent.indexOf("Kayıt ol") === -1) {
      btn = btn.parentElement;
    }
    if (!btn || !btn.parentElement) return;

    var note = document.createElement("div");
    note.id = "hy-terms-signup-notice";
    note.setAttribute("data-hy-legal", "signup");
    note.style.cssText =
      "font-size:12px;line-height:18px;color:#666;margin:12px 16px 0;text-align:center;";
    note.innerHTML =
      'Kayıt olarak <a href="' +
      TERMS_HREF +
      '" style="color:#2d6a4f;font-weight:700;text-decoration:none;">Kullanım Şartları</a>\'nı kabul edersiniz.';

    var anchor = btn.parentElement;
    var demoNote = findTextNode(anchor, "Yerel demo hesap");
    if (demoNote && demoNote.parentElement) {
      demoNote.parentElement.insertBefore(note, demoNote);
    } else {
      anchor.appendChild(note);
    }
  }

  function tick() {
    try {
      injectAyarlarLink();
      injectSignupNotice();
    } catch (err) {
      /* non-fatal */
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tick);
  } else {
    tick();
  }

  var root = document.getElementById("root");
  if (root) {
    new MutationObserver(tick).observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
  window.addEventListener("popstate", tick);
  setInterval(tick, 1500);
})();
