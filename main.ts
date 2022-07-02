/* eslint-disable prefer-const */
import {
  App,
  Editor,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";

export default class GoLinksPlugin extends Plugin {
  async onload() {
    this.registerMarkdownPostProcessor((element, context) => {
      // console.log(element, context);
      // console.log(element);
      const elementsToCheck = element.querySelectorAll("p, li");
      // console.log("found", textAndListItems);
      elementsToCheck.forEach((element) => {
        let changed = false;
        const result: Node[] = [];

        element.childNodes.forEach((node) => {
          if (node.nodeType !== Node.TEXT_NODE) {
            result.push(node);
            return;
          }

          let text = node.textContent || "";

          let nextLink: ReturnType<string["match"]> = null;
          do {
            nextLink = text.match(/go\/[_\d\w-/]+/);
            // todo: make function
            if (nextLink === null) {
              continue;
            }

            changed = true;
            result.push(document.createTextNode(text.slice(0, nextLink.index)));
            // <a aria-label-position="top" aria-label="http://go/actual-link" rel="noopener" class="external-link" href="http://go/actual-link" target="_blank">go/bad</a>
            const newLink = document.createElement("a");
            newLink.href = `http://${nextLink[0]}`;
            newLink.text = nextLink[0];
            result.push(newLink);
            text = text.slice((nextLink.index ?? 0) + nextLink[0].length);
          } while (nextLink != null);
          result.push(document.createTextNode(text));

          // https://www.golinks.com/help/golinks-naming-conventions/
          // const goLinks = (node.textContent ?? "").match(
          // 	/go\/[_\d\w-/]+/
          // );

          // for (const goLink of goLinks) {
          // 	changed = true;

          // 	console.log(goLink);
          // }
        });
        if (changed) {
          element.setChildrenInPlace(result);
        }
      });
    });
  }
}
