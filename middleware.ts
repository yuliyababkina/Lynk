// Basic Auth gate for the Lynk UX prototype.
// Blocks anonymous access to lynk-ux.app while allowing anyone with the
// shared login/password through. Runs on Vercel's Edge runtime before any
// static file is served, so it works for this Vite SPA without touching
// the app code itself.
//
// Credentials are read from environment variables (set in Vercel ->
// Project Settings -> Environment Variables):
//   BASIC_AUTH_USER
//   BASIC_AUTH_PASSWORD

export const config = {
  // Run on every request except Vercel's internal assets.
  matcher: ['/((?!_vercel).*)'],
};

function unauthorized() {
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Lynk Prototype", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
}

export default function middleware(request: Request) {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;

  // Safety net: if the env vars aren't set yet, fail closed (block access)
  // rather than accidentally leaving the site open.
  if (!expectedUser || !expectedPassword) {
    return unauthorized();
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Basic ')) {
    const encoded = authHeader.slice('Basic '.length);
    let decoded = '';
    try {
      decoded = atob(encoded);
    } catch {
      return unauthorized();
    }

    const separatorIndex = decoded.indexOf(':');
    const user = decoded.slice(0, separatorIndex);
    const pass = decoded.slice(separatorIndex + 1);

    if (user === expectedUser && pass === expectedPassword) {
      // Credentials are correct - let the request through untouched.
      return undefined;
    }
  }

  return unauthorized();
}
