import prompts, { PromptObject } from "prompts";

type CommandCall = (commit: boolean) => Promise<unknown>;
type Choice = {
  title: string;
  description: string;
  call?: CommandCall;
};

/**
 * Request user confirmation for commit mode
 * @returns void
 */
const confirmCommit = async () =>
  await prompts<"confirm">({
    type: "confirm",
    name: "confirm",
    message: "To run the command in  commit mode,\nplease confirm?",
    initial: false,
  });

/**
 * Prompt user with the available commands to execute
   commands are defined in commands module
 * @param choices COMMANDS
 * @param commit boolean
 * @returns Promise<{choice: number}>
 */
const selectCommands = async (choices: Array<Choice>, commit: boolean) => {
  const onSubmit = async (prompt: PromptObject, answer: number) => {
    const callable = choices[answer].call;
    if (callable) await callable(commit);
  };
  return await prompts<"choice">(
    {
      type: "select",
      name: "choice",
      message: "Select command to execute",
      choices: choices.map((choice, index) => ({
        title: choice.title,
        description: choice.description,
        value: index,
      })),
      initial: 0,
    },
    { onSubmit }
  );
};
export { confirmCommit, selectCommands, Choice };
