import { HttpClient } from '@angular/common/http';
import { of, Subject } from 'rxjs';
import { API_BASE_URL, DEFAULT_PAGE_REQUEST } from '../constants/app.constants';
import { ExerciseService } from './exercise.service';
import { WorkoutService } from './workout.service';

describe('WorkoutService', () => {
  const endpoint = `${API_BASE_URL}/workout`;
  let http: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; request: ReturnType<typeof vi.fn> };
  let service: WorkoutService;

  beforeEach(() => {
    http = { get: vi.fn(), post: vi.fn(), put: vi.fn(), request: vi.fn() };
    service = new WorkoutService(http as unknown as HttpClient);
  });

  it('loads workouts and clears a stale selection', () => {
    service.rememberSelectedWorkout('missing');
    http.post.mockReturnValue(of({ workouts: [{ id: 'w1', name: 'Push', durationMinutes: 45, startedAt: '2026-09-17' }], totalCount: 1 }));
    service.load().subscribe();
    expect(http.post).toHaveBeenCalledWith(`${endpoint}/all`, DEFAULT_PAGE_REQUEST);
    expect(service.getSelectedWorkoutId()).toBeNull();
  });

  it('caches details and refreshes their summary fields on list load', () => {
    http.get.mockReturnValue(of({ id: 'w1', name: 'Old', durationMinutes: 30, startedAt: '2026-09-16', workoutExercises: [] }));
    service.getById('w1').subscribe();
    http.post.mockReturnValue(of({ workouts: [{ id: 'w1', name: 'New', durationMinutes: 60, startedAt: '2026-09-17' }], totalCount: 1 }));
    service.load().subscribe();
    expect(service.getCachedWorkout('w1')).toEqual(expect.objectContaining({ name: 'New', durationMinutes: 60 }));
    expect(service.getCachedWorkout(null)).toBeNull();
  });

  it.each([['create', 'post'], ['update', 'put']] as const)('%s mutates then refreshes', (operation, verb) => {
    const request = { id: 'w1', name: 'Workout' };
    http[verb].mockReturnValue(of({ message: 'saved' }));
    http.post.mockImplementation((url: string) => url.endsWith('/all')
      ? of({ workouts: [], totalCount: 0 }) : of({ message: 'saved' }));
    service[operation](request as never).subscribe();
    expect(http[verb]).toHaveBeenCalledWith(endpoint, request);
    expect(http.post).toHaveBeenCalledWith(`${endpoint}/all`, DEFAULT_PAGE_REQUEST);
  });

  it('soft deletes workouts then refreshes', () => {
    http.request.mockReturnValue(of({ message: 'removed' }));
    http.post.mockReturnValue(of({ workouts: [], totalCount: 0 }));
    service.remove(['w1']).subscribe();
    expect(http.request).toHaveBeenCalledWith('delete', endpoint, { body: { ids: ['w1'], hardDelete: false } });
  });
});

describe('ExerciseService', () => {
  const endpoint = `${API_BASE_URL}/exercise`;
  let http: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; request: ReturnType<typeof vi.fn> };
  let service: ExerciseService;

  beforeEach(() => {
    http = { get: vi.fn(), post: vi.fn(), put: vi.fn(), request: vi.fn() };
    service = new ExerciseService(http as unknown as HttpClient);
  });

  it('selects an exercise and tracks detail loading', () => {
    const detail$ = new Subject<never>();
    http.get.mockReturnValue(detail$);
    const states: boolean[] = [];
    service.selectedExerciseLoading$.subscribe((value) => states.push(value));
    service.select('e1').subscribe({ error: () => undefined });
    expect(states.at(-1)).toBe(true);
    detail$.error(new Error('failed'));
    expect(states.at(-1)).toBe(false);

    http.get.mockReturnValue(of({ id: 'e1', name: 'Squat', muscleGroup: 1, difficultyLevel: 2 }));
    service.select('e1').subscribe();
    expect(service.getSelectedExerciseId()).toBe('e1');
  });

  it('updates selected summary fields when the catalog reloads', () => {
    http.get.mockReturnValue(of({ id: 'e1', name: 'Old', muscleGroup: 1, difficultyLevel: 1, description: 'details' }));
    service.select('e1').subscribe();
    http.post.mockReturnValue(of({ exercises: [{ id: 'e1', name: 'New', muscleGroup: 2, difficultyLevel: 3 }], totalCount: 1 }));
    service.load().subscribe();
    expect(service.getSelectedExerciseSnapshot()).toEqual(expect.objectContaining({ name: 'New', description: 'details' }));
  });

  it('clears a selection no longer present in the catalog', () => {
    http.get.mockReturnValue(of({ id: 'e1', name: 'Old', muscleGroup: 1, difficultyLevel: 1 }));
    service.select('e1').subscribe();
    http.post.mockReturnValue(of({ exercises: [], totalCount: 0 }));
    service.load().subscribe();
    expect(service.getSelectedExerciseSnapshot()).toBeNull();
  });

  it('clears a selected exercise when it is removed', () => {
    http.get.mockReturnValue(of({ id: 'e1', name: 'Squat', muscleGroup: 1, difficultyLevel: 1 }));
    service.select('e1').subscribe();
    http.request.mockReturnValue(of({ message: 'removed' }));
    http.post.mockReturnValue(of({ exercises: [], totalCount: 0 }));
    service.remove(['e1']).subscribe();
    expect(service.getSelectedExerciseSnapshot()).toBeNull();
  });

  it('finds catalog entries and provides a fallback name', () => {
    http.post.mockReturnValue(of({ exercises: [{ id: 'e1', name: 'Squat', muscleGroup: 1, difficultyLevel: 1 }], totalCount: 1 }));
    service.load().subscribe();
    expect(service.findById('e1')?.name).toBe('Squat');
    expect(service.getName('e1')).toBe('Squat');
    expect(service.getName('missing')).toBe('Exercise');
  });
});
