import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { API_BASE_URL, DEFAULT_PAGE_REQUEST } from '../constants/app.constants';
import {
  AddFoodLogRequest,
  EditFoodLogRequest,
  FoodLog,
  FoodLogsResponse,
  MessageResponse,
  RemoveRangeRequest,
  ShortFoodLog
} from '../models/api.models';
import { BaseResourceService } from './base-resource.service';

@Injectable({
  providedIn: 'root'
})
export class FoodLogService extends BaseResourceService {
  private readonly endpoint = `${API_BASE_URL}/foodlog`;
  private readonly itemsSubject = new BehaviorSubject<ShortFoodLog[]>([]);
  private readonly detailsSubject = new BehaviorSubject<Record<string, FoodLog>>({});

  readonly items$ = this.itemsSubject.asObservable();
  readonly details$ = this.detailsSubject.asObservable();

  constructor(private readonly httpClient: HttpClient) {
    super();
  }

  load() {
    return this.withLoading(
      this.httpClient.post<FoodLogsResponse>(`${this.endpoint}/all`, DEFAULT_PAGE_REQUEST).pipe(
        tap((response) => this.itemsSubject.next(response.foodLogs)),
        switchMap((response) =>
          this.loadDetails(response.foodLogs).pipe(map(() => response.foodLogs))
        )
      )
    );
  }

  getById(id: string) {
    return this.httpClient.get<FoodLog>(`${this.endpoint}/${id}`);
  }

  create(request: AddFoodLogRequest) {
    return this.withLoading(
      this.httpClient.post<MessageResponse>(this.endpoint, request).pipe(
        switchMap((response) => this.load().pipe(map(() => response)))
      )
    );
  }

  update(request: EditFoodLogRequest) {
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

  getDetail(id: string) {
    return this.detailsSubject.value[id] ?? null;
  }

  getFoodName(id: string) {
    return this.getDetail(id)?.foodItem?.name ?? 'Food item';
  }

  private loadDetails(items: ShortFoodLog[]) {
    if (!items.length) {
      this.detailsSubject.next({});
      return of({});
    }

    return forkJoin(
      items.map((item) =>
        this.getById(item.id).pipe(map((detail) => [item.id, detail] as const))
      )
    ).pipe(
      tap((entries) => {
        this.detailsSubject.next(
          entries.reduce<Record<string, FoodLog>>((details, [id, detail]) => {
            details[id] = detail;
            return details;
          }, {})
        );
      })
    );
  }
}
