// CSV export helpers ported from jesse/dashboard_patches/{universe_scan,portfolio}_page.template.js.

export function csvEscape(v: unknown): string {
  if (v === undefined || v === null) return '';
  const isNumber = typeof v === 'number';
  let s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  // Excel/Sheets treat a cell starting with =, +, -, @, or a leading tab/CR as a
  // formula to execute on open - prefix with a single quote to force it to stay literal
  // text (CSV formula injection). Only applies to non-numeric cells: a numeric cell
  // (e.g. a negative pnl_pct) must stay a plain number, not gain a guard quote just for
  // starting with '-'.
  if (!isNumber && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function downloadTextFile(filename: string, text: string, mime = 'text/csv'): void {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
