// Persistence ringan: simpan & pulihkan isi form (input/textarea/select)
// serta mode/tab aktif ke localStorage agar data tidak tereset saat refresh.
// Di-load oleh setiap halaman kalkulator.
(function () {
  'use strict';

  var PAGE = (location.pathname.split('/').pop() || 'index.html');
  var STORAGE_KEY = 'abs:state:v1:' + PAGE;
  var SAVE_DEBOUNCE_MS = 150;

  var restoring = false;
  var saveTimer = null;

  function getInputs() {
    return Array.prototype.slice.call(
      document.querySelectorAll('input, select, textarea')
    );
  }

  // Kunci stabil untuk tiap elemen input
  function keyFor(el) {
    if (el.id) return 'id:' + el.id;
    if (el.name) return 'name:' + el.name;
    var ds = el.dataset || {};
    var dataKeys = Object.keys(ds);
    if (dataKeys.length) {
      dataKeys.sort();
      var parts = dataKeys.map(function (k) { return k + '=' + ds[k]; });
      return 'data:' + el.tagName + ':' + parts.join('|');
    }
    return null;
  }

  function activeButtonGroups() {
    var groups = ['.mode-selector', '.tab-bar', '.mode-btns', '.tabs'];
    var out = [];
    groups.forEach(function (sel) {
      var containers = document.querySelectorAll(sel);
      Array.prototype.forEach.call(containers, function (container, ci) {
        var buttons = container.querySelectorAll('button');
        Array.prototype.forEach.call(buttons, function (btn, bi) {
          if (btn.classList.contains('active')) {
            out.push({
              sel: sel,
              ci: ci,
              bi: bi,
              onclick: btn.getAttribute('onclick') || ''
            });
          }
        });
      });
    });
    return out;
  }

  // Kunci stabil dengan disambiguasi posisi: jika beberapa elemen
  // menghasilkan keyFor() yang sama (mis. hanya punya data-role yang
  // sama), tambahkan suffix '#1', '#2', dst. sesuai urutan DOM.
  // snapshot() dan applyValues() memakai iterasi yang sama agar key
  // tetap konsisten antara save & restore.
  function enumerateKeys() {
    var inputs = getInputs();
    var seen = Object.create(null);
    var keys = new Array(inputs.length);
    for (var i = 0; i < inputs.length; i++) {
      var base = keyFor(inputs[i]);
      if (!base) { keys[i] = null; continue; }
      if (base in seen) {
        seen[base]++;
        keys[i] = base + '#' + seen[base];
      } else {
        seen[base] = 0;
        keys[i] = base;
      }
    }
    return { inputs: inputs, keys: keys };
  }

  function snapshot() {
    var data = { v: 1, fields: {}, activeButtons: activeButtonGroups() };
    var pair = enumerateKeys();
    for (var i = 0; i < pair.inputs.length; i++) {
      var el = pair.inputs[i];
      var k = pair.keys[i];
      if (!k) continue;
      if (el.type === 'file' || el.type === 'password') continue;
      if (el.type === 'checkbox' || el.type === 'radio') {
        data.fields[k] = { c: el.checked };
      } else {
        data.fields[k] = { v: el.value };
      }
    }
    return data;
  }

  function saveNow() {
    if (restoring) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot())); }
    catch (e) { /* quota / privacy mode: abaikan */ }
  }

  function scheduleSave() {
    if (restoring) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, SAVE_DEBOUNCE_MS);
  }

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function applyValues(data) {
    if (!data || !data.fields) return;
    var pair = enumerateKeys();
    for (var i = 0; i < pair.inputs.length; i++) {
      var el = pair.inputs[i];
      var k = pair.keys[i];
      if (!k || !(k in data.fields)) continue;
      var f = data.fields[k];
      if ('c' in f) {
        if (el.checked !== f.c) {
          el.checked = f.c;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else if ('v' in f) {
        if (el.value !== f.v) {
          el.value = f.v;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }
  }

  // Daftar fungsi generator yang dikenal di tiap halaman.
  // Dipanggil ulang setelah control inputs dipulihkan agar tabel
  // dinamis terbentuk lebih dulu sebelum nilai sel diisi.
  function callGenerators() {
    var names = [
      'generateTable',          // cronbach-alpha
      'generateSummaryTable',   // daya-pembeda
      'generateDetailTable',    // daya-pembeda
      'generateScoreTable',     // tingkat-kesukaran
      'buildInputTable',        // validitas-konstruk
      'updateRTabel',           // validitas-konstruk
      'buildTable'              // validitas-isi
    ];
    for (var i = 0; i < names.length; i++) {
      var fn = window[names[i]];
      if (typeof fn === 'function') {
        try { fn(true); } catch (e) { /* abaikan */ }
      }
    }
  }

  // tingkat-kesukaran: pulihkan jumlah panel "Input Langsung" yang
  // tersimpan dengan memanggil addDirectSoal sebanyak yang dibutuhkan.
  function ensureDirectSoalPanels(data) {
    if (typeof window.addDirectSoal !== 'function') return;
    if (!data || !data.fields) return;
    var maxIdx = 0;
    var keys = Object.keys(data.fields);
    for (var i = 0; i < keys.length; i++) {
      var m = keys[i].match(/^id:direct_(?:SA|SB|IA|IB)_(\d+)$/);
      if (m) {
        var n = parseInt(m[1], 10);
        if (n > maxIdx) maxIdx = n;
      }
    }
    if (!maxIdx) return;
    var existing = document.querySelectorAll('#directSoalContainer .soal-panel').length;
    while (existing < maxIdx) {
      try { window.addDirectSoal(); } catch (e) { break; }
      existing++;
    }
  }

  function applyActiveButtons(data) {
    if (!data || !Array.isArray(data.activeButtons)) return;
    data.activeButtons.forEach(function (ab) {
      try {
        var containers = document.querySelectorAll(ab.sel);
        var container = containers[ab.ci];
        if (!container) return;
        var buttons = container.querySelectorAll('button');
        var target = null;
        if (ab.onclick) {
          for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].getAttribute('onclick') === ab.onclick) {
              target = buttons[i];
              break;
            }
          }
        }
        if (!target) target = buttons[ab.bi];
        if (target && !target.classList.contains('active')) target.click();
      } catch (e) { /* abaikan */ }
    });
  }

  function autoRestore() {
    var data = loadData();
    if (!data) return;
    var origAlert = window.alert;
    window.alert = function () {};
    restoring = true;
    try {
      // 1) Pulihkan control inputs (jumlah butir, jumlah responden, dll).
      //    Event change dapat memicu generator otomatis pada beberapa halaman.
      applyValues(data);
      // 2) Pastikan generator dijalankan agar tabel dinamis terbentuk.
      callGenerators();
      // 3) Untuk halaman dengan panel dinamis (tingkat-kesukaran direct mode).
      ensureDirectSoalPanels(data);
      // 4) Isi sel-sel tabel yang baru dibentuk.
      applyValues(data);
      // 5) Pulihkan mode/tab aktif (mungkin memicu render ulang).
      applyActiveButtons(data);
      // 6) Pass terakhir setelah switch tab.
      applyValues(data);
    } finally {
      restoring = false;
      window.alert = origAlert;
    }
  }

  // Auto-save: dengarkan perubahan input + klik tombol (untuk perubahan tab/mode).
  ['input', 'change'].forEach(function (evt) {
    document.addEventListener(evt, scheduleSave, true);
  });
  document.addEventListener('click', function (e) {
    if (restoring) return;
    var t = e.target;
    if (t && (t.matches && t.matches('button')) ||
        (t && t.closest && t.closest('button'))) {
      // Tunggu satu tick agar handler tombol sempat memutakhirkan DOM/kelas.
      setTimeout(saveNow, 0);
    }
  }, true);
  window.addEventListener('beforeunload', saveNow);

  function start() {
    // Tunggu satu tick agar inline init script (mis. generateScoreTable)
    // sempat berjalan terlebih dahulu.
    setTimeout(autoRestore, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.__absPersist = {
    save: saveNow,
    restore: autoRestore,
    clear: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    }
  };
})();
