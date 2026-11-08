import { z } from "zod";
import { ApiError } from "../../shared/api/client";

const apiUrl = import.meta.env.VITE_API_URL ?? "APP_API_URL";

export const GetParticipantSchema = z.object({
  id: z.uuid(),
  name: z.string()
});

export type GetParticipantResponse = z.infer<typeof GetParticipantSchema>;

export async function getParticipantByIdAndSessionCode(
  sessionCode: string,
  participantId: string
): Promise<GetParticipantResponse> {
  const response = await fetch(
    `${apiUrl}/sessions/${encodeURIComponent(sessionCode)}/participants/${participantId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.ok) throw new ApiError(response);

  const responseBody = await response.json();

  return GetParticipantSchema.parseAsync(responseBody);
}

export const JoinSessionSchema = z.object({
  code: z.string(),
  participantName: z.string()
})

export type JoinSessionBody = z.infer<typeof JoinSessionSchema>

export const JoinSessionResponseSchema = z.object({
  participantId: z.guid(),
  participantName: z.string()
})

export type JoinSessionResponse = z.infer<typeof JoinSessionResponseSchema>

export async function joinSession(
 body: JoinSessionBody
): Promise<JoinSessionResponse> {
  const response = await fetch(
    `${apiUrl}/sessions/${encodeURIComponent(body.code)}/participants`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) throw new ApiError(response);

  const responseBody = await response.json();

  return JoinSessionResponseSchema.parseAsync(responseBody);
}