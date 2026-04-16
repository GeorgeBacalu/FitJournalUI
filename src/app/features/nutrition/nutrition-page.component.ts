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
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { FOOD_BRAND_LABELS, FOOD_CATEGORY_LABELS } from '../../core/constants/options';
import { FoodItem, ShortFoodItem, ShortFoodLog } from '../../core/models/api.models';
import { FoodItemService } from '../../core/services/food-item.service';
import { FoodLogService } from '../../core/services/food-log.service';
import { NotificationService } from '../../core/services/notification.service';
import { toDateTimeString, toDateValue } from '../../core/utils/date.utils';

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    DialogModule,
    InputNumberModule,
    SelectModule,
    TableModule
  ],
  templateUrl: './nutrition-page.component.html'
})
export class NutritionPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  foodItemDetails: FoodItem | null = null;
  foodItemDialogVisible = false;
  foodItems: ShortFoodItem[] = [];
  foodLogs: ShortFoodLog[] = [];
  loading = false;
  refreshing = false;
  saving = false;
  submitted = false;
  dialogVisible = false;
  editingFoodLogId: string | null = null;

  readonly form = this.formBuilder.group({
    date: this.formBuilder.control<Date | null>(new Date(), Validators.required),
    servings: this.formBuilder.control<number | null>(1, [
      Validators.required,
      Validators.min(1)
    ]),
    quantity: this.formBuilder.control<number | null>(100, [
      Validators.required,
      Validators.min(100),
      Validators.max(5000)
    ]),
    foodId: this.formBuilder.control<string | null>(null, Validators.required)
  });

  constructor(
    private readonly confirmationService: ConfirmationService,
    private readonly foodItemService: FoodItemService,
    private readonly foodLogService: FoodLogService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.hydrateFromCache();
    this.refresh();
  }

  brandLabel(value: number) {
    return FOOD_BRAND_LABELS[value] ?? 'Unknown';
  }

  categoryLabel(value: number) {
    return FOOD_CATEGORY_LABELS[value] ?? 'Unknown';
  }

  foodLogName(logId: string) {
    return this.foodLogService.getFoodName(logId);
  }

  openFoodDetails(foodId: string) {
    this.loading = true;

    this.foodItemService
      .getById(foodId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (foodItem) => {
          this.foodItemDetails = foodItem;
          this.foodItemDialogVisible = true;
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Food item details failed to load')
      });
  }

  openNewFoodLogDialog() {
    this.editingFoodLogId = null;
    this.submitted = false;
    this.dialogVisible = true;
    this.form.reset({
      date: new Date(),
      servings: 1,
      quantity: 100,
      foodId: null
    });
  }

  refresh() {
    this.hydrateFromCache();
    this.refreshing = true;

    forkJoin({
      foodLogs: this.foodLogService.load(),
      foodItems: this.foodItemService.load()
    })
      .pipe(finalize(() => (this.refreshing = false)))
      .subscribe({
        next: (result) => {
          this.foodLogs = [...result.foodLogs].sort(
            (left, right) =>
              new Date(right.date).getTime() - new Date(left.date).getTime()
          );
          this.foodItems = [...result.foodItems].sort((left, right) =>
            left.name.localeCompare(right.name)
          );
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Nutrition data load failed')
      });
  }

  removeFoodLog(foodLog: ShortFoodLog) {
    this.confirmationService.confirm({
      header: 'Delete food log',
      icon: 'pi pi-exclamation-triangle',
      message: `Remove "${this.foodLogName(foodLog.id)}" from your nutrition history?`,
      accept: () => {
        this.foodLogService.remove([foodLog.id]).subscribe({
          next: (response) => {
            this.notificationService.success('Food log deleted', response.message);
            this.refresh();
          },
          error: (error) =>
            this.notificationService.fromHttpError(error, 'Food log delete failed')
        });
      }
    });
  }

  saveFoodLog() {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    if (
      !formValue.date ||
      formValue.servings == null ||
      formValue.quantity == null ||
      !formValue.foodId
    ) {
      this.form.markAllAsTouched();
      return;
    }

    const request = {
      date: toDateTimeString(formValue.date),
      servings: formValue.servings,
      quantity: formValue.quantity,
      foodId: formValue.foodId
    };

    const saveRequest$ = this.editingFoodLogId
      ? this.foodLogService.update({ id: this.editingFoodLogId, ...request })
      : this.foodLogService.create(request);

    this.saving = true;

    saveRequest$
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (response) => {
          this.notificationService.success(
            this.editingFoodLogId ? 'Food log updated' : 'Food log saved',
            response.message
          );
          this.dialogVisible = false;
          this.refresh();
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Food log save failed')
      });
  }

  startEditFoodLog(foodLogId: string) {
    this.loading = true;

    this.foodLogService
      .getById(foodLogId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (foodLog) => {
          this.editingFoodLogId = foodLogId;
          this.submitted = false;
          this.dialogVisible = true;
          this.form.reset({
            date: toDateValue(foodLog.date),
            servings: foodLog.servings,
            quantity: foodLog.quantity,
            foodId: foodLog.foodItem?.id ?? null
          });
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Food log details failed to load')
      });
  }

  private hydrateFromCache() {
    this.foodLogs = [...this.foodLogService.getItemsSnapshot()].sort(
      (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
    );
    this.foodItems = [...this.foodItemService.getItemsSnapshot()].sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }
}
