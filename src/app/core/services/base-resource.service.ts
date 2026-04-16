import { BehaviorSubject, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

export abstract class BaseResourceService {
  private readonly loadingSubject = new BehaviorSubject(false);
  private pendingRequests = 0;

  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  protected withLoading<T>(source: Observable<T>) {
    this.pendingRequests += 1;
    this.loadingSubject.next(true);

    return source.pipe(
      finalize(() => {
        this.pendingRequests = Math.max(0, this.pendingRequests - 1);
        this.loadingSubject.next(this.pendingRequests > 0);
      })
    );
  }
}
