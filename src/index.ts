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
 * MLB Stats API MCP — official MLB statistics (keyless).
 *
 * Wraps the public, no-auth MLB Stats API at https://statsapi.mlb.com/api/v1.
 * Covers teams, division standings, daily schedule/scores, active rosters, and
 * player bios. sportId for MLB = 1; leagues are AL=103, NL=104.
 *
 * All tools return shaped, LLM-friendly objects (not raw API passthrough) and
 * never throw — fetch/parse failures resolve to { error }.
 */


const BASE = 'https://statsapi.mlb.com/api/v1';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'get_teams',
    description:
      'List all MLB teams from the official MLB Stats API. Returns each team with id, name, abbreviation, location, league, division, and home venue.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_standings',
    description:
      'MLB division standings (regular season) from the official MLB Stats API. Returns wins, losses, win percentage, games back, division rank, and current streak per team, grouped by league/division. Pass the desired season year (e.g. "2024"); defaults to "2024" if omitted.',
    inputSchema: {
      type: 'object',
      properties: {
        season: { type: 'string', description: 'Season year, e.g. "2024". Defaults to "2024" if omitted — pass the year you want.' },
        league_id: { type: 'string', description: 'Comma-separated league IDs (103=AL, 104=NL). Default "103,104" (both).' },
      },
    },
  },
  {
    name: 'get_schedule',
    description:
      "MLB daily schedule and scores from the official MLB Stats API. Returns each game's teams, scores, status, and venue. Pass a date (YYYY-MM-DD) or omit for today's games.",
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD. Omit to get today\'s schedule.' },
      },
    },
  },
  {
    name: 'get_roster',
    description:
      'Active roster for an MLB team from the official MLB Stats API. Returns each player with id, name, jersey number, and position abbreviation.',
    inputSchema: {
      type: 'object',
      properties: {
        team_id: { type: ['number', 'string'], description: 'MLB team id (e.g. 147 for the Yankees).' },
      },
      required: ['team_id'],
    },
  },
  {
    name: 'get_player',
    description:
      'Player biographical profile from the official MLB Stats API. Returns name, number, birth date, age, height, weight, position, bats/throws, and MLB debut date.',
    inputSchema: {
      type: 'object',
      properties: {
        person_id: { type: ['number', 'string'], description: 'MLB person/player id (e.g. 660271).' },
      },
      required: ['person_id'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    switch (name) {
      case 'get_teams':
        return await getTeams();
      case 'get_standings':
        return await getStandings(args);
      case 'get_schedule':
        return await getSchedule(args);
      case 'get_roster':
        return await getRoster(args);
      case 'get_player':
        return await getPlayer(args);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

async function getTeams(): Promise<unknown> {
  const data = (await mlbGet(`/teams?sportId=1`)) as { teams?: any[] };
  const teams = (data.teams ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    abbreviation: t.abbreviation,
    location: t.locationName,
    league: t.league?.name,
    division: t.division?.name,
    venue: t.venue?.name,
  }));
  return { count: teams.length, teams };
}

async function getStandings(args: Record<string, unknown>): Promise<unknown> {
  const season = strArg(args.season) ?? '2024';
  const leagueId = strArg(args.league_id) ?? '103,104';
  const params = new URLSearchParams({
    leagueId,
    season,
    standingsTypes: 'regularSeason',
  });
  const data = (await mlbGet(`/standings?${params.toString()}`)) as { records?: any[] };
  const divisions = (data.records ?? []).map((r) => ({
    league_id: r.league?.id,
    division_id: r.division?.id,
    teams: (r.teamRecords ?? []).map((tr: any) => ({
      team: tr.team?.name,
      wins: tr.wins,
      losses: tr.losses,
      pct: tr.winningPercentage,
      gamesBack: tr.gamesBack,
      divisionRank: tr.divisionRank,
      streak: tr.streak?.streakCode,
    })),
  }));
  return { season, divisions };
}

async function getSchedule(args: Record<string, unknown>): Promise<unknown> {
  const params = new URLSearchParams({ sportId: '1' });
  const date = strArg(args.date);
  if (date) params.set('date', date);
  const data = (await mlbGet(`/schedule?${params.toString()}`)) as { dates?: any[] };
  const games: unknown[] = [];
  for (const d of data.dates ?? []) {
    for (const g of d.games ?? []) {
      games.push({
        gamePk: g.gamePk,
        date: g.gameDate,
        status: g.status?.detailedState,
        away: { team: g.teams?.away?.team?.name, score: g.teams?.away?.score },
        home: { team: g.teams?.home?.team?.name, score: g.teams?.home?.score },
        venue: g.venue?.name,
      });
    }
  }
  return { count: games.length, games };
}

async function getRoster(args: Record<string, unknown>): Promise<unknown> {
  const teamId = reqIdArg(args, 'team_id', '147');
  const data = (await mlbGet(`/teams/${encodeURIComponent(teamId)}/roster?rosterType=active`)) as { roster?: any[] };
  const roster = (data.roster ?? []).map((r) => ({
    id: r.person?.id,
    name: r.person?.fullName,
    number: r.jerseyNumber,
    position: r.position?.abbreviation,
  }));
  return { count: roster.length, roster };
}

async function getPlayer(args: Record<string, unknown>): Promise<unknown> {
  const personId = reqIdArg(args, 'person_id', '660271');
  const data = (await mlbGet(`/people/${encodeURIComponent(personId)}`)) as { people?: any[] };
  const p = (data.people ?? [])[0];
  if (!p) return { error: 'player not found', person_id: personId };
  return {
    id: p.id,
    name: p.fullName,
    number: p.primaryNumber,
    birthDate: p.birthDate,
    age: p.currentAge,
    height: p.height,
    weight: p.weight,
    position: p.primaryPosition?.name,
    bats: p.batSide?.description,
    throws: p.pitchHand?.description,
    debut: p.mlbDebutDate,
  };
}

async function mlbGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!res.ok) {
    const body = await res.text().then((t) => t.slice(0, 200)).catch(() => '');
    throw new Error(`MLB Stats API: ${res.status} ${body}`.trim());
  }
  return res.json();
}

function strArg(v: unknown): string | undefined {
  if (typeof v === 'string') {
    const t = v.trim();
    return t ? t : undefined;
  }
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
}

function reqIdArg(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'string' && v.trim()) return v.trim();
  throw new Error(`Required argument "${key}" is missing. Pass a number or string id like ${example}.`);
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
