# @pipeworx/mlb-stats

MLB Stats API MCP — official MLB statistics: teams, standings, daily schedule and scores, rosters, player bios, season stats, per-game logs, batter-vs-pitcher splits, probable pitchers with posted lineups, and full box scores. No auth.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1856+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

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

Both URLs reach the same gateway and the same 1856+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/mlb_teams \
  -H 'Content-Type: application/json' \
  -d '{}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/mlb_teams`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Run it from npm

`@pipeworx/mcp-mlb-stats` is a local stdio bridge to the Pipeworx gateway: your MCP client
starts it with `npx`, and it forwards every call to the same
`https://gateway.pipeworx.io/mlb-stats/mcp` endpoint shown above. It needs network access;
there is no offline mode.

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

Without a key it calls anonymously, capped at 50 calls a day. A free account
raises that to 200 a day: get a key at https://pipeworx.io/signup and add
`"env": { "PIPEWORX_API_KEY": "<your key>" }` to the server entry.
The key is sent as a Bearer token, the same way a hosted connection sends it,
so calls are metered and billed exactly as they are there.

It lists **only** this pack's tools by default. Set `PIPEWORX_META_TOOLS=1` to
also list `ask_pipeworx` and the other gateway-wide tools.

Behind an HTTPS proxy: Node's built-in `fetch` does not read `HTTPS_PROXY` by
default. Newer Node releases honour it when `NODE_USE_ENV_PROXY=1` is set; check
your Node version's documentation.

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
