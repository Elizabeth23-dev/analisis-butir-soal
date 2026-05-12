// Shared navigation bar for Analisis Butir Soal
(function() {
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  const links = [
    { href: 'index.html', label: 'Beranda', icon: '&#9776;' },
    { href: 'daya-pembeda.html', label: 'Daya Pembeda' },
    { href: 'tingkat-kesukaran.html', label: 'Tingkat Kesukaran' },
    { href: 'cronbach-alpha.html', label: "Cronbach's Alpha" },
    { href: 'validitas-konstruk.html', label: 'Validitas Konstruk' },
    { href: 'validitas-isi.html', label: 'Validitas Isi' },
    { href: 'cek-ewallet.html', label: 'Cek E-Wallet' },
    { href: 'tempmail.html', label: 'TempMail' },
    { href: 'gpt/', label: 'GPT Generator' }
  ];

  const nav = document.createElement('nav');
  nav.id = 'shared-nav';
  nav.innerHTML = `
    <div class="nav-inner">
      <a href="index.html" class="nav-brand">Analisis Butir Soal</a>
      <button class="nav-toggle" onclick="document.getElementById('shared-nav').classList.toggle('open')" aria-label="Menu">&#9776;</button>
      <div class="nav-links">
        ${links.map(l =>
          `<a href="${l.href}" class="${currentPage === l.href ? 'active' : ''}">${l.label}</a>`
        ).join('')}
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #shared-nav {
      background: #1e1b4b;
      color: #fff;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      position: sticky;
      top: 0;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    #shared-nav .nav-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      padding: 0 16px;
      min-height: 48px;
      flex-wrap: wrap;
    }
    #shared-nav .nav-brand {
      font-weight: 700;
      font-size: 15px;
      color: #fff;
      text-decoration: none;
      margin-right: auto;
      padding: 10px 0;
      white-space: nowrap;
    }
    #shared-nav .nav-toggle {
      display: none;
      background: none;
      border: 1px solid rgba(255,255,255,0.3);
      color: #fff;
      font-size: 18px;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
    }
    #shared-nav .nav-links {
      display: flex;
      gap: 2px;
      flex-wrap: wrap;
    }
    #shared-nav .nav-links a {
      color: rgba(255,255,255,0.75);
      text-decoration: none;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.15s;
      white-space: nowrap;
      font-weight: 500;
      font-size: 13px;
    }
    #shared-nav .nav-links a:hover {
      background: rgba(255,255,255,0.1);
      color: #fff;
    }
    #shared-nav .nav-links a.active {
      background: rgba(129,140,248,0.25);
      color: #fff;
      font-weight: 600;
    }
    @media (max-width: 768px) {
      #shared-nav .nav-toggle { display: block; }
      #shared-nav .nav-links {
        display: none;
        width: 100%;
        flex-direction: column;
        padding: 8px 0;
      }
      #shared-nav.open .nav-links { display: flex; }
      #shared-nav .nav-links a { padding: 10px 12px; }
    }
  `;

  document.head.appendChild(style);
  document.body.insertBefore(nav, document.body.firstChild);
})();
