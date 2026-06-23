import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { App } from './app';

describe('App', () => {
  let events$: Subject<unknown>;
  let app: App;

  beforeEach(() => {
    events$ = new Subject<unknown>();
    app = new App({ events: events$.asObservable() } as Router);
  });

  it('updates the global loading state during route navigation', () => {
    expect(app.loading()).toBe(false);

    events$.next(new NavigationStart(1, '/dashboard'));

    expect(app.loading()).toBe(true);

    events$.next(new NavigationEnd(1, '/dashboard', '/dashboard'));

    expect(app.loading()).toBe(false);
  });
});
