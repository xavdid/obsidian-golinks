export const goLinkRegex = /\b(https?:\/\/)?go\/[_\d\w\-/]+/;
export const noProtocolGoLink = /\bgo\/[_\d\w\-/]+/;

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

export const maybeAddHttp = (s: string) =>
  s.startsWith("http") ? s : `http://${s}`;

/**
 * creates an `a` Node for use in reader view (i.e. non-interactive)
 */
export const createLinkTag = (el: Element, goLink: string): Element => {
  const href = maybeAddHttp(goLink);
  // if processing a fully-qualified link, don't show the protocol in the link text (to match other go/links)
  const label = goLink.replace(/https?:\/\//, "");

  // <a aria-label-position="top" aria-label="http://go/actual-link" rel="noopener" class="external-link" href="http://go/actual-link" target="_blank">go/actual-link</a>
  // this creates it on the parent element we're replacing, so that's probably fine; we keep the reference to it
  return el.createEl("a", {
    cls: "external-link",
    href,
    text: label,
    attr: {
      "aria-label": href,
      "aria-label-position": "top",
      rel: "noopener",
      target: "_blank",
    },
  });
};

/**
 * take a container element with children, break golinks out of text nodes
 */
export const buildNodeReplacements = (containerEl: HTMLElement): Node[] => {
  const results: Node[] = [];

  containerEl.childNodes.forEach((node) => {
    // quick check if this node is relevant to transform; if not, just pass it through
    if (!isTextNodeWithGoLink(node)) {
      results.push(node);
      return;
    }

    // now we have text that has at least one link
    // we'll go through, splittig it into [before?, go/link, remaining?] until remaining is empty
    let remaining = node.textContent || "";

    while (remaining) {
      const nextLink = parseNextLink(remaining);

      if (!nextLink.found) {
        results.push(document.createTextNode(nextLink.remaining));
        break;
      }

      results.push(document.createTextNode(nextLink.preText));
      results.push(createLinkTag(containerEl, nextLink.link));
      remaining = nextLink.remaining;
    }
  });
  return results;
};
