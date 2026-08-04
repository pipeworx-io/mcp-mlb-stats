# @pipeworx/mlb-stats

MLB Stats API MCP — official MLB statistics: schedules, scores, rosters, player stats, standings, box scores. No auth.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `schedule(date?, season?, team_id?, sport_id?)` — game schedule by date / season
- `standings(league_id?, season?, date?)` — current/historic standings
- `get_team(team_id)` — team profile
- `team_roster(team_id, roster_type?, season?)` — players on a team
- `get_player(player_id)` — player profile
- `player_stats(player_id, group?, season?, stats?)` — career or season stats
- `get_boxscore(game_pk)` — full game box score
- `get_game_feed(game_pk)` — live game feed (play-by-play)

## Data source

`https://statsapi.mlb.com/api/v1/` — public, used by MLB.com itself.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

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

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
