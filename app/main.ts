import { createInterface, type Interface, emitKeypressEvents } from "readline";

import {type PromptResult} from '../types/common.ts';
import { BUILT_INS, isBuiltIn } from './symbols.ts';

import { 
  parseInput
} from './utils.ts';

import { 
  search_PATH, runProgram, 
  execAutocomplete
} from "./exec.ts";

import { handleBuiltIns, handleRedirection } from './handlers.ts';
import { AutoComplete } from "./autocomplete.ts";

export const rl: Interface = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Enable raw mode and keypress events
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}
emitKeypressEvents(process.stdin);


function prompt_shell(prompt: string = ''): Promise<PromptResult> {
  return new Promise((resolve) => {
    let input = prompt;

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write('$ ' + prompt);
    
    const onKeypress = (str: string, key: any) => {
      if (key.name === 'tab') 
      {
        process.stdin.removeListener('keypress', onKeypress);
        resolve({input, key: 'tab'});

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
let autoCompleteBuiltIns: AutoComplete = new AutoComplete(BUILT_INS);


let prompt: string = '';
while (true) 
{
  let {input, key} = await prompt_shell(prompt);
  prompt = ''; 

  //Handle auto-completion if key is <TAB>
  if (key === 'tab')
  {
    //Search over built-ins, if not look over executables
    let autoCompCmd: string | undefined = autoCompleteBuiltIns.look_up_prefix(input);
    autoCompCmd = autoCompCmd ?? execAutocomplete(input); 

    //No matching completion
    if (autoCompCmd === undefined) { prompt = input + '\x07'}
    else { prompt = autoCompCmd + ' '; }
    
    continue; 
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
  let {pathExists, fullPath: _, exec_name: __} = search_PATH(cmd);
  if (pathExists)
  {
    await runProgram(cmd, modArgs, out_stream, err_stream);
    continue;
  }  

  out_stream.write(`${cmd}: command not found\n`);

  out_stream.end();
  err_stream.end(); 
}

