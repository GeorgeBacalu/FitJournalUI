export interface MessageResponse {
  message: string;
}

export interface ApiErrorResponse {
  title?: string | null;
  detail?: string | null;
  message?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmedPassword: string;
  phone: string;
  birthday: string;
  height: number;
  weight: number;
  gender: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmedPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmedPassword: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string;
  age: number;
  height: number;
  weight: number;
  gender: number;
}

export interface EditUserRequest {
  name: string;
  email: string;
  phone: string;
  birthday: string;
  height: number;
  weight: number;
  gender: number;
}

export interface ShortExercise {
  id: string;
  name: string;
  muscleGroup: number;
  difficultyLevel: number;
}

export interface Exercise extends ShortExercise {
  description?: string | null;
  notes?: string | null;
}

export interface ExercisesResponse {
  exercises: ShortExercise[];
  totalCount: number;
}

export interface ShortFoodItem {
  id: string;
  name: string;
  category: number;
  brand: number;
}

export interface FoodItem extends ShortFoodItem {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItemsResponse {
  foodItems: ShortFoodItem[];
  totalCount: number;
}

export interface WorkoutExerciseEntry {
  exerciseId: string;
  sets: number;
  reps: number;
  weightUsed: number;
}

export interface ShortWorkout {
  id: string;
  name: string;
  durationMinutes: number;
  startedAt: string;
}

export interface Workout extends ShortWorkout {
  description?: string | null;
  notes?: string | null;
  workoutExercises: WorkoutExerciseEntry[];
}

export interface WorkoutsResponse {
  workouts: ShortWorkout[];
  totalCount: number;
}

export interface AddWorkoutRequest {
  name: string;
  description?: string | null;
  notes?: string | null;
  durationMinutes: number;
  startedAt: string;
}

export interface EditWorkoutRequest extends AddWorkoutRequest {
  id: string;
}

export interface RemoveRangeRequest {
  ids: string[];
  hardDelete: boolean;
}

export interface ShortWorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  weightUsed: number;
}

export interface WorkoutExercisesResponse {
  workoutExercises: ShortWorkoutExercise[];
  totalCount: number;
}

export interface AddWorkoutExerciseRequest {
  workoutId: string;
  exerciseId: string;
  sets: number;
  reps: number;
  weightUsed: number;
}

export interface EditWorkoutExerciseRequest extends AddWorkoutExerciseRequest {
  id: string;
}

export interface RemoveWorkoutExercisesRequest {
  workoutId: string;
  exerciseIds: string[];
  hardDelete: boolean;
}

export interface ShortGoal {
  id: string;
  name: string;
  type: number;
  startDate: string;
  endDate: string;
  isAchieved: boolean;
}

export interface Goal extends ShortGoal {
  description?: string | null;
  notes?: string | null;
  targetWeight: number;
}

export interface GoalsResponse {
  goals: ShortGoal[];
  totalCount: number;
}

export interface AddGoalRequest {
  name: string;
  description?: string | null;
  notes?: string | null;
  type: number;
  targetWeight: number;
  startDate: string;
  endDate: string;
}

export interface EditGoalRequest extends AddGoalRequest {
  id: string;
}

export interface ShortProgressLog {
  id: string;
  date: string;
  weight: number;
  bodyFat: number;
}

export interface ProgressLog extends ShortProgressLog {
  waistCm: number;
  chestCm: number;
  armsCm: number;
}

export interface ProgressLogsResponse {
  progressLogs: ShortProgressLog[];
  totalCount: number;
}

export interface AddProgressLogRequest {
  date: string;
  weight: number;
  bodyFat: number;
  waistCm: number;
  chestCm: number;
  armsCm: number;
}

export interface EditProgressLogRequest extends AddProgressLogRequest {
  id: string;
}

export interface ShortFoodLog {
  id: string;
  date: string;
  servings: number;
  quantity: number;
}

export interface FoodLog extends ShortFoodLog {
  foodItem?: ShortFoodItem | null;
}

export interface FoodLogsResponse {
  foodLogs: ShortFoodLog[];
  totalCount: number;
}

export interface AddFoodLogRequest {
  date: string;
  servings: number;
  quantity: number;
  foodId: string;
}

export interface EditFoodLogRequest extends AddFoodLogRequest {
  id: string;
}

export interface JwtClaims {
  exp?: number;
  role?: string;
  userId?: string;
}
