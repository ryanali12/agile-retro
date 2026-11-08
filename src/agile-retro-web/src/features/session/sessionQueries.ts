import { queryOptions, skipToken } from "@tanstack/react-query";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../shared/api/client";
import { getParticipantByIdAndSessionCode } from "../participant/api";
import { getLiveKitToken, getSessionByCode } from "./api";

const tokenRefreshLeadMs = 60_000;
const tokenRefreshMinIntervalMs = 30_000;

export function isNotFound(error: Error | null) {
  return error instanceof ApiError && error.status === StatusCodes.NOT_FOUND;
}

function retryUnlessNotFound(failureCount: number, error: Error) {
  return !isNotFound(error) && failureCount < 2;
}

function retryUnlessUnavailable(failureCount: number, error: Error) {
  if (error instanceof ApiError) {
    if (
      error.status === StatusCodes.NOT_FOUND ||
      error.status === StatusCodes.SERVICE_UNAVAILABLE
    ) {
      return false;
    }
  }

  return failureCount < 2;
}

/**
 * Milliseconds until the token should be refreshed, leaving a margin before it
 * expires.
 */
function msUntilTokenRefresh(expiresAt: string | undefined) {
  if (!expiresAt) return 0;

  return Math.max(
    new Date(expiresAt).getTime() - Date.now() - tokenRefreshLeadMs,
    0,
  );
}

export function sessionByCodeQueryOptions(sessionCode: string | undefined) {
  return queryOptions({
    queryKey: ["sessionByCode", sessionCode],
    queryFn: sessionCode ? () => getSessionByCode(sessionCode) : skipToken,
    retry: retryUnlessNotFound,
  });
}

export function participantQueryOptions(
  sessionCode: string | undefined,
  participantId: string | undefined,
) {
  return queryOptions({
    queryKey: ["participantByIdAndSessionCode", sessionCode, participantId],
    queryFn:
      sessionCode && participantId
        ? () => getParticipantByIdAndSessionCode(sessionCode, participantId)
        : skipToken,
    retry: retryUnlessNotFound,
  });
}

export function liveKitTokenQueryOptions(
  sessionCode: string | undefined,
  participantId: string | undefined,
) {
  return queryOptions({
    queryKey: ["liveKitToken", sessionCode, participantId],
    queryFn:
      sessionCode && participantId
        ? () => getLiveKitToken(sessionCode, participantId)
        : skipToken,
    retry: retryUnlessUnavailable,
    staleTime: (query) => msUntilTokenRefresh(query.state.data?.expiresAt),
    refetchInterval: (query) => {
      const expiresAt = query.state.data?.expiresAt;
      if (!expiresAt) return false;

      return Math.max(
        msUntilTokenRefresh(expiresAt),
        tokenRefreshMinIntervalMs,
      );
    },
  });
}
