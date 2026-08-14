import sanitizeHtml from "sanitize-html";

const sanitizeInput = (dirty) => {
  return sanitizeHtml(dirty, {
    allowedTags: [], // strip all HTML — plain text only
    allowedAttributes: {},
  });
};

export { sanitizeInput };