import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// TODO: Uncomment the code below to pass the first stage


function prompt_shell(): Promise<String> { 
  return new Promise((resolve) => {
    rl.question("$ ", (answer) => {
      resolve(answer);
    });
  })
}

while (true) {
  let inp: String = await prompt_shell();
  let cmd: String; let args: String;

  [cmd, args] = inp.split(" ", 2);

  if (cmd === "exit") {
    rl.close();
    break; 
  } else if (cmd === "echo") {
    rl.write(`${args}\n`);
  } else {
    rl.write(`${cmd} : command not found\n`);
  }
}

