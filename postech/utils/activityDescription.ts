/** Título (1ª linha) e descrição opcional (restante), como no cadastro com `\n`. */

export function parseActivityDescription(description: string): {
  title: string;
  subtitle: string | null;
} {
  const trimmed = description.trim();
  const nl = trimmed.indexOf('\n');
  if (nl === -1) return { title: trimmed, subtitle: null };
  const title = trimmed.slice(0, nl).trim();
  const subtitle = trimmed.slice(nl + 1).trim() || null;
  return { title: title || trimmed, subtitle };
}

export function buildActivityDescription(title: string, notes: string): string {
  const t = title.trim();
  const n = notes.trim();
  return n ? `${t}\n${n}` : t;
}
