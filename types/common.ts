export type SearchMode = 'exact' | 'prefix'; 
export type KeyPress = 'tab' | 'enter';

export interface PathReturn {
  pathExists: boolean;
  fullPaths: string[]; 
  exec_names: string[]; 
};

export interface ShellProps {
  input: string; 
  keyPress: KeyPress; 
};

export interface ShellConfig {
  output?: string;
  prompt: string; 
};