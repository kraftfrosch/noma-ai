import express from 'express';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { RealtimeAgent, RealtimeSession, type RealtimeClientMessage } from '@openai/agents/realtime';

type Cleanup = () => void;

const loadEnvFromFile = (): void => {
  const envFilePath = resolve(process.cwd(), '.env');
  if (!existsSync(envFilePath)) {
    return;
  }

  const fileContents = readFileSync(envFilePath, 'utf8');
  for (const line of fileContents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || typeof process.env[key] === 'string') {
      continue;
    }

    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
};

// Load environment variables if the process was not started with them already populated.
loadEnvFromFile();

const OPENAI_EPHEMERAL_KEY = process.env.OPENAI_EPHEMERAL_KEY;
if (!OPENAI_EPHEMERAL_KEY) {
  throw new Error('OPENAI_EPHEMERAL_KEY is required to start the realtime bridge.');
}

const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? 'gpt-realtime';
const AGENT_NAME = process.env.OPENAI_AGENT_NAME ?? 'Assistant';
const AGENT_INSTRUCTIONS =
  process.env.OPENAI_AGENT_INSTRUCTIONS ?? 'You are a helpful assistant.';

const app = express();
app.get('/', (_, res) => res.send('OK'));

const server = createServer(app);
const port = Number.parseInt(process.env.PORT ?? '3000', 10);

const websocketPath = '/realtime';
const wss = new WebSocketServer({ server, path: websocketPath });

wss.on('listening', () => {
  console.log(`Realtime WebSocket server listening on path ${websocketPath}`);
});

wss.on('connection', async (socket) => {
  const agent = new RealtimeAgent({
    name: AGENT_NAME,
    instructions: AGENT_INSTRUCTIONS,
  });
  const session = new RealtimeSession(agent, {
    transport: 'websocket',
    model: REALTIME_MODEL,
  });
  const transport = session.transport;

  const cleanupHandlers: Cleanup[] = [];
  const addTransportListener = (event: string, handler: (...args: any[]) => void): void => {
    (transport as any).on(event, handler);
    cleanupHandlers.push(() => {
      if (typeof (transport as any).off === 'function') {
        (transport as any).off(event, handler);
      } else if (typeof (transport as any).removeListener === 'function') {
        (transport as any).removeListener(event, handler);
      }
    });
  };

  const sendJson = (payload: unknown): void => {
    if (socket.readyState !== WebSocket.OPEN) {
      return;
    }
    try {
      socket.send(JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to send JSON payload to client', error);
    }
  };

  const forwardRealtimeEvent = (event: unknown): void => {
    sendJson(event);
  };

  addTransportListener('*', forwardRealtimeEvent);
  addTransportListener('connection_change', (status: unknown) => {
    sendJson({ type: 'connection.change', status });
  });
  addTransportListener('error', (error: unknown) => {
    sendJson({ type: 'realtime.error', error });
  });
  addTransportListener('audio', (audioEvent: { data: ArrayBuffer }) => {
    if (socket.readyState !== WebSocket.OPEN) {
      return;
    }
    const buffer = Buffer.from(audioEvent.data);
    socket.send(buffer, { binary: true });
  });

  const cleanup = (): void => {
    cleanupHandlers.splice(0).forEach((dispose) => {
      try {
        dispose();
      } catch (error) {
        console.error('Failed to dispose transport listener', error);
      }
    });
    session.close();
  };

  socket.once('close', cleanup);
  socket.once('error', cleanup);

  try {
    await session.connect({
      apiKey: OPENAI_EPHEMERAL_KEY,
      model: REALTIME_MODEL,
    });
    sendJson({ type: 'realtime.connected', message: 'Connected to OpenAI Realtime API' });
  } catch (error) {
    console.error('Failed to establish realtime session', error);
    sendJson({
      type: 'realtime.error',
      message: 'Failed to connect to OpenAI Realtime API',
      error: error instanceof Error ? error.message : error,
    });
    cleanup();
    socket.close(1011, 'Failed to connect to OpenAI');
    return;
  }

  const toArrayBuffer = (data: Buffer): ArrayBuffer => {
    const arrayBuffer = new ArrayBuffer(data.byteLength);
    const view = new Uint8Array(arrayBuffer);
    view.set(data);
    return arrayBuffer;
  };

  const toBuffer = (data: WebSocket.RawData): Buffer => {
    if (Buffer.isBuffer(data)) {
      return data;
    }
    if (Array.isArray(data)) {
      return Buffer.concat(data);
    }
    return Buffer.from(data as ArrayBufferLike);
  };

  const isRealtimeClientMessage = (value: unknown): value is RealtimeClientMessage => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      typeof (value as { type?: unknown }).type === 'string'
    );
  };

  socket.on('message', (rawData, isBinary) => {
    if (isBinary) {
      const chunk = toBuffer(rawData);
      transport.sendAudio(toArrayBuffer(chunk), {});
      return;
    }

    const text = typeof rawData === 'string' ? rawData : rawData.toString();
    if (!text.trim()) {
      return;
    }

    let event: unknown;
    try {
      event = JSON.parse(text);
    } catch (error) {
      sendJson({
        type: 'client.error',
        message: 'Unable to parse websocket payload as JSON',
      });
      return;
    }

    if (!isRealtimeClientMessage(event)) {
      sendJson({
        type: 'client.error',
        message: 'Invalid realtime client event payload',
      });
      return;
    }

    try {
      transport.sendEvent(event);
    } catch (error) {
      console.error('Failed to forward client event to OpenAI', error);
      sendJson({
        type: 'realtime.error',
        message: 'Failed to forward client event to OpenAI',
        error: error instanceof Error ? error.message : error,
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Express server listening on port ${port}. WebSocket bridge available at ${websocketPath}`);
});
