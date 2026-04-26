// Token gate for Analisis Butir Soal
(function() {
  var TOKEN_HASH = '7afd71973d27917de395e255834f13b99c52f641ec5b1ac90762446072857c9b';

  function sha256(str) {
    var buf = new TextEncoder().encode(str);
    return crypto.subtle.digest('SHA-256', buf).then(function(hash) {
      var arr = Array.from(new Uint8Array(hash));
      return arr.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  function showGate() {

    var overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.innerHTML = '\
      <div class="auth-box">\
        <div class="auth-icon">&#128274;</div>\
        <h2>Akses Terbatas</h2>\
        <p>Masukkan token untuk mengakses website ini</p>\
        <input type="password" id="auth-token" placeholder="Masukkan token..." autofocus />\
        <button id="auth-submit">Masuk</button>\
        <div id="auth-error"></div>\
      </div>';

    var style = document.createElement('style');
    style.textContent = '\
      #auth-overlay {\
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;\
        background: linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%);\
        display: flex; align-items: center; justify-content: center;\
        z-index: 99999; font-family: "Inter", -apple-system, sans-serif;\
      }\
      .auth-box {\
        background: #fff; border-radius: 16px; padding: 2.5rem 2rem;\
        max-width: 380px; width: 90%; text-align: center;\
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);\
      }\
      .auth-icon { font-size: 3rem; margin-bottom: 0.5rem; }\
      .auth-box h2 { margin: 0 0 0.5rem; color: #1e293b; font-size: 1.4rem; }\
      .auth-box p { margin: 0 0 1.5rem; color: #64748b; font-size: 0.9rem; }\
      #auth-token {\
        width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0;\
        border-radius: 10px; font-size: 1rem; outline: none;\
        transition: border-color 0.2s; box-sizing: border-box;\
      }\
      #auth-token:focus { border-color: #4f46e5; }\
      #auth-submit {\
        width: 100%; padding: 12px; margin-top: 1rem;\
        background: #4f46e5; color: #fff; border: none; border-radius: 10px;\
        font-size: 1rem; font-weight: 600; cursor: pointer;\
        transition: background 0.2s;\
      }\
      #auth-submit:hover { background: #3730a3; }\
      #auth-error {\
        color: #dc2626; font-size: 0.85rem; margin-top: 0.75rem; min-height: 1.2em;\
      }';

    document.head.appendChild(style);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    var input = document.getElementById('auth-token');
    var btn = document.getElementById('auth-submit');
    var err = document.getElementById('auth-error');

    function tryLogin() {
      var val = input.value.trim();
      if (!val) { err.textContent = 'Token tidak boleh kosong'; return; }
      sha256(val).then(function(hash) {
        if (hash === TOKEN_HASH) {
          sessionStorage.setItem('auth_ok', '1');
          overlay.remove();
          document.body.style.overflow = '';
        } else {
          err.textContent = 'Token salah. Silakan coba lagi.';
          input.value = '';
          input.focus();
        }
      });
    }

    btn.addEventListener('click', tryLogin);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') tryLogin();
    });
  }

  if (sessionStorage.getItem('auth_ok') === '1') {
    return;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showGate);
  } else {
    showGate();
  }
})();
