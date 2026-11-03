// Shared arcade best scores. Client identity stays private in public rankings.
function createRankings(games, cleanName = name => name) {
  const tables = Object.fromEntries(Object.keys(games).map(game => [game, []]));

  function sortAndTrim(game) {
    tables[game].sort((a, b) => b.score - a.score || a.at - b.at);
    tables[game] = tables[game].slice(0, 6);
  }

  function publicScores() {
    return Object.fromEntries(Object.entries(tables).map(([game, rows]) => [
      game, rows.map(({nick, score}) => ({nick, score}))
    ]));
  }

  function record(game, clientId, nickname, score, now = Date.now()) {
    const rows = tables[game];
    if (!Array.isArray(rows) || !Number.isSafeInteger(score) || score <= 0) return {changed:false, rank:0};
    const nick = cleanName(String(nickname)).slice(0, 16);
    const previous = rows.find(row => row.clientId === clientId);
    if (previous && previous.score >= score) {
      const changed = previous.nick !== nick;
      previous.nick = nick;
      return {changed, rank:rows.indexOf(previous) + 1};
    }
    const remaining = rows.filter(row => row.clientId !== clientId);
    tables[game] = [...remaining, {clientId, nick, score, at:now}];
    sortAndTrim(game);
    const rank = tables[game].findIndex(row => row.clientId === clientId) + 1;
    return {changed:rank > 0, rank};
  }

  function restore(data) {
    if (!data || typeof data !== 'object') return;
    for (const game of Object.keys(tables)) {
      const rows = Array.isArray(data[game]) ? data[game] : [];
      for (const row of rows.slice(0, 100)) {
        if (!row || typeof row.clientId !== 'string' || typeof row.nick !== 'string') continue;
        const at = Number.isFinite(row.at) ? row.at : 0;
        record(game, row.clientId.slice(0, 64), row.nick, row.score, at);
      }
    }
  }

  return {record, restore, publicScores, export:() => tables};
}

module.exports = {createRankings};
