import { Plugin, MarkdownRenderChild } from "obsidian";

import { createLinkTag, isTextNodeWithGoLink, parseNextLink } from "./utils";

/**
 * A class that replaces the content of an element by splitting out `go/links` and linkifying them.
 * A given `p` tag could have many children. Many will be `text` nodes, but there will also be `span`s, links, etc.
 * this function copies the list of children
 * most pass though as-is, but some `text` nodes are split into many smaller nodes, which makes iterating tricky
 * the `text` node `before go/example after` becomes 3:
 *  * text: `before `
 *  * `<a href="http://go/example" ...>go/example</a>`
 *  * text: ` after`
 */
class GoLinkContainer extends MarkdownRenderChild {
  constructor(containerEl: HTMLElement) {
    super(containerEl);
  }

  onload(): void {
    const results: Parameters<typeof this.containerEl.replaceChildren> = [];

    this.containerEl.childNodes.forEach((node) => {
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
          results.push(nextLink.remaining);
          break;
        }

        results.push(nextLink.preText);
        results.push(createLinkTag(this.containerEl, nextLink.link));
        remaining = nextLink.remaining;
      }
    });
    this.containerEl.replaceChildren(...results);
  }
}

/**
 * check each child node- we're only worried about plaintext nodes with go/links in them
 * basic replacement for `Array.some()`, which doesn't exist on `NodeListOf<ChildNode>`
 * this lets us avoid ever calling the replacement class on extraneous nodes
 */
const anyReplacableNodes = (el: Element): boolean => {
  for (let i = 0; i < el.childNodes.length; i++) {
    const child = el.childNodes[i];
    if (isTextNodeWithGoLink(child)) {
      return true;
    }
  }
  return false;
};

export default class GoLinksPlugin extends Plugin {
  async onload() {
    this.registerMarkdownPostProcessor((element, context) => {
      element.querySelectorAll("p, li").forEach((el) => {
        if (anyReplacableNodes(el)) {
          context.addChild(new GoLinkContainer(el as HTMLElement));
        }
      });
    });
  }
}
