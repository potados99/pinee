import getEnv from "./lib/utils/env";

export default {
  auth: {
    token: getEnv('TOKEN') || 'YEAH'
  }
}
