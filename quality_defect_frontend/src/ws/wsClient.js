import { getRuntimeConfig } from "../config";
import { getAccessToken } from "../auth/tokenStorage";

const { wsUrl } = getRuntimeConfig();

// PUBLIC_INTERFACE
export function createWsClient({ onMessage, onStatus } = {}) {
  /**
   * Creates a minimal WebSocket client with reconnect scaffolding.
   * The backend should accept a token via query param (if supported): ?token=...
   */
  let ws = null;
  let closedByUser = false;
  let reconnectTimer = null;

  const notifyStatus = (status) => onStatus && onStatus(status);

  const connect = () => {
    if (!wsUrl) {
      notifyStatus({ state: "disabled", reason: "REACT_APP_WS_URL not set" });
      return;
    }

    const token = getAccessToken();
    const url = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;

    closedByUser = false;
    notifyStatus({ state: "connecting" });
    ws = new WebSocket(url);

    ws.onopen = () => notifyStatus({ state: "open" });

    ws.onclose = () => {
      ws = null;
      if (closedByUser) {
        notifyStatus({ state: "closed" });
        return;
      }
      notifyStatus({ state: "reconnecting" });
      reconnectTimer = window.setTimeout(connect, 1500);
    };

    ws.onerror = () => {
      // Let close handler drive reconnection.
      notifyStatus({ state: "error" });
    };

    ws.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data);
        onMessage && onMessage(payload);
      } catch {
        onMessage && onMessage(evt.data);
      }
    };
  };

  const disconnect = () => {
    closedByUser = true;
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
    if (ws) ws.close();
    ws = null;
  };

  const send = (data) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(typeof data === "string" ? data : JSON.stringify(data));
    return true;
  };

  return { connect, disconnect, send };
}
