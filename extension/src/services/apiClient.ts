export interface ReviewPayload {
  code: string;
  language: string;
  filePath: string;
  mode: 'selection' | 'file';
}

export interface RefactorPayload {
  code: string;
  language: string;
  filePath: string;
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onComplete: (data: any) => void;
  onError: (error: string) => void;
  onStatus?: (status: string) => void;
}

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string = '',
    private readonly instanceId: string = 'vscode-code-inspector'
  ) {}

  private _headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Instance-Id': this.instanceId
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  public async clearCache(): Promise<void> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/cache/clear`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this._headers()
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cache clear failed (${res.status}): ${text}`);
    }
  }

  public async refactor(payload: RefactorPayload): Promise<string> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/refactor`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Refactor request failed (${res.status}): ${text}`);
    }
    const data = (await res.json()) as { refactored: string };
    return data.refactored;
  }

  public async streamReview(
    payload: ReviewPayload,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/review`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify(payload)
      });
    } catch (err: any) {
      callbacks.onError(`Network connection failed: ${err.message}`);
      return;
    }

    if (!res.ok) {
      const errorText = await res.text();
      callbacks.onError(`Server error (${res.status}): ${errorText}`);
      return;
    }

    if (!res.body) {
      callbacks.onError('Response body is empty');
      return;
    }

    try {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      let currentEvent = 'message';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // keep incomplete tail
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            currentEvent = 'message';
            continue;
          }

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.replace('event:', '').trim();
          } else if (trimmed.startsWith('data:')) {
            const rawData = trimmed.replace('data:', '').trim();
            try {
              const data = JSON.parse(rawData);
              if (currentEvent === 'chunk') {
                callbacks.onChunk(data.text || '');
              } else if (currentEvent === 'complete') {
                callbacks.onComplete(data);
              } else if (currentEvent === 'status' || currentEvent === 'cache_hit') {
                callbacks.onStatus?.(data.status || (data.cached ? '⚡ Cache hit' : 'Processing...'));
              } else if (currentEvent === 'error') {
                callbacks.onError(data.error || 'Review failed');
              } else {
                // Default message
                if (data.text) callbacks.onChunk(data.text);
                if (data.markdown) callbacks.onChunk(data.markdown);
              }
            } catch {
              // Not JSON, treat as plain text chunk
              callbacks.onChunk(rawData);
            }
          }
        }
      }

      if (buffer.trim()) {
        if (buffer.startsWith('data:')) {
          const rawData = buffer.replace('data:', '').trim();
          try {
            const data = JSON.parse(rawData);
            if (currentEvent === 'complete') {
              callbacks.onComplete(data);
            } else if (data.text) {
              callbacks.onChunk(data.text);
            }
          } catch {
            callbacks.onChunk(rawData);
          }
        }
      }
    } catch (streamErr: any) {
      callbacks.onError(`Stream error: ${streamErr.message}`);
    }
  }
}
