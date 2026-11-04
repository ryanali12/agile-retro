import type { HubConnection } from "@microsoft/signalr";
import { z } from "zod";

export const BoardColumnIdSchema = z.enum([
  "went-well",
  "didnt-go-well",
  "needs-improvement",
  "action-items",
]);

export type BoardColumnId = z.infer<typeof BoardColumnIdSchema>;

const BoardCardPayloadSchema = z.object({
  id: z.uuid(),
  participantId: z.uuid(),
  authorName: z.string(),
  columnKey: BoardColumnIdSchema,
  text: z.string(),
  createdAt: z.string(),
});

export const BoardCardSchema = BoardCardPayloadSchema.transform(
  ({ columnKey, ...card }) => ({ ...card, columnId: columnKey }),
);

export type BoardCard = z.infer<typeof BoardCardSchema>;

export const BoardParticipantSchema = z.object({
  participantId: z.uuid(),
  name: z.string(),
});

export type BoardParticipant = z.infer<typeof BoardParticipantSchema>;

export const BoardParticipantsSchema = z.array(BoardParticipantSchema);

export const BoardSnapshotSchema = z.object({
  sessionId: z.uuid(),
  code: z.string(),
  name: z.string(),
  cards: z.array(BoardCardSchema),
  participants: BoardParticipantsSchema,
});

export type BoardSnapshot = z.infer<typeof BoardSnapshotSchema>;

export const boardQueryKey = (code: string) => ["board", code] as const;

export interface CreateBoardCardInput {
  columnKey: BoardColumnId;
  text: string;
}

export interface UpdateBoardCardInput {
  cardId: string;
  text: string;
}

export async function joinBoard(
  connection: HubConnection,
  code: string,
  participantId: string,
): Promise<BoardSnapshot> {
  const payload = await connection.invoke("JoinBoard", code, participantId);

  return BoardSnapshotSchema.parseAsync(payload);
}

export async function createBoardCard(
  connection: HubConnection,
  input: CreateBoardCardInput,
): Promise<BoardCard> {
  const payload = await connection.invoke("CreateCard", input);

  return BoardCardSchema.parseAsync(payload);
}

export async function updateBoardCard(
  connection: HubConnection,
  input: UpdateBoardCardInput,
): Promise<BoardCard> {
  const payload = await connection.invoke("UpdateCard", input);

  return BoardCardSchema.parseAsync(payload);
}
