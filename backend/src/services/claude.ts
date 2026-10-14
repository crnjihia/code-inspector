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

export async function callClaudeReview(input: ReviewInput): Promise<AsyncIterable<string>> {
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
}

export async function callClaudeRefactor(input: RefactorInput): Promise<string> {
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

  return text.trim();
}
