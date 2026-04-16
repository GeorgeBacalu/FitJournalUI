import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { API_BASE_URL } from '../constants/app.constants';
import { EditUserRequest, MessageResponse, User } from '../models/api.models';
import { BaseResourceService } from './base-resource.service';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseResourceService {
  private readonly endpoint = `${API_BASE_URL}/user`;
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);

  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly httpClient: HttpClient,
    private readonly sessionService: SessionService
  ) {
    super();
  }

  loadCurrentUser(): Observable<User | null> {
    const userId = this.sessionService.getCurrentUserId();

    if (!userId) {
      this.currentUserSubject.next(null);
      return of(null);
    }

    return this.withLoading(
      this.httpClient.get<User>(`${this.endpoint}/${userId}`).pipe(
        tap((user) => this.currentUserSubject.next(user))
      )
    );
  }

  updateProfile(request: EditUserRequest) {
    return this.withLoading(
      this.httpClient.put<MessageResponse>(this.endpoint, request).pipe(
        switchMap((response) => this.loadCurrentUser().pipe(map(() => response)))
      )
    );
  }

  clear() {
    this.currentUserSubject.next(null);
  }
}
