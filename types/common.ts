export interface PromptResult {
  input: string;
  key: 'tab' | 'enter';
};

export type SearchMode = 'exact' | 'prefix'; 

export interface PathReturn {
  pathExists: boolean;
  fullPath: string; 
  exec_name: string; 
};