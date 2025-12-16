import { createInterface } from "readline";
import path, { delimiter } from 'path';
import fs from 'fs';

const BUILT_INS: string[] = ['echo', 'exit', 'type'];

const rl = createInterface({
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

function search_PATH(cmd: string): [boolean,string]
{
  //Split path 
  let paths: string[] | undefined = process.env.PATH?.split(delimiter);
  
  if (paths === undefined) { return [false, ""]; }
  
  let pathItem: string; 
  for (pathItem of paths)
  {
    let contents: string[] = [];
    try {
      contents = fs.readdirSync(pathItem);
    } catch (err) {
      continue; //Path likely does not exist on disk  
    }

    let item: string; 
    for (item of contents)
    {
      const fullPath: string = path.join(pathItem, item);
      const stats = fs.statSync(fullPath);

      const canOwnerExec: number = stats.mode & fs.constants.S_IXUSR;
      //Ignore directories
      if (!stats.isDirectory() && canOwnerExec && cmd == item)
      { 
        return [true, fullPath]; 
      }
    }
  }

  //Not found
  return [false, ""];
}

function handle_type(cmd: string) 
{
  if (BUILT_INS.includes(cmd))
  {
    rl.write(`${cmd} is a shell builtin\n`);
    return; 
  } 

  let pathExists: boolean;
  let fullPath: string; 
  [pathExists, fullPath] = search_PATH(cmd);

  if (pathExists) 
  { 
    rl.write(`${cmd} is ${fullPath}\n`); 
  } else 
  { 
    rl.write(`${cmd}: not found\n`); 
  }
}

while (true) 
{
  let inp: string = await prompt_shell();
  let cmd: string; 
  let args: string[];

  [cmd, ...args] = inp.split(" ");

  if (cmd === "exit") 
  {
    rl.close();
    break; 
  } else if (cmd === "echo") 
  {
    rl.write(`${args.join(' ')}\n`);
  } else if (cmd == "type") 
  {
    handle_type(args[0]);
  }
  else 
  {
    rl.write(`${cmd}: command not found\n`);
  }
}

