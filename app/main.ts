import { createInterface, type Interface } from "readline";
import fs from 'fs';
import { type Writable } from "stream";


import { isBuiltIn } from './symbols.ts';
import { 
  search_PATH, parseInput, runProgram, relativeToAbsPaths
} from './utils.ts';
import { handleBuiltIns, handleRedirection } from './handlers.ts';

export const rl: Interface = createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt_shell(): Promise<string> 
{ 
  return new Promise((resolve) => {
    rl.question("$ ", (answer) => {
      resolve(answer);
    });
  })
}

while (true) 
{
  let inp: string = await prompt_shell();
  let cmd: string; 
  let args: string[];
  
  [cmd, args] = parseInput(inp);

  let out_stream: Writable;
  let err_stream: Writable;

  //Redirects streams if redirection is specified
  [args, out_stream, err_stream] = handleRedirection(args);


  if (isBuiltIn(cmd))
  {
    let nxt = handleBuiltIns(cmd, args, out_stream, err_stream);
    if (nxt === 'Continue') { continue; }
    else { break; }
  }

  //Search for command
  let pathExists: boolean;
  let fullPath: string; 
  [pathExists, fullPath] = search_PATH(cmd);
  if (pathExists)
  {
    await runProgram(cmd, args, out_stream, err_stream);
    continue;
  }  
  
  out_stream.end();
  err_stream.end(); 
  
  rl.write(`${cmd}: command not found\n`);
}

