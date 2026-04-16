import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { GENDER_OPTIONS } from '../../core/constants/options';
import { toDateOnlyString } from '../../core/utils/date.utils';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    DatePickerModule,
    InputNumberModule,
    InputTextModule,
    PasswordModule,
    SelectModule
  ],
  templateUrl: './register-page.component.html'
})
export class RegisterPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  readonly genderOptions = GENDER_OPTIONS;
  submitted = false;
  submitting = false;

  readonly form = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(50)
    ]),
    email: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.email,
      Validators.maxLength(50)
    ]),
    password: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(30)
    ]),
    confirmedPassword: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(30)
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

  constructor(
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly router: Router
  ) {}

  hasError(control: AbstractControl | null) {
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  passwordsMismatch() {
    const password = this.form.controls.password.value;
    const confirmedPassword = this.form.controls.confirmedPassword.value;
    return !!password && !!confirmedPassword && password !== confirmedPassword;
  }

  submit() {
    this.submitted = true;

    if (this.passwordsMismatch()) {
      this.form.controls.confirmedPassword.setErrors({ mismatch: true });
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    if (
      !formValue.birthday ||
      formValue.height == null ||
      formValue.weight == null ||
      formValue.gender == null
    ) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    this.authService
      .register({
        name: formValue.name,
        email: formValue.email,
        password: formValue.password,
        confirmedPassword: formValue.confirmedPassword,
        phone: formValue.phone,
        birthday: toDateOnlyString(formValue.birthday),
        height: formValue.height,
        weight: formValue.weight,
        gender: formValue.gender
      })
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (response) => {
          this.notificationService.success('Account created', response.message);
          void this.router.navigateByUrl('/login');
        },
        error: (error) => this.notificationService.fromHttpError(error, 'Registration failed')
      });
  }
}
