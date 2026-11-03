const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

type ProblemDetails = {
  title?: string
  detail?: string
  status?: number
}

export class ApiError extends Error {
  readonly status: number
  readonly detail: string | undefined

  constructor(status: number, message: string, detail?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

async function readProblemDetails(response: Response): Promise<ProblemDetails> {
  try {
    return (await response.json()) as ProblemDetails
  } catch {
    return {}
  }
}

/**
 * Calls the API. Paths are relative to the API root ("/api/..."), so they work
 * through the Vite dev proxy without configuring a URL.
 */
export async function apiRequest<TResponse>(
  path: string,
  init: RequestInit = {},
): Promise<TResponse> {
  const headers = new Headers(init.headers)

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })

  if (!response.ok) {
    const problem = await readProblemDetails(response)
    throw new ApiError(
      response.status,
      problem.title ?? `Request failed with status ${response.status}`,
      problem.detail,
    )
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await response.json()) as TResponse
}
