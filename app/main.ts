import { createInterface } from "readline";
import path, { delimiter } from 'path';
import { execFile } from 'child_process';
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

function handleType(cmd: string, pathExists: boolean, path: string) 
{
  if (BUILT_INS.includes(cmd))
  {
    rl.write(`${cmd} is a shell builtin\n`);
    return; 
  } 

  if (pathExists) 
  { 
    rl.write(`${cmd} is ${path}\n`); 
  } else 
  { 
    rl.write(`${cmd}: not found\n`); 
  }
}

function runProgram(path: string, args: string[]): Promise<void> 
{
  return new Promise<void>((resolve) => {
    execFile(path, args, (error, stdout, stderr) => {
      if (error) { rl.write(`${error.message}`); }
      if (stderr) {rl.write(`${stderr}`)}
      if (stdout) {rl.write(`${stdout}`);}

      resolve();
    });
  });
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
  } 
  
  if (cmd === "echo") 
  {
    rl.write(`${args.join(' ')}\n`);
    continue; 
  } 
  
  //Check if cmd exists on path
  let pathExists: boolean;
  let fullPath: string; 
  [pathExists, fullPath] = search_PATH(args[0]);
  if (cmd == "type")
  {
    handleType(args[0], pathExists, fullPath);
    continue; 
  }

  [pathExists, fullPath] = search_PATH(cmd);
  if (pathExists)
  {
    await runProgram(fullPath, args);
    continue;
  }  
    
  rl.write(`${cmd}: command not found\n`);
}

