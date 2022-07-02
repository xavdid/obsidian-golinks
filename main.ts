/* eslint-disable prefer-const */
import { AsyncLocalStorage } from "async_hooks";
import {
  App,
  Editor,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  MarkdownRenderChild,
} from "obsidian";

const goLinkRegex = /go\/[_\d\w-/]+/;
type RegexResult = ReturnType<string["match"]>;

const parseNextLink = (
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

const createLinkTag = (el: Element, goLink: string): Element => {
  const a = el.createEl("a");

  // <a aria-label-position="top" aria-label="http://go/actual-link" rel="noopener" class="external-link" href="http://go/actual-link" target="_blank">go/bad</a>
  const href = `http://${goLink}`;
  a.href = href;
  a.text = goLink;
  a.ariaLabel = href;
  a.setAttribute("aria-label-position", "top");
  a.rel = "noopener";
  a.className = "external-link";
  a.target = "_blank";

  return a;
};

/**
 * A class that replaces the content of an element by splitting out `go/links` and linkifying them.
 */
class GoLinkContainer extends MarkdownRenderChild {
  constructor(containerEl: HTMLElement) {
    super(containerEl);
  }

  onload(): void {
    const results: Parameters<typeof this.containerEl.replaceChildren> = [];

    // goes through each child, spliting them into multiple go find the go/links
    this.containerEl.childNodes.forEach((node) => {
      if (
        node.nodeType !== Node.TEXT_NODE ||
        !node.textContent?.match(goLinkRegex)
      ) {
        // not text or text doesn't have a link; ignore
        results.push(node);
        return;
      }

      // now we have text that has at least one link
      // we'll go through, splittig it into [before?, go/link, remaining?] until remaining is empty
      let remaining = node.textContent || "";

      // let nextLink: ReturnType<string["match"]> = null;
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
export default class GoLinksPlugin extends Plugin {
  async onload() {
    this.registerMarkdownPostProcessor((element, context) => {
      // todo: add block quote?
      const elementsToCheck = element.querySelectorAll("p, li");

      elementsToCheck.forEach((el) => {
        let shouldReplaceChildrenOfContainer = false;
        // check each child node- we're only worried about plaintext nodes with go/links in them
        for (let i = 0; i < el.childNodes.length; i++) {
          const child = el.childNodes[i];
          if (
            child.nodeType === Node.TEXT_NODE &&
            child.textContent?.match(goLinkRegex)
          ) {
            shouldReplaceChildrenOfContainer = true;
            break;
          }
        }

        if (!shouldReplaceChildrenOfContainer) {
          return;
        }

        context.addChild(new GoLinkContainer(el as HTMLElement));

        // console.log("replace me", el, el.textContent);

        // el.replaceChildren("text", "goes", "here");
        // el.replaceWith(el.createSpan({ text: "link goes here" }));
      });
    });
  }
}

// elementsToCheck.forEach((element) => {
//   let changed = false;

// https://www.golinks.com/help/golinks-naming-conventions/
// const goLinks = (node.textContent ?? "").match(
// 	/go\/[_\d\w-/]+/
// );

// for (const goLink of goLinks) {
// 	changed = true;

// 	console.log(goLink);
// }
// });
// if (changed) {
// element.setChildrenInPlace(result);
//     // context.
//   }
// });
// });
//   }
// }
