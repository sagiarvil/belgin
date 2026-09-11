// Vercel Edge Middleware AST Pruner
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  const isAIBot = /PerplexityBot|GPTBot|ClaudeBot|OAI-SearchBot/i.test(ua);
  const response = NextResponse.next();
  if (isAIBot) {
    response.headers.set('X-AST-Budget', 'sub-14kb');
  }
  return response;
}
