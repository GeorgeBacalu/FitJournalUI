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
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_OPTIONS,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_OPTIONS
} from '../../core/constants/options';
import { SessionService } from '../../core/services/session.service';
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
import { SelectedExerciseDetailsComponent } from './selected-exercise-details.component';

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
    TextareaModule,
    SelectedExerciseDetailsComponent
  ],
  templateUrl: './workouts-page.component.html'
})
export class WorkoutsPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  readonly difficultyOptions = DIFFICULTY_OPTIONS;
  readonly muscleGroupOptions = MUSCLE_GROUP_OPTIONS;
  selectedCatalogExerciseId: string | null = null;
  exerciseCatalog: ShortExercise[] = [];
  editingCatalogExerciseId: string | null = null;
  savingCatalogExercise = false;
  selectedWorkout: Workout | null = null;
  selectedWorkoutId: string | null = null;
  standaloneExerciseDialogVisible = false;
  standaloneExerciseSubmitted = false;
  savingExercise = false;
  savingWorkout = false;
  exerciseDialogVisible = false;
  exerciseSubmitted = false;
  editingWorkoutExerciseId: string | null = null;
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

  readonly standaloneExerciseForm = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(50)
    ]),
    description: this.formBuilder.nonNullable.control('', Validators.maxLength(250)),
    notes: this.formBuilder.nonNullable.control('', Validators.maxLength(250)),
    muscleGroup: this.formBuilder.control<number | null>(null, Validators.required),
    difficultyLevel: this.formBuilder.control<number | null>(null, Validators.required)
  });

  constructor(
    private readonly confirmationService: ConfirmationService,
    private readonly exerciseService: ExerciseService,
    private readonly notificationService: NotificationService,
    private readonly sessionService: SessionService,
    private readonly workoutExerciseService: WorkoutExerciseService,
    private readonly workoutService: WorkoutService
  ) {}

  ngOnInit() {
    this.refresh();
  }

  get canManageExercises() {
    return (this.sessionService.getCurrentRole() ?? '').toLowerCase() === 'admin';
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

    this.editingWorkoutExerciseId = null;
    this.exerciseSubmitted = false;
    this.exerciseDialogVisible = true;
    this.workoutExerciseForm.controls.exerciseId.enable();
    this.workoutExerciseForm.reset({
      exerciseId: null,
      sets: 3,
      reps: 10,
      weightUsed: 0
    });
  }

  openStandaloneExerciseDialog() {
    if (!this.canManageExercises) {
      this.notificationService.warn(
        'Admin role required',
        'Your backend only allows admin accounts to create standalone exercises.'
      );
      return;
    }

    this.editingCatalogExerciseId = null;
    this.standaloneExerciseSubmitted = false;
    this.standaloneExerciseDialogVisible = true;
    this.standaloneExerciseForm.reset({
      name: '',
      description: '',
      notes: '',
      muscleGroup: null,
      difficultyLevel: null
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

  openCatalogExercise(exerciseId: string, showError = true) {
    this.selectedCatalogExerciseId = exerciseId;

    this.exerciseService.select(exerciseId).subscribe({
      error: (error) => {
        this.selectedCatalogExerciseId = null;
        this.exerciseService.clearSelected();

        if (showError) {
          this.notificationService.fromHttpError(error, 'Exercise details failed to load');
        }
      }
    });
  }

  refresh(
    preferredWorkoutId = this.selectedWorkoutId,
    preferredExerciseId = this.selectedCatalogExerciseId
  ) {
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

        const nextExerciseId =
          preferredExerciseId &&
          this.exerciseCatalog.some((item) => item.id === preferredExerciseId)
            ? preferredExerciseId
            : null;

        if (nextExerciseId) {
          this.openCatalogExercise(nextExerciseId, false);
        } else {
          this.selectedCatalogExerciseId = null;
          this.exerciseService.clearSelected();
        }

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

    const editingWorkoutExerciseId = this.editingWorkoutExerciseId;
    this.savingExercise = true;

    const request = {
      workoutId: this.selectedWorkoutId,
      exerciseId: formValue.exerciseId,
      sets: formValue.sets,
      reps: formValue.reps,
      weightUsed: formValue.weightUsed
    };

    const saveRequest$ = editingWorkoutExerciseId
      ? this.workoutExerciseService.update({
          id: editingWorkoutExerciseId,
          ...request
        })
      : this.workoutExerciseService.create(request);

    saveRequest$
      .pipe(finalize(() => (this.savingExercise = false)))
      .subscribe({
        next: (response) => {
          this.notificationService.success(
            editingWorkoutExerciseId ? 'Exercise updated' : 'Exercise added',
            response.message
          );
          this.exerciseDialogVisible = false;
          this.selectWorkout(this.selectedWorkoutId as string);
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Exercise save failed')
      });
  }

  saveStandaloneExercise() {
    this.standaloneExerciseSubmitted = true;

    if (this.standaloneExerciseForm.invalid) {
      this.standaloneExerciseForm.markAllAsTouched();
      return;
    }

    const formValue = this.standaloneExerciseForm.getRawValue();

    if (formValue.muscleGroup == null || formValue.difficultyLevel == null) {
      this.standaloneExerciseForm.markAllAsTouched();
      return;
    }

    const editingCatalogExerciseId = this.editingCatalogExerciseId;
    this.savingCatalogExercise = true;

    const request = {
      name: formValue.name,
      description: formValue.description || null,
      notes: formValue.notes || null,
      muscleGroup: formValue.muscleGroup,
      difficultyLevel: formValue.difficultyLevel
    };

    const saveRequest$ = editingCatalogExerciseId
      ? this.exerciseService.update({
          id: editingCatalogExerciseId,
          ...request
        })
      : this.exerciseService.create(request);

    saveRequest$
      .pipe(finalize(() => (this.savingCatalogExercise = false)))
      .subscribe({
        next: (response) => {
          this.notificationService.success(
            editingCatalogExerciseId ? 'Exercise updated' : 'Exercise created',
            response.message
          );
          this.standaloneExerciseDialogVisible = false;
          this.refresh(
            this.selectedWorkoutId,
            editingCatalogExerciseId ?? this.selectedCatalogExerciseId
          );
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Exercise save failed')
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

  startEditWorkoutExercise(entry: ShortWorkoutExercise) {
    this.editingWorkoutExerciseId = entry.id;
    this.exerciseSubmitted = false;
    this.exerciseDialogVisible = true;
    this.workoutExerciseForm.reset({
      exerciseId: entry.exerciseId,
      sets: entry.sets,
      reps: entry.reps,
      weightUsed: entry.weightUsed
    });
    this.workoutExerciseForm.controls.exerciseId.disable();
  }

  handleWorkoutExerciseDialogHide() {
    this.editingWorkoutExerciseId = null;
    this.workoutExerciseForm.controls.exerciseId.enable();
  }

  startEditCatalogExercise(exerciseId: string) {
    if (!this.canManageExercises) {
      this.notificationService.warn(
        'Admin role required',
        'Your backend only allows admin accounts to edit standalone exercises.'
      );
      return;
    }

    this.exerciseService.getById(exerciseId).subscribe({
      next: (exercise) => {
        this.editingCatalogExerciseId = exerciseId;
        this.standaloneExerciseSubmitted = false;
        this.standaloneExerciseDialogVisible = true;
        this.standaloneExerciseForm.reset({
          name: exercise.name,
          description: exercise.description ?? '',
          notes: exercise.notes ?? '',
          muscleGroup: exercise.muscleGroup,
          difficultyLevel: exercise.difficultyLevel
        });
      },
      error: (error) =>
        this.notificationService.fromHttpError(error, 'Exercise details failed to load')
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

  removeCatalogExercise(exercise: ShortExercise) {
    if (!this.canManageExercises) {
      this.notificationService.warn(
        'Admin role required',
        'Your backend only allows admin accounts to delete standalone exercises.'
      );
      return;
    }

    this.confirmationService.confirm({
      header: 'Delete exercise',
      icon: 'pi pi-exclamation-triangle',
      message: `Remove "${exercise.name}" from the exercise catalog?`,
      accept: () => {
        const preferredExerciseId =
          exercise.id === this.selectedCatalogExerciseId ? null : this.selectedCatalogExerciseId;

        if (exercise.id === this.selectedCatalogExerciseId) {
          this.selectedCatalogExerciseId = null;
          this.exerciseService.clearSelected();
        }

        this.exerciseService.remove([exercise.id]).subscribe({
          next: (response) => {
            this.notificationService.success('Exercise deleted', response.message);
            this.refresh(this.selectedWorkoutId, preferredExerciseId);
          },
          error: (error) =>
            this.notificationService.fromHttpError(error, 'Exercise delete failed')
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
