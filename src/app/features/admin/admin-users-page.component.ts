import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { GENDER_LABELS, GENDER_OPTIONS } from '../../core/constants/options';
import { User, UserSummary } from '../../core/models/api.models';
import { AdminUserService } from '../../core/services/admin-user.service';
import { NotificationService } from '../../core/services/notification.service';
import { SessionService } from '../../core/services/session.service';
import { toDateOnlyString, toDateValue } from '../../core/utils/date.utils';

@Component({
  imports: [
    CommonModule,
    FormsModule,
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
  ],
  templateUrl: './admin-users-page.component.html',
})
export class AdminUsersPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  readonly genderOptions = GENDER_OPTIONS;
  readonly currentUserId: string | null;
  users: UserSummary[] = [];
  totalCount = 0;
  searchName = '';
  loading = false;
  saving = false;
  editorVisible = false;
  selectedUser: User | null = null;

  readonly editForm = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
    email: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.email,
      Validators.maxLength(50),
    ]),
    phone: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(20),
    ]),
    birthday: this.formBuilder.control<Date | null>(null, Validators.required),
    height: this.formBuilder.control<number | null>(null, [
      Validators.required,
      Validators.min(120),
      Validators.max(250),
    ]),
    weight: this.formBuilder.control<number | null>(null, [
      Validators.required,
      Validators.min(25),
      Validators.max(250),
    ]),
    gender: this.formBuilder.control<number | null>(null, Validators.required),
  });

  constructor(
    private readonly adminUsers: AdminUserService,
    private readonly confirmationService: ConfirmationService,
    private readonly notifications: NotificationService,
    sessionService: SessionService,
  ) {
    this.currentUserId = sessionService.getCurrentUserId();
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.adminUsers
      .load(this.searchName)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.users = response.users;
          this.totalCount = response.totalCount;
        },
        error: (error) => this.notifications.fromHttpError(error, 'User list failed'),
      });
  }

  clearSearch() {
    this.searchName = '';
    this.load();
  }

  edit(user: UserSummary) {
    this.loading = true;
    this.adminUsers
      .getById(user.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (profile) => {
          this.selectedUser = profile;
          this.editForm.reset({
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            birthday: toDateValue(profile.birthday),
            height: profile.height,
            weight: profile.weight,
            gender: profile.gender,
          });
          this.editorVisible = true;
        },
        error: (error) => this.notifications.fromHttpError(error, 'User load failed'),
      });
  }

  save() {
    if (!this.selectedUser || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const value = this.editForm.getRawValue();
    if (!value.birthday || value.height == null || value.weight == null || value.gender == null)
      return;

    this.saving = true;
    this.adminUsers
      .update(this.selectedUser.id, {
        name: value.name,
        email: value.email,
        phone: value.phone,
        birthday: toDateOnlyString(value.birthday),
        height: value.height,
        weight: value.weight,
        gender: value.gender,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (response) => {
          this.notifications.success('User updated', response.message);
          this.editorVisible = false;
          this.load();
        },
        error: (error) => this.notifications.fromHttpError(error, 'User update failed'),
      });
  }

  deactivate(user: UserSummary) {
    if (user.id === this.currentUserId) return;

    this.confirmationService.confirm({
      header: 'Deactivate user',
      icon: 'pi pi-exclamation-triangle',
      message: `Deactivate ${user.name}? Their data remains soft-deleted and auditable.`,
      accept: () =>
        this.adminUsers.deactivate(user.id).subscribe({
          next: (response) => {
            this.notifications.success('User deactivated', response.message);
            this.load();
          },
          error: (error) => this.notifications.fromHttpError(error, 'User deactivation failed'),
        }),
    });
  }

  genderLabel(gender: number) {
    return GENDER_LABELS[gender] ?? 'Not specified';
  }

  roleLabel(role: number | string) {
    return role === 'Admin' || role === 1 ? 'Admin' : 'Athlete';
  }
}
