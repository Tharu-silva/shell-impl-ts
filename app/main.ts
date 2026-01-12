import { createInterface, type Interface, emitKeypressEvents } from "readline";
import fs from 'fs';
import { type Writable } from "stream";

import {type PromptResult} from '../types/common.ts';
import { isBuiltIn } from './symbols.ts';
import { 
  search_PATH, parseInput, runProgram, relativeToAbsPaths
} from './utils.ts';
import { handleBuiltIns, handleRedirection } from './handlers.ts';

export const rl: Interface = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Enable raw mode and keypress events
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}
emitKeypressEvents(process.stdin);


function prompt_shell(): Promise<PromptResult> {
  return new Promise((resolve) => {
    let input = '';
    
    process.stdout.write('$ ');
    
    const onKeypress = (str: string, key: any) => {
      if (key.name === 'tab') 
      {
        // Tab pressed - resolve with 'tab' state
        // process.stdout.write('\n');
        process.stdin.removeListener('keypress', onKeypress);
        resolve({input, key: 'tab'});

        // resolve({ input, key: 'tab' });
      } else if (key.name === 'return' || key.name === 'enter') 
      {
        // Enter pressed - resolve with 'enter' state
        process.stdin.removeListener('keypress', onKeypress);
        resolve({ input, key: 'enter' });
      } else if (key.ctrl && key.name === 'c') 
      {
        // Handle Ctrl+C to exit
        process.exit();
      } else if (key.name === 'backspace') 
      {
        // Handle backspace
        if (input.length > 1) {
          input = input.slice(0, -1);
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write('$ ' + input);        
        }
      } else if (str && !key.ctrl && !key.meta) 
      {
        // Regular character input
        input += str;
      }
    };
    
    process.stdin.on('keypress', onKeypress);
  });
}

//Auto-complete set-up
//Build prefix trie of built ins
//Then search over when TAB is pressed
//Then output to console

while (true) 
{
  // let input: string;
  // let key: string; 
  let {input, key} = await prompt_shell();

  //Handle auto-completion if key is <TAB>
  if (key === 'tab')
  {
    
  }
  let cmd: string; 
  let args: string[];
  
  [cmd, args] = parseInput(input);

  //Redirects streams if redirection is specified
  let { modArgs, out_stream, err_stream } = handleRedirection(args);


  if (isBuiltIn(cmd))
  {
    let nxt = handleBuiltIns(cmd, modArgs, out_stream, err_stream);
    if (nxt === 'Continue') { continue; }
    else { break; }
  }

  //Search for command
  let pathExists: boolean;
  let fullPath: string; 
  [pathExists, fullPath] = search_PATH(cmd);
  if (pathExists)
  {
    await runProgram(cmd, modArgs, out_stream, err_stream);
    continue;
  }  

  out_stream.write(`${cmd}: command not found\n`);

  out_stream.end();
  err_stream.end(); 
}

