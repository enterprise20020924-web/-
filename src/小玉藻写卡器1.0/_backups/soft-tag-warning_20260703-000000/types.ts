export interface RoleDraft {
  id: string;
  label: string;
  name: string;
  seed: string;
  statusAvatarUrl: string;
  statusBackgroundUrl: string;
}

export interface WorldviewResult {
  content: string;
  raw: string;
}

export interface StagePersonas {
  early: string;
  middle: string;
  close: string;
  common: string;
}

export interface RoleResult {
  draft: RoleDraft;
  name: string;
  aliases: string[];
  basic: string;
  palette: string;
  reinterpret: string;
  multistagePersona: string;
  stagePersonas: StagePersonas;
  quickView: string;
  raw: string;
}

export interface WriterLog {
  id: string;
  level: 'info' | 'success' | 'warning' | 'error';
  text: string;
}

export interface WriterArtifacts {
  entries: PartialDeep<WorldbookEntry>[];
  mvuSchemaScript: string;
  statusRegexHtml: string;
}
