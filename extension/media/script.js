(function () {
  const vscode = acquireVsCodeApi();

  const statusBadge = document.getElementById('statusBadge');
  const targetFile = document.getElementById('targetFile');
  const metricBar = document.getElementById('metricBar');
  const countBugs = document.getElementById('countBugs');
  const scoreComplexity = document.getElementById('scoreComplexity');
  const countNaming = document.getElementById('countNaming');
  const countRefactors = document.getElementById('countRefactors');
  const streamSection = document.getElementById('streamSection');
  const streamConsole = document.getElementById('streamConsole');
  const emptyState = document.getElementById('emptyState');

  const sectionBugs = document.getElementById('sectionBugs');
  const bugsContainer = document.getElementById('bugsContainer');

  const sectionComplexity = document.getElementById('sectionComplexity');
  const complexityContainer = document.getElementById('complexityContainer');

  const sectionNaming = document.getElementById('sectionNaming');
  const namingContainer = document.getElementById('namingContainer');

  const sectionRefactors = document.getElementById('sectionRefactors');
  const refactorsContainer = document.getElementById('refactorsContainer');

  let streamBuffer = '';

  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.type) {
      case 'reset':
        handleReset(msg.mode, msg.filePath);
        break;
      case 'status':
        handleStatus(msg.status);
        break;
      case 'chunk':
        handleChunk(msg.text);
        break;
      case 'complete':
        handleComplete(msg.data);
        break;
      case 'applied':
        handleApplied(msg.id);
        break;
      case 'error':
        handleError(msg.error);
        break;
    }
  });

  function handleReset(mode, filePath) {
    emptyState.classList.add('hidden');
    metricBar.classList.add('hidden');
    streamSection.classList.remove('hidden');
    streamConsole.textContent = '';
    streamBuffer = '';

    statusBadge.textContent = 'Streaming...';
    statusBadge.className = 'status-badge streaming';

    targetFile.textContent = `${filePath || 'Active File'} (${mode || 'selection'})`;

    // Clear all card containers
    bugsContainer.innerHTML = '';
    complexityContainer.innerHTML = '';
    namingContainer.innerHTML = '';
    refactorsContainer.innerHTML = '';

    sectionBugs.classList.add('hidden');
    sectionComplexity.classList.add('hidden');
    sectionNaming.classList.add('hidden');
    sectionRefactors.classList.add('hidden');
  }

  function handleStatus(status) {
    statusBadge.textContent = status;
    if (status.includes('hit')) {
      statusBadge.className = 'status-badge hit';
    } else {
      statusBadge.className = 'status-badge ready';
    }
  }

  function handleChunk(text) {
    streamBuffer += text;
    streamConsole.textContent = streamBuffer;
    streamConsole.scrollTop = streamConsole.scrollHeight;
  }

  function handleComplete(data) {
    streamSection.classList.add('hidden');
    metricBar.classList.remove('hidden');

    statusBadge.textContent = data.cached ? 'Cached ⚡' : 'Reviewed ✓';
    statusBadge.className = data.cached ? 'status-badge hit' : 'status-badge ready';

    const bugs = data.bugs || [];
    const complexity = data.complexity || { score: 'N/A', issues: [] };
    const naming = data.naming || [];
    const refactors = data.refactors || [];

    // Metrics
    countBugs.textContent = bugs.length;
    scoreComplexity.textContent = complexity.score;
    countNaming.textContent = naming.length;
    countRefactors.textContent = refactors.length;

    // 1. Render Bugs
    if (bugs.length > 0) {
      sectionBugs.classList.remove('hidden');
      bugsContainer.innerHTML = '';
      bugs.forEach((bug, idx) => {
        const id = `bug-${idx}`;
        const card = document.createElement('div');
        card.className = 'card';

        const severityClass = `badge-${bug.severity || 'medium'}`;
        card.innerHTML = `
          <div class="card-header">
            <span class="badge ${severityClass}">${(bug.severity || 'MED').toUpperCase()}</span>
            <span class="line-info">Line ${bug.line}</span>
          </div>
          <div class="card-desc">${escapeHtml(bug.description)}</div>
          ${bug.fix ? `<div class="code-preview">${escapeHtml(bug.fix)}</div>` : ''}
          ${bug.fix ? `<button id="${id}" class="apply-btn">Apply Fix</button>` : ''}
        `;

        if (bug.fix) {
          const btn = card.querySelector(`#${id}`);
          btn.addEventListener('click', () => {
            btn.textContent = 'Applying...';
            vscode.postMessage({
              command: 'applyBugFix',
              line: bug.line,
              fix: bug.fix,
              id
            });
          });
        }
        bugsContainer.appendChild(card);
      });
    }

    // 2. Render Complexity
    if (complexity.issues && complexity.issues.length > 0) {
      sectionComplexity.classList.remove('hidden');
      complexityContainer.innerHTML = '';
      complexity.issues.forEach((issue) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="card-desc">⚡ ${escapeHtml(issue)}</div>
        `;
        complexityContainer.appendChild(card);
      });
    }

    // 3. Render Naming
    if (naming.length > 0) {
      sectionNaming.classList.remove('hidden');
      namingContainer.innerHTML = '';
      naming.forEach((item, idx) => {
        const id = `name-${idx}`;
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="card-header">
            <span class="line-info">Line ${item.line}</span>
            <div class="rename-visual">
              <span class="name-old">${escapeHtml(item.current)}</span>
              <span class="name-arrow">→</span>
              <span class="name-new">${escapeHtml(item.suggested)}</span>
            </div>
          </div>
          <div class="card-desc">${escapeHtml(item.reason)}</div>
          <button id="${id}" class="apply-btn">Apply Rename</button>
        `;

        const btn = card.querySelector(`#${id}`);
        btn.addEventListener('click', () => {
          btn.textContent = 'Applying...';
          vscode.postMessage({
            command: 'applyRename',
            line: item.line,
            current: item.current,
            suggested: item.suggested,
            id
          });
        });
        namingContainer.appendChild(card);
      });
    }

    // 4. Render Refactors
    if (refactors.length > 0) {
      sectionRefactors.classList.remove('hidden');
      refactorsContainer.innerHTML = '';
      refactors.forEach((ref, idx) => {
        const id = `refactor-${idx}`;
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="card-header">
            <span class="line-info">Scope: ${escapeHtml(ref.range || 'function')}</span>
          </div>
          <div class="card-desc">${escapeHtml(ref.reason)}</div>
          ${ref.code ? `<div class="code-preview">${escapeHtml(ref.code)}</div>` : ''}
          ${ref.code ? `<button id="${id}" class="apply-btn">Apply Refactor</button>` : ''}
        `;

        if (ref.code) {
          const btn = card.querySelector(`#${id}`);
          btn.addEventListener('click', () => {
            btn.textContent = 'Applying...';
            vscode.postMessage({
              command: 'applyRefactor',
              range: ref.range,
              code: ref.code,
              id
            });
          });
        }
        refactorsContainer.appendChild(card);
      });
    }
  }

  function handleApplied(id) {
    const btn = document.getElementById(id);
    if (btn) {
      btn.textContent = 'Applied ✓';
      btn.className = 'apply-btn applied';
      btn.disabled = true;
    }
  }

  function handleError(error) {
    statusBadge.textContent = 'Error';
    statusBadge.className = 'status-badge';
    statusBadge.style.background = 'rgba(239, 68, 68, 0.3)';
    statusBadge.style.color = '#f87171';
    streamSection.classList.remove('hidden');
    streamConsole.textContent = `❌ ${error}`;
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
