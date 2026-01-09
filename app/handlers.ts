import process from 'process';
import fs from 'fs';
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

/**
 * If output/error redirection is specified then modifies arguments and returns 
 * the redirected streams, otherwise returns given argumnets and stdout for 
 * output and error streams. 
 * 
 * @param args A list of string arguments
 * @returns [args, out_stream, err_stream]
 * args: Modified list of arguments
 * out_stream: Redirected output stream
 * err_stream: Redirected error stream
 */
export function handleRedirection(args: string[])
  : {modArgs: string[], out_stream: Writable, err_stream: Writable}
{
  let out_stream: Writable = process.stdout;  
  let err_stream: Writable = process.stdout; 
  let options: fs.WriteStreamOptions = {};

  let out_redir_specifiers: string[] = [">", "1>", ">>", "1>>"];
  let err_redir_specifiers: string[] = ["2>", "2>>"];
  let modArgs: string[] = args;

  //Find first idx of redir specifier or -1 if it doesn't exist
  let out_redir_idx: number = args.findIndex(item => out_redir_specifiers.includes(item));
  let err_redir_idx: number = args.findIndex(item => err_redir_specifiers.includes(item)); 

  if (out_redir_idx !== -1)
  { //Stdout redirection is specified
    
    //Populate flags if append is specified
    if (args.includes(">>") || args.includes("1>>"))
    { options.flags = 'a'; }

    let fName: string = args[out_redir_idx + 1];
    modArgs = args.splice(0, out_redir_idx);

    //Creates file if it does not exist
    out_stream = fs.createWriteStream(fName, options); 
  } else if (err_redir_idx !== -1)
  {
    //Populate flags if err append is specified
    if (args.includes("2>>"))
    { options.flags = 'a'; }

    let fName: string = args[err_redir_idx + 1];
    modArgs = args.splice(0, err_redir_idx);

    //Creates file if it doesn't exist
    err_stream = fs.createWriteStream(fName, options); 
  }

  return {modArgs, out_stream, err_stream}; 
}