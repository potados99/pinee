import { Guild, User } from "discord.js";

export function isOwner(user: User, guild: Guild) {
  return true // user.id === guild.ownerID;
}
