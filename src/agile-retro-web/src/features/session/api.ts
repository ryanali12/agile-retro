import {z} from "zod";
import { ApiError } from "../../shared/api/client";

const apiUrl = import.meta.env.VITE_API_URL ?? "APP_API_URL";

export const CreateSessionSchema = z.object({
  name: z.string(),
  participantName: z.string()
});

type CreateSesssionBody = z.infer<typeof CreateSessionSchema>

export const CreateSessionResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  code: z.string(),
  participantId: z.uuid(),
  participantName: z.string(),
});

export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>;

export async function createSession(data: CreateSesssionBody): Promise<CreateSessionResponse> {
    const response = await fetch(`${apiUrl}/sessions`, {
        method: "POST",
        body: JSON.stringify(data),
        headers:  {
            "Content-Type": "application/json"
        }
    })

    if(!response.ok) throw new ApiError(response);

    const responseBody = await response.json();
    
    return CreateSessionResponseSchema.parseAsync(responseBody)
}

export const GetSessionByCodeSchema = z.object({
  id: z.guid(),
  name: z.string(),
  code: z.string()
})

export type GetSessionByCodeResponse = z.infer<typeof GetSessionByCodeSchema>

export async function getSessionByCode(code: string){
     const response = await fetch(`${apiUrl}/sessions/by-code/${code}`, {
        method: "GET",
        headers:  {
            "Content-Type": "application/json"
        }
    })

    if(!response.ok) throw new ApiError(response);

    const responseBody = await response.json();
    
    return GetSessionByCodeSchema.parseAsync(responseBody)
}

export const LiveKitTokenSchema = z.object({
  token: z.string(),
  url: z.string(),
  roomName: z.string(),
  expiresAt: z.string()
})

export type LiveKitToken = z.infer<typeof LiveKitTokenSchema>

/**
 * Requests a LiveKit access token for a participant who has already joined the
 * session. The response includes the server URL, so callers should prefer it
 * over a build-time value.
 */
export async function getLiveKitToken(
  code: string,
  participantId: string
): Promise<LiveKitToken> {
  const response = await fetch(
    `${apiUrl}/sessions/${encodeURIComponent(code)}/livekit-token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ participantId })
    }
  )

  if (!response.ok) throw new ApiError(response);

  const responseBody = await response.json();

  return LiveKitTokenSchema.parseAsync(responseBody);
}