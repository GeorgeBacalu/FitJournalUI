import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { API_BASE_URL, DEFAULT_PAGE_REQUEST } from '../constants/app.constants';
import {
  AddWorkoutExerciseRequest,
  EditWorkoutExerciseRequest,
  MessageResponse,
  RemoveWorkoutExercisesRequest,
  ShortWorkoutExercise,
  WorkoutExercisesResponse
} from '../models/api.models';
import { BaseResourceService } from './base-resource.service';

@Injectable({
  providedIn: 'root'
})
export class WorkoutExerciseService extends BaseResourceService {
  private readonly endpoint = `${API_BASE_URL}/workoutexercise`;
  private readonly itemsSubject = new BehaviorSubject<ShortWorkoutExercise[]>([]);

  readonly items$ = this.itemsSubject.asObservable();

  constructor(private readonly httpClient: HttpClient) {
    super();
  }

  load(workoutId: string | null): Observable<ShortWorkoutExercise[]> {
    if (!workoutId) {
      this.itemsSubject.next([]);
      return of([]);
    }

    return this.withLoading(
      this.httpClient
        .post<WorkoutExercisesResponse>(`${this.endpoint}/all`, {
          ...DEFAULT_PAGE_REQUEST,
          workoutId
        })
        .pipe(
          tap((response) => this.itemsSubject.next(response.workoutExercises)),
          map((response) => response.workoutExercises)
        )
    );
  }

  create(request: AddWorkoutExerciseRequest) {
    return this.withLoading(
      this.httpClient.post<MessageResponse>(this.endpoint, request).pipe(
        switchMap((response) => this.load(request.workoutId).pipe(map(() => response)))
      )
    );
  }

  update(request: EditWorkoutExerciseRequest) {
    return this.withLoading(
      this.httpClient.put<MessageResponse>(this.endpoint, request).pipe(
        switchMap((response) => this.load(request.workoutId).pipe(map(() => response)))
      )
    );
  }

  remove(workoutId: string, exerciseIds: string[]) {
    return this.withLoading(
      this.httpClient
        .request<MessageResponse>('delete', this.endpoint, {
          body: {
            workoutId,
            exerciseIds,
            hardDelete: false
          } as RemoveWorkoutExercisesRequest
        })
        .pipe(switchMap((response) => this.load(workoutId).pipe(map(() => response))))
    );
  }

  clear() {
    this.itemsSubject.next([]);
  }
}
