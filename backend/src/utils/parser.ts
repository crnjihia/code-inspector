export interface BugRisk {
  line: number;
  severity: 'high' | 'medium' | 'low';
  description: string;
  fix: string;
}

export interface ComplexityAnalysis {
  score: number | string;
  issues: string[];
}

export interface NamingSuggestion {
  line: number;
  current: string;
  suggested: string;
  reason: string;
}

export interface RefactorSuggestion {
  range: string;
  code: string;
  reason: string;
}

export interface ReviewResponse {
  bugs: BugRisk[];
  complexity: ComplexityAnalysis;
  naming: NamingSuggestion[];
  refactors: RefactorSuggestion[];
  rawText?: string;
  markdown?: string;
}

export function parseClaudeReview(text: string): ReviewResponse {
  let jsonString = text.trim();

  // Strip markdown code fences if present (e.g. ```json ... ```)
  const fenceMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    jsonString = fenceMatch[1].trim();
  } else {
    // If there is text before or after the JSON, find first { and last }
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    const parsed = JSON.parse(jsonString);
    const bugs: BugRisk[] = Array.isArray(parsed.bugs)
      ? parsed.bugs.map((b: any) => ({
          line: typeof b.line === 'number' ? b.line : parseInt(b.line, 10) || 1,
          severity: ['high', 'medium', 'low'].includes(b.severity?.toLowerCase())
            ? b.severity.toLowerCase()
            : 'medium',
          description: b.description || 'Potential bug detected',
          fix: b.fix || ''
        }))
      : [];

    const complexity: ComplexityAnalysis = {
      score: parsed.complexity?.score ?? 'Moderate',
      issues: Array.isArray(parsed.complexity?.issues)
        ? parsed.complexity.issues
        : typeof parsed.complexity?.issues === 'string'
        ? [parsed.complexity.issues]
        : []
    };

    const naming: NamingSuggestion[] = Array.isArray(parsed.naming)
      ? parsed.naming.map((n: any) => ({
          line: typeof n.line === 'number' ? n.line : parseInt(n.line, 10) || 1,
          current: n.current || '',
          suggested: n.suggested || '',
          reason: n.reason || 'Better naming clarity'
        }))
      : [];

    const refactors: RefactorSuggestion[] = Array.isArray(parsed.refactors)
      ? parsed.refactors.map((r: any) => ({
          range: r.range || 'selected',
          code: r.code || '',
          reason: r.reason || 'Improve maintainability'
        }))
      : [];

    const markdown = generateMarkdownSummary({ bugs, complexity, naming, refactors });

    return {
      bugs,
      complexity,
      naming,
      refactors,
      rawText: text,
      markdown
    };
  } catch (err) {
    // Fallback if Claude output wasn't valid JSON
    return {
      bugs: [],
      complexity: { score: 'N/A', issues: [] },
      naming: [],
      refactors: [],
      rawText: text,
      markdown: `### Review Output\n\n${text}`
    };
  }
}

export function generateMarkdownSummary(review: {
  bugs: BugRisk[];
  complexity: ComplexityAnalysis;
  naming: NamingSuggestion[];
  refactors: RefactorSuggestion[];
}): string {
  let md = '';

  // Bug Risks
  md += '### 🚨 Bug Risks\n\n';
  if (review.bugs.length === 0) {
    md += '_No critical bugs detected._\n\n';
  } else {
    for (const bug of review.bugs) {
      md += `- **[Line ${bug.line}]** \`${bug.severity.toUpperCase()}\`: ${bug.description}\n`;
      if (bug.fix) {
        md += `  \`\`\`\n  Fix: ${bug.fix}\n  \`\`\`\n`;
      }
    }
    md += '\n';
  }

  // Complexity
  md += `### ⚡ Complexity (Score: ${review.complexity.score})\n\n`;
  if (review.complexity.issues.length === 0) {
    md += '_Code complexity is within healthy thresholds._\n\n';
  } else {
    for (const issue of review.complexity.issues) {
      md += `- ${issue}\n`;
    }
    md += '\n';
  }

  // Naming
  md += '### 🏷️ Naming Improvements\n\n';
  if (review.naming.length === 0) {
    md += '_All identifiers follow clear conventions._\n\n';
  } else {
    for (const name of review.naming) {
      md += `- **Line ${name.line}:** \`${name.current}\` → \`${name.suggested}\` — _${name.reason}_\n`;
    }
    md += '\n';
  }

  // Refactor
  md += '### 🛠️ Refactor Suggestions\n\n';
  if (review.refactors.length === 0) {
    md += '_No immediate refactor required._\n\n';
  } else {
    for (const ref of review.refactors) {
      md += `**Range:** \`${ref.range}\` — _${ref.reason}_\n\n`;
      if (ref.code) {
        md += `\`\`\`\n${ref.code}\n\`\`\`\n\n`;
      }
    }
  }

  return md.trim();
}
