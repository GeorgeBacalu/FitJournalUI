import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs/operators';
import {
  DIFFICULTY_LABELS,
  MUSCLE_GROUP_LABELS
} from '../../core/constants/options';
import { ExerciseService } from '../../core/services/exercise.service';
import { SessionService } from '../../core/services/session.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-selected-exercise-details',
  imports: [CommonModule, CardModule, TagModule, ButtonModule],
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
            @if (exercise.thumbnailUrl) {
              <div class="col-12 md:col-4"><img [src]="exercise.thumbnailUrl" [alt]="exercise.name + ' thumbnail'" class="w-full border-round-xl" /></div>
            }
            @if (exercise.videoUrl) {
              <div class="col-12 md:col-8"><video controls preload="metadata" class="w-full border-round-xl"><source [src]="exercise.videoUrl" /></video></div>
            }
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
          @if (canManageExercises) {
            <div class="flex gap-3 flex-wrap align-items-center">
              <label class="p-button p-button-secondary"><span class="pi pi-image mr-2"></span>{{ uploading === 'thumbnail' ? 'Uploading…' : 'Upload thumbnail' }}<input type="file" accept="image/*" hidden [disabled]="!!uploading" (change)="upload($event, exercise.id, 'thumbnail')" /></label>
              <label class="p-button p-button-secondary"><span class="pi pi-video mr-2"></span>{{ uploading === 'video' ? 'Uploading…' : 'Upload video' }}<input type="file" accept="video/*" hidden [disabled]="!!uploading" (change)="upload($event, exercise.id, 'video')" /></label>
            </div>
          }
        </div>
      </p-card>
    }
  `
})
export class SelectedExerciseDetailsComponent {
  private readonly exerciseService = inject(ExerciseService);
  private readonly sessionService = inject(SessionService);
  private readonly notifications = inject(NotificationService);
  uploading: 'thumbnail' | 'video' | null = null;

  readonly selectedExercise$ = this.exerciseService.selectedExercise$;
  readonly selectedExerciseLoading$ = this.exerciseService.selectedExerciseLoading$;

  get canManageExercises() { return (this.sessionService.getCurrentRole() ?? '').toLowerCase() === 'admin'; }

  upload(event: Event, exerciseId: string, mediaType: 'thumbnail' | 'video') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading = mediaType;
    this.exerciseService.uploadMedia(exerciseId, mediaType, file).pipe(finalize(() => { this.uploading = null; input.value = ''; })).subscribe({
      next: () => this.notifications.success('Media uploaded', `Exercise ${mediaType} is now available.`),
      error: (error) => this.notifications.fromHttpError(error, 'Media upload failed')
    });
  }

  difficultyLabel(value: number) {
    return DIFFICULTY_LABELS[value] ?? 'Unknown';
  }

  muscleGroupLabel(value: number) {
    return MUSCLE_GROUP_LABELS[value] ?? 'Unknown';
  }
}
