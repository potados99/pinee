import Discord, { Message } from "discord.js";
import { onReady } from "./routes/ready";
import { onMessageUpdate } from "./routes/message";
import config from "../config";

export default async function startBot() {

  const client = new Discord.Client({ partials: ['MESSAGE'] }); // Listen for changes on previous messages.

  client.on('ready', async () => {
    await onReady(client);
  });

  client.on('messageUpdate', async (before, after) => {
   if (before.partial || after.partial) {
     console.log('Update on previous message.');

     await before.fetch();
     await after.fetch();
   }

    await onMessageUpdate(client, before as Message, after as Message);
  })

  if (await client.login(config.auth.token) !== config.auth.token) {
    throw Error('Login failed!');
  } else {
    console.log('Login succeeded.');
  }
}
