import { log } from "../utils/logging";
import { Client } from "discord.js";

/**
 * 클라이언트가 준비 상태가 되었을 때에 실행할 동작을 정의합니다.
 * @param _ 클라이언트
 */
export async function onReady(_: Client) {
  log("Pinee 시작!");
}
