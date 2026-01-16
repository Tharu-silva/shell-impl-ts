import path, { delimiter } from 'path';
import { spawn } from 'child_process';
import type { Writable } from 'stream';
import fs from 'fs';

import { type SearchMode, type PathReturn } from '../types/common';

//Map from executable name to its fully qualified path
// let exec_cache: Map<string, string> = new Map();

/**
 * Returns all the executable names that match the given prefix
 * 
 * @param prefix The prefix of the executable
 * @returns List of string of all prefix-matching executable
 */
export function execAutocomplete(prefix: string): string[]
{
	let {pathExists, fullPaths, exec_names} = search_PATH(prefix, 'prefix');
	if (!pathExists) { return []; } //No prefix matches

	//Cache exec name and the path(s)
  // exec_names.forEach((exec_name,i) => exec_cache.set(exec_name, fullPaths[i]));

	return exec_names;
}

/**
 * Searches the system PATH for a given command in a given mode
 * 
 * 'exact' mode - Searches for exact matches of cmd.
 * 'prefix' mode - Searches for prefix matches. If multiple prefix matches, all the matching 
 *                 executables will be returned. 
 * 
 * @param cmd The command to search for.
 * @param mode The search mode. 
 * @returns A tuple where the first element is a boolean indicating if the command was found,
 *          and the second element are the full paths to the command(s) if found, or an empty string if not found.
 */
export function search_PATH(cmd: string, mode: SearchMode = 'exact'): PathReturn
{
  //Check in cache

  //Split path 
  let paths: string[] | undefined = process.env.PATH?.split(delimiter);
  
	let pathReturn: PathReturn = {
		pathExists: false, fullPaths: [], exec_names: []
	}
  if (paths === undefined) { return pathReturn; }
  
  let pathItem: string; 
  for (pathItem of paths)
  {
    let contents: string[] = [];
    try {
      contents = fs.readdirSync(pathItem);
    } catch (err: unknown) {
      continue; //Path likely does not exist on disk  
    }

    //Search over contents of the directory
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

      //Ignore directories and bad exec perms
      if (!stats.isDirectory() && canOwnerExec)
      { 
				//Check if cmd is an exact match 
				if (item === cmd && mode === 'exact') 
        { 
					return { pathExists: true, fullPaths: [fullPath], exec_names: [item]}; 
        }

        //Prefix mode is specified - add to the accumulator if cmd is prefix of item
        if (item.startsWith(cmd)) 
        {
          pathReturn.fullPaths.push(fullPath);
          pathReturn.exec_names.push(item);
        }
      }
    }
  }

  pathReturn.pathExists = pathReturn.fullPaths.length > 0; 
  return pathReturn;
}

/**
 * Given a command and its arguments, spawns a child process to run the command.
 * @param cmd The command to run.
 * @param args The arguments for the command.
 * @returns A promise that resolves when the command has finished executing.
 */
export function runProgram(cmd: string, args: string[], out_stream: Writable, err_stream: Writable): Promise<void> 
{
  return new Promise<void>((resolve) => {
    const child = spawn(cmd, args); 

    child.stdout.on('data', (data) => {
      out_stream.write(`${data}`);
    });
    
    child.stderr.on('data', (data) => {
      err_stream.write(`${data}`);
    });
    
    child.on('close', (code) => {
      resolve();
    });
  });
}
