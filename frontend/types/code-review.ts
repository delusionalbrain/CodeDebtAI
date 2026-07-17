export interface DiffLine {
  type: 'add' | 'remove' | 'context' | string;
  content: string;
}

export interface CodeReviewItem {
  file_path: string;
  original_code: string;
  suggested_code: string;
  diff: DiffLine[];
}
