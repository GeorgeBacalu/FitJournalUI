import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { API_BASE_URL, DEFAULT_PAGE_REQUEST } from '../constants/app.constants';
import {
  AddGoalRequest,
  EditGoalRequest,
  Goal,
  GoalsResponse,
  MessageResponse,
  RemoveRangeRequest,
  ShortGoal
} from '../models/api.models';
import { BaseResourceService } from './base-resource.service';

@Injectable({
  providedIn: 'root'
})
export class GoalService extends BaseResourceService {
  private readonly endpoint = `${API_BASE_URL}/goal`;
  private readonly itemsSubject = new BehaviorSubject<ShortGoal[]>([]);

  readonly items$ = this.itemsSubject.asObservable();

  constructor(private readonly httpClient: HttpClient) {
    super();
  }

  getItemsSnapshot() {
    return this.itemsSubject.value;
  }

  load() {
    return this.withLoading(
      this.httpClient.post<GoalsResponse>(`${this.endpoint}/all`, DEFAULT_PAGE_REQUEST).pipe(
        tap((response) => this.itemsSubject.next(response.goals)),
        map((response) => response.goals)
      )
    );
  }

  getById(id: string) {
    return this.httpClient.get<Goal>(`${this.endpoint}/${id}`);
  }

  create(request: AddGoalRequest) {
    return this.withLoading(
      this.httpClient.post<MessageResponse>(this.endpoint, request).pipe(
        switchMap((response) => this.load().pipe(map(() => response)))
      )
    );
  }

  update(request: EditGoalRequest) {
    return this.withLoading(
      this.httpClient.put<MessageResponse>(this.endpoint, request).pipe(
        switchMap((response) => this.load().pipe(map(() => response)))
      )
    );
  }

  remove(ids: string[]) {
    return this.withLoading(
      this.httpClient
        .request<MessageResponse>('delete', this.endpoint, {
          body: {
            ids,
            hardDelete: false
          } as RemoveRangeRequest
        })
        .pipe(switchMap((response) => this.load().pipe(map(() => response))))
    );
  }
}
