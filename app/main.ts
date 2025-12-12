import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// TODO: Uncomment the code below to pass the first stage


function prompt_shell(): Promise<String> { 
  return new Promise((resolve) => {
    rl.question("$ ", (answer) => {
      console.log(`${answer}: command not found`);
      resolve(answer);
    });
  })
}

while (true) {
  let prompt: String = await prompt_shell();
}

