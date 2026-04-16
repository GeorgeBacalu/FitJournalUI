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
  private readonly detailsSubject = new BehaviorSubject<Record<string, Workout>>({});
  private readonly itemsSubject = new BehaviorSubject<ShortWorkout[]>([]);
  private readonly selectedWorkoutIdSubject = new BehaviorSubject<string | null>(null);

  readonly items$ = this.itemsSubject.asObservable();

  constructor(private readonly httpClient: HttpClient) {
    super();
  }

  getItemsSnapshot() {
    return this.itemsSubject.value;
  }

  getCachedWorkout(id: string | null) {
    return id ? this.detailsSubject.value[id] ?? null : null;
  }

  getSelectedWorkoutId() {
    return this.selectedWorkoutIdSubject.value;
  }

  rememberSelectedWorkout(id: string | null) {
    this.selectedWorkoutIdSubject.next(id);
  }

  load() {
    return this.withLoading(
      this.httpClient.post<WorkoutsResponse>(`${this.endpoint}/all`, DEFAULT_PAGE_REQUEST).pipe(
        tap((response) => {
          this.itemsSubject.next(response.workouts);

          const selectedWorkoutId = this.selectedWorkoutIdSubject.value;

          if (
            selectedWorkoutId &&
            !response.workouts.some((workout) => workout.id === selectedWorkoutId)
          ) {
            this.selectedWorkoutIdSubject.next(null);
          }

          const cachedDetails = this.detailsSubject.value;
          const nextDetails = { ...cachedDetails };
          let hasDetailsChanges = false;

          for (const workout of response.workouts) {
            const cachedWorkout = cachedDetails[workout.id];

            if (!cachedWorkout) {
              continue;
            }

            nextDetails[workout.id] = {
              ...cachedWorkout,
              name: workout.name,
              durationMinutes: workout.durationMinutes,
              startedAt: workout.startedAt
            };
            hasDetailsChanges = true;
          }

          if (hasDetailsChanges) {
            this.detailsSubject.next(nextDetails);
          }
        }),
        map((response) => response.workouts)
      )
    );
  }

  getById(id: string) {
    return this.httpClient.get<Workout>(`${this.endpoint}/${id}`).pipe(
      tap((workout) => {
        this.detailsSubject.next({
          ...this.detailsSubject.value,
          [workout.id]: workout
        });
      })
    );
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
