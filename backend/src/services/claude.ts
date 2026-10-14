import { Anthropic } from '@anthropic-ai/sdk';

export interface ReviewInput {
  code: string;
  language: string;
  filePath: string;
  mode: string;
}

export interface RefactorInput {
  code: string;
  language: string;
  filePath: string;
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'mock-api-key'
});

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';

function getMockReviewStream(input: ReviewInput): AsyncIterable<string> {
  const mockReview = JSON.stringify(
    {
      bugs: [
        {
          line: 2,
          severity: 'high',
          description: 'Potential null pointer exception: accessing properties on user without strict null/undefined verification.',
          fix: 'if (!user) return 0;'
        },
        {
          line: 3,
          severity: 'medium',
          description: 'Variable disc can be scoped as const to prevent accidental mutation across branches.',
          fix: 'const discount = user.isVip ? total * 0.2 : (total > 100 ? total * 0.1 : 0);'
        }
      ],
      complexity: {
        score: 3,
        issues: [
          'Multiple nested if-else conditional branches increase cognitive load',
          'Implicit assumption that total is always a positive number'
        ]
      },
      naming: [
        {
          line: 3,
          current: 'disc',
          suggested: 'discount',
          reason: 'Avoid cryptic abbreviations to improve readability'
        }
      ],
      refactors: [
        {
          range: 'function',
          reason: 'Refactor into guard clause and declarative discount calculation',
          code: `function calculateDiscount(user, total) {\n  if (!user || total <= 0) return 0;\n  const discountRate = user.isVip ? 0.2 : (total > 100 ? 0.1 : 0);\n  return total * (1 - discountRate);\n}`
        }
      ]
    },
    null,
    2
  );

  async function* textStream() {
    const chunkSize = 25;
    for (let i = 0; i < mockReview.length; i += chunkSize) {
      yield mockReview.slice(i, i + chunkSize);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  return textStream();
}

export async function callClaudeReview(input: ReviewInput): Promise<AsyncIterable<string>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'mock-api-key' || !apiKey.startsWith('sk-ant-')) {
    console.log('No valid ANTHROPIC_API_KEY found, streaming development mock review');
    return getMockReviewStream(input);
  }

  try {
    const prompt = `Review this ${input.language} code. Return JSON with: {bugs: [{line, severity, description, fix}], complexity: {score, issues}, naming: [{line, current, suggested, reason}], refactors: [{range, code, reason}]}. Code:\n\n${input.code}`;

    const stream = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      stream: true,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    async function* textStream() {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          yield chunk.delta.text;
        }
      }
    }

    return textStream();
  } catch (err: any) {
    if (
      err?.status === 401 ||
      err?.message?.includes('invalid x-api-key') ||
      err?.message?.includes('authentication_error')
    ) {
      console.warn('Anthropic API key invalid, falling back to mock review for development');
      return getMockReviewStream(input);
    }
    throw err;
  }
}

export async function callClaudeRefactor(input: RefactorInput): Promise<string> {
  const fallbackCode = `function calculateDiscount(user, total) {\n  if (!user || total <= 0) return 0;\n  const discountRate = user.isVip ? 0.2 : (total > 100 ? 0.1 : 0);\n  return total * (1 - discountRate);\n}`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'mock-api-key' || !apiKey.startsWith('sk-ant-')) {
    return fallbackCode;
  }

  try {
    const prompt = `Refactor this ${input.language} function for readability. Return only the code.\n\n${input.code}`;

    const resp = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      stream: false,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const text = resp.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    return text.trim() || fallbackCode;
  } catch (err: any) {
    if (
      err?.status === 401 ||
      err?.message?.includes('invalid x-api-key') ||
      err?.message?.includes('authentication_error')
    ) {
      return fallbackCode;
    }
    throw err;
  }
}
