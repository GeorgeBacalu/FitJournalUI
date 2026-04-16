import { BehaviorSubject, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

export abstract class BaseResourceService {
  private readonly loadingSubject = new BehaviorSubject(false);

  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  protected withLoading<T>(source: Observable<T>) {
    this.loadingSubject.next(true);
    return source.pipe(finalize(() => this.loadingSubject.next(false)));
  }
}
