import path, { delimiter } from 'path';
import { spawn } from 'child_process';
import type { Writable } from 'stream';
import fs from 'fs';

import { type SearchMode, type PathReturn } from '../types/common';

let exec_cache: Map<string, string> = new Map();

//exec_AUTOCOMPLETE
//Given a prefix traverse path and find the first matching executable. 
//If one exists then adds it to some exec cache and returns
//If one does not exist then returns undefined
export function execAutocomplete(prefix: string): string | undefined
{
	let {pathExists, fullPath, exec_name} = search_PATH(prefix, 'prefix');
	if (!pathExists) { return undefined; }

	//Cache exec name and it's path
	exec_cache.set(exec_name, fullPath);

	return exec_name;
}

/**
 * Searches the system PATH for a given command in a given mode
 * @param cmd The command to search for.
 * @param mode The search mode. 'exact' for exact matches, 'prefix' for prefix matches
 * @returns A tuple where the first element is a boolean indicating if the command was found,
 *          and the second element is the full path to the command if found, or an empty string if not found.
 */
export function search_PATH(cmd: string, mode: SearchMode = 'exact'): PathReturn
{
  //Split path 
  let paths: string[] | undefined = process.env.PATH?.split(delimiter);
  
	let bad_cmd: PathReturn = {
		pathExists: false, fullPath: "", exec_name: cmd
	}
  if (paths === undefined) { return bad_cmd; }
  
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
				//Check if cmd matches current item according to mode
				let isMatch: boolean; 
				switch (mode)
				{
					case 'exact':
						isMatch = (cmd == item);
						break;
					case 'prefix':
						isMatch = item.startsWith(cmd);
				}
				
				if (isMatch) { 
					return { pathExists: isMatch, fullPath: fullPath, exec_name: item}; }
      }
    }
  }

  //Not found
  return bad_cmd;
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
