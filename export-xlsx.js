// Helper untuk ekspor data ke file .xlsx menggunakan SheetJS (xlsx.mini.min.js).
// Dipakai oleh tombol "Ekspor Excel" pada tiap halaman kalkulator.
(function () {
  'use strict';

  function isReady() {
    return typeof XLSX !== 'undefined' && XLSX.utils && XLSX.writeFile;
  }

  // sheets: [{ name: string, rows: any[][] }, ...]
  function exportSheets(filename, sheets) {
    if (!isReady()) {
      alert('Library Excel belum siap. Coba muat ulang halaman lalu coba lagi.');
      return false;
    }
    if (!Array.isArray(sheets) || sheets.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return false;
    }
    var wb = XLSX.utils.book_new();
    sheets.forEach(function (s) {
      var ws = XLSX.utils.aoa_to_sheet(s.rows || []);
      // Nama sheet di Excel maksimal 31 karakter
      var name = String(s.name || 'Sheet').slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, name);
    });
    try {
      XLSX.writeFile(wb, filename);
      return true;
    } catch (e) {
      alert('Gagal menulis file Excel: ' + (e && e.message ? e.message : e));
      return false;
    }
  }

  window.absExportXLSX = exportSheets;
  window.absExportReady = isReady;
})();
