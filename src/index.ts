// @ts-nocheck
import { agent, log } from "@yao/runtime";
import { readGameFiles, isChinese } from "./utils";
import { createGamePage, buildGamePage } from "./sui";

/**
 * Game Crafter - Sandbox Game Development Assistant
 *
 * This agent uses sandbox mode to run Claude CLI for game development.
 *
 * ## Execution Flow
 *
 * 1. Create Hook - Initialize, store chat_id
 * 2. Sandbox Execution - Claude CLI creates game files
 * 3. Next Hook - Read files, create SUI page, navigate user
 *
 * ## Output
 *
 * Games are published at /ai/{chat_id}
 */

// ==================== Create Hook ====================

/**
 * Create Hook - Initialize the game development pipeline
 *
 * Stores chat_id and start_time for later use.
 *
 * @param ctx - Agent context
 * @param messages - User messages
 * @returns Create config
 */
export function Create(ctx: agent.Context, messages: agent.Message[]): agent.Create {
  log.Info("Game Crafter: Create hook started");

  // Store chat_id and start_time
  ctx.memory.context.Set("chat_id", ctx.chat_id);
  ctx.memory.context.Set("start_time", Date.now());

  return { messages };
}

// ==================== Next Hook ====================

/**
 * Next Hook - Process sandbox output and create game page
 *
 * Reads game files from sandbox, creates SUI page, and navigates user.
 *
 * @param ctx - Agent context
 * @param payload - Contains completion and tool results
 * @returns Next response with game URL
 */
export function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  log.Info("Game Crafter: Next hook called");

  const { error } = payload;
  const isZh = isChinese(ctx);

  // Handle errors
  if (error) {
    log.Error(`Sandbox execution error: ${error}`);
    return { data: { status: "error", message: error } };
  }

  // Check if sandbox is available
  if (!ctx.sandbox) {
    log.Warn("ctx.sandbox not available, skipping file processing");
    return null;
  }

  // Read game files from sandbox
  const gameFiles = readGameFiles(ctx);
  if (!gameFiles) {
    log.Warn("No game files found");
    return null;
  }

  // Get chat_id for page route
  const chatId = ctx.memory.context.Get("chat_id") || ctx.chat_id;
  if (!chatId) {
    log.Error("chat_id not available");
    return { data: { status: "error", message: "chat_id not available" } };
  }

  // Create SUI page
  const pageResult = createGamePage(chatId, gameFiles);
  if (!pageResult.success) {
    ctx.Send(
      isZh
        ? `❌ 创建游戏页面失败: ${pageResult.error}`
        : `❌ Failed to create game page: ${pageResult.error}`
    );
    return { data: { status: "error", message: pageResult.error } };
  }

  // Build the page
  const buildResult = buildGamePage(pageResult.route);
  if (!buildResult.success) {
    ctx.Send(
      isZh
        ? `⚠️ 游戏页面创建成功，但编译时出现错误: ${buildResult.error}`
        : `⚠️ Game page created but build failed: ${buildResult.error}`
    );
    // Still provide the page URL - user can access uncompiled version
  }

  // Add timestamp to URL to prevent caching
  const timestamp = Date.now();
  const urlWithTimestamp = `${pageResult.url}?t=${timestamp}`;

  // Send navigation action
  ctx.Send({
    type: "action",
    props: {
      name: "navigate",
      payload: { route: urlWithTimestamp },
    },
  });

  // Send success message with link
  ctx.Send(
    isZh
      ? `\n\n🎮 **游戏已就绪！** [打开游戏](${urlWithTimestamp})`
      : `\n\n🎮 **Game Ready!** [Open Game](${urlWithTimestamp})`
  );

  // Calculate duration
  const startTime = ctx.memory.context.Get("start_time");
  const duration = startTime ? Date.now() - startTime : 0;

  return {
    data: {
      status: "success",
      chat_id: chatId,
      game_url: pageResult.url,
      duration_ms: duration,
    },
  };
}
