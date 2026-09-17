import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { API_BASE_URL, DEFAULT_PAGE_REQUEST } from '../constants/app.constants';
import { SessionService } from './session.service';
import { UserService } from './user.service';
import { WorkoutExerciseService } from './workout-exercise.service';

describe('UserService', () => {
  const http = { get: vi.fn(), put: vi.fn() };
  const session = { getCurrentUserId: vi.fn() };
  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService(http as unknown as HttpClient, session as unknown as SessionService);
  });

  it('returns null without making a request when no user is logged in', () => {
    session.getCurrentUserId.mockReturnValue(null);
    let result: unknown = 'unset';
    service.loadCurrentUser().subscribe((value) => result = value);
    expect(result).toBeNull();
    expect(http.get).not.toHaveBeenCalled();
  });

  it('loads and stores the current user', () => {
    const user = { id: 'u1', name: 'User' };
    session.getCurrentUserId.mockReturnValue('u1');
    http.get.mockReturnValue(of(user));
    service.loadCurrentUser().subscribe();
    expect(http.get).toHaveBeenCalledWith(`${API_BASE_URL}/user/u1`);
    expect(service.getCurrentUserSnapshot()).toBe(user);
  });

  it('updates the profile and reloads the user', () => {
    const request = { name: 'Updated' };
    session.getCurrentUserId.mockReturnValue('u1');
    http.put.mockReturnValue(of({ message: 'saved' }));
    http.get.mockReturnValue(of({ id: 'u1', name: 'Updated' }));
    service.updateProfile(request as never).subscribe();
    expect(http.put).toHaveBeenCalledWith(`${API_BASE_URL}/user`, request);
    expect(http.get).toHaveBeenCalledWith(`${API_BASE_URL}/user/u1`);
  });

  it('clears cached user state', () => {
    session.getCurrentUserId.mockReturnValue('u1');
    http.get.mockReturnValue(of({ id: 'u1' }));
    service.loadCurrentUser().subscribe();
    service.clear();
    expect(service.getCurrentUserSnapshot()).toBeNull();
  });
});

describe('WorkoutExerciseService', () => {
  const endpoint = `${API_BASE_URL}/workoutexercise`;
  let http: { post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; request: ReturnType<typeof vi.fn> };
  let service: WorkoutExerciseService;

  beforeEach(() => {
    http = { post: vi.fn(), put: vi.fn(), request: vi.fn() };
    service = new WorkoutExerciseService(http as unknown as HttpClient);
  });

  it('clears entries without HTTP when no workout is selected', () => {
    let result: unknown;
    service.load(null).subscribe((value) => result = value);
    expect(result).toEqual([]);
    expect(service.getItemsSnapshot()).toEqual([]);
    expect(http.post).not.toHaveBeenCalled();
  });

  it('loads entries for a selected workout', () => {
    const entries = [{ id: 'entry-1', exerciseId: 'exercise-1', sets: 3, reps: 10, weightUsed: 50 }];
    http.post.mockReturnValue(of({ workoutExercises: entries, totalCount: 1 }));
    service.load('workout-1').subscribe();
    expect(http.post).toHaveBeenCalledWith(`${endpoint}/all`, { ...DEFAULT_PAGE_REQUEST, workoutId: 'workout-1' });
    expect(service.getItemsSnapshot()).toEqual(entries);
  });

  it('creates an entry and refreshes its workout', () => {
    const request = { workoutId: 'workout-1', exerciseId: 'exercise-1', sets: 3, reps: 10, weightUsed: 50 };
    http.post.mockImplementation((url: string) => url.endsWith('/all')
      ? of({ workoutExercises: [], totalCount: 0 })
      : of({ message: 'created' }));
    service.create(request).subscribe();
    expect(http.post).toHaveBeenCalledWith(endpoint, request);
    expect(http.post).toHaveBeenCalledWith(`${endpoint}/all`, { ...DEFAULT_PAGE_REQUEST, workoutId: 'workout-1' });
  });

  it('updates and removes entries with the correct workout scope', () => {
    const update = { id: 'entry-1', workoutId: 'workout-1', exerciseId: 'exercise-1', sets: 4, reps: 8, weightUsed: 60 };
    http.put.mockReturnValue(of({ message: 'updated' }));
    http.request.mockReturnValue(of({ message: 'removed' }));
    http.post.mockReturnValue(of({ workoutExercises: [], totalCount: 0 }));
    service.update(update).subscribe();
    service.remove('workout-1', ['exercise-1']).subscribe();
    expect(http.put).toHaveBeenCalledWith(endpoint, update);
    expect(http.request).toHaveBeenCalledWith('delete', endpoint, { body: {
      workoutId: 'workout-1', exerciseIds: ['exercise-1'], hardDelete: false
    } });
  });
});
