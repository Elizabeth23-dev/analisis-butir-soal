# Analisis Butir Soal

Kumpulan kalkulator statistik untuk analisis instrumen penelitian pendidikan. Semua perhitungan berjalan sepenuhnya di peramban (browser) — data Anda **tidak dikirim ke server mana pun**.

## Fitur

| No | Kalkulator | Rumus | Referensi |
|----|-----------|-------|-----------|
| 1 | **Uji Daya Pembeda** | DP = (SA - SB) / IA | Sundayana (2018), Fatimah & Alfath (2019) |
| 2 | **Uji Tingkat Kesukaran** | TK = (SA + SB) / (IA + IB) | Sundayana (2018), Arikunto (2010) |
| 3 | **Reliabilitas Cronbach's Alpha** | α = n/(n-1) × {1 - Σsi²/st²} | Imaduddin, Maulani, & Taufik (2022); Sundayana (2018) |
| 4 | **Validitas Konstruk (Pearson)** | r_XY = [nΣXY - (ΣX)(ΣY)] / √[...] | Korelasi Product Moment |
| 5 | **Validitas Isi (Aiken's V)** | V = ΣS / [n(c-1)] | Aiken (1985) |
| 6 | **Cek E-Wallet** | API Mochi | Verifikasi akun e-wallet via API |

## Cara Pakai

1. Buka `index.html` di browser
2. Pilih kalkulator yang diinginkan
3. Masukkan data sesuai petunjuk
4. Klik tombol hitung untuk melihat hasil

## Struktur File

```
├── index.html                 # Halaman utama (landing page)
├── nav.js                     # Navigasi bersama antar halaman
├── daya-pembeda.html          # Kalkulator Daya Pembeda
├── tingkat-kesukaran.html     # Kalkulator Tingkat Kesukaran
├── cronbach-alpha.html        # Kalkulator Cronbach's Alpha
├── validitas-konstruk.html    # Kalkulator Validitas Konstruk
├── validitas-isi.html         # Kalkulator Validitas Isi (Aiken's V)
├── cek-ewallet.html           # Cek E-Wallet via API Mochi
└── README.md
```

## Teknologi

- HTML, CSS, JavaScript murni (vanilla)
- Tidak memerlukan server atau framework
- Responsif untuk desktop dan mobile
- Semua data diproses secara lokal di browser

## Lisensi

Dibuat untuk kebutuhan analisis instrumen penelitian pendidikan.
