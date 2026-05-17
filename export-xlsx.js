// Helper untuk ekspor data ke file .xlsx menggunakan SheetJS (xlsx.mini.min.js).
// Dipakai oleh tombol "Ekspor Excel" pada tiap halaman kalkulator.
//
// Setiap cell pada `rows` boleh berupa:
//   - nilai biasa (number/string/null/boolean)
//   - objek formula: { f: 'A2+B2', v: 7 }  -> formula Excel; v dipakai sebagai
//     cached value sehingga sel langsung menunjukkan hasil meski Excel belum
//     menghitung ulang. Awalan '=' opsional pada `f`.
//   - objek nilai: { v: 'text' }            -> nilai biasa via objek
(function () {
  'use strict';

  function isReady() {
    return typeof XLSX !== 'undefined' && XLSX.utils && XLSX.writeFile;
  }

  function inferType(v) {
    if (typeof v === 'number') return 'n';
    if (typeof v === 'boolean') return 'b';
    return 's';
  }

  // Ubah baris yang mengandung cell {f, v} menjadi array nilai biasa,
  // sambil mencatat formula yang harus ditempel ulang ke worksheet.
  function extractFormulas(rows) {
    var formulas = [];
    var plainRows = rows.map(function (row, r) {
      if (!Array.isArray(row)) return row;
      return row.map(function (cell, c) {
        if (cell && typeof cell === 'object' && !Array.isArray(cell)) {
          if (typeof cell.f === 'string' && cell.f.length > 0) {
            formulas.push({ r: r, c: c, f: cell.f, v: cell.v });
            // Placeholder agar aoa_to_sheet tetap membuat sel pada posisi ini
            return cell.v != null ? cell.v : 0;
          }
          if ('v' in cell) return cell.v;
        }
        return cell;
      });
    });
    return { plainRows: plainRows, formulas: formulas };
  }

  function applyFormulas(ws, formulas) {
    formulas.forEach(function (info) {
      var addr = XLSX.utils.encode_cell({ r: info.r, c: info.c });
      var existing = ws[addr] || {};
      // Buang awalan '=' jika user menyertakannya; SheetJS expects formula tanpa '='
      var f = info.f.replace(/^=+/, '');
      existing.f = f;
      if (info.v != null) {
        existing.v = info.v;
        existing.t = existing.t || inferType(info.v);
      } else {
        existing.t = existing.t || 'n';
      }
      ws[addr] = existing;
    });
  }

  function applyColumnWidths(ws, rows) {
    if (!rows || !rows.length) return;
    var maxCols = 0;
    rows.forEach(function (r) { if (Array.isArray(r) && r.length > maxCols) maxCols = r.length; });
    if (!maxCols) return;
    var widths = new Array(maxCols).fill(8);
    rows.forEach(function (r) {
      if (!Array.isArray(r)) return;
      r.forEach(function (cell, idx) {
        var text;
        if (cell == null) text = '';
        else if (typeof cell === 'object') text = String(cell.v != null ? cell.v : (cell.f || ''));
        else text = String(cell);
        var len = text.length;
        if (len + 2 > widths[idx]) widths[idx] = Math.min(60, len + 2);
      });
    });
    ws['!cols'] = widths.map(function (w) { return { wch: w }; });
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
      var srcRows = s.rows || [];
      var extracted = extractFormulas(srcRows);
      var ws = XLSX.utils.aoa_to_sheet(extracted.plainRows);
      applyFormulas(ws, extracted.formulas);
      applyColumnWidths(ws, srcRows);
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

  // Helper untuk membentuk cell formula dengan nilai cached
  function formula(f, v) {
    return { f: f, v: v };
  }

  // Helper untuk membentuk referensi sel Excel dari (row, col) 0-indexed
  function cellRef(row, col) {
    if (typeof XLSX !== 'undefined' && XLSX.utils && XLSX.utils.encode_cell) {
      return XLSX.utils.encode_cell({ r: row, c: col });
    }
    // Fallback sederhana
    var letters = '';
    var c = col;
    do {
      letters = String.fromCharCode(65 + (c % 26)) + letters;
      c = Math.floor(c / 26) - 1;
    } while (c >= 0);
    return letters + (row + 1);
  }

  window.absExportXLSX = exportSheets;
  window.absExportReady = isReady;
  window.absXLSXFormula = formula;
  window.absXLSXCell = cellRef;
})();
