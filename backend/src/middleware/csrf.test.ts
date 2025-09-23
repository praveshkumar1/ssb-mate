import { csrfProtection, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from './csrf';

describe('csrfProtection middleware', () => {
  test('blocks when CSRF cookie/header are missing or mismatched', () => {
    const req: any = { method: 'POST', headers: {} };
    const json = jest.fn();
    const res: any = { status: jest.fn(() => ({ json })), json };
    const next = jest.fn();

    // Call middleware
    csrfProtection(req, res, next as any);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('allows when CSRF cookie and header match', () => {
    const token = 'abc123';
    const cookieHeader = `${CSRF_COOKIE_NAME}=${token}`;
    const req: any = { method: 'POST', headers: { cookie: cookieHeader, [CSRF_HEADER_NAME]: token } };
    const res: any = { status: jest.fn(() => ({ json: jest.fn() })), json: jest.fn() };
    const next = jest.fn();

    csrfProtection(req, res, next as any);

    expect(next).toHaveBeenCalled();
  });
});
