import type { BoardColumnId } from "./api";

export interface BoardColumnDefinition {
  id: BoardColumnId;
  title: string;
  description: string;
  accentClassName: string;
}

/**
 * Fixed retro columns. Keep the order: positive, negative, improvement ideas,
 * then the outcomes the team commits to.
 */
export const boardColumns: BoardColumnDefinition[] = [
  {
    id: "went-well",
    title: "Went well",
    description: "What should we keep doing?",
    accentClassName: "bg-success",
  },
  {
    id: "didnt-go-well",
    title: "Didn't go well",
    description: "What got in the way?",
    accentClassName: "bg-danger",
  },
  {
    id: "needs-improvement",
    title: "Needs improvement",
    description: "What should we change?",
    accentClassName: "bg-warning",
  },
  {
    id: "action-items",
    title: "Action items",
    description: "What will we do next?",
    accentClassName: "bg-primary",
  },
];
