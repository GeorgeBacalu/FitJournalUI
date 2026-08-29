import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
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
import { countByDay, withinDays } from './dashboard-analytics.utils';

Chart.register(...registerables);

@Component({
  imports: [CommonModule, CardModule, ButtonModule, TagModule],
  templateUrl: './dashboard-page.component.html'
})

export class DashboardPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('weightChart') private weightChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('bodyFatChart') private bodyFatChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('workoutChart') private workoutChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('nutritionChart') private nutritionChartCanvas?: ElementRef<HTMLCanvasElement>;
  private weightChart?: Chart;
  private bodyFatChart?: Chart;
  private workoutChart?: Chart;
  private nutritionChart?: Chart;
  analyticsDays = 90;
  exercises: ShortExercise[] = [];
  foodItems: ShortFoodItem[] = [];
  foodLogs: ShortFoodLog[] = [];
  goals: ShortGoal[] = [];
  progressLogs: ShortProgressLog[] = [];
  refreshing = false;
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
    this.hydrateFromCache();
    this.refresh();
  }

  ngAfterViewInit() {
    this.renderCharts();
  }

  ngOnDestroy() {
    this.weightChart?.destroy();
    this.bodyFatChart?.destroy();
    this.workoutChart?.destroy();
    this.nutritionChart?.destroy();
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
    this.hydrateFromCache();
    this.loading = !this.hasCachedData();
    this.refreshing = true;

    forkJoin({
      user: this.userService.loadCurrentUser(),
      workouts: this.workoutService.load(),
      goals: this.goalService.load(),
      progressLogs: this.progressLogService.load(),
      foodLogs: this.foodLogService.load(),
      exercises: this.exerciseService.load(),
      foodItems: this.foodItemService.load()
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.refreshing = false;
        })
      )
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
          this.scheduleCharts();
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Dashboard load failed')
      });
  }

  private renderCharts() {
    const entries = withinDays([...this.progressLogs].reverse(), (entry) => entry.date, this.analyticsDays);
    const workouts = withinDays([...this.workouts].reverse(), (entry) => entry.startedAt, this.analyticsDays);
    const nutrition = withinDays([...this.foodLogs].reverse(), (entry) => entry.date, this.analyticsDays);
    const labels = entries.map((entry) => entry.date);
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: false, grid: { color: 'rgba(148, 163, 184, 0.18)' } } }
    };

    this.weightChart?.destroy(); this.bodyFatChart?.destroy(); this.workoutChart?.destroy(); this.nutritionChart?.destroy();
    if (this.weightChartCanvas && entries.length > 1) this.weightChart = new Chart(this.weightChartCanvas.nativeElement, {
      type: 'line', data: { labels, datasets: [{ label: 'Weight (kg)', data: entries.map((e) => e.weight), borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.14)', fill: true, tension: 0.3 }] }, options
    });
    if (this.bodyFatChartCanvas && entries.length > 1) this.bodyFatChart = new Chart(this.bodyFatChartCanvas.nativeElement, {
      type: 'line', data: { labels, datasets: [{ label: 'Body fat (%)', data: entries.map((e) => e.bodyFat), borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.14)', fill: true, tension: 0.3 }] }, options
    });
    if (this.workoutChartCanvas && workouts.length) this.workoutChart = new Chart(this.workoutChartCanvas.nativeElement, { type: 'bar', data: { labels: workouts.map((x) => x.startedAt.slice(0, 10)), datasets: [{ label: 'Duration (min)', data: workouts.map((x) => x.durationMinutes), backgroundColor: '#7c3aed' }] }, options: { ...options, scales: { y: { beginAtZero: true } } } });
    const nutritionDays = countByDay(nutrition, (x) => x.date);
    if (this.nutritionChartCanvas && nutrition.length) this.nutritionChart = new Chart(this.nutritionChartCanvas.nativeElement, { type: 'bar', data: { labels: nutritionDays.labels, datasets: [{ label: 'Nutrition entries', data: nutritionDays.values, backgroundColor: '#ea580c' }] }, options: { ...options, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
  }

  setAnalyticsDays(days: number) { this.analyticsDays = days; this.scheduleCharts(); }

  private scheduleCharts() { setTimeout(() => this.renderCharts()); }

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

  private hasCachedData() {
    return (
      !!this.user ||
      this.workouts.length > 0 ||
      this.goals.length > 0 ||
      this.progressLogs.length > 0 ||
      this.foodLogs.length > 0 ||
      this.exercises.length > 0 ||
      this.foodItems.length > 0
    );
  }

  private hydrateFromCache() {
    this.user = this.userService.getCurrentUserSnapshot();
    this.workouts = this.sortByDateDesc(
      this.workoutService.getItemsSnapshot(),
      (item) => item.startedAt
    );
    this.goals = this.sortByDateDesc(this.goalService.getItemsSnapshot(), (item) => item.endDate);
    this.progressLogs = this.sortByDateDesc(
      this.progressLogService.getItemsSnapshot(),
      (item) => item.date
    );
    this.foodLogs = this.sortByDateDesc(this.foodLogService.getItemsSnapshot(), (item) => item.date);
    this.exercises = [...this.exerciseService.getItemsSnapshot()].sort((left, right) =>
      left.name.localeCompare(right.name)
    );
    this.foodItems = [...this.foodItemService.getItemsSnapshot()].sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }
}
