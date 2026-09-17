import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL, DEFAULT_PAGE_REQUEST } from '../constants/app.constants';
import { EditUserRequest, MessageResponse, User, UsersResponse } from '../models/api.models';
import { BaseResourceService } from './base-resource.service';

@Injectable({ providedIn: 'root' })
export class AdminUserService extends BaseResourceService {
  private readonly userEndpoint = `${API_BASE_URL}/user`;
  private readonly adminUserEndpoint = `${API_BASE_URL}/adminuser`;
  private readonly adminAuthEndpoint = `${API_BASE_URL}/adminauth`;

  constructor(private readonly http: HttpClient) {
    super();
  }

  load(searchName = '') {
    return this.withLoading(
      this.http.post<UsersResponse>(`${this.userEndpoint}/all`, {
        ...DEFAULT_PAGE_REQUEST,
        size: 100,
        searchName: searchName.trim() || null,
      }),
    );
  }

  getById(id: string) {
    return this.withLoading(this.http.get<User>(`${this.userEndpoint}/${id}`));
  }

  update(id: string, request: EditUserRequest) {
    return this.withLoading(
      this.http.put<MessageResponse>(`${this.adminUserEndpoint}/${id}`, request),
    );
  }

  deactivate(id: string) {
    return this.withLoading(this.http.delete<MessageResponse>(`${this.adminAuthEndpoint}/${id}`));
  }
}
