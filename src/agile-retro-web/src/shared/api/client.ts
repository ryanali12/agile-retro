export class ApiError extends Error {
  public readonly response: Response;

  constructor(response: Response) {
    super(`API request failed with status ${response.status}`);

    this.name = "ApiError";
    this.response = response;
  }

  get status(): number {
    return this.response.status;
  }
}
