// ═══════════════════════════════════════════════════════════
// SITE-WIDE PASSWORD PROTECTION (pre-launch)
// Remove this file when ready to go public
// ═══════════════════════════════════════════════════════════

const SITE_PASSWORD = 'fga2026';

export default function middleware(request) {
  const url = new URL(request.url);

  // Don't protect: webhook (Stripe needs it), and static assets
  if (
    url.pathname === '/api/webhook' ||
    url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
  ) {
    return;
  }

  // Check for auth cookie
  const cookie = request.headers.get('cookie') || '';
  if (cookie.includes('fga_auth=granted')) {
    return; // Already authenticated
  }

  // Check if this is a password submission
  if (request.method === 'POST' && url.pathname === '/_auth') {
    return;
  }

  // Show password page
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fast Grad Academy — Coming Soon</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0a;
      color: #e8e0d4;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .container {
      text-align: center;
      max-width: 400px;
      padding: 2rem;
    }
    h1 {
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
      font-weight: 300;
      letter-spacing: 0.05em;
    }
    h1 em { font-style: italic; color: #c4a97d; }
    p {
      color: #888;
      margin-bottom: 2rem;
      font-size: 0.95rem;
    }
    form { display: flex; gap: 0.5rem; }
    input {
      flex: 1;
      padding: 0.75rem 1rem;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      color: #e8e0d4;
      font-size: 1rem;
      outline: none;
    }
    input:focus { border-color: #c4a97d; }
    button {
      padding: 0.75rem 1.5rem;
      background: #c4a97d;
      color: #0a0a0a;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.95rem;
    }
    button:hover { background: #d4b98d; }
    .error { color: #e74c3c; margin-top: 1rem; font-size: 0.85rem; display: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Fast Grad <em>Academy</em></h1>
    <p>This site is not yet public. Enter the password to continue.</p>
    <form onsubmit="return checkPassword(event)">
      <input type="password" id="pw" placeholder="Password" autocomplete="off" autofocus />
      <button type="submit">Enter</button>
    </form>
    <p class="error" id="err">Incorrect password. Try again.</p>
  </div>
  <script>
    function checkPassword(e) {
      e.preventDefault();
      var pw = document.getElementById('pw').value;
      if (pw === '${SITE_PASSWORD}') {
        document.cookie = 'fga_auth=granted; path=/; max-age=86400; SameSite=Lax';
        window.location.reload();
      } else {
        document.getElementById('err').style.display = 'block';
        document.getElementById('pw').value = '';
        document.getElementById('pw').focus();
      }
      return false;
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
