import { log } from "../utils/logging";
import { Client } from "discord.js";

export async function onReady(_: Client) {
  log("Pinee 시작!");
}
