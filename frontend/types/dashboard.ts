export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface FlaggedFile {
  line_start: number;
  line_end: number;
  file_path: string;
  priority_score: number;
  severity: SeverityLevel;
  complexity_grade: string;
  maintainability_index: number;
  reason: string;
}

export interface SeverityDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface DashboardTelemetry {
  summary: string;
  health_score: number;
  files_scanned: number;
  total_debt_score: number;
  severity_distribution: SeverityDistribution;
  files: FlaggedFile[];
}
