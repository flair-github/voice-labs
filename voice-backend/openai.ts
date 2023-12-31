import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat";

const openai = new OpenAI({
  apiKey: "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",
});

// define initial message - the system telling OpenAI how to act
const messages: Array<ChatCompletionMessageParam> = [
  {
    role: "system",
    content:
      "You are a voice assistant that the user is speaking to. Answer their question concisely. Your response will be spoken to the user, so it should be appropriate for the audio format. It shouldn't be longer than 2 sentences.",
  },
];

// define a simple interface for getting the next message in the chat.
export async function getOpenAIChatCompletion(
  newMessage: string
): Promise<string> {
  //   get chat completion by sending all previous messages, including the latest one
  messages.push({
    role: "user",
    content: newMessage,
  });
  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
  });
  return chatCompletion.choices[0].message.content || "";
}
