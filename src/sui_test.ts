// @ts-nocheck
import { testing, agent, log, Process } from "@yao/runtime";
import {
  createGamePage,
  buildGamePage,
  extractFromSingleFile,
  extractBodyContent,
  extractFontImports,
  wrapJsForSui,
  isAlreadyWrapped,
} from "./sui";

// ==================== Extract Tests ====================

export function TestExtractFromSingleFile(t: testing.T, ctx: agent.Context) {
  const html = `
    <html>
      <head>
        <style>.test { color: red; }</style>
      </head>
      <body>
        <script>console.log("hello");</script>
      </body>
    </html>
  `;

  const result = extractFromSingleFile(html);

  t.assert.Contains(result.css, ".test { color: red; }", "Should extract CSS");
  t.assert.Contains(result.js, 'console.log("hello")', "Should extract JS");
}

export function TestExtractBodyContent(t: testing.T, ctx: agent.Context) {
  const html = `
    <html>
      <body>
        <div id="game">Game Content</div>
        <style>.hidden { display: none; }</style>
        <script>init();</script>
      </body>
    </html>
  `;

  const result = extractBodyContent(html);

  t.assert.Contains(result, "Game Content", "Should contain body content");
  t.assert.True(!result.includes("<style"), "Should not contain style tag");
  t.assert.True(!result.includes("<script"), "Should not contain script tag");
}

// ==================== JavaScript Wrapping Tests ====================

export function TestIsAlreadyWrapped(t: testing.T, ctx: agent.Context) {
  // Code already wrapped in init()
  const wrappedInit = `function init() {
  const canvas = document.getElementById('game');
  gameLoop();
}

init();`;

  // Code already wrapped in main()
  const wrappedMain = `function main() {
  console.log("hello");
}
main();`;

  // Code NOT wrapped
  const notWrapped = `const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
gameLoop();`;

  // Code with init function but not called
  const initNotCalled = `function init() {
  gameLoop();
}`;

  t.assert.True(isAlreadyWrapped(wrappedInit), "Should detect init() wrapped code");
  t.assert.True(isAlreadyWrapped(wrappedMain), "Should detect main() wrapped code");
  t.assert.False(isAlreadyWrapped(notWrapped), "Should detect unwrapped code");
  t.assert.False(isAlreadyWrapped(initNotCalled), "Should detect init without call");
}

export function TestWrapJsForSui(t: testing.T, ctx: agent.Context) {
  // Test unwrapped code gets wrapped
  const unwrapped = `const canvas = document.getElementById('game');
gameLoop();`;
  
  const wrapped = wrapJsForSui(unwrapped);
  log.Info(`Wrapped result:\n${wrapped}`);
  
  t.assert.Contains(wrapped, "function init()", "Should contain init function");
  t.assert.Contains(wrapped, "init();", "Should call init at end");
  t.assert.Contains(wrapped, "const canvas", "Should contain original code");

  // Test already wrapped code is not double-wrapped
  const alreadyWrapped = `function init() {
  const canvas = document.getElementById('game');
}

init();`;

  const result = wrapJsForSui(alreadyWrapped);
  t.assert.Equal(result, alreadyWrapped, "Should not double-wrap");
}

// ==================== SUI Page Tests ====================

export function TestCreateGamePage(t: testing.T, ctx: agent.Context) {
  const chatId = "test-game-" + Date.now();
  const gameFiles = {
    html: `
      <!DOCTYPE html>
      <html>
        <head><title>Test Game</title></head>
        <body>
          <canvas id="game"></canvas>
        </body>
      </html>
    `,
    css: "canvas { border: 1px solid #333; }",
    js: "const canvas = document.getElementById('game');",
  };

  const result = createGamePage(chatId, gameFiles, "Test Game");

  log.Info(`Create result: ${JSON.stringify(result)}`);

  t.assert.True(result.success, `Should create page successfully: ${result.error || ""}`);
  t.assert.Equal(result.route, `/ai/${chatId}`, "Route should match");
}

export function TestBuildGamePage(t: testing.T, ctx: agent.Context) {
  // First create a page
  const chatId = "test-build-" + Date.now();
  const gameFiles = {
    html: "<div>Build Test</div>",
    css: "",
    js: "",
  };

  const createResult = createGamePage(chatId, gameFiles);
  t.assert.True(createResult.success, `Should create page: ${createResult.error || ""}`);

  // Then build it
  const buildResult = buildGamePage(createResult.route);
  t.assert.True(buildResult.success, `Should build page successfully: ${buildResult.error || ""}`);
}

