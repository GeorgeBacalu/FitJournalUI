import { Subject } from 'rxjs';
import { BaseResourceService } from './base-resource.service';

class TestResourceService extends BaseResourceService {
  track<T>(source: Subject<T>) { return this.withLoading(source); }
}

describe('BaseResourceService', () => {
  it('stays loading until every concurrent request has completed', () => {
    const service = new TestResourceService();
    const first = new Subject<void>();
    const second = new Subject<void>();
    const states: boolean[] = [];
    service.loading$.subscribe((value) => states.push(value));

    service.track(first).subscribe();
    service.track(second).subscribe();
    first.complete();
    expect(states.at(-1)).toBe(true);
    second.complete();
    expect(states.at(-1)).toBe(false);
  });

  it('clears loading when a request errors', () => {
    const service = new TestResourceService();
    const request = new Subject<void>();
    let loading = false;
    service.loading$.subscribe((value) => loading = value);
    service.track(request).subscribe({ error: () => undefined });
    request.error(new Error('failed'));
    expect(loading).toBe(false);
  });
});
