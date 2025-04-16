// This file contains all the CodeMirror-specific functionality for editor mode

import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { editorLivePreviewField } from "obsidian";
import { goLinkRegex } from "./utils";

/**
 * Creates a clickable decoration for a go/link
 * @param from - Start position in the document
 * @param to - End position in the document
 * @param goLink - The go/link text
 * @returns A decoration that makes the go/link clickable
 */
export function createGoLinkDecoration(from: number, to: number, goLink: string): { from: number; to: number; value: Decoration } {
  // Convert go/link to a proper URL (add http:// if missing)
  const href = goLink.startsWith("http") ? goLink : `http://${goLink}`;
  
  // Create and return a mark decoration with appropriate attributes
  return Decoration.mark({
    class: "cm-go-link",
    attributes: {
      "data-href": href,
      "title": href
    },
    inclusiveStart: true,
    inclusiveEnd: true
  }).range(from, to);
}

/**
 * Checks if a position in the editor is inside a code block
 * @param view - The editor view
 * @param pos - Position to check
 * @returns True if the position is inside a code block, false otherwise
 */
export function isInsideCodeBlock(view: EditorView, pos: number): boolean {
  try {
    const tree = syntaxTree(view.state);
    const node = tree.resolve(pos, 1);
    return node.type.name.includes("code") || 
           node.type.name.includes("CodeBlock") || 
           node.type.name.includes("inline-code");
  } catch (error) {
    // If we can't determine if it's in a code block, assume it's not
    console.error("Error checking if position is in code block:", error);
    return false;
  }
}

/**
 * Checks if a position in the editor is inside a link
 * @param view - The editor view
 * @param pos - Position to check
 * @returns True if the position is inside a link, false otherwise
 */
export function isInsideLink(view: EditorView, pos: number): boolean {
  try {
    const tree = syntaxTree(view.state);
    const node = tree.resolve(pos, 1);
    return node.type.name.includes("link") || 
           node.type.name.includes("url");
  } catch (error) {
    // If we can't determine if it's in a link, assume it's not
    console.error("Error checking if position is in link:", error);
    return false;
  }
}

/**
 * Checks if the editor is in Live Preview mode
 * @param view - The editor view
 * @returns True if in Live Preview mode, false otherwise
 */
export function isLivePreviewMode(view: EditorView): boolean {
  try {
    return view.state.field(editorLivePreviewField);
  } catch (error) {
    // If we can't determine the mode, assume it's not Live Preview
    console.error("Error checking if in Live Preview mode:", error);
    return false;
  }
}

/**
 * Finds all go/links in a range of text
 * @param view - The editor view
 * @param from - Start position in the document
 * @param to - End position in the document
 * @returns Array of objects containing start, end, and goLink properties
 */
export function findGoLinksInText(view: EditorView, from: number, to: number): {start: number, end: number, goLink: string}[] {
  const results: {start: number, end: number, goLink: string}[] = [];
  const text = view.state.doc.sliceString(from, to);
  const regex = new RegExp(goLinkRegex, 'g');
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const start = from + match.index;
    const end = start + match[0].length;
    
    // Skip if inside code block or existing link
    if (isInsideCodeBlock(view, start) || isInsideLink(view, start)) {
      continue;
    }
    
    results.push({
      start,
      end,
      goLink: match[0]
    });
  }
  
  return results;
}

/**
 * Creates a CodeMirror extension that makes go/links clickable in the editor
 * @returns A CodeMirror extension
 */
export function goLinksEditorExtension(): Extension {
  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    
    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }
    
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
    
    buildDecorations(view: EditorView): DecorationSet {
      const decorations: { from: number; to: number; value: Decoration }[] = [];
      const isLivePreview = isLivePreviewMode(view);
      
      // Iterate through visible ranges
      for (const { from, to } of view.visibleRanges) {
        // In Live Preview mode, we need to be more selective
        if (isLivePreview) {
          // In Live Preview, Obsidian already renders some Markdown elements
          // We need to avoid decorating links that will be rendered by Obsidian
          
          // Get all go/links in the range
          const links = findGoLinksInText(view, from, to);
          
          for (const link of links) {
            // Additional check for Live Preview: make sure the link isn't in a rendered element
            // This is a simplified check - in a real implementation, you'd need more sophisticated logic
            const lineText = view.state.doc.lineAt(link.start).text;
            
            // Skip links in lines that look like they might be rendered by Obsidian
            // This is a heuristic and might need adjustment
            const isInRenderedElement = lineText.trim().startsWith('>') || // blockquote
                                       lineText.trim().startsWith('- ') || // list
                                       lineText.trim().startsWith('* ') || // list
                                       lineText.trim().startsWith('1. '); // numbered list
            
            if (!isInRenderedElement) {
              decorations.push(createGoLinkDecoration(link.start, link.end, link.goLink));
            }
          }
        } else {
          // Standard editor mode - decorate all go/links that aren't in code blocks or links
          const links = findGoLinksInText(view, from, to);
          
          for (const link of links) {
            decorations.push(createGoLinkDecoration(link.start, link.end, link.goLink));
          }
        }
      }
      
      return Decoration.set(decorations);
    }
  }, {
    decorations: (v: { decorations: DecorationSet }) => v.decorations,
    
    // Handle click events on go/links
    eventHandlers: {
      click: (e: MouseEvent, view: EditorView) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains("cm-go-link")) {
          const href = target.getAttribute("data-href");
          if (href) {
            try {
              window.open(href, "_blank");
              e.preventDefault();
              return true;
            } catch (error) {
              console.error("Error opening go/link:", error);
            }
          }
        }
        return false;
      }
    }
  });
}