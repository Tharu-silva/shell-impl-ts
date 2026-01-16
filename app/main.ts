import { createInterface, type Interface, emitKeypressEvents } from "readline";

import type { KeyPress, ShellConfig, ShellProps } from '../types/common.ts';
import { isBuiltIn } from './symbols.ts';

import { 
  parseInput
} from './utils.ts';

import { 
  search_PATH, runProgram
} from "./exec.ts";

import { handleAutoComplete, handleBuiltIns, handleRedirection } from './handlers.ts';

export const rl: Interface = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Enable raw mode and keypress events
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}
emitKeypressEvents(process.stdin);

//Create shell state obj
function prompt_shell(shellConfig: ShellConfig): Promise<ShellProps> {
  return new Promise((resolve) => {
    let input: string = shellConfig.prompt;

    //If output is specified then output that then add the prompt line
    if (shellConfig.output)
    {
      process.stdout.write('\n' + shellConfig.output + '\n');
    } else 
    {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
    }

    process.stdout.write('$ ' + shellConfig.prompt);
    
    const onKeypress = (str: string, key: any) => {

      if (key.name === 'tab') 
      {
        process.stdin.removeListener('keypress', onKeypress);
        resolve({input, keyPress: 'tab'});

      } else if (key.name === 'return' || key.name === 'enter') 
      {
        // Enter pressed - resolve with 'enter' state
        process.stdin.removeListener('keypress', onKeypress);
        resolve({ input, keyPress: 'enter' });
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

let shellConfig: ShellConfig = {prompt: ''};
let prevKeyPress: KeyPress;
let shellProps: ShellProps = {input: '', keyPress: 'enter'};
while (true) 
{
  //Record prev keypress
  prevKeyPress = shellProps.keyPress; 

  shellProps = await prompt_shell(shellConfig);

  //Reset next prompt
  shellConfig.prompt = '';

  //Clean input
  shellProps.input = shellProps.input.replace(/\x07/g, '').trim();

  //Handle auto-completion if key is <TAB>
  if (shellProps.keyPress === 'tab')
  { 
    shellConfig = handleAutoComplete(shellProps, prevKeyPress); 
    continue; 
  }

  let cmd: string; 
  let args: string[];
  
  [cmd, args] = parseInput(shellProps.input);

  //Redirects streams if redirection is specified
  let { modArgs, out_stream, err_stream } = handleRedirection(args);


  if (isBuiltIn(cmd))
  {
    let nxt = handleBuiltIns(cmd, modArgs, out_stream, err_stream);
    if (nxt === 'Continue') { continue; }
    else { break; }
  }

  //Search for command
  let {pathExists, fullPaths: _, exec_names: __} = search_PATH(cmd);
  if (pathExists)
  {
    await runProgram(cmd, modArgs, out_stream, err_stream);
    continue;
  }  

  out_stream.write(`${cmd}: command not found\n`);

  out_stream.end();
  err_stream.end(); 
}

