export const goLinkRegex = /go\/[_\d\w-/]+/;

export const isTextNodeWithGoLink = (n: Node): boolean =>
  n.nodeType === Node.TEXT_NODE && Boolean(n.textContent?.match(goLinkRegex));

export const parseNextLink = (
  text: string
):
  | { found: false; remaining: string }
  | { found: true; preText: string; link: string; remaining: string } => {
  const result = text.match(goLinkRegex);
  if (result == null) {
    return { found: false, remaining: text };
  }

  const preText = text.slice(0, result.index);
  const link = result[0];
  const remaining = text.slice((result.index ?? 0) + link.length);
  return { found: true, preText, link, remaining };
};

export const createLinkTag = (el: Element, goLink: string): Element => {
  const href = `http://${goLink}`;
  // <a aria-label-position="top" aria-label="http://go/actual-link" rel="noopener" class="external-link" href="http://go/actual-link" target="_blank">go/bad</a>
  // this creates it on the parent element we're replacing, so that's probably fine; we keep the reference to it
  return el.createEl("a", {
    cls: "external-link",
    href,
    text: goLink,
    attr: {
      "aria-label": href,
      "aria-label-position": "top",
      rel: "noopener",
      target: "_blank",
    },
  });
};
