/**
 * Match WordPress plugin `rvbot-app.js` `formatAiText` output for identical AI bubble styling.
 */
export function formatAiText(text) {
  if (!text || typeof text !== 'string') return '';
  const lines = text.split('\n');
  const formatted = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      if (i > 0 && i < lines.length - 1 && lines[i - 1].trim() && lines[i + 1].trim()) {
        formatted.push('<div class="msg-break"></div>');
      }
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      const hasPrevContent = prevLine && !prevLine.match(/^[•→]/);
      if (hasPrevContent && formatted.length > 0) {
        const lastItem = formatted[formatted.length - 1];
        if (!lastItem.includes('msg-divider') && !lastItem.includes('msg-break')) {
          formatted.push('<div class="msg-divider"></div>');
        }
      }
      let heading = trimmed.replace(/\*\*/g, '');
      formatted.push(`<div class="msg-section-heading">${heading}</div>`);
      continue;
    }
    if (/^[^\w\d]*\s*\d+\.\s+/.test(trimmed)) {
      const hasContent = /\d+\.\s+\w+/.test(trimmed);
      if (hasContent) {
        const prevLine = i > 0 ? lines[i - 1].trim() : '';
        const hasPrevContent = prevLine && !prevLine.match(/^[•→]/);
        if (hasPrevContent && formatted.length > 0) {
          const lastItem = formatted[formatted.length - 1];
          if (!lastItem.includes('msg-divider') && !lastItem.includes('msg-break')) {
            formatted.push('<div class="msg-divider"></div>');
          }
        }
        let heading = trimmed.replace(/\*\*/g, '');
        formatted.push(`<div class="msg-section-heading">${heading}</div>`);
        continue;
      }
    }
    if (/^→\s+/.test(trimmed)) {
      let tip = trimmed.replace(/^→\s+/, '').replace(/\*\*/g, '');
      formatted.push(`<div class="msg-tip">→ ${tip}</div>`);
      continue;
    }
    if (/^\*\*[^*]+\*\*:?\s*$/.test(trimmed)) {
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      const hasPrevContent = prevLine && !prevLine.match(/^[•→]/);
      if (hasPrevContent && formatted.length > 0) {
        const lastItem = formatted[formatted.length - 1];
        if (!lastItem.includes('msg-divider') && !lastItem.includes('msg-break')) {
          formatted.push('<div class="msg-divider"></div>');
        }
      }
      let heading = trimmed.replace(/\*\*/g, '');
      formatted.push(`<div class="msg-section-heading">${heading}</div>`);
      continue;
    }
    if (/^\*\*\d+\.\s+[^*]+\*\*/.test(trimmed)) {
      let step = trimmed.replace(/\*\*/g, '');
      formatted.push(`<div class="msg-section-heading">${step}</div>`);
      continue;
    }
    if (/^•\s+/.test(trimmed)) {
      let bullet = trimmed.replace(/^•\s+/, '');
      bullet = bullet.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      bullet = bullet.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      formatted.push(`<div class="msg-bullet">• ${bullet}</div>`);
      continue;
    }
    let para = trimmed;
    para = para.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    para = para.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    para = para.replace(/`([^`]+)`/g, '<code>$1</code>');
    para = para.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    if (para) formatted.push(`<div class="msg-paragraph">${para}</div>`);
  }
  return formatted.join('');
}
