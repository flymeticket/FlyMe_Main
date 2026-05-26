import { env } from './env';

// Simple bearer-token check for /api/admin/* endpoints. Not OAuth, not user
// auth — just enough to keep these endpoints from being hit by anonymous
// traffic. Pair with a long random ADMIN_TOKEN in production.

export function requireAdmin(req: Request): Response | null {
  const auth = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${env.adminToken}`;
  if (auth !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }
  return null;
}
