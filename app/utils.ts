import fs from 'fs';
import path from 'path';
import { AutoComplete } from './autocomplete';

/**
 * Checks if the given absolute path is a directory.
 * @param dirPath The absolute directory path.
 * @returns boolean indicating if the path is a directory.
 */
export function isDirectory(dirPath: string) : boolean
{
  try {
    const stats = fs.statSync(dirPath);
    return stats.isDirectory();
  } catch (err)
  { //Path does not exist
    return false; 
  }
}

/**
 * Converts a relative path to an absolute path.
 * @param dirPath The relative path.
 * @returns The absolute path.
 */
export function relativeToAbsPaths(dirPath: string): string 
{
  let dirNames: string[] = dirPath.split('/').filter(Boolean); //Remove empty strings
  let workingDir: string; 
  let currDir: string = process.cwd(); 
  let homeDir: string = process.env.HOME ?? process.env.USERPROFILE ?? '';

  let i = 1; 
  if (dirPath[0] === '/') { workingDir = '/'; i = 0;}
  else if (dirPath === '' || dirNames[0] === '~') { workingDir = `${homeDir}/`; }
  else if (dirNames[0] === '.') { workingDir = `${process.cwd()}/`; }
  else if (dirNames[0] === '..') { workingDir = `${path.dirname(currDir)}/`; }
  else { workingDir = `/${dirNames[0]}/`; }

  for (; i < dirNames.length; ++i)
  {
    if (dirNames[i] == '.') { continue; }
    else if (dirNames[i] == '..') { workingDir = path.dirname(workingDir); }
    else { workingDir += `${dirNames[i]}/`; }
  }

  //Remove post-fix '/'
  if (workingDir.at(-1) == '/' && workingDir.length > 1) {
    workingDir = workingDir.slice(0, -1);
  }

  return workingDir;
}

/**
 * Extracts arguments from a raw argument string.
 * @param argsRaw The raw argument string.
 * @returns An array of extracted arguments.
 */
export function extractArgs(argsRaw: string) : string[]
{
  /**
   * 'echo 'shell\\\nscript'
   */
  let l: number = 0;
  let r: number = 0;
  let args: string[] = [];
  let insideSingleQuote: boolean = false; 
  let insideDoubleQuote: boolean = false; 
  let isEscaped: boolean = false; 

  for (; r < argsRaw.length; ++r)
  {
    if (isEscaped)
    {
      isEscaped = false; 
    } else if (argsRaw[r] === '\\')
    {
      isEscaped = true; 
    } else if (argsRaw[r] === '\'' && !insideDoubleQuote)
    {
      insideSingleQuote = !insideSingleQuote;
    } else if (argsRaw[r] == '"' && !insideSingleQuote) 
    {
      insideDoubleQuote = !insideDoubleQuote; 
    } else if (argsRaw[r] === ' ' && !insideSingleQuote && !insideDoubleQuote)
    {
      if (l != r) { args.push(argsRaw.substring(l, r)); }
      l = r + 1; 
    }
  }

  if (l != r) { args.push(argsRaw.substring(l, r)); }

  //Remove ' and " from each str
  args = args.map(removeQuotes);
  return args;
}

/**
 * Helper to remove single and double quotes from an argument
 * @param arg A parsed argument
 */
function removeQuotes(arg: string) : string 
{
  let insideSingleQuote: boolean = false;  
  let insideDoubleQuote: boolean = false; 

  let idx_to_remove: Set<number> = new Set();
  let isEscaped: boolean = false; 
  for (let i: number = 0; i < arg.length; ++i)
  {
    if (arg[i] === "'" && !insideDoubleQuote && !isEscaped) { insideSingleQuote = !insideSingleQuote; }
    if (arg[i] === '"' && !insideSingleQuote && !isEscaped) { insideDoubleQuote = !insideDoubleQuote; }


    if (arg[i] === '\\' && !insideSingleQuote) { 
      if (insideDoubleQuote)
      {
        if (!isEscaped && (arg[i + 1] === '"' || arg[i + 1] === '\\'))
        {
          isEscaped = true; 
          idx_to_remove.add(i);
        } else { isEscaped = false; }
        continue;  
      }

      if (!isEscaped)
      {
        idx_to_remove.add(i); 
        isEscaped = true; 
      } else { isEscaped = false; }

      continue; 
    } 
    
    let should_remove: boolean = !isEscaped && (
      (arg[i] === "'" && insideSingleQuote && !insideDoubleQuote) ||
      (arg[i] === '"' && insideDoubleQuote && !insideSingleQuote) ||
      (!insideSingleQuote && !insideDoubleQuote && (arg[i] === '"' || arg[i] == "'"))
      );
    
    isEscaped = false;
    if (should_remove) { idx_to_remove.add(i); }
  }
  

  //Remove idxs from arg
  return [...arg].filter((_, i) => !idx_to_remove.has(i)).join('');
} 

/**
 * 
 * @param rawInp The raw input string
 * @returns Two arguments. First is (unquoted) cmd string and the second is a list of extracted args
 */
export function parseInput(rawInp: string): [string, string[]]
{
  let cmd: string = ''; 
  let rawArgs: string = ''; 

  if (rawInp.includes('"') || rawInp.includes("'"))
  {
    let last_quote: string = '';
    let idx_to_remove: Set<number> = new Set();
    let i: number = 0;

    //Identify indexes of enclosing quotes. Enclosing quotes are quotes that aren't themselves enclosed
    for (; i < rawInp.length && (last_quote !== '' || rawInp[i] !== ' '); ++i)
    {
      if ((rawInp[i] === "'" || rawInp[i] == '"') && last_quote === '') 
      {//Opening enclosing quote
        idx_to_remove.add(i);
        last_quote = rawInp[i];

      } else if ((rawInp[i] === "'" && last_quote === "'") || 
                (rawInp[i] == '"' && last_quote === '"')) 
      {//Closing enclosing quote
        idx_to_remove.add(i);
        last_quote = '';
      }
    }

    //Remove all quotes from the raw input
    cmd = [...rawInp.substring(0, i)].filter((_, i) => !idx_to_remove.has(i)).join('');;
    rawArgs = rawInp.substring(i + 1);

  } else 
  {
    let firstSpace: number = rawInp.indexOf(' ');

    cmd = (firstSpace === -1) ? rawInp : rawInp.substring(0, firstSpace);
    rawArgs = (firstSpace === -1) ? '' : rawInp.substring(firstSpace + 1); 
  }

  return [cmd, extractArgs(rawArgs)];
}


export function findLongestCommonPrefix(words: string[]): string 
{
  let word_trie = new AutoComplete(words);

  return word_trie.find_longest_common_prefix();
}
