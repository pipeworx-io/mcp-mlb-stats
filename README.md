# @pipeworx/mlb-stats

MLB Stats API MCP — official MLB statistics: teams, standings, daily schedule and scores, rosters, player bios, season stats, per-game logs, batter-vs-pitcher splits, probable pitchers with posted lineups, and full box scores. No auth.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1683+ live data sources.

## Tools

- `mlb_teams()` — every MLB team with id, abbreviation, league, division, venue
- `mlb_standings(season?, league_id?)` — division standings; defaults to the current season
- `mlb_schedule(date?)` — games, scores, status and venue for a date (default today), with `gamePk`
- `mlb_roster(team_id)` — active roster
- `mlb_player(person_id)` — biographical profile
- `mlb_player_stats(player, season?, group?)` — season hitting and/or pitching totals; `player` is a name or id
- `mlb_player_game_log(player, season?, group?, last?)` — per-game lines, newest first (default last 15); pitchers default to the pitching log
- `mlb_matchup(batter, pitcher, season?)` — batter-vs-pitcher history split by season
- `mlb_probable_pitchers(date?, team?)` — probable starters and, once posted, the batting order for each game
- `mlb_boxscore(game_pk)` — every batter's and pitcher's line plus team totals for one game

Player and team arguments accept names ("Yordan Alvarez", "Astros", "HOU") or numeric ids.

## Data source

`https://statsapi.mlb.com/api/v1/` — public, used by MLB.com itself. Lineups appear 2-4 hours before first pitch; probable pitchers as soon as MLB names them.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/mlb-stats/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1683+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/mlb_teams \
  -H 'Content-Type: application/json' \
  -d '{}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/mlb_teams`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "mlb-stats": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-mlb-stats"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-mlb-stats
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Mlb Stats data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
