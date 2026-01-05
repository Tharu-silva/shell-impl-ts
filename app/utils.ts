import fs from 'fs';
import path, { delimiter } from 'path';
import { spawn } from 'child_process';


import { rl } from './main.ts'


/**
 * Searches the system PATH for a given command.
 * @param cmd The command to search for.
 * @returns A tuple where the first element is a boolean indicating if the command was found,
 *          and the second element is the full path to the command if found, or an empty string if not found.
 */

export function search_PATH(cmd: string): [boolean,string]
{
  //Split path 
  let paths: string[] | undefined = process.env.PATH?.split(delimiter);
  
  if (paths === undefined) { return [false, ""]; }
  
  let pathItem: string; 
  for (pathItem of paths)
  {
    let contents: string[] = [];
    try {
      contents = fs.readdirSync(pathItem);
    } catch (err: unknown) {
      continue; //Path likely does not exist on disk  
    }

    let item: string; 
    for (item of contents)
    {
      const fullPath: string = path.join(pathItem, item);
      let stats; 
      try {
        stats = fs.statSync(fullPath);
      } catch (err: unknown)
      {
        if (err instanceof Error)
        {
          const fsError = err as NodeJS.ErrnoException; 
          switch (fsError.code) 
          {
            case 'EACCES': //POSIX
            case 'EPERM': //Windows
              continue; //Ignore 
            default:
              throw err; 
          }
        } else { throw err; }
      }

      const canOwnerExec: number = stats.mode & fs.constants.S_IXUSR;
      //Ignore directories
      if (!stats.isDirectory() && canOwnerExec && cmd == item)
      { return [true, fullPath]; }
    }
  }

  //Not found
  return [false, ""];
}

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
 * Converts a relative directory path to an absolute path.
 * @param dirPath The relative directory path.
 * @returns The absolute directory path.
 */
export function relativeToAbsPaths(dirPath: string): string 
{
  /**
   * Cases not dealt with: 
   *
   * 
   * Cases dealth with: 
   * empty string
   * ./ 
   * .
   * ../
   * ..
   * /.
   * /..
   * /
   * ./x
   * ../x
   * /x
   * x
   */

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
 * Given a command and its arguments, spawns a child process to run the command.
 * @param cmd The command to run.
 * @param args The arguments for the command.
 * @returns A promise that resolves when the command has finished executing.
 */
export function runProgram(cmd: string, args: string[]): Promise<void> 
{
  return new Promise<void>((resolve) => {
    const child = spawn(cmd, args); 

    child.stdout.on('data', (data) => {
      rl.write(`${data}`);
    });
    
    child.stderr.on('data', (data) => {
      rl.write(`stderr: ${data}`);
    });
    
    child.on('error', (error) => {
      rl.write(`Error: ${error.message}\n`);
    });
    
    child.on('close', (code) => {
      resolve();
    });
  });
}

/**
 * Extracts arguments from a raw input string.
 * @param argsRaw The raw input string containing arguments.
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


    if (arg[i] === '\\' && !insideDoubleQuote && !insideSingleQuote) { 
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