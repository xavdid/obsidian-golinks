import { Plugin, MarkdownRenderChild } from "obsidian";

import { buildNodeReplacements, isTextNodeWithGoLink } from "./utils";

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
    this.containerEl.setChildrenInPlace(
      buildNodeReplacements(this.containerEl)
    );
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
