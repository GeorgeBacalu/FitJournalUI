import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { AthleteAdvicePageComponent } from './athlete-advice-page.component';

describe('AthleteAdvicePageComponent', () => {
  let http: { post: ReturnType<typeof vi.fn> };
  let notifications: { fromHttpError: ReturnType<typeof vi.fn> };
  let component: AthleteAdvicePageComponent;

  beforeEach(() => {
    http = { post: vi.fn() };
    notifications = { fromHttpError: vi.fn() };
    component = new AthleteAdvicePageComponent(http as unknown as HttpClient, notifications as unknown as NotificationService);
  });

  it('ignores empty questions and a second request while loading', () => {
    component.question = '   ';
    component.ask();
    component.question = 'Question';
    component.loading = true;
    component.ask();
    expect(http.post).not.toHaveBeenCalled();
  });

  it('sends trimmed text with history and appends the answer and context', () => {
    component.messages.push({ role: 'assistant', content: 'Earlier answer' });
    component.question = '  How should I train?  ';
    http.post.mockReturnValue(of({ answer: 'Train consistently.', context: { hasProgress: true, activeGoals: 2, recentWorkouts: 3, nutritionEntries: 4 } }));
    component.ask();
    expect(http.post).toHaveBeenCalledWith(expect.stringContaining('/athlete-advice'), {
      question: 'How should I train?', history: [{ role: 'assistant', content: 'Earlier answer' }]
    });
    expect(component.messages.at(-1)).toEqual({ role: 'assistant', content: 'Train consistently.' });
    expect(component.contextSummary).toBe('3 workouts, 2 active goals, 4 nutrition entries, latest progress');
    expect(component.loading).toBe(false);
  });

  it('restores the question and removes the optimistic message on failure', () => {
    const error = new Error('offline');
    component.question = 'Help me recover';
    http.post.mockReturnValue(throwError(() => error));
    component.ask();
    expect(component.messages).toEqual([]);
    expect(component.question).toBe('Help me recover');
    expect(component.loading).toBe(false);
    expect(notifications.fromHttpError).toHaveBeenCalledWith(error, 'Coach unavailable');
  });
});
