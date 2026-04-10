/** Máscara e parsing DD/MM/AAAA + HH:MM (24h), usados no cadastro/edição de lembretes. */

export function formatDateInput(text: string): string {
  const numbers = text.replace(/\D/g, '');
  if (numbers === '') return '';
  const limited = numbers.slice(0, 8);
  if (limited.length <= 2) return limited;
  if (limited.length <= 4) return `${limited.slice(0, 2)}/${limited.slice(2)}`;
  return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
}

export function formatTimeInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function parseDate(dateString: string): Date | null {
  if (!dateString || dateString.length < 10) return null;
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null;
  const d = new Date(year, month, day);
  if (d.getDate() !== day || d.getMonth() !== month || d.getFullYear() !== year) return null;
  return d;
}

export function parseTime(timeString: string): { h: number; m: number } | null {
  if (!timeString || timeString.length < 5) return null;
  const [a, b] = timeString.split(':');
  const h = parseInt(a, 10);
  const m = parseInt(b, 10);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

export function combineDateTime(dateStr: string, timeStr: string): Date | null {
  const d = parseDate(dateStr);
  const t = parseTime(timeStr);
  if (!d || !t) return null;
  d.setHours(t.h, t.m, 0, 0);
  return d;
}

/** Data/hora padrão: próximo dia útil às 9h se já passou hoje. */
export function defaultScheduleDateTimeStrings(): { date: string; time: string } {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  if (d.getTime() <= Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return { date: `${day}/${month}/${year}`, time: '09:00' };
}
