import { createInterface } from "readline";

const BUILT_INS: String[] = ['echo', 'exit', 'type'];

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt_shell(): Promise<String> 
{ 
  return new Promise((resolve) => {
    rl.question("$ ", (answer) => {
      resolve(answer);
    });
  })
}

function handle_type(cmd: String) 
{
  if (BUILT_INS.includes(cmd))
  {
    rl.write(`${cmd} is a shell builtin\n`);
  } else 
  {
    rl.write(`${cmd}: not found\n`);
  }
}

while (true) 
{
  let inp: String = await prompt_shell();
  let cmd: String; 
  let args: String[];

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

