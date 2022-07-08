import each from "jest-each";

import { goLinkRegex, parseNextLink } from "../utils";

describe("go/link regex", () => {
  each([
    ["find a go/link", true],
    ["not find a go link", false],
    ["find a bongo/link", false],
    ["with ;go/punctuation...", true],
    ["go/li-nk", true],
    ["go/ask/it", true],
    ["go/ask/i/t", true],
    ["go/snake_case", true],
    ["go/call-123", true],
    ["go/kitchen_sink-123/cool", true],
    // ["go//hello-世界", true], // doesn't work yet
  ]).test(
    'expect "%s" to match? %s',
    (input: string, shouldFindMatch: boolean) => {
      expect(Boolean(input.match(goLinkRegex))).toEqual(shouldFindMatch);
    }
  );
});

describe("parseNextLink", () => {
  each([
    [
      "go/link and some text",
      {
        found: true,
        link: "go/link",
        preText: "",
        remaining: " and some text",
      },
    ],
    [
      "some text and then a go/link",
      {
        found: true,
        link: "go/link",
        preText: "some text and then a ",
        remaining: "",
      },
    ],
    [
      "some text, a go/link, and some more text",
      {
        found: true,
        link: "go/link",
        preText: "some text, a ",
        remaining: ", and some more text",
      },
    ],
    [
      "linkless text, nothing to see here",
      {
        found: false,
        remaining: "linkless text, nothing to see here",
      },
    ],
    [
      "",
      {
        found: false,
        remaining: "",
      },
    ],
  ]).test("test %#", (input, expected) => {
    expect(parseNextLink(input)).toEqual(expected);
  });
});

// TODO: i'll probably need jsdom to simulate the browser APIs; may need to refactor the functions to take those browser elements as arguments instead of reading `document` from global
// the following functions need tests:
//  * buildNodeReplacements
//  * createLinkTag
//  * isTextNodeWithGoLink
