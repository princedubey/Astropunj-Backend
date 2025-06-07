import { RtcTokenBuilder, RtcRole } from "agora-access-token"

const APP_ID = process.env.AGORA_APP_ID!
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!

export const generateAgoraToken = (
  channelName: string,
  uid: number,
  role: "publisher" | "subscriber" = "publisher",
) => {
  const expirationTimeInSeconds = 3600 // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

  const agoraRole = role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER

  return RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, agoraRole, privilegeExpiredTs)
}

export { APP_ID }
