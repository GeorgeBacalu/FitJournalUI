import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule
  ],
  templateUrl: './reset-password-page.component.html'
})
export class ResetPasswordPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  submitted = false;
  submitting = false;

  readonly form = this.formBuilder.nonNullable.group({
    token: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(30)]],
    confirmedPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(30)]]
  });

  constructor(
    activatedRoute: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly router: Router
  ) {
    const token = activatedRoute.snapshot.queryParamMap.get('token');

    if (token) {
      this.form.patchValue({ token });
    }
  }

  hasError(control: AbstractControl | null) {
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  passwordsMismatch() {
    const newPassword = this.form.controls.newPassword.value;
    const confirmedPassword = this.form.controls.confirmedPassword.value;
    return !!newPassword && !!confirmedPassword && newPassword !== confirmedPassword;
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

    this.submitting = true;

    this.authService
      .resetPassword(this.form.getRawValue())
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (response) => {
          this.notificationService.success('Password updated', response.message);
          void this.router.navigateByUrl('/login');
        },
        error: (error) =>
          this.notificationService.fromHttpError(error, 'Password reset failed')
      });
  }
}
