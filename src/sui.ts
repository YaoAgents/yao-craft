// @ts-nocheck
import { log, Process } from "@yao/runtime";

// ==================== Types ====================

export interface GameFiles {
  html: string;
  css: string;
  js: string;
}

export interface PageResult {
  success: boolean;
  route: string;
  url: string;
  error?: string;
}

// ==================== SUI Page Operations ====================

/**
 * Create a SUI page for the game
 * @param chatId - Unique chat ID for the page route
 * @param gameFiles - Game files (html, css, js)
 * @param title - Optional page title
 */
export function createGamePage(
  chatId: string,
  gameFiles: GameFiles,
  title?: string
): PageResult {
  const pageRoute = `/ai/${chatId}`;
  const suiId = "web"; // SUI application ID from suis/web.sui.yao

  try {
    log.Info(`Creating SUI page at ${pageRoute}`);

    // Extract body content and inline styles/scripts if needed
    const bodyContent = extractBodyContent(gameFiles.html);
    const extracted = extractFromSingleFile(gameFiles.html);

    // Extract font imports from original HTML head
    const fontImports = extractFontImports(gameFiles.html);

    // Merge CSS and JS, prepend font imports to CSS
    let finalCss = gameFiles.css || extracted.css;
    if (fontImports) {
      finalCss = `${fontImports}\n\n${finalCss}`;
    }
    
    // Wrap JS in init function for SUI compatibility
    const rawJs = gameFiles.js || extracted.js;
    const finalJs = wrapJsForSui(rawJs);

    // Create page using SUI process
    // Args: suiId, templateID, route, payload (optional)
    const templateId = "default"; // Use existing template
    const payload = { title: title || "Game" };
    
    // Create and save page in one call using sui.page.create with source
    // Args: suiId, templateID, route, source
    const source = {
      uid: chatId,
      page: {
        source: bodyContent,
        language: "html",
      },
      style: {
        source: finalCss,
        language: "css",
      },
      script: {
        source: finalJs,
        language: "javascript",
      },
      setting: {
        title: title || "Game",
      },
      needToSave: {
        page: true,
        style: true,
        script: true,
        setting: true,
      },
    };

    log.Info(`Calling sui.page.save: ${suiId}, ${templateId}, ${pageRoute}`);
    const saveResult = Process("sui.page.save", suiId, templateId, pageRoute, source);
    log.Info(`sui.page.save result: ${JSON.stringify(saveResult)}`);

    log.Info(`SUI page created successfully at ${pageRoute}`);

    return {
      success: true,
      route: pageRoute,
      url: pageRoute,
    };
  } catch (e: any) {
    log.Error(`Failed to create SUI page: ${e.message}`);
    return {
      success: false,
      route: pageRoute,
      url: pageRoute,
      error: e.message,
    };
  }
}

export interface BuildResult {
  success: boolean;
  error?: string;
}

/**
 * Build/compile a SUI page
 * @param pageRoute - The page route (e.g., "/ai/xxx")
 */
export function buildGamePage(pageRoute: string): BuildResult {
  const suiId = "web";
  const templateId = "default";
  const option = { ssr: true };

  try {
    log.Info(`Building SUI page: ${pageRoute}`);
    // Args: suiId, templateID, route, option
    Process("sui.build.page", suiId, templateId, pageRoute, option);
    log.Info(`SUI page built successfully`);
    return { success: true };
  } catch (e: any) {
    log.Error(`Failed to build SUI page: ${e.message}`);
    return { success: false, error: e.message };
  }
}

// ==================== JavaScript Wrapping ====================

/**
 * Check if JavaScript code is already wrapped in an init/main function
 * @param js - JavaScript code to check
 * @returns true if already wrapped
 */
export function isAlreadyWrapped(js: string): boolean {
  const trimmed = js.trim();
  
  // Check if code contains a top-level function init() or function main() definition
  // Allow comments before the function declaration
  // The function should be at the start (after any comments) and called at the end
  const hasInitFunction = /^\s*(\/\/[^\n]*\n|\s)*function\s+(init|main)\s*\(\s*\)\s*\{/m.test(trimmed);
  const endsWithCall = /(init|main)\s*\(\s*\)\s*;?\s*$/.test(trimmed);
  
  return hasInitFunction && endsWithCall;
}

/**
 * Wrap JavaScript code in an init function for SUI compatibility
 * SUI requires code to be wrapped in a function that gets called after DOM is ready
 * @param js - Raw JavaScript code
 * @returns Wrapped JavaScript with init function
 */
export function wrapJsForSui(js: string): string {
  if (isAlreadyWrapped(js)) {
    // Already properly wrapped, return as-is
    return js;
  }

  // Wrap the code in an init function
  return `function init() {\n${js}\n}\n\ninit();`;
}

// ==================== Content Extraction ====================

/**
 * Extract inline CSS and JS from HTML content
 */
export function extractFromSingleFile(html: string): { css: string; js: string } {
  let css = "";
  let js = "";

  // Extract <style> content
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (styleMatch) {
    css = styleMatch
      .map((s) => s.replace(/<\/?style[^>]*>/gi, ""))
      .join("\n");
  }

  // Extract <script> content
  const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  if (scriptMatch) {
    js = scriptMatch
      .map((s) => s.replace(/<\/?script[^>]*>/gi, ""))
      .join("\n");
  }

  return { css, js };
}

/**
 * Extract external font URLs from HTML head (Google Fonts, etc.)
 * Returns CSS @import statements
 */
export function extractFontImports(html: string): string {
  const imports: string[] = [];

  // Extract <head> content
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch) return "";

  const headContent = headMatch[1];

  // Find external font links (Google Fonts)
  const linkRegex = /<link[^>]+href=["']([^"']+fonts\.googleapis\.com[^"']+)["'][^>]*>/gi;
  let match;
  while ((match = linkRegex.exec(headContent)) !== null) {
    const href = match[1];
    imports.push(`@import url('${href}');`);
  }

  return imports.join("\n");
}

/**
 * Extract body content from HTML, removing style and script tags
 */
export function extractBodyContent(html: string): string {
  // Get body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let content = bodyMatch ? bodyMatch[1] : html;

  // Remove style and script tags (they'll be handled separately)
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  return content.trim();
}
