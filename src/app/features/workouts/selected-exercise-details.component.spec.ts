import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Exercise } from '../../core/models/api.models';
import { ExerciseService } from '../../core/services/exercise.service';
import { NotificationService } from '../../core/services/notification.service';
import { SessionService } from '../../core/services/session.service';
import { SelectedExerciseDetailsComponent } from './selected-exercise-details.component';

describe('SelectedExerciseDetailsComponent', () => {
  let exercises: { selectedExercise$: BehaviorSubject<Exercise | null>; selectedExerciseLoading$: BehaviorSubject<boolean>; uploadMedia: ReturnType<typeof vi.fn> };
  let session: { getCurrentRole: ReturnType<typeof vi.fn> };
  let notifications: { success: ReturnType<typeof vi.fn>; fromHttpError: ReturnType<typeof vi.fn> };

  const createComponent = () => TestBed.runInInjectionContext(() => new SelectedExerciseDetailsComponent());

  beforeEach(() => {
    exercises = { selectedExercise$: new BehaviorSubject<Exercise | null>(null), selectedExerciseLoading$: new BehaviorSubject(false), uploadMedia: vi.fn() };
    session = { getCurrentRole: vi.fn().mockReturnValue('User') };
    notifications = { success: vi.fn(), fromHttpError: vi.fn() };
    TestBed.configureTestingModule({ providers: [
      { provide: ExerciseService, useValue: exercises },
      { provide: SessionService, useValue: session },
      { provide: NotificationService, useValue: notifications }
    ] });
  });

  it('allows only admins to manage exercise media', () => {
    const component = createComponent();
    expect(component.canManageExercises).toBe(false);
    session.getCurrentRole.mockReturnValue('ADMIN');
    expect(component.canManageExercises).toBe(true);
  });

  it('ignores upload events without a file', () => {
    const component = createComponent();
    component.upload({ target: { files: [] } } as unknown as Event, 'exercise-id', 'thumbnail');
    expect(exercises.uploadMedia).not.toHaveBeenCalled();
  });

  it('uploads media, reports success, and resets the input', () => {
    const component = createComponent();
    const file = new File(['image'], 'thumbnail.png', { type: 'image/png' });
    const input = { files: [file], value: 'C:\\fakepath\\thumbnail.png' };
    exercises.uploadMedia.mockReturnValue(of({ url: '/thumbnail.png' }));
    component.upload({ target: input } as unknown as Event, 'exercise-id', 'thumbnail');
    expect(exercises.uploadMedia).toHaveBeenCalledWith('exercise-id', 'thumbnail', file);
    expect(notifications.success).toHaveBeenCalledWith('Media uploaded', 'Exercise thumbnail is now available.');
    expect(component.uploading).toBeNull();
    expect(input.value).toBe('');
  });

  it('reports upload failures and provides unknown label fallbacks', () => {
    const component = createComponent();
    const error = new Error('upload failed');
    const input = { files: [new File(['video'], 'clip.mp4')], value: 'clip.mp4' };
    exercises.uploadMedia.mockReturnValue(throwError(() => error));
    component.upload({ target: input } as unknown as Event, 'exercise-id', 'video');
    expect(notifications.fromHttpError).toHaveBeenCalledWith(error, 'Media upload failed');
    expect(component.difficultyLabel(999)).toBe('Unknown');
    expect(component.muscleGroupLabel(999)).toBe('Unknown');
    expect(component.uploading).toBeNull();
  });
});
