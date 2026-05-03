type TokenValue = readonly [string, string];

function assignTokenTuples(vars: Record<string, string>, tuples: readonly TokenValue[]) {
  for (const [token, value] of tuples) {
    vars[token] = value;
  }
}

function setRolePairVars(
  vars: Record<string, string>,
  bgToken: string,
  fgToken: string,
  pair: { bg: string; fg: string }
) {
  assignTokenTuples(vars, [
    [bgToken, pair.bg],
    [fgToken, pair.fg],
  ]);
}

function setRoleTripletVars(
  vars: Record<string, string>,
  borderToken: string,
  bgToken: string,
  fgToken: string,
  triplet: { border: string; bg: string; fg: string }
) {
  assignTokenTuples(vars, [
    [borderToken, triplet.border],
    [bgToken, triplet.bg],
    [fgToken, triplet.fg],
  ]);
}

function setRoleVar(vars: Record<string, string>, token: string, value: string) {
  vars[token] = value;
}

export { setRolePairVars, setRoleTripletVars, setRoleVar };
