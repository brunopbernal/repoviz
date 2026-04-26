export type KitFileCategory =
  | 'agent'
  | 'command'
  | 'hook'
  | 'context'
  | 'template'
  | 'config'
  | 'unclassified';

export type RelationshipType =
  | 'reads'
  | 'executes'
  | 'creates'
  | 'edits'
  | 'references'
  | 'unresolved';

export interface KitFile {
  id: string;
  path: string;
  category: KitFileCategory;
  native_type: string;
  harness: string;
  display_name: string;
  description: string | null;
  metadata: Record<string, unknown>;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  evidence: string;
}

export interface AnalysisSummary {
  repo_path: string;
  detected_harnesses: string[];
  total_files_scanned: number;
  classified_files: number;
  unclassified_files: number;
  relationship_count: number;
  analysis_time_ms: number;
}

export interface KitGraph {
  summary: AnalysisSummary;
  harnesses: Record<string, string[]>;
  nodes: KitFile[];
  edges: Relationship[];
}
