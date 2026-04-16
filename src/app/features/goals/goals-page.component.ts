import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { GOAL_TYPE_LABELS, GOAL_TYPE_OPTIONS } from '../../core/constants/options';
import { Goal, ShortGoal } from '../../core/models/api.models';
import { GoalService } from '../../core/services/goal.service';
import { NotificationService } from '../../core/services/notification.service';
import { toDateOnlyString, toDateValue } from '../../core/utils/date.utils';

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
  templateUrl: './goals-page.component.html'
})
export class GoalsPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  dialogVisible = false;
  goals: ShortGoal[] = [];
  loading = false;
  refreshing = false;
  saving = false;
  submitted = false;
  readonly goalTypeOptions = GOAL_TYPE_OPTIONS;
  editingGoalId: string | null = null;

  readonly form = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(50)
    ]),
    description: this.formBuilder.nonNullable.control('', Validators.maxLength(250)),
    notes: this.formBuilder.nonNullable.control('', Validators.maxLength(250)),
    type: this.formBuilder.control<number | null>(null, Validators.required),
    targetWeight: this.formBuilder.control<number | null>(70, [
      Validators.required,
      Validators.min(25),
      Validators.max(250)
    ]),
    startDate: this.formBuilder.control<Date | null>(new Date(), Validators.required),
    endDate: this.formBuilder.control<Date | null>(new Date(), Validators.required)
  });

  constructor(
    private readonly confirmationService: ConfirmationService,
    private readonly goalService: GoalService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.hydrateFromCache();
    this.refresh();
  }

  get achievedGoalsCount() {
    return this.goals.filter((goal) => goal.isAchieved).length;
  }

  get activeGoalsCount() {
    return this.goals.filter((goal) => !goal.isAchieved).length;
  }

  goalSeverity(goal: ShortGoal) {
    if (goal.isAchieved) {
      return 'success';
    }

    return new Date(`${goal.endDate}T00:00:00`).getTime() < Date.now() ? 'danger' : 'warn';
  }

  goalTypeLabel(goal: Goal | ShortGoal | null | undefined) {
    return GOAL_TYPE_LABELS[goal?.type ?? 0] ?? 'Unknown';
  }

  hasError(control: AbstractControl | null) {
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  openNewGoalDialog() {
    this.editingGoalId = null;
    this.submitted = false;
    this.dialogVisible = true;
    this.form.reset({
      name: '',
      description: '',
      notes: '',
      type: null,
      targetWeight: 70,
      startDate: new Date(),
      endDate: new Date()
    });
  }

  refresh() {
    this.hydrateFromCache();
    this.refreshing = true;

    this.goalService
      .load()
      .pipe(finalize(() => (this.refreshing = false)))
      .subscribe({
        next: (goals) => {
          this.goals = [...goals].sort(
            (left, right) =>
              new Date(right.endDate).getTime() - new Date(left.endDate).getTime()
          );
        },
        error: (error) => this.notificationService.fromHttpError(error, 'Goals load failed')
      });
  }

  removeGoal(goal: ShortGoal) {
    this.confirmationService.confirm({
      header: 'Delete goal',
      icon: 'pi pi-exclamation-triangle',
      message: `Remove "${goal.name}"?`,
      accept: () => {
        this.goalService.remove([goal.id]).subscribe({
          next: (response) => {
            this.notificationService.success('Goal deleted', response.message);
            this.refresh();
          },
          error: (error) =>
            this.notificationService.fromHttpError(error, 'Goal delete failed')
        });
      }
    });
  }

  saveGoal() {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    if (
      formValue.type == null ||
      formValue.targetWeight == null ||
      !formValue.startDate ||
      !formValue.endDate
    ) {
      this.form.markAllAsTouched();
      return;
    }

    const request = {
      name: formValue.name,
      description: formValue.description || null,
      notes: formValue.notes || null,
      type: formValue.type,
      targetWeight: formValue.targetWeight,
      startDate: toDateOnlyString(formValue.startDate),
      endDate: toDateOnlyString(formValue.endDate)
    };

    const saveRequest$ = this.editingGoalId
      ? this.goalService.update({ id: this.editingGoalId, ...request })
      : this.goalService.create(request);

    this.saving = true;

    saveRequest$
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (response) => {
          this.notificationService.success(
            this.editingGoalId ? 'Goal updated' : 'Goal created',
            response.message
          );
          this.dialogVisible = false;
          this.refresh();
        },
        error: (error) => this.notificationService.fromHttpError(error, 'Goal save failed')
      });
  }

  startEditGoal(goalId: string) {
    this.loading = true;

    this.goalService
      .getById(goalId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (goal) => {
          this.editingGoalId = goalId;
          this.submitted = false;
          this.dialogVisible = true;
          this.form.reset({
            name: goal.name,
            description: goal.description ?? '',
            notes: goal.notes ?? '',
            type: goal.type,
            targetWeight: goal.targetWeight,
            startDate: toDateValue(goal.startDate),
            endDate: toDateValue(goal.endDate)
          });
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Goal details failed to load')
      });
  }

  private hydrateFromCache() {
    this.goals = [...this.goalService.getItemsSnapshot()].sort(
      (left, right) => new Date(right.endDate).getTime() - new Date(left.endDate).getTime()
    );
  }
}
