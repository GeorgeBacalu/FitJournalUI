import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { finalize, map, switchMap, tap } from 'rxjs/operators';
import { API_BASE_URL, DEFAULT_PAGE_REQUEST } from '../constants/app.constants';
import {
  AddExerciseRequest,
  EditExerciseRequest,
  Exercise,
  ExercisesResponse,
  MessageResponse,
  RemoveRangeRequest,
  ShortExercise
} from '../models/api.models';
import { BaseResourceService } from './base-resource.service';

@Injectable({
  providedIn: 'root'
})
export class ExerciseService extends BaseResourceService {
  private readonly endpoint = `${API_BASE_URL}/exercise`;
  private readonly itemsSubject = new BehaviorSubject<ShortExercise[]>([]);
  private readonly selectedExerciseLoadingSubject = new BehaviorSubject(false);
  private readonly selectedExerciseSubject = new BehaviorSubject<Exercise | null>(null);

  readonly items$ = this.itemsSubject.asObservable();
  readonly selectedExercise$ = this.selectedExerciseSubject.asObservable();
  readonly selectedExerciseLoading$ = this.selectedExerciseLoadingSubject.asObservable();

  constructor(private readonly httpClient: HttpClient) {
    super();
  }

  load() {
    return this.withLoading(
      this.httpClient.post<ExercisesResponse>(`${this.endpoint}/all`, DEFAULT_PAGE_REQUEST).pipe(
        tap((response) => {
          this.itemsSubject.next(response.exercises);

          const selectedExercise = this.selectedExerciseSubject.value;

          if (!selectedExercise) {
            return;
          }

          const matchingExercise = response.exercises.find(
            (item) => item.id === selectedExercise.id
          );

          if (!matchingExercise) {
            this.clearSelected();
            return;
          }

          this.selectedExerciseSubject.next({
            ...selectedExercise,
            name: matchingExercise.name,
            muscleGroup: matchingExercise.muscleGroup,
            difficultyLevel: matchingExercise.difficultyLevel
          });
        }),
        map((response) => response.exercises)
      )
    );
  }

  getById(id: string) {
    return this.httpClient.get<Exercise>(`${this.endpoint}/${id}`);
  }

  create(request: AddExerciseRequest) {
    return this.withLoading(
      this.httpClient.post<MessageResponse>(this.endpoint, request).pipe(
        switchMap((response) => this.load().pipe(map(() => response)))
      )
    );
  }

  update(request: EditExerciseRequest) {
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
        .pipe(
          tap(() => {
            const selectedExercise = this.selectedExerciseSubject.value;

            if (selectedExercise && ids.includes(selectedExercise.id)) {
              this.clearSelected();
            }
          }),
          switchMap((response) => this.load().pipe(map(() => response)))
        )
    );
  }

  select(id: string) {
    this.selectedExerciseLoadingSubject.next(true);

    return this.getById(id).pipe(
      tap((exercise) => this.selectedExerciseSubject.next(exercise)),
      finalize(() => this.selectedExerciseLoadingSubject.next(false))
    );
  }

  clearSelected() {
    this.selectedExerciseLoadingSubject.next(false);
    this.selectedExerciseSubject.next(null);
  }

  findById(id: string) {
    return this.itemsSubject.value.find((item) => item.id === id) ?? null;
  }

  getName(id: string) {
    return this.findById(id)?.name ?? 'Exercise';
  }
}
