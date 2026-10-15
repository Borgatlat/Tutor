import { authTokensFromUrl, friendlyAuthEmailError } from '../lib/authRedirect';

describe('authTokensFromUrl', () => {
  it('reads tokens from a confirm link opened in the app', () => {
    expect(authTokensFromUrl('strakejesuittutors://auth/callback#access_token=abc&refresh_token=def&type=signup'))
      .toEqual({ access_token: 'abc', refresh_token: 'def' });
  });

  it('reports an expired or used link', () => {
    expect(authTokensFromUrl('strakejesuittutors://auth/callback#error=access_denied&error_description=Email+link+is+invalid+or+has+expired'))
      .toEqual({ error: 'Email link is invalid or has expired' });
  });

  it('ignores ordinary links', () => {
    expect(authTokensFromUrl('strakejesuittutors://sessions')).toBeNull();
    expect(authTokensFromUrl(null)).toBeNull();
  });
});

describe('friendlyAuthEmailError', () => {
  it('explains a failed confirmation email without technical terms', () => {
    const msg = friendlyAuthEmailError('Error sending confirmation email');
    expect(msg).toMatch(/couldn't send the confirmation email/);
    expect(msg).not.toMatch(/SMTP/);
  });

  it('leaves other errors alone', () => {
    expect(friendlyAuthEmailError('Invalid login credentials')).toBeNull();
  });
});
