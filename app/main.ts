import { createInterface } from "readline";

import { isBuiltIn } from './symbols.ts';
import { search_PATH, extractArgs, runProgram } from './utils.ts';
import { handleBuiltIns } from './handlers.ts';

export const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
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
  let argsRaw: string;

  let firstSpace: number = inp.indexOf(' ');
  if (firstSpace === -1) {
    cmd = inp;
    argsRaw = '';
  } else {
    cmd = inp.substring(0, firstSpace);
    argsRaw = inp.substring(firstSpace + 1);
  }

  let args: string[] = extractArgs(argsRaw);

  if (isBuiltIn(cmd))
  {
    let nxt = handleBuiltIns(cmd, args);
    if (nxt === 'Continue') { continue; }
    else { break; }
  }

  //Search for command
  let pathExists: boolean;
  let fullPath: string; 
  [pathExists, fullPath] = search_PATH(cmd);
  if (pathExists)
  {
    await runProgram(cmd, args);
    continue;
  }  
    
  rl.write(`${cmd}: command not found\n`);
}

