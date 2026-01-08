import process from 'process';
import fs from 'fs';
import { type Interface } from 'readline';
import { type Writable } from 'stream';

import { type BUILT_IN, isBuiltIn } from './symbols.ts';
import { search_PATH, isDirectory, relativeToAbsPaths } from './utils.ts';
import { rl } from './main.ts';

/**
 * Handles the 'type' command by checking if the given command is a shell builtin
 * or exists in the system PATH, and outputs the appropriate message.
 * @param cmd The command to check.
 */
function handleType(cmd: string, out_stream: Writable, err_stream: Writable) 
{
  if (isBuiltIn(cmd))
  {
    out_stream.write(`${cmd} is a shell builtin\n`);
    return; 
  } 
  
  //Check if cmd exists on path
  let pathExists: boolean;
  let fullPath: string; 
  [pathExists, fullPath] = search_PATH(cmd);

  if (pathExists) 
  { 
    out_stream.write(`${cmd} is ${fullPath}\n`); 
  } else 
  { 
    err_stream.write(`${cmd}: not found\n`); 
  }
}

/**
 * Handles the 'cd' command by changing the current working directory
 * to the specified path.
 * @param dirPath The target directory path.
 */
function handleCd(dirPath: string, out_stream: Writable, err_stream: Writable)
{
  //Convert relative path to absolute path
  let absPath: string = relativeToAbsPaths(dirPath);
  if (isDirectory(absPath))
  {
    process.chdir(absPath);
  } else   
  {
    err_stream.write(`cd: ${absPath}: No such file or directory\n`);
  }
}

/**
 * Handles built-in shell commands.
 * @param cmd The command to handle.
 * @param args The arguments for the command.
 * @param out_stream The output stream to write BuiltIns to
 * @returns 'Continue' to keep the shell running, 'Break' to exit.
 */
export function handleBuiltIns(cmd: BUILT_IN, args: string[], out_stream: Writable, err_stream: Writable): 'Continue' | 'Break'
{
  switch (cmd)
  {
    case 'exit':
      rl.close();
      return 'Break';
    case 'echo':
      out_stream.write(`${args.join(' ')}\n`);
      return 'Continue';
    case 'pwd':
      let cwd: string = process.cwd();
      out_stream.write(`${cwd}\n`);
      return 'Continue'; 
    case 'type':
      handleType(args[0], out_stream, err_stream);
      return 'Continue';
    case 'cd':
      handleCd(args[0], out_stream, err_stream);
      return 'Continue';
  } 
}