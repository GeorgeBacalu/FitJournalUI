import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API_BASE_URL, DEFAULT_PAGE_REQUEST } from '../constants/app.constants';
import { FoodItem, FoodItemsResponse, ShortFoodItem } from '../models/api.models';
import { BaseResourceService } from './base-resource.service';

@Injectable({
  providedIn: 'root'
})
export class FoodItemService extends BaseResourceService {
  private readonly endpoint = `${API_BASE_URL}/fooditem`;
  private readonly itemsSubject = new BehaviorSubject<ShortFoodItem[]>([]);

  readonly items$ = this.itemsSubject.asObservable();

  constructor(private readonly httpClient: HttpClient) {
    super();
  }

  getItemsSnapshot() {
    return this.itemsSubject.value;
  }

  load() {
    return this.withLoading(
      this.httpClient.post<FoodItemsResponse>(`${this.endpoint}/all`, DEFAULT_PAGE_REQUEST).pipe(
        tap((response) => this.itemsSubject.next(response.foodItems)),
        map((response) => response.foodItems)
      )
    );
  }

  getById(id: string) {
    return this.httpClient.get<FoodItem>(`${this.endpoint}/${id}`);
  }

  findById(id: string) {
    return this.itemsSubject.value.find((item) => item.id === id) ?? null;
  }

  getName(id: string) {
    return this.findById(id)?.name ?? 'Food item';
  }
}
