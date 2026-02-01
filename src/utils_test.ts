// @ts-nocheck
/**
 * Game Crafter Utils Tests
 *
 * Unit tests for utility functions.
 *
 * Run with:
 *   yao agent test -i scripts.yao.craft.utils -v
 */

import { testing, agent } from "@yao/runtime";
import { extractFromSingleFile } from "./sui";

/**
 * Test extractFromSingleFile - extracts CSS from style tags
 */
export function TestExtractCSS(t: testing.T, ctx: agent.Context) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { background: #000; }
        .game { color: #fff; }
      </style>
    </head>
    <body>
      <div class="game">Hello</div>
    </body>
    </html>
  `;

  const result = extractFromSingleFile(html);

  t.assert.Contains(result.css, "body { background: #000; }", "Should extract body style");
  t.assert.Contains(result.css, ".game { color: #fff; }", "Should extract game class style");
}

/**
 * Test extractFromSingleFile - extracts JS from script tags
 */
export function TestExtractJS(t: testing.T, ctx: agent.Context) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="external.js"></script>
    </head>
    <body>
      <script>
        const game = { score: 0 };
        function update() { game.score++; }
      </script>
    </body>
    </html>
  `;

  const result = extractFromSingleFile(html);

  t.assert.Contains(result.js, "const game = { score: 0 };", "Should extract game variable");
  t.assert.Contains(result.js, "function update()", "Should extract update function");
  t.assert.NotContains(result.js, "external.js", "Should NOT include external script src");
}

/**
 * Test extractFromSingleFile - handles multiple style/script tags
 */
export function TestExtractMultiple(t: testing.T, ctx: agent.Context) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>.header { color: blue; }</style>
      <style>.footer { color: red; }</style>
    </head>
    <body>
      <script>const a = 1;</script>
      <script>const b = 2;</script>
    </body>
    </html>
  `;

  const result = extractFromSingleFile(html);

  t.assert.Contains(result.css, ".header { color: blue; }", "Should extract header style");
  t.assert.Contains(result.css, ".footer { color: red; }", "Should extract footer style");
  t.assert.Contains(result.js, "const a = 1;", "Should extract first script");
  t.assert.Contains(result.js, "const b = 2;", "Should extract second script");
}

/**
 * Test extractFromSingleFile - empty input
 */
export function TestExtractEmpty(t: testing.T, ctx: agent.Context) {
  const result = extractFromSingleFile("");

  t.assert.Equal(result.css, "", "CSS should be empty");
  t.assert.Equal(result.js, "", "JS should be empty");
}

/**
 * Test extractFromSingleFile - no style/script tags
 */
export function TestExtractNoTags(t: testing.T, ctx: agent.Context) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <div>Hello World</div>
    </body>
    </html>
  `;

  const result = extractFromSingleFile(html);

  t.assert.Equal(result.css, "", "CSS should be empty when no style tags");
  t.assert.Equal(result.js, "", "JS should be empty when no script tags");
}
