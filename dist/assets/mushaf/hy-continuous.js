/**
 * Gapless page recitation for the Fatiha demo (and baked QCF pages).
 * Reuses two Audio elements so iOS Safari does not drop the user gesture
 * between ayahs. Prefetches the next ayah; no silence between files.
 * Default: play through the page, then stop on Fatiha (page 1).
 * Loop / pause only when the user turns them on.
 */
(function (global) {
  var FOLDERS = {
    alafasy: "Alafasy_128kbps",
    abdulbasit: "Abdul_Basit_Mujawwad_128kbps",
    minshawi: "Minshawy_Mujawwad_64kbps",
    "abdulbasit-murattal": "Abdul_Basit_Murattal_192kbps",
    husary: "Husary_128kbps",
    sudais: "Sudais_128kbps",
  };

  var buf = [null, null];
  var cur = 0;
  var queue = [];
  var idx = 0;
  var token = 0;
  var playing = false;
  var paused = false;
  var loop = false;
  try {
    loop = localStorage.getItem("hyLoop") === "1";
  } catch (e) {}
  var rate = 1;
  var reciterId = "alafasy";
  var pageNo = 1;
  var tick = 0;

  function pad(n) {
    return String(n).padStart(3, "0");
  }

  function folder() {
    return FOLDERS[reciterId] || FOLDERS.alafasy;
  }

  function ayahUrl(surah, ayah) {
    return "https://everyayah.com/data/" + folder() + "/" + pad(surah) + pad(ayah) + ".mp3";
  }

  function audio(i) {
    if (!buf[i]) {
      var a = new Audio();
      a.preload = "auto";
      a.setAttribute("playsinline", "true");
      a.setAttribute("webkit-playsinline", "true");
      buf[i] = a;
    }
    return buf[i];
  }

  function current() {
    return audio(cur);
  }

  function nextBuf() {
    return audio(1 - cur);
  }

  function load(el, url) {
    return new Promise(function (resolve) {
      if (el.getAttribute("data-hy-src") === url && el.readyState >= 2) {
        resolve(true);
        return;
      }
      var done = false;
      function fin() {
        if (done) return;
        done = true;
        el.oncanplaythrough = null;
        el.onloadeddata = null;
        el.onerror = null;
        resolve(el.readyState >= 2);
      }
      el.oncanplaythrough = fin;
      el.onloadeddata = fin;
      el.onerror = fin;
      el.setAttribute("data-hy-src", url);
      el.src = url;
      el.load();
      setTimeout(fin, 4000);
    });
  }

  function spansFor(surah, ayah) {
    var words = document.querySelectorAll('#hy-qcf-glyphs [data-hy-qcf-word^="' + surah + ":" + ayah + ':"]');
    var out = [];
    for (var i = 0; i < words.length; i++) {
      var loc = (words[i].getAttribute("data-hy-local") || "").split("-");
      if (loc.length >= 2) out.push({ ayahIndex: +loc[0], wordIndex: +loc[1] });
      else out.push({ ayahIndex: Math.max(0, ayah - 1), wordIndex: i });
    }
    if (!out.length) out.push({ ayahIndex: Math.max(0, ayah - 1), wordIndex: 0 });
    return out;
  }

  function track() {
    var item = queue[idx];
    if (!item) return;
    var a = current();
    var hy = global.hyQuranTiming;
    if (!hy) return;
    var spans = spansFor(item.surah, item.ayah);
    var hit = hy.atTime ? hy.atTime(reciterId, item.surah, item.ayah, a.currentTime || 0, spans) : null;
    if (hit) hy.setActive(hit);
    else hy.setActive({ ayahIndex: spans[0].ayahIndex, wordIndex: spans[0].wordIndex, letterIndex: 0 });
    var now = document.getElementById("hy-player-now");
    if (now) {
      now.textContent = item.key;
      now.setAttribute("data-key", item.key);
    }
    if (global.hyQcfMushaf && global.hyQcfMushaf.setChromeVerse) {
      global.hyQcfMushaf.setChromeVerse({ surah: item.surah, ayah: item.ayah });
    }
  }

  function prefetchNext() {
    var n = idx + 1;
    if (n >= queue.length) {
      if (loop && queue[0]) n = 0;
      else return Promise.resolve();
    }
    var item = queue[n];
    if (!item || !folder()) return Promise.resolve();
    return load(nextBuf(), ayahUrl(item.surah, item.ayah));
  }

  function wire(el, myToken) {
    el.ontimeupdate = function () {
      if (myToken !== token || paused) return;
      track();
      var d = el.duration;
      if (d > 0 && el.currentTime >= d - 0.06) advance(myToken);
    };
    el.onended = function () {
      if (myToken !== token) return;
      advance(myToken);
    };
  }

  var advancing = false;
  function advance(myToken) {
    if (myToken !== token || advancing) return;
    advancing = true;
    idx += 1;
    if (idx >= queue.length) {
      if (loop) {
        idx = 0;
        playIndex(0, myToken).then(function () {
          advancing = false;
        });
        return;
      }
      advancing = false;
      stopAtPageEnd();
      return;
    }
    playIndex(idx, myToken).then(function () {
      advancing = false;
    });
  }

  function playIndex(i, myToken) {
    idx = i;
    var item = queue[i];
    if (!item || myToken !== token) return Promise.resolve();
    var url = ayahUrl(item.surah, item.ayah);
    if (nextBuf().getAttribute("data-hy-src") === url) cur = 1 - cur;
    var el = current();
    var idle = nextBuf();
    el.playbackRate = rate;
    wire(el, myToken);
    return load(el, url).then(function () {
      if (myToken !== token) return;
      try {
        idle.pause();
      } catch (e) {}
      var p = el.play();
      if (p && p.catch) p.catch(function () {});
      playing = true;
      paused = false;
      track();
      prefetchNext();
    });
  }

  function stopAtPageEnd() {
    playing = false;
    paused = false;
    try {
      current().pause();
    } catch (e) {}
    var btn = document.querySelector("#hy-player-dock [data-act=play]");
    if (btn) {
      btn.textContent = "▶";
      btn.classList.remove("on");
    }
    if (pageNo > 1) {
      var next = document.querySelector('[aria-label="Sonraki sayfa"]');
      if (next) next.click();
    }
  }

  function stop() {
    token += 1;
    playing = false;
    paused = false;
    advancing = false;
    try {
      audio(0).pause();
      audio(1).pause();
    } catch (e) {}
  }

  function buildQueue(data) {
    var seen = {};
    var out = [];
    (data.verses || []).forEach(function (v) {
      var k = v.surah + ":" + v.ayah;
      if (seen[k]) return;
      seen[k] = 1;
      out.push({ surah: v.surah, ayah: v.ayah, key: k });
    });
    return out;
  }

  function start(fromKey) {
    var qcf = global.hyQcfMushaf;
    if (!qcf) return Promise.resolve(false);
    pageNo = qcf.pageFromUi ? qcf.pageFromUi() : 1;
    reciterId = (function () {
      try {
        return localStorage.getItem("hyReciterId") || "alafasy";
      } catch (e) {
        return "alafasy";
      }
    })();
    if (reciterId === "hoca-tts") reciterId = "alafasy";
    token += 1;
    var my = token;
    audio(0);
    audio(1);
    return Promise.resolve(qcf.loadPage ? qcf.loadPage(pageNo) : null).then(function (data) {
      if (!data) return false;
      queue = buildQueue(data);
      if (!queue.length) return false;
      idx = 0;
      if (fromKey) {
        for (var i = 0; i < queue.length; i++) if (queue[i].key === fromKey) idx = i;
      }
      playing = true;
      paused = false;
      return playIndex(idx, my).then(function () {
        return true;
      });
    });
  }

  function pause() {
    if (!playing) return;
    paused = true;
    try {
      current().pause();
    } catch (e) {}
  }

  function resume() {
    if (!queue.length) return start();
    token += 1;
    var my = token;
    var el = current();
    wire(el, my);
    el.playbackRate = rate;
    paused = false;
    playing = true;
    var p = el.play();
    if (p && p.catch) {
      return p.catch(function () {
        return start(queue[idx] && queue[idx].key);
      });
    }
    prefetchNext();
    return Promise.resolve(true);
  }

  function toggle() {
    if (playing && !paused) {
      pause();
      return Promise.resolve("paused");
    }
    if (playing && paused) {
      return resume().then(function () {
        return "playing";
      });
    }
    return start().then(function () {
      return playing ? "playing" : "idle";
    });
  }

  function jump(dir) {
    if (!queue.length) return;
    var next = Math.max(0, Math.min(queue.length - 1, idx + dir));
    token += 1;
    playIndex(next, token);
  }

  function setLoop(on) {
    loop = !!on;
  }

  function setRate(n) {
    rate = Math.max(0.5, Math.min(2, Number(n) || 1));
    try {
      current().playbackRate = rate;
      nextBuf().playbackRate = rate;
    } catch (e) {}
  }

  function setReciter(id) {
    if (id && FOLDERS[id]) reciterId = id;
    if (playing) start(queue[idx] && queue[idx].key);
  }

  if (!tick) {
    tick = setInterval(function () {
      if (playing && !paused) track();
    }, 80);
  }

  global.hyContinuous = {
    toggle: toggle,
    start: start,
    pause: pause,
    resume: resume,
    stop: stop,
    jump: jump,
    setLoop: setLoop,
    setRate: setRate,
    setReciter: setReciter,
    isPlaying: function () {
      return playing && !paused;
    },
    isPaused: function () {
      return playing && paused;
    },
    queue: function () {
      return queue.slice();
    },
    index: function () {
      return idx;
    },
    _advance: function () {
      advance(token);
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
