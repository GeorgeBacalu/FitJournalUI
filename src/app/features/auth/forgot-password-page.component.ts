import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './forgot-password-page.component.html'
})
export class ForgotPasswordPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  submitted = false;
  submitting = false;

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]]
  });

  constructor(
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService
  ) {}

  hasError(control: AbstractControl | null) {
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  submit() {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    this.authService
      .forgotPassword(this.form.getRawValue())
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (response) =>
          this.notificationService.success('Email requested', response.message),
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Password reset request failed')
      });
  }
}
