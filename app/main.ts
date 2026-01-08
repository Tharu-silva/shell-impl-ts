import { createInterface, type Interface } from "readline";
import fs from 'fs';
import { type Writable } from "stream";


import { isBuiltIn } from './symbols.ts';
import { 
  search_PATH, parseInput, runProgram, relativeToAbsPaths
} from './utils.ts';
import { handleBuiltIns } from './handlers.ts';

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

  let out_stream: Writable = process.stdout;  
  let err_stream: Writable = process.stdout; 

  if (args.includes(">") || args.includes("1>"))
  { //Stdout redirection is specified

    let redir_idx: number = args.indexOf(">");
    redir_idx = redir_idx === -1 ? args.indexOf("1>") : redir_idx;

    let fName: string = args[redir_idx + 1];
    args = args.splice(0, redir_idx);
    //Creates file if it does not exist
    out_stream = fs.createWriteStream(fName); 
  }

  if (args.includes("2>"))
  {
    let redir_idx: number = args.indexOf("2>");

    let fName: string = args[redir_idx + 1];
    args = args.splice(0, redir_idx);
    //Creates file if it does not exist
    err_stream = fs.createWriteStream(fName); 
  }


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
    
  rl.write(`${cmd}: command not found\n`);
}

