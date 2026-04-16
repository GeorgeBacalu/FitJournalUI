import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API_BASE_URL, DEFAULT_PAGE_REQUEST } from '../constants/app.constants';
import { Exercise, ExercisesResponse, ShortExercise } from '../models/api.models';
import { BaseResourceService } from './base-resource.service';

@Injectable({
  providedIn: 'root'
})
export class ExerciseService extends BaseResourceService {
  private readonly endpoint = `${API_BASE_URL}/exercise`;
  private readonly itemsSubject = new BehaviorSubject<ShortExercise[]>([]);

  readonly items$ = this.itemsSubject.asObservable();

  constructor(private readonly httpClient: HttpClient) {
    super();
  }

  load() {
    return this.withLoading(
      this.httpClient.post<ExercisesResponse>(`${this.endpoint}/all`, DEFAULT_PAGE_REQUEST).pipe(
        tap((response) => this.itemsSubject.next(response.exercises)),
        map((response) => response.exercises)
      )
    );
  }

  getById(id: string) {
    return this.httpClient.get<Exercise>(`${this.endpoint}/${id}`);
  }

  findById(id: string) {
    return this.itemsSubject.value.find((item) => item.id === id) ?? null;
  }

  getName(id: string) {
    return this.findById(id)?.name ?? 'Exercise';
  }
}
