import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  const messages = { add: vi.fn() };
  let service: NotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NotificationService(messages as unknown as MessageService);
  });

  it.each([
    ['success', 'success'], ['info', 'info'], ['warn', 'warn'], ['error', 'error']
  ] as const)('publishes %s messages', (method, severity) => {
    service[method]('Summary', 'Detail');
    expect(messages.add).toHaveBeenCalledWith(expect.objectContaining({ severity, summary: 'Summary', detail: 'Detail' }));
  });

  it('joins validation messages from an API response', () => {
    const error = new HttpErrorResponse({ status: 400, error: { errors: { name: ['Required'], weight: 'Invalid' } } });
    expect(service.getErrorMessage(error)).toBe('Required Invalid');
  });

  it('hides database and server implementation details', () => {
    expect(service.getErrorMessage(new HttpErrorResponse({ status: 409, error: 'UNIQUE constraint failed' })))
      .toContain('duplicate record');
    expect(service.getErrorMessage(new HttpErrorResponse({ status: 500, error: 'Stack trace: exception' })))
      .toContain('unexpected happened');
  });

  it('handles unreachable servers and ordinary errors', () => {
    expect(service.getErrorMessage(new HttpErrorResponse({ status: 0 }))).toContain('unreachable');
    expect(service.getErrorMessage(new Error('plain failure'))).toBe('plain failure');
    expect(service.getErrorMessage({})).toContain('Something went wrong');
  });
});
