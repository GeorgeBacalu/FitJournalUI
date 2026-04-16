import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { ProgressLog, ShortProgressLog } from '../../core/models/api.models';
import { NotificationService } from '../../core/services/notification.service';
import { ProgressLogService } from '../../core/services/progress-log.service';
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
    TableModule
  ],
  templateUrl: './progress-page.component.html'
})
export class ProgressPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  dialogVisible = false;
  loading = false;
  logs: ShortProgressLog[] = [];
  saving = false;
  submitted = false;
  editingLogId: string | null = null;

  readonly form = this.formBuilder.group({
    date: this.formBuilder.control<Date | null>(new Date(), Validators.required),
    weight: this.formBuilder.control<number | null>(70, [
      Validators.required,
      Validators.min(25),
      Validators.max(250)
    ]),
    bodyFat: this.formBuilder.control<number | null>(20, [
      Validators.required,
      Validators.min(2),
      Validators.max(60)
    ]),
    waistCm: this.formBuilder.control<number | null>(80, [
      Validators.required,
      Validators.min(30),
      Validators.max(250)
    ]),
    chestCm: this.formBuilder.control<number | null>(100, [
      Validators.required,
      Validators.min(30),
      Validators.max(200)
    ]),
    armsCm: this.formBuilder.control<number | null>(35, [
      Validators.required,
      Validators.min(10),
      Validators.max(100)
    ])
  });

  constructor(
    private readonly confirmationService: ConfirmationService,
    private readonly notificationService: NotificationService,
    private readonly progressLogService: ProgressLogService
  ) {}

  ngOnInit() {
    this.refresh();
  }

  get latestLog(): ShortProgressLog | null {
    return this.logs[0] ?? null;
  }

  get weightChange() {
    if (this.logs.length < 2) {
      return null;
    }

    return this.logs[0].weight - this.logs[this.logs.length - 1].weight;
  }

  openNewLogDialog() {
    this.editingLogId = null;
    this.submitted = false;
    this.dialogVisible = true;
    this.form.reset({
      date: new Date(),
      weight: 70,
      bodyFat: 20,
      waistCm: 80,
      chestCm: 100,
      armsCm: 35
    });
  }

  refresh() {
    this.loading = true;

    this.progressLogService
      .load()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (logs) => {
          this.logs = [...logs].sort(
            (left, right) =>
              new Date(right.date).getTime() - new Date(left.date).getTime()
          );
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Progress logs load failed')
      });
  }

  removeLog(log: ShortProgressLog) {
    this.confirmationService.confirm({
      header: 'Delete progress log',
      icon: 'pi pi-exclamation-triangle',
      message: `Remove the progress entry from ${new Date(log.date).toLocaleDateString()}?`,
      accept: () => {
        this.progressLogService.remove([log.id]).subscribe({
          next: (response) => {
            this.notificationService.success('Progress entry deleted', response.message);
            this.refresh();
          },
          error: (error) =>
            this.notificationService.fromHttpError(error, 'Progress entry delete failed')
        });
      }
    });
  }

  saveLog() {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    if (
      !formValue.date ||
      formValue.weight == null ||
      formValue.bodyFat == null ||
      formValue.waistCm == null ||
      formValue.chestCm == null ||
      formValue.armsCm == null
    ) {
      this.form.markAllAsTouched();
      return;
    }

    const request = {
      date: toDateOnlyString(formValue.date),
      weight: formValue.weight,
      bodyFat: formValue.bodyFat,
      waistCm: formValue.waistCm,
      chestCm: formValue.chestCm,
      armsCm: formValue.armsCm
    };

    const saveRequest$ = this.editingLogId
      ? this.progressLogService.update({ id: this.editingLogId, ...request })
      : this.progressLogService.create(request);

    this.saving = true;

    saveRequest$
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (response) => {
          this.notificationService.success(
            this.editingLogId ? 'Progress updated' : 'Progress saved',
            response.message
          );
          this.dialogVisible = false;
          this.refresh();
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Progress save failed')
      });
  }

  startEditLog(logId: string) {
    this.loading = true;

    this.progressLogService
      .getById(logId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (log: ProgressLog) => {
          this.editingLogId = logId;
          this.submitted = false;
          this.dialogVisible = true;
          this.form.reset({
            date: toDateValue(log.date),
            weight: log.weight,
            bodyFat: log.bodyFat,
            waistCm: log.waistCm,
            chestCm: log.chestCm,
            armsCm: log.armsCm
          });
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Progress details failed to load')
      });
  }
}
