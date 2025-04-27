// This file contains all the CodeMirror-specific functionality for editor mode

import { syntaxTree } from "@codemirror/language";
import { Extension, RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";
import { goLinkRegex, maybeAddHttp } from "./utils";

export const GOLINK_HTML_CLASS = "cm-golink";
export const GOLINK_LIVE_PREVIEW_CLASS = "cm-golink-live";
// const
const DATA_PROPERTY = "data-golink-href";

class GoLinkLiveNode extends WidgetType {
  constructor(private href: string) {
    super();
  }

  toDOM(): HTMLElement {
    // mirrors the shape of naturally created urls

    const link = document.createElement("a");
    link.href = maybeAddHttp(this.href);
    link.textContent = this.href;
    link.className = "cm-underline";

    const span = document.createElement("span");
    span.className = "cm-url";
    span.appendChild(link);
    // span.setAttribute("contenteditable", "true");
    span.removeAttribute("contenteditable");

    return span;
  }
}

/**
 * creates a span that is presented as a link, but acts as plaintext while editing
 */
const createLinkSpan = (
  from: number,
  to: number,
  goLink: string,
  livemode: boolean
) => {
  // Convert go/link to a proper URL (add http:// if missing)
  const href = maybeAddHttp(goLink);

  // const link = document.createElement("a");
  // link.href = href;
  // link.textContent = `go/${href}`;
  // link.className = "your-link-class"; // Add Obsidian's or your own styling here
  // link.target = "_blank"; // Optional

  // Create and return a mark decoration with appropriate attributes
  return Decoration.mark({
    class: [
      "cm-url", // to make styling work like we want
      GOLINK_HTML_CLASS, // to identify these as being ours
      livemode ? GOLINK_LIVE_PREVIEW_CLASS : "",
    ]
      .filter(Boolean)
      .join(" "),
    attributes: {
      [DATA_PROPERTY]: href,
      title: href,
    },
    inclusiveStart: true,
    inclusiveEnd: true,
  }).range(from, to);
};

const createLinkA = (
  ranges: { from: number; to: number; goLink: string }[]
): DecorationSet => {
  // Convert go/link to a proper URL (add http:// if missing)

  // Create and return a mark decoration with appropriate attributes
  // return Decoration.replace({
  //   widget: new GoLinkLiveNode(goLink),
  // }).range(from, to);

  const builder = new RangeSetBuilder<Decoration>();

  // if i'm trying to emulate live preview, I could check if i'm under a `cm-active` line and render differnetly. I think the isInsideSkippableNode will help handle that?

  for (const range of ranges) {
    const href = maybeAddHttp(range.goLink);
    const innerDeco = Decoration.mark({
      class: "cm-underline",
      tagName: "a",
      attributes: {
        [DATA_PROPERTY]: href,
        title: href,
        href,
      },
      inclusive: true,
    }); // <a>
    const outerDeco = Decoration.mark({ class: "cm-url", inclusive: true }); // <span>
    builder.add(range.from, range.to, outerDeco);
    builder.add(range.from, range.to, innerDeco); // innerDeco must come first
  }

  return builder.finish();
};

// if our current position is inside any of these nodes, then we'll skip rendering the golink
const SKIPPABLE_NODE_NAMES = [
  "code",
  "CodeBlock",
  "inline-code",
  "link",
  "url",
];

const isInsideSkippableNode = (view: EditorView, pos: number): boolean => {
  try {
    const nodeName = syntaxTree(view.state).resolve(pos, 1).type.name;

    return SKIPPABLE_NODE_NAMES.some((skippableName) =>
      nodeName.includes(skippableName)
    );
  } catch (error) {
    // If we can't determine if it's in a code block, assume it's not
    console.error("Error checking if position is in code block:", error);
    return false;
  }
};

/**
 * Checks if the editor is in Live Preview mode
 * @param view - The editor view
 * @returns True if in Live Preview mode, false otherwise
 */
const isLivePreviewMode = (view: EditorView): boolean =>
  Boolean(view.state.field(editorLivePreviewField, false));

/**
 * Finds all go/links in a range of text
 * @param view - The editor view
 * @param from - Start position in the document
 * @param to - End position in the document
 * @returns Array of objects containing start, end, and goLink properties
 */
export const findGoLinksInText = (
  view: EditorView,
  from: number,
  to: number
): { start: number; end: number; goLink: string }[] => {
  const results: { start: number; end: number; goLink: string }[] = [];
  const text = view.state.doc.sliceString(from, to);
  const regex = new RegExp(goLinkRegex, "g");
  let match;

  while ((match = regex.exec(text)) !== null) {
    const start = from + match.index;
    const end = start + match[0].length;

    // Skip if inside code block or existing link
    if (isInsideSkippableNode(view, start)) {
      continue;
    }

    results.push({
      start,
      end,
      goLink: match[0],
    });
  }

  return results;
};

/**
 * Creates a CodeMirror extension that makes go/links clickable in the editor
 * @returns A CodeMirror extension
 */
export const goLinksEditorExtension = (): Extension => {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      // track whether we last rendered in live or not (and respond to that)
      lastRenderWasLiveMode: boolean;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
        this.lastRenderWasLiveMode = isLivePreviewMode(view);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          isLivePreviewMode(update.view) !== this.lastRenderWasLiveMode
        ) {
          this.decorations = this.buildDecorations(update.view);
          this.lastRenderWasLiveMode = isLivePreviewMode(update.view);
        }
      }

      buildDecorations(view: EditorView): DecorationSet {
        const decorations: Array<{
          from: number;
          to: number;
          value: Decoration;
        }> = [];
        const isLivePreview = isLivePreviewMode(view);

        // Iterate through visible ranges
        for (const { from, to } of view.visibleRanges) {
          const links = findGoLinksInText(view, from, to);
          // if (isLivePreview) {
          //   return createLinkA(
          //     links.map(({ start, end, goLink }) => ({
          //       from: start,
          //       to: end,
          //       goLink,
          //     }))
          //   );
          // } else {
          for (const link of links) {
            decorations.push(
              // isLivePreview
              // ? // TODO: difference?
              // createLinkSpan(link.start, link.end, link.goLink)
              createLinkSpan(link.start, link.end, link.goLink, isLivePreview)
            );
          }
          // }
        }

        return Decoration.set(decorations);
      }
    },
    {
      decorations: (v: { decorations: DecorationSet }) => v.decorations,

      // Handle click events on go/links
      // this is only used in editing mode (either kind)
      eventHandlers: {
        mousedown: (e, view) => {
          // we have to handle live preview events early, since by the time `click` fires, the active row has been updated by Obsidian

          // so on mousedown, we check if we're in live preview and not the child of the active row. If so, we open!

          const target = e.target as HTMLElement;
          if (!target.classList.contains(GOLINK_HTML_CLASS)) {
            console.log("down early return 1 (not my link)");
            return false;
          }

          if (isLivePreviewMode(view) && !target.closest(".cm-active")) {
            const href = target.getAttribute(DATA_PROPERTY);
            if (!href) {
              console.error(`Golink without a ${DATA_PROPERTY}?`);
              console.log("down early return 2 (no data property)");
              return false;
            }

            try {
              console.log("opening");
              window.open(href, "_blank");
              // don't prevent default (e.g. complete the click)
              // e.preventDefault();
              // return true;
            } catch (error) {
              console.error("Error opening go/link:", error);
            }
          }

          return false;
        },
        click: (e, view) => {
          // this handler only matters for source mode, since live preview is handled above
          const target = e.target as HTMLElement;
          console.log("clicking in handler!", target, e.metaKey);
          // ignore clicks on things that we didn't create
          if (!target.classList.contains(GOLINK_HTML_CLASS)) {
            console.log("early return 1 (not my link)");
            return false;
          }

          const href = target.getAttribute(DATA_PROPERTY);
          if (!href) {
            console.error(`Golink without a ${DATA_PROPERTY}?`);
            console.log("early return 2 (no data property)");
            return false;
          }

          // if (isLivePreviewMode(view)) {
          //   // nothing happens in this handler
          //   return false;
          // }

          if (!e.metaKey) {
            // this is a cursor click in source mode, ignore
            return false;
          }

          // finally, the user is actually clicking a go/link in source mode; open it!
          try {
            console.log("opening");
            window.open(href, "_blank");
            e.preventDefault();
            return true;
          } catch (error) {
            console.error("Error opening go/link:", error);
          }
        },
      },
    }
  );
};
