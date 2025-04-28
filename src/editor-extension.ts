// This file contains all the CodeMirror-specific functionality for editor mode

import { syntaxTree } from "@codemirror/language";
import { Extension } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";
import { goLinkRegex, maybeAddHttp } from "./utils";

// class applied to all nodes we create
export const GOLINK_HTML_CLASS = "cm-golink";
// to distinguish live links from source mode ones
export const GOLINK_LIVE_PREVIEW_CLASS = "cm-golink-live";
const DATA_PROPERTY = "data-golink-href";

type GolinkDecoration = {
  start: number;
  end: number;
  goLink: string;
};

/**
 * creates a span that is presented as a link, but acts as plaintext while editing
 */
const createLinkSpan = (
  from: number,
  to: number,
  goLink: string,
  isLivePreview: boolean
) => {
  // Convert go/link to a proper URL (add http:// if missing)
  const href = maybeAddHttp(goLink);

  // Create and return a mark decoration with appropriate attributes
  return Decoration.mark({
    class: [
      "cm-url", // to make styling work like we want
      GOLINK_HTML_CLASS, // to identify these as being ours
      isLivePreview ? GOLINK_LIVE_PREVIEW_CLASS : "",
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
const findGoLinksInText = (
  view: EditorView,
  from: number,
  to: number
): GolinkDecoration[] => {
  const results: GolinkDecoration[] = [];
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

const isExtensionCreatedLink = (target: HTMLElement): boolean =>
  target.classList.contains(GOLINK_HTML_CLASS);

const getHref = (target: HTMLElement): string | null => {
  const href = target.getAttribute(DATA_PROPERTY);
  if (href) {
    return href;
  }

  console.error(`Golink without a ${DATA_PROPERTY}?`);
  return null;
};

/**
 * Creates a CodeMirror extension that makes go/links clickable in the editor
 * @returns A CodeMirror extension
 */
export const goLinksEditorExtension = (): Extension => {
  return ViewPlugin.fromClass(
    class {
      // all the spans we built
      decorations: DecorationSet;
      // if a user switches from source <-> live preview, we have to re-caculate
      lastRenderWasLiveMode: boolean;

      private rebuild(view: EditorView) {
        this.decorations = this.buildDecorations(view);
        this.lastRenderWasLiveMode = isLivePreviewMode(view);
      }

      constructor(view: EditorView) {
        this.rebuild(view);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          isLivePreviewMode(update.view) !== this.lastRenderWasLiveMode
        ) {
          this.rebuild(update.view);
        }
      }

      buildDecorations(view: EditorView): DecorationSet {
        const decorations: Array<{
          from: number;
          to: number;
          value: Decoration;
        }> = [];
        const isLivePreview = isLivePreviewMode(view);

        for (const { from, to } of view.visibleRanges) {
          const links = findGoLinksInText(view, from, to);
          decorations.push(
            ...links.map(({ start, end, goLink }) =>
              createLinkSpan(start, end, goLink, isLivePreview)
            )
          );
        }

        return Decoration.set(decorations);
      }
    },
    {
      decorations: (v: { decorations: DecorationSet }) => v.decorations,

      // Handle click events on go/links
      // these is only used in editing mode (either kind)
      eventHandlers: {
        // we have to handle live preview events early, since by the time `click` fires, the active row has been updated by Obsidian
        // so on mousedown, we check if we're in live preview and not the child of the active row. If so, we open!
        mousedown: (e, view) => {
          const target = e.target as HTMLElement;

          if (!isExtensionCreatedLink(target)) {
            return false;
          }

          const href = getHref(target);
          if (!href) {
            return false;
          }

          if (isLivePreviewMode(view) && !target.closest(".cm-active")) {
            window.open(href, "_blank");
            // don't prevent default (e.g. complete the click)
          }

          return false;
        },
        // this handler is responsible primarily for clicks in source view
        click: (e) => {
          const target = e.target as HTMLElement;

          if (!isExtensionCreatedLink(target)) {
            return false;
          }

          const href = getHref(target);
          if (!href) {
            return false;
          }

          // we're dealing with plain text (rendered links are handled in the markdown processor)
          // so we only open the link if the cmd key is held. Otherwise, it should be treated like text
          if (!e.metaKey) {
            // this is a cursor click in source mode, ignore
            return false;
          }

          // finally, the user is actually clicking a go/link in source mode; open it!
          window.open(href, "_blank");
          e.preventDefault();
        },
      },
    }
  );
};
