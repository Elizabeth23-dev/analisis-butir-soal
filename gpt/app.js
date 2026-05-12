// ── Config ──
const API_BASE = 'https://ezweystock.petrix.id/gpt';

// ── State ──
let selectedPlan = 'plus';
let currencies = [];
let isGenerating = false;
let cooldownTimer = null;
let failedAttempts = 0;
const MAX_FAILS = 5;
const SPAM_COOLDOWN = 300; // 5 min

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([loadStats(), loadCurrencies()]);
    setTimeout(openInfoModal, 800);
});

// ── Stats ──
async function loadStats() {
    try {
        const r = await fetch(API_BASE + '/stats');
        const d = await r.json();
        animateCounter('stat-total', d.total);
        animateCounter('stat-team', d.team);
        animateCounter('stat-plus', d.plus);
    } catch { /* silent */ }
}

function animateCounter(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const duration = 1200;
    const start = performance.now();
    const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

// ── Currencies ──
async function loadCurrencies() {
    try {
        const r = await fetch(API_BASE + '/currency');
        currencies = await r.json();
        renderCurrencyDD(currencies);
        if (currencies.length > 0) selectCurrency(currencies[0]);
    } catch { /* silent */ }
}

function renderCurrencyDD(list) {
    const container = document.getElementById('currencyList');
    container.innerHTML = '';
    const selectable = list.filter(c => !c.separator);
    if (selectable.length === 0) {
        container.innerHTML = '<div class="dd-empty">Tidak ditemukan</div>';
        return;
    }
    list.forEach(c => {
        if (c.separator) {
            const div = document.createElement('div');
            div.className = 'dd-divider';
            container.appendChild(div);
            return;
        }
        const item = document.createElement('div');
        item.className = 'dd-item';
        item.textContent = c.label;
        item.dataset.key = c.key;
        item.onclick = () => selectCurrency(c);
        if (c.key === document.getElementById('currencyCode').value) {
            item.classList.add('active');
        }
        container.appendChild(item);
    });
}

function selectCurrency(c) {
    document.getElementById('currencyCode').value = c.key;
    document.getElementById('currencySearch').value = c.label;
    closeCurrencyDD();
    document.querySelectorAll('.plan-price').forEach(el => {
        el.textContent = c.currency + ' 0';
    });
}

function openCurrencyDD() {
    const input = document.getElementById('currencySearch');
    input.select();
    document.getElementById('currencyList').classList.add('open');
    renderCurrencyDD(currencies);
}

function closeCurrencyDD() {
    document.getElementById('currencyList').classList.remove('open');
}

function filterCurrencies() {
    const q = document.getElementById('currencySearch').value.toLowerCase();
    if (!q) {
        renderCurrencyDD(currencies);
    } else {
        const filtered = currencies.filter(c =>
            !c.separator && (c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q))
        );
        renderCurrencyDD(filtered);
    }
    document.getElementById('currencyList').classList.add('open');
}

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
    const cdd = document.getElementById('currencyDropdown');
    if (cdd && !cdd.contains(e.target)) closeCurrencyDD();
    const pdd = document.getElementById('paymentDropdown');
    if (pdd && !pdd.contains(e.target)) closePaymentDD();
});

// ── Payment Dropdown ──
function togglePaymentDD() {
    document.getElementById('paymentList').classList.toggle('open');
}
function closePaymentDD() {
    document.getElementById('paymentList').classList.remove('open');
}
function selectPayment(value, label) {
    document.getElementById('paymentMethod').value = value;
    document.getElementById('paymentDisplay').textContent = label;
    closePaymentDD();
    document.querySelectorAll('#paymentList .dd-item').forEach(el => {
        el.classList.toggle('active', el.dataset.value === value);
    });
}

// ── Plan Selection ──
function selectPlan(plan) {
    if (plan === 'team') return;
    selectedPlan = plan;
    const card = document.getElementById('plan-plus');
    card.classList.add('selected');
}

// ── Generate ──
async function generateLink() {
    if (isGenerating) return;
    if (cooldownTimer) {
        showError('Harap tunggu sebelum mencoba lagi.');
        return;
    }

    const tokenRaw = document.getElementById('accessToken').value.trim();
    if (!tokenRaw) {
        showError('Silakan tempel accessToken atau session JSON.');
        return;
    }

    let session = tokenRaw;
    try {
        const json = JSON.parse(tokenRaw);
        if (json.accessToken) {
            session = json.accessToken;
        } else {
            showError('JSON valid tapi tidak ada field "accessToken".');
            return;
        }
    } catch {
        // bukan JSON, kirim sebagai raw token
    }

    const currency = document.getElementById('currencyCode').value;
    const payMethod = document.getElementById('paymentMethod').value;

    isGenerating = true;
    setLoading(true);
    hideResult();

    try {
        const res = await fetch(API_BASE + '/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                plan: selectedPlan,
                payment: payMethod,
                currency: currency,
                session: session
            })
        });

        const data = await res.json();
        setLoading(false);
        isGenerating = false;

        if (data.success) {
            failedAttempts = 0;
            showSuccess(data.url);
            loadStats();
            startCooldown(60);
        } else {
            if (res.status === 429 && data.spam) {
                failedAttempts = 0;
                startCooldown(data.retryAfter || SPAM_COOLDOWN);
                showError(data.msg || 'Terlalu banyak percobaan gagal. Tunggu 5 menit.');
            } else if (res.status === 429 && data.retryAfter) {
                startCooldown(data.retryAfter);
                showError(data.msg || 'Error tidak diketahui');
            } else {
                failedAttempts++;
                if (failedAttempts >= MAX_FAILS) {
                    failedAttempts = 0;
                    startCooldown(SPAM_COOLDOWN);
                    showError('Terlalu banyak percobaan gagal. Tunggu 5 menit.');
                } else {
                    showError(data.msg || 'Error tidak diketahui');
                }
            }
        }
    } catch (err) {
        setLoading(false);
        isGenerating = false;
        showError(err.message || 'Kesalahan jaringan');
    }
}

// ── Cooldown ──
function startCooldown(seconds) {
    const btn = document.getElementById('generateBtn');
    btn.disabled = true;
    let remaining = seconds;
    const span = btn.querySelector('span');
    const origText = span?.textContent || 'Generate';
    if (span) span.textContent = 'Tunggu ' + remaining + 's';

    cooldownTimer = setInterval(() => {
        remaining--;
        if (span) span.textContent = 'Tunggu ' + remaining + 's';
        if (remaining <= 0) {
            clearInterval(cooldownTimer);
            cooldownTimer = null;
            btn.disabled = false;
            if (span) span.textContent = origText;
        }
    }, 1000);
}

// ── UI helpers ──
function setLoading(on) {
    document.getElementById('generateBtn').classList.toggle('hidden', on);
    const ls = document.getElementById('loadingState');
    ls.classList.toggle('hidden', !on);
    ls.classList.toggle('flex', on);
}

function hideResult() {
    document.getElementById('successBox').classList.add('hidden');
    document.getElementById('errorBox').classList.add('hidden');
}

function showSuccess(url) {
    document.getElementById('resultUrl').value = url;
    const box = document.getElementById('successBox');
    box.classList.remove('hidden');
    const inner = box.querySelector('.animate-fadeSlideUp');
    if (inner) { inner.style.animation = 'none'; inner.offsetHeight; inner.style.animation = ''; }
}

function showError(msg) {
    document.getElementById('errorMsg').textContent = msg;
    const box = document.getElementById('errorBox');
    box.classList.remove('hidden');
    const inner = box.querySelector('.animate-fadeSlideUp');
    if (inner) { inner.style.animation = 'none'; inner.offsetHeight; inner.style.animation = ''; }
}

function copyLink() {
    const url = document.getElementById('resultUrl').value;
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('copyBtn');
        const orig = btn.innerHTML;
        btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><span>Tersalin!</span>';
        btn.classList.replace('bg-emerald-600', 'bg-emerald-700');
        setTimeout(() => {
            btn.innerHTML = orig;
            btn.classList.replace('bg-emerald-700', 'bg-emerald-600');
        }, 2000);
    });
}

function openLink() {
    const url = document.getElementById('resultUrl').value;
    if (url) window.open(url, '_blank');
}

// ── Info Modal ──
function openInfoModal() {
    document.getElementById('infoOverlay').classList.add('active');
    document.getElementById('infoModal').classList.add('active');
}
function closeInfoModal() {
    document.getElementById('infoOverlay').classList.remove('active');
    document.getElementById('infoModal').classList.remove('active');
}
