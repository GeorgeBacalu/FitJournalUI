import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { DIFFICULTY_LABELS, MUSCLE_GROUP_LABELS } from '../../core/constants/options';
import { NotificationService } from '../../core/services/notification.service';
import { ExerciseService } from '../../core/services/exercise.service';
import { WorkoutExerciseService } from '../../core/services/workout-exercise.service';
import { WorkoutService } from '../../core/services/workout.service';
import { toDateTimeString, toDateValue } from '../../core/utils/date.utils';
import {
  ShortExercise,
  ShortWorkout,
  ShortWorkoutExercise,
  Workout
} from '../../core/models/api.models';

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule
  ],
  templateUrl: './workouts-page.component.html'
})
export class WorkoutsPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  exerciseCatalog: ShortExercise[] = [];
  selectedWorkout: Workout | null = null;
  selectedWorkoutId: string | null = null;
  savingExercise = false;
  savingWorkout = false;
  exerciseDialogVisible = false;
  exerciseSubmitted = false;
  loading = false;
  submitted = false;
  workoutDialogVisible = false;
  workoutExercises: ShortWorkoutExercise[] = [];
  workouts: ShortWorkout[] = [];
  editingWorkoutId: string | null = null;

  readonly workoutForm = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(50)
    ]),
    description: this.formBuilder.nonNullable.control('', Validators.maxLength(250)),
    notes: this.formBuilder.nonNullable.control('', Validators.maxLength(250)),
    durationMinutes: this.formBuilder.control<number | null>(60, [
      Validators.required,
      Validators.min(5),
      Validators.max(300)
    ]),
    startedAt: this.formBuilder.control<Date | null>(new Date(), Validators.required)
  });

  readonly workoutExerciseForm = this.formBuilder.group({
    exerciseId: this.formBuilder.control<string | null>(null, Validators.required),
    sets: this.formBuilder.control<number | null>(3, [
      Validators.required,
      Validators.min(1),
      Validators.max(10)
    ]),
    reps: this.formBuilder.control<number | null>(10, [
      Validators.required,
      Validators.min(1),
      Validators.max(50)
    ]),
    weightUsed: this.formBuilder.control<number | null>(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(500)
    ])
  });

  constructor(
    private readonly confirmationService: ConfirmationService,
    private readonly exerciseService: ExerciseService,
    private readonly notificationService: NotificationService,
    private readonly workoutExerciseService: WorkoutExerciseService,
    private readonly workoutService: WorkoutService
  ) {}

  ngOnInit() {
    this.refresh();
  }

  difficultyLabel(value: number) {
    return DIFFICULTY_LABELS[value] ?? 'Unknown';
  }

  exerciseName(id: string) {
    return this.exerciseService.getName(id);
  }

  muscleGroupLabel(value: number) {
    return MUSCLE_GROUP_LABELS[value] ?? 'Unknown';
  }

  openExerciseDialog() {
    if (!this.selectedWorkoutId) {
      return;
    }

    this.exerciseSubmitted = false;
    this.exerciseDialogVisible = true;
    this.workoutExerciseForm.reset({
      exerciseId: null,
      sets: 3,
      reps: 10,
      weightUsed: 0
    });
  }

  openNewWorkoutDialog() {
    this.editingWorkoutId = null;
    this.submitted = false;
    this.workoutDialogVisible = true;
    this.workoutForm.reset({
      name: '',
      description: '',
      notes: '',
      durationMinutes: 60,
      startedAt: new Date()
    });
  }

  refresh(preferredWorkoutId = this.selectedWorkoutId) {
    this.loading = true;

    forkJoin({
      workouts: this.workoutService.load(),
      exercises: this.exerciseService.load()
    }).subscribe({
      next: (result) => {
        this.workouts = this.sortByDateDesc(result.workouts, (item) => item.startedAt);
        this.exerciseCatalog = [...result.exercises].sort((left, right) =>
          left.name.localeCompare(right.name)
        );

        if (!this.workouts.length) {
          this.loading = false;
          this.selectedWorkout = null;
          this.selectedWorkoutId = null;
          this.workoutExercises = [];
          return;
        }

        const nextWorkoutId =
          preferredWorkoutId && this.workouts.some((item) => item.id === preferredWorkoutId)
            ? preferredWorkoutId
            : this.workouts[0].id;

        this.selectWorkout(nextWorkoutId);
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.fromHttpError(error, 'Workouts load failed');
      }
    });
  }

  saveWorkout() {
    this.submitted = true;

    if (this.workoutForm.invalid) {
      this.workoutForm.markAllAsTouched();
      return;
    }

    const formValue = this.workoutForm.getRawValue();

    if (formValue.durationMinutes == null || !formValue.startedAt) {
      this.workoutForm.markAllAsTouched();
      return;
    }

    const selectedWorkoutId = this.editingWorkoutId ?? this.selectedWorkoutId;
    const request = {
      name: formValue.name,
      description: formValue.description || null,
      notes: formValue.notes || null,
      durationMinutes: formValue.durationMinutes,
      startedAt: toDateTimeString(formValue.startedAt)
    };

    const saveRequest$ = this.editingWorkoutId
      ? this.workoutService.update({
          id: this.editingWorkoutId,
          ...request
        })
      : this.workoutService.create(request);

    this.savingWorkout = true;

    saveRequest$
      .pipe(finalize(() => (this.savingWorkout = false)))
      .subscribe({
        next: (response) => {
          this.notificationService.success(
            this.editingWorkoutId ? 'Workout updated' : 'Workout created',
            response.message
          );
          this.workoutDialogVisible = false;
          this.refresh(selectedWorkoutId);
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Workout save failed')
      });
  }

  saveWorkoutExercise() {
    this.exerciseSubmitted = true;

    if (this.workoutExerciseForm.invalid || !this.selectedWorkoutId) {
      this.workoutExerciseForm.markAllAsTouched();
      return;
    }

    const formValue = this.workoutExerciseForm.getRawValue();

    if (
      !formValue.exerciseId ||
      formValue.sets == null ||
      formValue.reps == null ||
      formValue.weightUsed == null
    ) {
      this.workoutExerciseForm.markAllAsTouched();
      return;
    }

    this.savingExercise = true;

    this.workoutExerciseService
      .create({
        workoutId: this.selectedWorkoutId,
        exerciseId: formValue.exerciseId,
        sets: formValue.sets,
        reps: formValue.reps,
        weightUsed: formValue.weightUsed
      })
      .pipe(finalize(() => (this.savingExercise = false)))
      .subscribe({
        next: (response) => {
          this.notificationService.success('Exercise added', response.message);
          this.exerciseDialogVisible = false;
          this.selectWorkout(this.selectedWorkoutId as string);
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Exercise add failed')
      });
  }

  selectWorkout(workoutId: string) {
    this.loading = true;

    forkJoin({
      detail: this.workoutService.getById(workoutId),
      exercises: this.workoutExerciseService.load(workoutId)
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.selectedWorkoutId = workoutId;
          this.selectedWorkout = result.detail;
          this.workoutExercises = result.exercises;
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Workout details failed to load')
      });
  }

  startEditWorkout(workoutId: string) {
    this.loading = true;

    this.workoutService
      .getById(workoutId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (workout) => {
          this.editingWorkoutId = workoutId;
          this.submitted = false;
          this.workoutDialogVisible = true;
          this.workoutForm.reset({
            name: workout.name,
            description: workout.description ?? '',
            notes: workout.notes ?? '',
            durationMinutes: workout.durationMinutes,
            startedAt: toDateValue(workout.startedAt)
          });
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Workout details failed to load')
      });
  }

  removeWorkout(workout: ShortWorkout) {
    this.confirmationService.confirm({
      header: 'Delete workout',
      icon: 'pi pi-exclamation-triangle',
      message: `Remove "${workout.name}" from your journal?`,
      accept: () => {
        this.workoutService.remove([workout.id]).subscribe({
          next: (response) => {
            this.notificationService.success('Workout deleted', response.message);
            this.refresh(workout.id === this.selectedWorkoutId ? null : this.selectedWorkoutId);
          },
          error: (error) =>
            this.notificationService.fromHttpError(error, 'Workout delete failed')
        });
      }
    });
  }

  removeWorkoutExercise(entry: ShortWorkoutExercise) {
    if (!this.selectedWorkoutId) {
      return;
    }

    this.confirmationService.confirm({
      header: 'Remove exercise',
      icon: 'pi pi-exclamation-triangle',
      message: `Remove "${this.exerciseName(entry.exerciseId)}" from this workout?`,
      accept: () => {
        this.workoutExerciseService
          .remove(this.selectedWorkoutId as string, [entry.exerciseId])
          .subscribe({
            next: (response) => {
              this.notificationService.success('Exercise removed', response.message);
              this.selectWorkout(this.selectedWorkoutId as string);
            },
            error: (error) =>
              this.notificationService.fromHttpError(error, 'Exercise remove failed')
          });
      }
    });
  }

  private sortByDateDesc<T>(items: T[], selector: (item: T) => string) {
    return [...items].sort(
      (left, right) =>
        new Date(selector(right)).getTime() - new Date(selector(left)).getTime()
    );
  }
}
