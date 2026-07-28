import assert from "node:assert/strict";

import { formatReportParagraphs, stripTrailingMarkdownRule } from "../apps/astra-web/lib/report-paragraphs";

const sixParagraphs = [
  "First idea stays first.",
  "Second idea follows it.",
  "Third idea keeps moving.",
  "Fourth idea turns the corner.",
  "Fifth idea adds the practice.",
  "Sixth idea closes the thought."
].join("\n\n");
const grouped = formatReportParagraphs(sixParagraphs);
assert.equal(grouped.split("\n\n").length, 3);
assert.equal(grouped.replace(/\n\n/g, " "), sixParagraphs.replace(/\n\n/g, " "));

const oneParagraph = "You see the pattern. You name the cost. You notice what repeats. You try one change. You keep what works. You let the rest go.";
const split = formatReportParagraphs(oneParagraph);
assert.equal(split.split("\n\n").length, 3);
assert.equal(split.replace(/\n\n/g, " "), oneParagraph);

const twoParagraphs = "You know what matters.\n\nYou act on it.";
assert.equal(formatReportParagraphs(twoParagraphs), twoParagraphs);
assert.equal(formatReportParagraphs("  You   keep   the meaning.  "), "You keep the meaning.");
assert.equal(stripTrailingMarkdownRule("The chapter closes here. ---"), "The chapter closes here.");
assert.equal(stripTrailingMarkdownRule("The chapter closes here.\n\n---"), "The chapter closes here.");
assert.equal(stripTrailingMarkdownRule("A mid-chapter --- marker stays in the sentence."), "A mid-chapter --- marker stays in the sentence.");

console.log("Report prose preserves meaning while rendering in at most three balanced paragraphs.");
