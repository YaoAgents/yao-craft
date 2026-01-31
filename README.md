# Game Crafter - AI Web Game Development Agent

An intelligent sandbox-based agent that generates complete, playable HTML5 games with cyberpunk-style visuals.

**Development Status**

| AI Planning | AI Development | AI Testing | AI Review | Manual Review | Manual Testing |
|:-----------:|:--------------:|:----------:|:---------:|:-------------:|:--------------:|
| ✅ Done | ✅ Done | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending |

**Availability**

| Downloadable | Installable | Manual Testable |
|:------------:|:-----------:|:---------------:|
| ✅ Yes | ✅ Yes | ✅ Yes |

## Quick Start

```bash
# Create a simple game
yao agent test -n yao.craft -i "Create a Snake game"

# Chinese
yao agent test -n yao.craft -i "做一个贪吃蛇游戏"
```

## About

Game Crafter uses **Sandbox Mode** to run Claude CLI in a Docker container. Sandbox mode provides:

- Full file system access to create and modify files
- Command execution capability in an isolated environment
- Persistent workspace for building complete applications

### What is Sandbox Mode?

Sandbox mode is a special execution mode in Yao Agent that runs an AI coding assistant (like Claude CLI) inside a Docker container. The container follows a **stateless container + persistent workspace** model:

| Component | Lifecycle | Storage |
|-----------|-----------|---------|
| **Container** | Per-request, disposable | None (stateless) |
| **Workspace** | Persistent across requests | `{YAO_DATA_ROOT}/sandbox/workspace/{user}/chat-{chat_id}/` |
| **History** | Managed by Yao | Yao's session store |

The workspace directory is **mounted from the host**, so:
- Files persist across requests and container restarts
- Generated games can be accessed directly from the host
- Container can be recreated anytime without losing state

### Sandbox Configuration

```jsonc
// package.yao
{
  "sandbox": {
    "command": "claude",           // Claude CLI executor
    "timeout": "10m",              // Max execution time
    "arguments": {
      "max_turns": 20,             // Max conversation turns
      "permission_mode": "bypassPermissions"  // Auto-approve file operations
    }
  }
}
```

### Sandbox Hooks

Hooks can interact with the sandbox environment via `ctx.sandbox`:

```typescript
function Create(ctx: Context, messages: Message[]): CreateResponse | null {
  if (ctx.sandbox) {
    // Read files from sandbox
    const content = ctx.sandbox.ReadFile("config.json");
    
    // Write files to sandbox
    ctx.sandbox.WriteFile("setup.txt", "Initial setup data");
    
    // List directory
    const files = ctx.sandbox.ListDir(".");
    
    // Execute commands
    const output = ctx.sandbox.Exec(["ls", "-la"]);
  }
  return { messages };
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Yao Agent System                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Create     │───▶│   Sandbox    │───▶│   Complete   │  │
│  │    Hook      │    │  (Claude)    │    │    Hook      │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                             │                               │
└─────────────────────────────┼───────────────────────────────┘
                              │ mount
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Docker Container (Stateless)                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  /workspace (mounted from host)                         │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐         │ │
│  │  │game.html│  │ assets/ │  │  Other files... │         │ │
│  │  └─────────┘  └─────────┘  └─────────────────┘         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Host Filesystem (Persistent)                                │
│  {YAO_DATA_ROOT}/sandbox/workspace/{user}/chat-{chat_id}/   │
└─────────────────────────────────────────────────────────────┘
```

### Execution Flow

1. **User Request** → User asks for a game (e.g., "Create a Tetris game")
2. **Create Hook** → Optional preprocessing, workspace setup
3. **Sandbox Execution** → Claude CLI runs in Docker container
   - Receives system prompt with design guidelines
   - Plans game architecture
   - Writes complete `game.html` file
   - Explains each step to user
4. **Complete Hook** → Optional post-processing, file retrieval
5. **Response** → User receives game file and instructions

## Output Format

All games are created as a **single HTML file** containing:

```html
<!DOCTYPE html>
<html>
<head>
  <style>/* All CSS styles */</style>
</head>
<body>
  <canvas id="game"></canvas>
  <script>/* All JavaScript game logic */</script>
</body>
</html>
```

This makes games easy to:
- Share (single file)
- Run (open in any browser)
- Modify (all code in one place)

## Design System

### Cyberpunk Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#00F0FF` | Main UI, borders, text |
| Secondary | `#FF00E5` | Accents, highlights |
| Accent | `#00FF88` | Success, power-ups |
| Warning | `#FFE500` | Alerts, special items |
| Background | `#0A0A0F` | Main background |
| Surface | `#12121A` | Elevated elements |

### Visual Effects

- **Neon Glow**: `box-shadow: 0 0 10px #00F0FF, 0 0 20px #00F0FF40`
- **Scan Lines**: CSS overlay for retro-tech feel
- **Glitch Effects**: CSS animations for titles
- **Sharp Corners**: 2-4px border-radius

### Typography

- **Title Font**: Orbitron (bold, 2.5rem)
- **UI Font**: Share Tech Mono (1.5rem)
- **Effects**: Letter-spacing, text-shadow glow

## Required Game Features

Every generated game includes:

| Feature | Description |
|---------|-------------|
| Start Screen | Title, instructions, start button |
| Game Over | Final score, restart button |
| Score Display | Real-time score counter |
| Pause | Press 'P' or 'Escape' |
| Controls | Arrow keys or WASD |
| Responsive | Centered, handles resize |

## File Structure

```
assistants/yao/craft/
├── package.yao          # Agent configuration (sandbox settings)
├── prompts.yml          # System prompt with design guidelines
├── README.md            # This file
└── locales/
    ├── en-us.yml        # English translations
    └── zh-cn.yml        # Chinese translations
```

## Example Games

Ask Game Crafter to create:

- **Classic Games**: Snake, Tetris, Pong, Breakout, Flappy Bird
- **Arcade Games**: Space Invaders, Asteroids, Pac-Man style
- **Puzzle Games**: Memory match, Sliding puzzle, Minesweeper
- **Casual Games**: Clicker games, Endless runners

## Workflow

Game Crafter follows a structured workflow:

1. **Understand** → Analyze game requirements
2. **Design** → Plan architecture and visuals
3. **Implement** → Write HTML/CSS/JS code
4. **Create** → Save `game.html` file
5. **Instruct** → Explain controls and gameplay

The AI explains each step as it works, keeping users informed.

## Configuration Reference

### package.yao Options

| Option | Description |
|--------|-------------|
| `connector` | LLM connector (volcengine.glm-4_7) |
| `sandbox.command` | Executor type (claude) |
| `sandbox.timeout` | Max execution time |
| `sandbox.arguments.max_turns` | Max conversation turns |
| `sandbox.arguments.permission_mode` | File permission handling |

### Permission Modes

| Mode | Description |
|------|-------------|
| `bypassPermissions` | Auto-approve all operations |
| `acceptEdits` | Auto-approve edits, prompt for others |
| `default` | Prompt for all operations |

## See Also

- [Agent Context API](../../ai-docs/agent-context-api.md) - Sandbox API reference
- [Scribe Agent](../scribe/README.md) - Multi-agent workflow example
