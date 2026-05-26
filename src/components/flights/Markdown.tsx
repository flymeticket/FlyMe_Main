// Minimal, dependency-free markdown → HTML renderer for AI-generated copy.
// We control the input (own LLM prompt schema), so we don't need a full parser
// like react-markdown. Supports: # h2/h3, paragraphs, **bold**, *italic*,
// unordered/ordered lists, [links](url). Sanitizes by escaping HTML entities
// before rendering.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderInline(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="underline underline-offset-2 hover:opacity-80">$1</a>'
  );
  return out;
}

function mdToHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^### /.test(line)) {
      out.push(`<h3 class="mt-8 text-xl font-light text-fg">${renderInline(line.slice(4))}</h3>`);
      i++;
      continue;
    }
    if (/^## /.test(line)) {
      out.push(`<h2 class="mt-10 text-2xl font-light text-fg">${renderInline(line.slice(3))}</h2>`);
      i++;
      continue;
    }

    // Unordered list block
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].slice(2))}</li>`);
        i++;
      }
      out.push(`<ul class="mt-4 list-disc space-y-1 pl-6 text-fg-muted">${items.join('')}</ul>`);
      continue;
    }

    // Ordered list block
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\d+\. /, ''))}</li>`);
        i++;
      }
      out.push(`<ol class="mt-4 list-decimal space-y-1 pl-6 text-fg-muted">${items.join('')}</ol>`);
      continue;
    }

    // Blank line ends paragraph
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph: gather until next blank or heading
    const para: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{2,3} /.test(lines[i]) &&
      !/^[-*] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    out.push(
      `<p class="mt-4 leading-relaxed text-fg-muted">${renderInline(para.join(' '))}</p>`
    );
  }

  return out.join('\n');
}

export function Markdown({ source }: { source: string }) {
  return <div dangerouslySetInnerHTML={{ __html: mdToHtml(source) }} />;
}
