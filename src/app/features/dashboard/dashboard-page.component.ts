import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { FOOD_CATEGORY_LABELS, GOAL_TYPE_LABELS } from '../../core/constants/options';
import {
  FoodItem,
  ShortExercise,
  ShortFoodItem,
  ShortFoodLog,
  ShortGoal,
  ShortProgressLog,
  ShortWorkout,
  User
} from '../../core/models/api.models';
import { ExerciseService } from '../../core/services/exercise.service';
import { FoodItemService } from '../../core/services/food-item.service';
import { FoodLogService } from '../../core/services/food-log.service';
import { GoalService } from '../../core/services/goal.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProgressLogService } from '../../core/services/progress-log.service';
import { UserService } from '../../core/services/user.service';
import { WorkoutService } from '../../core/services/workout.service';

@Component({
  imports: [CommonModule, CardModule, ButtonModule, TagModule],
  templateUrl: './dashboard-page.component.html'
})
export class DashboardPageComponent implements OnInit {
  exercises: ShortExercise[] = [];
  foodItems: ShortFoodItem[] = [];
  foodLogs: ShortFoodLog[] = [];
  goals: ShortGoal[] = [];
  progressLogs: ShortProgressLog[] = [];
  user: User | null = null;
  workouts: ShortWorkout[] = [];
  loading = false;

  constructor(
    private readonly exerciseService: ExerciseService,
    private readonly foodItemService: FoodItemService,
    private readonly foodLogService: FoodLogService,
    private readonly goalService: GoalService,
    private readonly notificationService: NotificationService,
    private readonly progressLogService: ProgressLogService,
    private readonly userService: UserService,
    private readonly workoutService: WorkoutService
  ) {}

  ngOnInit() {
    this.refresh();
  }

  get activeGoalsCount() {
    return this.goals.filter((goal) => !goal.isAchieved).length;
  }

  get latestProgressLog(): ShortProgressLog | null {
    return this.progressLogs[0] ?? null;
  }

  get latestWorkout(): ShortWorkout | null {
    return this.workouts[0] ?? null;
  }

  refresh() {
    this.loading = true;

    forkJoin({
      user: this.userService.loadCurrentUser(),
      workouts: this.workoutService.load(),
      goals: this.goalService.load(),
      progressLogs: this.progressLogService.load(),
      foodLogs: this.foodLogService.load(),
      exercises: this.exerciseService.load(),
      foodItems: this.foodItemService.load()
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.user = result.user;
          this.workouts = this.sortByDateDesc(result.workouts, (item) => item.startedAt);
          this.goals = this.sortByDateDesc(result.goals, (item) => item.endDate);
          this.progressLogs = this.sortByDateDesc(result.progressLogs, (item) => item.date);
          this.foodLogs = this.sortByDateDesc(result.foodLogs, (item) => item.date);
          this.exercises = [...result.exercises].sort((left, right) =>
            left.name.localeCompare(right.name)
          );
          this.foodItems = [...result.foodItems].sort((left, right) =>
            left.name.localeCompare(right.name)
          );
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Dashboard load failed')
      });
  }

  foodCategoryLabel(item: FoodItem | ShortFoodItem | null | undefined) {
    return FOOD_CATEGORY_LABELS[item?.category ?? 0] ?? 'Unknown';
  }

  foodLogName(logId: string) {
    return this.foodLogService.getFoodName(logId);
  }

  goalSeverity(goal: ShortGoal) {
    if (goal.isAchieved) {
      return 'success';
    }

    return new Date(`${goal.endDate}T00:00:00`).getTime() < Date.now() ? 'danger' : 'warn';
  }

  goalTypeLabel(type: number) {
    return GOAL_TYPE_LABELS[type] ?? 'Unknown';
  }

  private sortByDateDesc<T>(items: T[], selector: (item: T) => string) {
    return [...items].sort(
      (left, right) =>
        new Date(selector(right)).getTime() - new Date(selector(left)).getTime()
    );
  }
}
