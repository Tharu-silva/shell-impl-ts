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
  let cmd: String = await prompt_shell();
  if (cmd === "exit") {
    rl.close();
    break; 
  } else {
    console.log(`${cmd}: command not found`);
  }
}

