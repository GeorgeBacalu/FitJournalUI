import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { API_BASE_URL, DEFAULT_PAGE_REQUEST } from '../constants/app.constants';
import { AdminUserService } from './admin-user.service';

describe('AdminUserService', () => {
  const http = {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  let service: AdminUserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AdminUserService(http as unknown as HttpClient);
  });

  it('loads filtered active users through the admin-protected list endpoint', () => {
    http.post.mockReturnValue(of({ users: [], totalCount: 0 }));

    service.load('  Ada  ').subscribe();

    expect(http.post).toHaveBeenCalledWith(`${API_BASE_URL}/user/all`, {
      ...DEFAULT_PAGE_REQUEST,
      size: 100,
      searchName: 'Ada',
    });
  });

  it('loads, updates and deactivates the selected user through admin endpoints', () => {
    const request = { name: 'Ada Lovelace' };
    http.get.mockReturnValue(of({ id: 'u1' }));
    http.put.mockReturnValue(of({ message: 'updated' }));
    http.delete.mockReturnValue(of({ message: 'deactivated' }));

    service.getById('u1').subscribe();
    service.update('u1', request as never).subscribe();
    service.deactivate('u1').subscribe();

    expect(http.get).toHaveBeenCalledWith(`${API_BASE_URL}/user/u1`);
    expect(http.put).toHaveBeenCalledWith(`${API_BASE_URL}/adminuser/u1`, request);
    expect(http.delete).toHaveBeenCalledWith(`${API_BASE_URL}/adminauth/u1`);
  });
});
