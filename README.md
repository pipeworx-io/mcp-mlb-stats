# mcp-mlb-stats

MLB Stats API MCP — official MLB statistics

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 250+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `schedule` | Game schedule. Filter by date (YYYY-MM-DD), full season, or specific team. |
| `standings` | Standings by league/division for a season or date. |
| `get_team` | Team profile + venue info. |
| `team_roster` | Players on a team. Use roster_type=active for current 26-man, =40Man for full org. |
| `get_player` | Player profile by ID. |
| `player_stats` | Career or season stats for a player. |
| `get_boxscore` | Full box score for a completed/in-progress game by gamePk. |
| `get_game_feed` | Live game feed with play-by-play. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "mlb-stats": {
      "url": "https://gateway.pipeworx.io/mlb-stats/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 250+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Mlb Stats data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
