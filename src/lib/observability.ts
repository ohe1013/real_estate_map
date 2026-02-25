type EventPayload = Record<string, unknown>;

function formatPayload(payload?: EventPayload) {
  if (!payload || Object.keys(payload).length === 0) return "";
  return ` ${JSON.stringify(payload)}`;
}

export function logClientEvent(event: string, payload?: EventPayload) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[client:event] ${event}${formatPayload(payload)}`);
  }
}

export function logClientError(
  event: string,
  error: unknown,
  payload?: EventPayload
) {
  console.error(`[client:error] ${event}${formatPayload(payload)}`, error);
}

export function logServerEvent(event: string, payload?: EventPayload) {
  console.info(`[server:event] ${event}${formatPayload(payload)}`);
}

export function logServerError(
  event: string,
  error: unknown,
  payload?: EventPayload
) {
  console.error(`[server:error] ${event}${formatPayload(payload)}`, error);
}
