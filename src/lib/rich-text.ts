import sanitizeHtml from 'sanitize-html';

const options: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'img', 'h2', 'h3', 'blockquote', 'ul', 'ol', 'li', 'font'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title'],
    font: ['size'],
    '*': ['style'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedStyles: { '*': { 'font-size': [/^\d{1,2}px$/] } },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }, true),
  },
};

export function sanitizeRichText(value: string) {
  return sanitizeHtml(value, options).trim();
}

export function richTextToPlain(value: string) {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();
}
