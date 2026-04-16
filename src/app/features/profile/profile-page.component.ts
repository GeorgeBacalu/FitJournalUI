import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { GENDER_OPTIONS } from '../../core/constants/options';
import { User } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';
import { toDateOnlyString, toDateValue } from '../../core/utils/date.utils';

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    InputNumberModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    TagModule
  ],
  templateUrl: './profile-page.component.html'
})
export class ProfilePageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  loading = false;
  profileSubmitted = false;
  savingPassword = false;
  savingProfile = false;
  user: User | null = null;
  readonly genderOptions = GENDER_OPTIONS;

  readonly profileForm = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(50)
    ]),
    email: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.email,
      Validators.maxLength(50)
    ]),
    phone: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(20),
      Validators.pattern(/^\+?[0-9\s\-()]{7,20}$/)
    ]),
    birthday: this.formBuilder.control<Date | null>(null, Validators.required),
    height: this.formBuilder.control<number | null>(170, [
      Validators.required,
      Validators.min(120),
      Validators.max(250)
    ]),
    weight: this.formBuilder.control<number | null>(70, [
      Validators.required,
      Validators.min(25),
      Validators.max(250)
    ]),
    gender: this.formBuilder.control<number | null>(1, Validators.required)
  });

  readonly passwordForm = this.formBuilder.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(30)]],
    newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(30)]],
    confirmedPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(30)]]
  });

  passwordSubmitted = false;

  constructor(
    private readonly authService: AuthService,
    private readonly confirmationService: ConfirmationService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;

    this.userService
      .loadCurrentUser()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (user) => {
          if (!user) {
            return;
          }

          this.user = user;
          this.profileForm.reset({
            name: user.name,
            email: user.email,
            phone: user.phone,
            birthday: toDateValue(user.birthday),
            height: user.height,
            weight: user.weight,
            gender: user.gender
          });
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Profile load failed')
      });
  }

  passwordsMismatch() {
    const newPassword = this.passwordForm.controls.newPassword.value;
    const confirmedPassword = this.passwordForm.controls.confirmedPassword.value;
    return !!newPassword && !!confirmedPassword && newPassword !== confirmedPassword;
  }

  savePassword() {
    this.passwordSubmitted = true;

    if (this.passwordsMismatch()) {
      this.passwordForm.controls.confirmedPassword.setErrors({ mismatch: true });
    }

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword = true;

    this.authService
      .changePassword(this.passwordForm.getRawValue())
      .pipe(finalize(() => (this.savingPassword = false)))
      .subscribe({
        next: (response) => {
          this.notificationService.success('Password changed', response.message);
          this.passwordSubmitted = false;
          this.passwordForm.reset({
            currentPassword: '',
            newPassword: '',
            confirmedPassword: ''
          });
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Password change failed')
      });
  }

  saveProfile() {
    this.profileSubmitted = true;

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const formValue = this.profileForm.getRawValue();

    if (
      !formValue.birthday ||
      formValue.height == null ||
      formValue.weight == null ||
      formValue.gender == null
    ) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile = true;

    this.userService
      .updateProfile({
        name: formValue.name,
        email: formValue.email,
        phone: formValue.phone,
        birthday: toDateOnlyString(formValue.birthday),
        height: formValue.height,
        weight: formValue.weight,
        gender: formValue.gender
      })
      .pipe(finalize(() => (this.savingProfile = false)))
      .subscribe({
        next: (response) => {
          this.notificationService.success('Profile updated', response.message);
          this.loadProfile();
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Profile save failed')
      });
  }

  deactivateAccount() {
    this.confirmationService.confirm({
      header: 'Deactivate account',
      icon: 'pi pi-exclamation-triangle',
      message:
        'This will deactivate your FitJournal account. You will be signed out immediately.',
      accept: () => {
        this.authService.deactivateAccount().subscribe({
          next: (response) =>
            this.notificationService.success('Account deactivated', response.message),
          error: (error) =>
            this.notificationService.fromHttpError(error, 'Account deactivation failed')
        });
      }
    });
  }
}
