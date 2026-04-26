import type { KitFileCategory, RelationshipType } from '../output/types.js';

export interface DetectionSignal {
  path?: string;
  glob?: string;
  required?: boolean;
}

export interface PrimitiveMapping {
  native_type: string;
  category: KitFileCategory;
  glob: string;
  description?: string;
}

export interface RelationshipPattern {
  type: RelationshipType;
  pattern: string;
  description?: string;
}

export interface HarnessDefinition {
  id: string;
  name: string;
  version: string;
  detection_signals: DetectionSignal[];
  primitive_mappings: PrimitiveMapping[];
  relationship_patterns: RelationshipPattern[];
}
