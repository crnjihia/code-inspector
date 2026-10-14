/**
 * Code Inspector — Interactive Showcase & Live Simulation Engine
 */

(function () {
  'use strict';

  // --- Preset Scenarios Data ---
  const PRESETS = {
    ecommerce: {
      name: 'TypeScript: Discount Calculation',
      fileName: 'calculateDiscount.ts',
      mode: 'selection',
      language: 'typescript',
      originalCode: `function calculateDiscount(user, total) {
  let disc = 0;
  if (user.isVip) {
    if (total > 200) {
      disc = total * 0.25;
    } else {
      disc = total * 0.15;
    }
  } else if (total > 100) {
    disc = total * 0.1;
  }
  return total - disc;
}`,
      fixedBugCode: `function calculateDiscount(user, total) {
  if (!user || typeof total !== 'number' || total <= 0) return 0;
  let disc = 0;
  if (user.isVip) {
    if (total > 200) {
      disc = total * 0.25;
    } else {
      disc = total * 0.15;
    }
  } else if (total > 100) {
    disc = total * 0.1;
  }
  return total - disc;
}`,
      renamedCode: `function calculateDiscount(user, total) {
  let discount = 0;
  if (user.isVip) {
    if (total > 200) {
      discount = total * 0.25;
    } else {
      discount = total * 0.15;
    }
  } else if (total > 100) {
    discount = total * 0.1;
  }
  return total - discount;
}`,
      refactoredCode: `/**
 * Pure, declarative discount calculation with strict input validation.
 */
export function calculateDiscount(user: { isVip?: boolean } | null, total: number): number {
  if (!user || total <= 0) return 0;
  
  const discountRate = user.isVip
    ? (total > 200 ? 0.25 : 0.15)
    : (total > 100 ? 0.10 : 0);

  return Number((total * (1 - discountRate)).toFixed(2));
}`,
      reviewData: {
        bugs: [
          {
            id: 'bug-1',
            severity: 'high',
            line: 3,
            rule: 'strict-null-check',
            description: 'Potential null pointer crash: accessing properties on user without verifying object existence or shape.',
            diffOld: 'if (user.isVip) {',
            diffNew: 'if (!user || typeof total !== "number" || total <= 0) return 0;',
            fixType: 'bug'
          },
          {
            id: 'bug-2',
            severity: 'medium',
            line: 2,
            rule: 'no-reassign',
            description: 'Variable disc is mutated repeatedly across 4 branching paths. Prone to state leakage and difficult to test.',
            diffOld: 'let disc = 0;',
            diffNew: 'const discountRate = computeRate(user, total);',
            fixType: 'reassign'
          }
        ],
        complexity: {
          score: 4,
          issues: [
            'Deeply nested if-else conditional tree increases cyclomatic complexity to 5.',
            'Implicit assumption that total is always a non-negative finite number.'
          ]
        },
        naming: [
          {
            id: 'naming-1',
            line: 2,
            current: 'disc',
            suggested: 'discount',
            reason: 'Avoid cryptic abbreviations to conform with Clean Code and team styleguides.'
          }
        ],
        refactors: [
          {
            id: 'refactor-1',
            title: 'Declarative Guard Clause & Rate Ternary',
            description: 'Flattens conditional branches into an early-return guard clause and a clean mathematical rate lookup.',
            snippet: 'const discountRate = user.isVip ? (total > 200 ? 0.25 : 0.15) : (total > 100 ? 0.10 : 0);'
          }
        ]
      }
    },

    asyncHandler: {
      name: 'Node.js: Async Database Controller',
      fileName: 'userController.js',
      mode: 'function',
      language: 'javascript',
      originalCode: `async function transferCredits(senderId, recipientId, amount) {
  const sender = await db.query('SELECT balance FROM users WHERE id = $1', [senderId]);
  if (sender.rows[0].balance < amount) {
    throw new Error('Insufficient funds');
  }
  await db.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, senderId]);
  await db.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, recipientId]);
  return { success: true };
}`,
      fixedBugCode: `async function transferCredits(senderId, recipientId, amount) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const sender = await client.query('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [senderId]);
    if (!sender.rows[0] || sender.rows[0].balance < amount) {
      throw new Error('Insufficient balance or invalid sender');
    }
    await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, senderId]);
    await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, recipientId]);
    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}`,
      renamedCode: `async function transferCredits(sourceUserId, destinationUserId, creditAmount) {
  const sender = await db.query('SELECT balance FROM users WHERE id = $1', [sourceUserId]);
  if (sender.rows[0].balance < creditAmount) {
    throw new Error('Insufficient funds');
  }
  await db.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [creditAmount, sourceUserId]);
  await db.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [creditAmount, destinationUserId]);
  return { success: true };
}`,
      refactoredCode: `/**
 * Transactional credit transfer with row-level locks and automatic rollback.
 */
async function transferCredits(senderId, recipientId, amount) {
  return await db.transaction(async (tx) => {
    const { rows } = await tx.query(
      'SELECT balance FROM users WHERE id = $1 FOR UPDATE',
      [senderId]
    );
    if (!rows[0] || rows[0].balance < amount) {
      throw new Error('Transaction aborted: Insufficient funds');
    }
    await tx.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, senderId]);
    await tx.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, recipientId]);
    return { status: 'TRANSFERRED', amount, at: new Date().toISOString() };
  });
}`,
      reviewData: {
        bugs: [
          {
            id: 'bug-1',
            severity: 'high',
            line: 6,
            rule: 'acid-transaction-missing',
            description: 'Critical data integrity flaw: Two sequential UPDATEs without database transaction (BEGIN/COMMIT). Crash between queries results in lost money.',
            diffOld: 'await db.query("UPDATE users SET balance = balance - $1 ...")',
            diffNew: 'await client.query("BEGIN"); ... await client.query("COMMIT");',
            fixType: 'bug'
          },
          {
            id: 'bug-2',
            severity: 'high',
            line: 2,
            rule: 'race-condition-concurrency',
            description: 'Double-spending vulnerability: SELECT without FOR UPDATE allows concurrent transfers to pass balance check simultaneously.',
            diffOld: "SELECT balance FROM users WHERE id = $1",
            diffNew: "SELECT balance FROM users WHERE id = $1 FOR UPDATE",
            fixType: 'bug'
          }
        ],
        complexity: {
          score: 3,
          issues: [
            'Unenclosed async calls leave database connections unreleased on failure.',
            'Missing input bounds validation on amount (e.g. negative amounts).'
          ]
        },
        naming: [
          {
            id: 'naming-1',
            line: 1,
            current: 'senderId, recipientId',
            suggested: 'sourceUserId, destinationUserId',
            reason: 'Explicit domain entities reduce semantic ambiguity in financial service methods.'
          }
        ],
        refactors: [
          {
            id: 'refactor-1',
            title: 'Transactional Runner with Auto-Rollback',
            description: 'Wraps operations in an ACID transaction helper with pessimistic locking.',
            snippet: 'return await db.transaction(async (tx) => { ... });'
          }
        ]
      }
    },

    reactHook: {
      name: 'React: Timer & Stale State Closure',
      fileName: 'LiveTimer.tsx',
      mode: 'selection',
      language: 'typescript',
      originalCode: `import React, { useState, useEffect } from 'react';

export function LiveTimer({ initial = 0 }) {
  const [val, setVal] = useState(initial);

  useEffect(() => {
    const id = setInterval(() => {
      setVal(val + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <div className="timer">Elapsed: {val}s</div>;
}`,
      fixedBugCode: `import React, { useState, useEffect } from 'react';

export function LiveTimer({ initial = 0 }) {
  const [val, setVal] = useState(initial);

  useEffect(() => {
    const id = setInterval(() => {
      setVal(prev => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <div className="timer">Elapsed: {val}s</div>;
}`,
      renamedCode: `import React, { useState, useEffect } from 'react';

export function LiveTimer({ initialSeconds = 0 }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(initialSeconds);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <div className="timer">Elapsed: {elapsedSeconds}s</div>;
}`,
      refactoredCode: `import React, { useState, useEffect } from 'react';

interface LiveTimerProps {
  initialSeconds?: number;
}

export const LiveTimer: React.FC<LiveTimerProps> = ({ initialSeconds = 0 }) => {
  const [seconds, setSeconds] = useState<number>(initialSeconds);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  return (
    <div className="timer" role="timer" aria-live="polite">
      <span>Elapsed:</span> <strong>{seconds}s</strong>
    </div>
  );
};`,
      reviewData: {
        bugs: [
          {
            id: 'bug-1',
            severity: 'high',
            line: 8,
            rule: 'react-stale-closure',
            description: 'Stale closure bug: setVal(val + 1) captures the initial render value (0). The timer will tick from 0 to 1 and stay at 1 forever.',
            diffOld: 'setVal(val + 1);',
            diffNew: 'setVal(prev => prev + 1);',
            fixType: 'bug'
          }
        ],
        complexity: {
          score: 2,
          issues: [
            'Missing prop-type interface and accessible ARIA attributes on time display.'
          ]
        },
        naming: [
          {
            id: 'naming-1',
            line: 4,
            current: 'val, setVal',
            suggested: 'elapsedSeconds, setElapsedSeconds',
            reason: 'Generic variable name val obscures unit of measurement and state purpose.'
          }
        ],
        refactors: [
          {
            id: 'refactor-1',
            title: 'TypeScript Interface & Functional State Updater',
            description: 'Strict typing for component props and accessible timer presentation.',
            snippet: 'setSeconds(prev => prev + 1);'
          }
        ]
      }
    },

    pythonData: {
      name: 'Python: Mutable Default Argument',
      fileName: 'data_pipeline.py',
      mode: 'file',
      language: 'python',
      originalCode: `def collect_metrics(event, bucket=[]):
    bucket.append(event)
    payload = {
        "len": len(bucket),
        "data": bucket
    }
    return payload`,
      fixedBugCode: `def collect_metrics(event, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(event)
    payload = {
        "len": len(bucket),
        "data": bucket
    }
    return payload`,
      renamedCode: `def collect_metrics(event_payload, event_accumulator=None):
    if event_accumulator is None:
        event_accumulator = []
    event_accumulator.append(event_payload)
    return {
        "total_count": len(event_accumulator),
        "events": event_accumulator
    }`,
      refactoredCode: `from typing import Any, Dict, List, Optional

def collect_metrics(
    event: Any, 
    bucket: Optional[List[Any]] = None
) -> Dict[str, Any]:
    """Appends an event into an isolated per-invocation accumulator."""
    events = [] if bucket is None else list(bucket)
    events.append(event)
    return {
        "total_count": len(events),
        "events": events
    }`,
      reviewData: {
        bugs: [
          {
            id: 'bug-1',
            severity: 'high',
            line: 1,
            rule: 'python-mutable-default-arg',
            description: 'Critical Python gotcha: default list bucket=[] is instantiated once at function definition. Subsequent calls without bucket share identical memory state.',
            diffOld: 'def collect_metrics(event, bucket=[]):',
            diffNew: 'def collect_metrics(event, bucket=None):\n    if bucket is None: bucket = []',
            fixType: 'bug'
          }
        ],
        complexity: {
          score: 1,
          issues: [
            'No type hinting or docstring specifications provided.'
          ]
        },
        naming: [
          {
            id: 'naming-1',
            line: 1,
            current: 'bucket',
            suggested: 'accumulator / event_list',
            reason: 'Bucket colloquially implies S3 storage in cloud data processing pipelines.'
          }
        ],
        refactors: [
          {
            id: 'refactor-1',
            title: 'Modern Type Hinting & None Guard',
            description: 'Isolates accumulator state and defines explicit return schema.',
            snippet: 'bucket: Optional[List[Any]] = None'
          }
        ]
      }
    }
  };

  // --- Pipeline Steps Technical Details ---
  const PIPELINE_DETAILS = [
    {
      title: 'VS Code Client Trigger',
      badge: 'Editor Extension',
      desc: 'The developer selects a code block and triggers Ctrl+Shift+K or right-clicks "Code Inspector: Review this function".',
      specs: [
        { label: 'Latency', value: '< 2ms' },
        { label: 'Trigger Type', value: 'Keybinding / ContextMenu' },
        { label: 'Payload', value: 'code, language, filePath, selectionRange' }
      ],
      codeSnippet: `// VS Code Extension Command Handler
vscode.commands.registerCommand('codeInspector.reviewSelection', async () => {
  const editor = vscode.window.activeTextEditor;
  const selection = editor.selection;
  const code = editor.document.getText(selection);
  
  // Stream to webview beside active editor
  await inspectorPanel.streamReview({
    code,
    language: editor.document.languageId,
    filePath: editor.document.fileName
  });
});`
    },
    {
      title: 'Express Backend Ingestion',
      badge: 'Node.js 20+ / Express',
      desc: 'Lightweight API server receives POST /review with Bearer token authentication and input schema validation.',
      specs: [
        { label: 'Transport', value: 'HTTP POST / SSE Stream' },
        { label: 'Auth', value: 'Bearer CODE_INSPECTOR_API_KEY' },
        { label: 'Rate Limit', value: '100 req/min' }
      ],
      codeSnippet: `// Backend Review Route (Express)
router.post('/review', authenticateToken, async (req, res) => {
  const { code, language, filePath, mode } = req.body;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  await reviewService.executeReview({ code, language, filePath, mode }, res);
});`
    },
    {
      title: 'SHA-256 Redis 7 Caching',
      badge: 'Sub-50ms Acceleration',
      desc: 'Computes cryptographic SHA-256 hash of the sanitized code string + language + inspection mode. Checks Redis memory cache.',
      specs: [
        { label: 'Cache Hit Latency', value: '18ms - 42ms' },
        { label: 'TTL', value: '24 Hours (86,400s)' },
        { label: 'Key Format', value: 'review:sha256(code+lang+mode)' }
      ],
      codeSnippet: `// Redis Cache Service
const hash = crypto.createHash('sha256')
  .update(code.trim() + ':' + language + ':' + mode)
  .digest('hex');

const cached = await redis.get(\`review:\${hash}\`);
if (cached) {
  res.write(\`data: \${JSON.stringify({ type: 'status', status: 'Cache hit ⚡' })}\\n\\n\`);
  res.write(\`data: \${JSON.stringify({ type: 'complete', data: JSON.parse(cached) })}\\n\\n\`);
  return res.end();
}`
    },
    {
      title: 'Claude 3.5 Sonnet Streaming',
      badge: 'Anthropic AI Engine',
      desc: 'On a cache miss, requests streamed JSON review from Claude 3.5 Sonnet. Tokens are forwarded in real-time to the extension.',
      specs: [
        { label: 'Model', value: 'claude-3-5-sonnet-20241022' },
        { label: 'Max Tokens', value: '4,096' },
        { label: 'Stream Protocol', value: 'Server-Sent Events (SSE)' }
      ],
      codeSnippet: `// Anthropic Claude Stream
const stream = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,
  stream: true,
  messages: [{ role: 'user', content: prompt }]
});

for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta') {
    res.write(\`data: \${JSON.stringify({ type: 'chunk', text: chunk.delta.text })}\\n\\n\`);
  }
}`
    },
    {
      title: 'Native WorkspaceEdit Application',
      badge: 'VS Code Editor API',
      desc: 'One-click actions apply targeted diffs directly to the user document with full undo/redo stack support.',
      specs: [
        { label: 'Execution', value: 'vscode.workspace.applyEdit()' },
        { label: 'Safety', value: 'Zero file corruption, native undo (Ctrl+Z)' },
        { label: 'Visuals', value: 'Side-by-side diff preview' }
      ],
      codeSnippet: `// Applying One-Click Edit
const workspaceEdit = new vscode.WorkspaceEdit();
const range = new vscode.Range(startLine, 0, endLine, 0);

workspaceEdit.replace(document.uri, range, replacementCode);
await vscode.workspace.applyEdit(workspaceEdit);
vscode.window.showInformationMessage('Code Inspector: Fix applied successfully!');`
    }
  ];

  // --- State Variables ---
  let currentPresetKey = 'ecommerce';
  let isStreaming = false;
  let activeCode = '';

  // --- DOM Elements ---
  const presetButtons = document.querySelectorAll('.preset-btn');
  const fileTabTitle = document.getElementById('fileTabTitle');
  const codeArea = document.getElementById('codeArea');
  const lineNumbers = document.getElementById('lineNumbers');
  const inspectBtn = document.getElementById('inspectBtn');
  const cacheHitBtn = document.getElementById('cacheHitBtn');
  const resetBtn = document.getElementById('resetBtn');

  // Webview Pane Elements
  const statusBadge = document.getElementById('statusBadge');
  const webviewTarget = document.getElementById('webviewTarget');
  const inspectorEmpty = document.getElementById('inspectorEmpty');
  const streamSection = document.getElementById('streamSection');
  const streamTerminal = document.getElementById('streamTerminal');
  const webviewResults = document.getElementById('webviewResults');

  // Mini Stats in Webview
  const statBugs = document.getElementById('statBugs');
  const statComplexity = document.getElementById('statComplexity');
  const statNaming = document.getElementById('statNaming');
  const statRefactors = document.getElementById('statRefactors');

  // Card Containers
  const bugsContainer = document.getElementById('bugsContainer');
  const complexityContainer = document.getElementById('complexityContainer');
  const namingContainer = document.getElementById('namingContainer');
  const refactorsContainer = document.getElementById('refactorsContainer');

  // Toast
  const toastNotice = document.getElementById('toastNotice');
  const toastText = document.getElementById('toastText');

  // --- Initializer ---
  function init() {
    loadPreset(currentPresetKey);
    bindEvents();
    setupPipelineStepper();
    setupTabs();
  }

  // --- Load Preset Scenario ---
  function loadPreset(key) {
    currentPresetKey = key;
    const preset = PRESETS[key];
    activeCode = preset.originalCode;

    // Update Presets Toolbar
    presetButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.preset === key);
    });

    // Update Editor
    fileTabTitle.textContent = preset.fileName;
    renderCode(activeCode);

    // Reset Webview
    resetWebviewState();
  }

  // --- Render Code with Line Numbers ---
  function renderCode(code) {
    codeArea.textContent = code;
    const linesCount = code.split('\n').length;
    let numbersHtml = '';
    for (let i = 1; i <= linesCount; i++) {
      numbersHtml += `<div>${i}</div>`;
    }
    lineNumbers.innerHTML = numbersHtml;
  }

  // --- Reset Webview State ---
  function resetWebviewState() {
    inspectorEmpty.style.display = 'flex';
    streamSection.style.display = 'none';
    webviewResults.style.display = 'none';
    statusBadge.textContent = 'Ready';
    statusBadge.className = 'status-badge ready';
    webviewTarget.textContent = `${PRESETS[currentPresetKey].fileName} (selection)`;
    streamTerminal.textContent = '';
  }

  // --- Simulate Streaming Review ---
  function runInspection(isCached = false) {
    if (isStreaming) return;
    isStreaming = true;

    inspectorEmpty.style.display = 'none';
    webviewResults.style.display = 'none';
    streamSection.style.display = 'block';
    streamTerminal.textContent = '';

    statusBadge.textContent = isCached ? 'Checking Redis...' : 'Streaming Claude...';
    statusBadge.className = isCached ? 'status-badge hit' : 'status-badge streaming';

    const preset = PRESETS[currentPresetKey];
    const rawJson = JSON.stringify(preset.reviewData, null, 2);

    if (isCached) {
      // Fast simulation of 35ms Redis hit
      let step = 0;
      streamTerminal.textContent = '>> GET review:sha256(' + preset.fileName + ')\n>> Status: CACHE_HIT (Redis 7 in-memory)\n>> Retuned 1,482 bytes in 28ms.\n\n';
      setTimeout(() => {
        finishInspection(preset.reviewData, true);
        isStreaming = false;
      }, 400);
      return;
    }

    // Token by token streaming simulation
    let index = 0;
    const chunkSize = 16;
    const interval = setInterval(() => {
      if (index < rawJson.length) {
        const nextChunk = rawJson.slice(index, index + chunkSize);
        streamTerminal.textContent += nextChunk;
        streamTerminal.scrollTop = streamTerminal.scrollHeight;
        index += chunkSize;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          finishInspection(preset.reviewData, false);
          isStreaming = false;
        }, 300);
      }
    }, 25);
  }

  // --- Finish Review & Populate Cards ---
  function finishInspection(data, cached) {
    streamSection.style.display = 'none';
    webviewResults.style.display = 'flex';

    statusBadge.textContent = cached ? 'Cached ⚡' : 'Reviewed ✓';
    statusBadge.className = cached ? 'status-badge hit' : 'status-badge ready';

    // Populate Metrics
    statBugs.textContent = data.bugs.length;
    statComplexity.textContent = data.complexity.score;
    statNaming.textContent = data.naming.length;
    statRefactors.textContent = data.refactors.length;

    // Render Bug Cards
    bugsContainer.innerHTML = '';
    data.bugs.forEach((bug) => {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `
        <div class="card-top">
          <span class="severity-tag ${bug.severity}">${bug.severity}</span>
          <span class="line-tag">Line ${bug.line} • ${bug.rule}</span>
        </div>
        <p class="card-desc">${bug.description}</p>
        <div class="card-code-diff">
          <span class="diff-del">- ${escapeHtml(bug.diffOld)}</span>
          <span class="diff-add">+ ${escapeHtml(bug.diffNew)}</span>
        </div>
        <div class="card-action">
          <button class="btn btn-secondary btn-sm apply-fix-btn" data-fix="${bug.fixType}">
            ⚡ Apply Fix
          </button>
        </div>
      `;
      bugsContainer.appendChild(card);
    });

    // Render Complexity Card
    complexityContainer.innerHTML = `
      <div class="result-card">
        <div class="card-top">
          <span class="severity-tag low">Complexity Score: ${data.complexity.score}/10</span>
          <span class="line-tag">Cognitive Assessment</span>
        </div>
        <ul style="padding-left: 1.25rem; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
          ${data.complexity.issues.map(issue => `<li>${issue}</li>`).join('')}
        </ul>
      </div>
    `;

    // Render Naming Cards
    namingContainer.innerHTML = '';
    data.naming.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `
        <div class="card-top">
          <span class="severity-tag medium">Naming</span>
          <span class="line-tag">Line ${item.line}</span>
        </div>
        <p class="card-desc">${item.reason}</p>
        <div class="card-code-diff">
          <span class="diff-del">- ${escapeHtml(item.current)}</span>
          <span class="diff-add">+ ${escapeHtml(item.suggested)}</span>
        </div>
        <div class="card-action">
          <button class="btn btn-secondary btn-sm apply-rename-btn">
            🏷️ Apply Rename
          </button>
        </div>
      `;
      namingContainer.appendChild(card);
    });

    // Render Refactors Cards
    refactorsContainer.innerHTML = '';
    data.refactors.forEach((refactor) => {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `
        <div class="card-top">
          <span class="severity-tag high" style="background: rgba(139, 92, 246, 0.15); color: #a78bfa; border-color: rgba(139, 92, 246, 0.4);">Refactor</span>
          <span class="line-tag">${refactor.title}</span>
        </div>
        <p class="card-desc">${refactor.description}</p>
        <div class="card-action">
          <button class="btn btn-primary btn-sm apply-refactor-btn">
            ✨ Apply One-Click Refactor
          </button>
        </div>
      `;
      refactorsContainer.appendChild(card);
    });

    bindCardActions();
    showToast(cached ? '⚡ Loaded from Redis cache in 32ms!' : '✓ Review streamed successfully from Claude 3.5 Sonnet!');
  }

  // --- Bind Card Interactive Buttons (Apply Fix / Rename / Refactor) ---
  function bindCardActions() {
    // Apply Fix Buttons
    document.querySelectorAll('.apply-fix-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = PRESETS[currentPresetKey];
        activeCode = preset.fixedBugCode;
        renderCode(activeCode);
        flashEditor();
        btn.textContent = '✓ Applied';
        btn.disabled = true;
        btn.style.opacity = '0.7';
        showToast('⚡ Bug fix applied to editor via WorkspaceEdit!');
      });
    });

    // Apply Rename Buttons
    document.querySelectorAll('.apply-rename-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = PRESETS[currentPresetKey];
        activeCode = preset.renamedCode;
        renderCode(activeCode);
        flashEditor();
        btn.textContent = '✓ Renamed';
        btn.disabled = true;
        btn.style.opacity = '0.7';
        showToast('🏷️ Identifiers renamed across scope!');
      });
    });

    // Apply Refactor Buttons
    document.querySelectorAll('.apply-refactor-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = PRESETS[currentPresetKey];
        activeCode = preset.refactoredCode;
        renderCode(activeCode);
        flashEditor();
        btn.textContent = '✓ Refactored';
        btn.disabled = true;
        btn.style.opacity = '0.7';
        showToast('✨ Entire function refactored cleanly!');
      });
    });
  }

  // --- Flash Editor Effect on Edit ---
  function flashEditor() {
    codeArea.style.transition = 'background-color 200ms ease';
    codeArea.style.backgroundColor = 'rgba(0, 240, 255, 0.12)';
    setTimeout(() => {
      codeArea.style.backgroundColor = 'transparent';
    }, 350);
  }

  // --- Toast Notification ---
  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toastText.textContent = message;
    toastNotice.classList.add('show');
    toastTimer = setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 3200);
  }

  // --- Event Listeners ---
  function bindEvents() {
    // Preset Selector
    presetButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        loadPreset(btn.dataset.preset);
      });
    });

    // Inspection Buttons
    inspectBtn.addEventListener('click', () => runInspection(false));
    cacheHitBtn.addEventListener('click', () => runInspection(true));
    resetBtn.addEventListener('click', () => loadPreset(currentPresetKey));

    // Keyboard Shortcut (Ctrl+Shift+K / Cmd+Shift+K)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
        e.preventDefault();
        runInspection(false);
      }
    });

    // Copy Buttons
    document.querySelectorAll('.copy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.copyTarget;
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          navigator.clipboard.writeText(targetEl.textContent.trim()).then(() => {
            const originalText = btn.textContent;
            btn.textContent = '✓ Copied';
            setTimeout(() => {
              btn.textContent = originalText;
            }, 1800);
            showToast('📋 Copied to clipboard!');
          });
        }
      });
    });
  }

  // --- Pipeline Stepper ---
  function setupPipelineStepper() {
    const pipeSteps = document.querySelectorAll('.pipe-step');
    const pipeDetailTitle = document.getElementById('pipeDetailTitle');
    const pipeDetailBadge = document.getElementById('pipeDetailBadge');
    const pipeDetailDesc = document.getElementById('pipeDetailDesc');
    const pipeDetailSpecs = document.getElementById('pipeDetailSpecs');
    const pipeDetailCode = document.getElementById('pipeDetailCode');

    function selectPipeStep(index) {
      pipeSteps.forEach((s, idx) => {
        s.classList.toggle('active', idx === index);
      });

      const data = PIPELINE_DETAILS[index];
      if (!data) return;

      pipeDetailTitle.textContent = data.title;
      pipeDetailBadge.textContent = data.badge;
      pipeDetailDesc.textContent = data.desc;
      pipeDetailCode.textContent = data.codeSnippet;

      pipeDetailSpecs.innerHTML = data.specs.map(s => `
        <div style="background: rgba(255,255,255,0.03); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          <div style="font-size: 0.725rem; color: var(--text-muted);">${s.label}</div>
          <div style="font-family: var(--font-mono); font-size: 0.9rem; font-weight: 600; color: var(--accent-cyan);">${s.value}</div>
        </div>
      `).join('');
    }

    pipeSteps.forEach((step) => {
      step.addEventListener('click', () => {
        const stepIndex = parseInt(step.dataset.step, 10);
        selectPipeStep(stepIndex);
      });
    });

    selectPipeStep(0);
  }

  // --- Tabs ---
  function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(btn.dataset.tab);
        if (targetPane) {
          targetPane.classList.add('active');
        }
      });
    });
  }

  // --- Escape HTML Helper ---
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
