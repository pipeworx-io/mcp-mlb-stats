interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * MLB Stats API MCP — official MLB statistics
 *
 * Base: https://statsapi.mlb.com/api/v1/
 * Auth: none.
 *
 * Tool surface focuses on the most common research/agent use cases —
 * schedules, scores, rosters, stats, standings. Live play-by-play uses v1.1.
 */


const BASE_V1 = 'https://statsapi.mlb.com/api/v1';
const BASE_V11 = 'https://statsapi.mlb.com/api/v1.1';

const tools: McpToolExport['tools'] = [
  {
    name: 'schedule',
    description: 'Game schedule. Filter by date (YYYY-MM-DD), full season, or specific team.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'YYYY-MM-DD' },
        start_date: { type: 'string', description: 'YYYY-MM-DD (for ranges)' },
        end_date: { type: 'string', description: 'YYYY-MM-DD' },
        season: { type: 'string', description: 'YYYY (e.g. "2024")' },
        team_id: { type: 'number', description: 'MLB team id' },
        sport_id: { type: 'number', description: 'Sport ID (default 1 = MLB)' },
      },
    },
  },
  {
    name: 'standings',
    description: 'Standings by league/division for a season or date.',
    inputSchema: {
      type: 'object',
      properties: {
        league_id: { type: 'string', description: 'Comma-separated league IDs (103=AL, 104=NL). Default both.' },
        season: { type: 'string', description: 'YYYY (default current)' },
        date: { type: 'string', description: 'YYYY-MM-DD for historical standings' },
        standings_type: { type: 'string', description: 'regularSeason (default) | wildCard | divisionLeaders' },
      },
    },
  },
  {
    name: 'get_team',
    description: 'Team profile + venue info.',
    inputSchema: {
      type: 'object',
      properties: { team_id: { type: 'number', description: 'MLB team id' } },
      required: ['team_id'],
    },
  },
  {
    name: 'team_roster',
    description: 'Players on a team. Use roster_type=active for current 26-man, =40Man for full org.',
    inputSchema: {
      type: 'object',
      properties: {
        team_id: { type: 'number' },
        roster_type: { type: 'string', description: 'active | 40Man | depthChart | fullSeason | fullRoster' },
        season: { type: 'string', description: 'YYYY' },
      },
      required: ['team_id'],
    },
  },
  {
    name: 'get_player',
    description: 'Player profile by ID.',
    inputSchema: {
      type: 'object',
      properties: { player_id: { type: 'number', description: 'MLB player id' } },
      required: ['player_id'],
    },
  },
  {
    name: 'player_stats',
    description: 'Career or season stats for a player.',
    inputSchema: {
      type: 'object',
      properties: {
        player_id: { type: 'number' },
        group: { type: 'string', description: 'hitting | pitching | fielding (default hitting)' },
        season: { type: 'string', description: 'YYYY' },
        stats: { type: 'string', description: 'season (default) | career | yearByYear | seasonAdvanced' },
      },
      required: ['player_id'],
    },
  },
  {
    name: 'get_boxscore',
    description: 'Full box score for a completed/in-progress game by gamePk.',
    inputSchema: {
      type: 'object',
      properties: { game_pk: { type: 'number', description: 'MLB game primary key' } },
      required: ['game_pk'],
    },
  },
  {
    name: 'get_game_feed',
    description: 'Live game feed with play-by-play.',
    inputSchema: {
      type: 'object',
      properties: { game_pk: { type: 'number' } },
      required: ['game_pk'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'schedule': {
      const params = new URLSearchParams({ sportId: String(args.sport_id ?? 1) });
      if (args.date) params.set('date', String(args.date));
      if (args.start_date) params.set('startDate', String(args.start_date));
      if (args.end_date) params.set('endDate', String(args.end_date));
      if (args.season) params.set('season', String(args.season));
      if (args.team_id !== undefined) params.set('teamId', String(args.team_id));
      return mlbGet(`/schedule?${params}`);
    }
    case 'standings': {
      const params = new URLSearchParams({
        leagueId: String(args.league_id ?? '103,104'),
        standingsType: String(args.standings_type ?? 'regularSeason'),
      });
      if (args.season) params.set('season', String(args.season));
      if (args.date) params.set('date', String(args.date));
      return mlbGet(`/standings?${params}`);
    }
    case 'get_team':
      return mlbGet(`/teams/${reqNum(args, 'team_id', '147')}`);
    case 'team_roster': {
      const id = reqNum(args, 'team_id', '147');
      const params = new URLSearchParams();
      params.set('rosterType', String(args.roster_type ?? 'active'));
      if (args.season) params.set('season', String(args.season));
      return mlbGet(`/teams/${id}/roster?${params}`);
    }
    case 'get_player':
      return mlbGet(`/people/${reqNum(args, 'player_id', '660271')}`);
    case 'player_stats': {
      const id = reqNum(args, 'player_id', '660271');
      const params = new URLSearchParams({
        stats: String(args.stats ?? 'season'),
        group: String(args.group ?? 'hitting'),
      });
      if (args.season) params.set('season', String(args.season));
      return mlbGet(`/people/${id}/stats?${params}`);
    }
    case 'get_boxscore':
      return mlbGet(`/game/${reqNum(args, 'game_pk', '716463')}/boxscore`);
    case 'get_game_feed':
      return mlbGetV11(`/game/${reqNum(args, 'game_pk', '716463')}/feed/live`);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function mlbGet(path: string) {
  return mlbFetch(`${BASE_V1}${path}`);
}
async function mlbGetV11(path: string) {
  return mlbFetch(`${BASE_V11}${path}`);
}

async function mlbFetch(url: string) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (res.status === 404) throw new Error(`MLB: not found (${url.split('/api/')[1]})`);
  if (res.status === 429) throw new Error('MLB: rate-limit (HTTP 429)');
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`MLB error: ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

function reqNum(args: Record<string, unknown>, key: string, example: string): number {
  const v = args[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new Error(`Required argument "${key}" must be a number. Example: ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
