# Game Crafter Pages

Client-side pages for the Game Crafter assistant.

## Game Preview Page

**Path**: `/ai/{chat_id}`

Each chat session gets its own unique game page using the `chat_id` as the route.

### How It Works

1. **Sandbox Execution**: Claude CLI generates game files (`game.html`, `game.css`, `game.js`)
2. **ZIP Packaging**: Files are compressed into `game.zip`
3. **Next Hook Processing**:
   - Reads `game.zip` from sandbox workspace (via `utils.readGameFiles`)
   - Creates SUI page at `/ai/{chat_id}` (via `utils.createGamePage`)
   - Builds the page (via `utils.buildGamePage`)
4. **Navigation**: User is directed to the game URL

### File Flow

```
Claude CLI (Sandbox)
     ↓
Creates: game.html, game.css, game.js
     ↓
Compresses: game.zip
     ↓
Next Hook (src/index.ts)
     ↓
readGameFiles(ctx)           ← src/utils.ts
     ↓
createGamePage(chatId, ...)  ← src/utils.ts
     ↓
buildGamePage(route)         ← src/utils.ts
     ↓
/ai/{chat_id}
```

### SUI Processes Used

| Process | Purpose |
|---------|---------|
| `sui.page.create` | Create new SUI page |
| `sui.page.save` | Save page source (HTML, CSS, JS) |
| `sui.build.page` | Build/compile the page |

### Page Structure

Each generated game creates:

```
/data/templates/default/ai/{chat_id}/
├── {chat_id}.html    # Game HTML structure (body content only)
├── {chat_id}.css     # Game styles
├── {chat_id}.ts      # Game logic
└── {chat_id}.json    # Page metadata
```

### URL Rewrite

Add this rewrite rule to `app.yao` to enable the `/ai/{chat_id}` route:

```json
{
  "public": {
    "rewrite": [
      { "^\\/ai\\/([^\\/]+)$": "/ai/[id].sui" }
    ]
  }
}
```
