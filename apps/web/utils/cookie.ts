function hasSessionCookie(): boolean {
  return document.cookie.split(';').some((cookie) => cookie.trim().startsWith('session='));
}

function getSessionCookie(): string | undefined {
  const cookie = document.cookie.split(';').find((c) => c.trim().startsWith('session='));
  return cookie?.split('=')[1];
}

export { hasSessionCookie, getSessionCookie };
