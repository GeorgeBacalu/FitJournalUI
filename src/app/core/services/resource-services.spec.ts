import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { API_BASE_URL, DEFAULT_PAGE_REQUEST } from '../constants/app.constants';
import { FoodItemService } from './food-item.service';
import { FoodLogService } from './food-log.service';
import { GoalService } from './goal.service';
import { ProgressLogService } from './progress-log.service';

type ResourceService = {
  getItemsSnapshot(): unknown[];
  load(): ReturnType<typeof of>;
  getById(id: string): ReturnType<typeof of>;
  create(request: unknown): ReturnType<typeof of>;
  update(request: unknown): ReturnType<typeof of>;
  remove(ids: string[]): ReturnType<typeof of>;
};

const cases = [
  { name: 'GoalService', ctor: GoalService, route: 'goal', responseKey: 'goals' },
  { name: 'ProgressLogService', ctor: ProgressLogService, route: 'progresslog', responseKey: 'progressLogs' },
  { name: 'FoodItemService', ctor: FoodItemService, route: 'fooditem', responseKey: 'foodItems' },
  { name: 'FoodLogService', ctor: FoodLogService, route: 'foodlog', responseKey: 'foodLogs' }
] as const;

describe.each(cases)('$name HTTP resource behavior', ({ ctor, route, responseKey }) => {
  const endpoint = `${API_BASE_URL}/${route}`;
  let http: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; request: ReturnType<typeof vi.fn> };
  let service: ResourceService;

  beforeEach(() => {
    http = { get: vi.fn(), post: vi.fn(), put: vi.fn(), request: vi.fn() };
    service = new ctor(http as unknown as HttpClient) as unknown as ResourceService;
  });

  it('loads and stores the resource list', () => {
    const items = [{ id: 'item-1' }];
    http.post.mockReturnValue(of({ [responseKey]: items, totalCount: 1 }));
    http.get.mockReturnValue(of({ id: 'item-1' }));
    let result: unknown;
    service.load().subscribe((value) => result = value);
    expect(http.post).toHaveBeenCalledWith(`${endpoint}/all`, DEFAULT_PAGE_REQUEST);
    expect(result).toEqual(items);
    expect(service.getItemsSnapshot()).toEqual(items);
  });

  it('loads one resource by id', () => {
    http.get.mockReturnValue(of({ id: 'item-1' }));
    service.getById('item-1').subscribe();
    expect(http.get).toHaveBeenCalledWith(`${endpoint}/item-1`);
  });

  it.each([
    ['create', 'post'],
    ['update', 'put']
  ] as const)('%s sends the mutation and reloads the list', (operation, verb) => {
    const request = { id: 'item-1', name: 'Item' };
    http[verb].mockReturnValue(of({ message: 'saved' }));
    http.post.mockImplementation((url: string) =>
      url.endsWith('/all') ? of({ [responseKey]: [], totalCount: 0 }) : of({ message: 'saved' })
    );
    let result: unknown;
    service[operation](request).subscribe((value) => result = value);
    expect(http[verb]).toHaveBeenCalledWith(endpoint, request);
    expect(http.post).toHaveBeenCalledWith(`${endpoint}/all`, DEFAULT_PAGE_REQUEST);
    expect(result).toEqual({ message: 'saved' });
  });

  it('soft-deletes ids and reloads the list', () => {
    http.request.mockReturnValue(of({ message: 'removed' }));
    http.post.mockReturnValue(of({ [responseKey]: [], totalCount: 0 }));
    service.remove(['one', 'two']).subscribe();
    expect(http.request).toHaveBeenCalledWith('delete', endpoint, {
      body: { ids: ['one', 'two'], hardDelete: false }
    });
    expect(http.post).toHaveBeenCalledWith(`${endpoint}/all`, DEFAULT_PAGE_REQUEST);
  });
});
