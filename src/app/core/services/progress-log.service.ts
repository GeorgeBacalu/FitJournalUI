import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { API_BASE_URL, DEFAULT_PAGE_REQUEST } from '../constants/app.constants';
import {
  AddProgressLogRequest,
  EditProgressLogRequest,
  MessageResponse,
  ProgressLog,
  ProgressLogsResponse,
  RemoveRangeRequest,
  ShortProgressLog
} from '../models/api.models';
import { BaseResourceService } from './base-resource.service';

@Injectable({
  providedIn: 'root'
})
export class ProgressLogService extends BaseResourceService {
  private readonly endpoint = `${API_BASE_URL}/progresslog`;
  private readonly itemsSubject = new BehaviorSubject<ShortProgressLog[]>([]);

  readonly items$ = this.itemsSubject.asObservable();

  constructor(private readonly httpClient: HttpClient) {
    super();
  }

  load() {
    return this.withLoading(
      this.httpClient.post<ProgressLogsResponse>(`${this.endpoint}/all`, DEFAULT_PAGE_REQUEST).pipe(
        tap((response) => this.itemsSubject.next(response.progressLogs)),
        map((response) => response.progressLogs)
      )
    );
  }

  getById(id: string) {
    return this.httpClient.get<ProgressLog>(`${this.endpoint}/${id}`);
  }

  create(request: AddProgressLogRequest) {
    return this.withLoading(
      this.httpClient.post<MessageResponse>(this.endpoint, request).pipe(
        switchMap((response) => this.load().pipe(map(() => response)))
      )
    );
  }

  update(request: EditProgressLogRequest) {
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
