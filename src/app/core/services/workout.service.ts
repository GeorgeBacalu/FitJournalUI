import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { API_BASE_URL, DEFAULT_PAGE_REQUEST } from '../constants/app.constants';
import {
  AddWorkoutRequest,
  EditWorkoutRequest,
  MessageResponse,
  RemoveRangeRequest,
  Workout,
  WorkoutsResponse,
  ShortWorkout
} from '../models/api.models';
import { BaseResourceService } from './base-resource.service';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService extends BaseResourceService {
  private readonly endpoint = `${API_BASE_URL}/workout`;
  private readonly itemsSubject = new BehaviorSubject<ShortWorkout[]>([]);

  readonly items$ = this.itemsSubject.asObservable();

  constructor(private readonly httpClient: HttpClient) {
    super();
  }

  load() {
    return this.withLoading(
      this.httpClient.post<WorkoutsResponse>(`${this.endpoint}/all`, DEFAULT_PAGE_REQUEST).pipe(
        tap((response) => this.itemsSubject.next(response.workouts)),
        map((response) => response.workouts)
      )
    );
  }

  getById(id: string) {
    return this.httpClient.get<Workout>(`${this.endpoint}/${id}`);
  }

  create(request: AddWorkoutRequest) {
    return this.withLoading(
      this.httpClient.post<MessageResponse>(this.endpoint, request).pipe(
        switchMap((response) => this.load().pipe(map(() => response)))
      )
    );
  }

  update(request: EditWorkoutRequest) {
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
