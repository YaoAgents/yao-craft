// @ts-nocheck
import { agent, log } from "@yao/runtime";

// Import types from sui
import type { GameFiles } from "./sui";

// ==================== File Operations ====================

/**
 * Check if a file exists in sandbox
 */
export function fileExists(ctx: agent.Context, filename: string): boolean {
  try {
    const content = ctx.sandbox.ReadFile(filename);
    return content !== null && content !== undefined;
  } catch {
    return false;
  }
}

/**
 * Read game files from sandbox
 * Tries ZIP first, then individual files
 */
export function readGameFiles(ctx: agent.Context): GameFiles | null {
  // Try reading from zip first
  if (fileExists(ctx, "game.zip")) {
    log.Info("Found game.zip, extracting...");
    const files = readFromZip(ctx);
    if (files) return files;
  }

  // Try reading individual files
  if (fileExists(ctx, "game.html")) {
    log.Info("Found individual game files");
    return readIndividualFiles(ctx);
  }

  log.Warn("No game files found in sandbox");
  return null;
}

/**
 * Read and extract files from game.zip
 */
function readFromZip(ctx: agent.Context): GameFiles | null {
  const extractDir = "game_extracted";

  try {
    log.Info("Starting ZIP extraction...");

    // Create extraction directory
    const mkdirResult = ctx.sandbox.Exec(["mkdir", "-p", extractDir]);
    log.Info(`mkdir result: ${JSON.stringify(mkdirResult)}`);

    // Extract zip
    const unzipResult = ctx.sandbox.Exec([
      "unzip",
      "-o",
      "game.zip",
      "-d",
      extractDir,
    ]);
    log.Info(`unzip result: ${JSON.stringify(unzipResult)}`);

    // List extracted files
    const lsResult = ctx.sandbox.Exec(["ls", "-la", extractDir]);
    log.Info(`ls result: ${JSON.stringify(lsResult)}`);

    // Read extracted files
    log.Info("Reading extracted files...");
    const html = ctx.sandbox.ReadFile(`${extractDir}/game.html`);
    log.Info(`HTML read: ${html ? html.length : 0} bytes`);

    const css = safeReadFile(ctx, `${extractDir}/game.css`);
    log.Info(`CSS read: ${css ? css.length : 0} bytes`);

    const js = safeReadFile(ctx, `${extractDir}/game.js`);
    log.Info(`JS read: ${js ? js.length : 0} bytes`);

    // Cleanup
    ctx.sandbox.Exec(["rm", "-rf", extractDir]);

    return { html, css, js };
  } catch (e: any) {
    log.Error(`Failed to read ZIP: ${e.message}`);
    log.Error(`Stack: ${e.stack || "N/A"}`);
    return null;
  }
}

/**
 * Read individual game files (game.html, game.css, game.js)
 */
function readIndividualFiles(ctx: agent.Context): GameFiles | null {
  try {
    const html = ctx.sandbox.ReadFile("game.html");
    if (!html) {
      log.Error("game.html is empty or not found");
      return null;
    }

    const css = safeReadFile(ctx, "game.css");
    const js = safeReadFile(ctx, "game.js");

    return { html, css, js };
  } catch (e: any) {
    log.Error(`Failed to read individual files: ${e.message}`);
    return null;
  }
}

/**
 * Safely read a file, returning empty string if not found
 */
function safeReadFile(ctx: agent.Context, path: string): string {
  try {
    return ctx.sandbox.ReadFile(path) || "";
  } catch {
    return "";
  }
}

// ==================== Utilities ====================

/**
 * Check if current locale is Chinese
 */
export function isChinese(ctx: agent.Context): boolean {
  const locale = ctx.locale || "en-us";
  return locale.toLowerCase().startsWith("zh");
}
