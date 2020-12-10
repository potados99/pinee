import Discord from 'discord.js';
import config from "./config";

const client = new Discord.Client();

client.on('ready', () => {
  console.log('ready!!');
});

client.on('message', (message) => {
    console.log(message.content);
})

client.login(config.auth.token);
