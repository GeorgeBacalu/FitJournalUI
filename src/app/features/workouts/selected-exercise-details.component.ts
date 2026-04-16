import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import {
  DIFFICULTY_LABELS,
  MUSCLE_GROUP_LABELS
} from '../../core/constants/options';
import { ExerciseService } from '../../core/services/exercise.service';

@Component({
  selector: 'app-selected-exercise-details',
  imports: [CommonModule, CardModule, TagModule],
  template: `
    @if (selectedExerciseLoading$ | async) {
      <p-card header="Selected exercise" styleClass="mt-3">
        <p class="section-empty">Loading exercise details...</p>
      </p-card>
    } @else if (selectedExercise$ | async; as exercise) {
      <p-card header="Selected exercise" styleClass="mt-3">
        <div class="flex flex-column gap-3">
          <div class="flex align-items-start justify-content-between gap-3 flex-wrap">
            <div>
              <div class="font-semibold text-xl">{{ exercise.name }}</div>
              <small class="text-color-secondary">
                Full exercise details from the catalog.
              </small>
            </div>

            <div class="toolbar-actions justify-content-end">
              <p-tag
                [value]="muscleGroupLabel(exercise.muscleGroup)"
                severity="secondary"
              />
              <p-tag
                [value]="difficultyLabel(exercise.difficultyLevel)"
                severity="contrast"
              />
            </div>
          </div>

          <div class="grid">
            <div class="col-12 md:col-6">
              <div class="font-semibold mb-2">Description</div>
              <div class="text-color-secondary">
                {{ exercise.description || 'No description provided.' }}
              </div>
            </div>

            <div class="col-12 md:col-6">
              <div class="font-semibold mb-2">Notes</div>
              <div class="text-color-secondary">
                {{ exercise.notes || 'No notes added yet.' }}
              </div>
            </div>
          </div>
        </div>
      </p-card>
    }
  `
})
export class SelectedExerciseDetailsComponent {
  private readonly exerciseService = inject(ExerciseService);

  readonly selectedExercise$ = this.exerciseService.selectedExercise$;
  readonly selectedExerciseLoading$ = this.exerciseService.selectedExerciseLoading$;

  difficultyLabel(value: number) {
    return DIFFICULTY_LABELS[value] ?? 'Unknown';
  }

  muscleGroupLabel(value: number) {
    return MUSCLE_GROUP_LABELS[value] ?? 'Unknown';
  }
}
