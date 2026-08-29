import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({ template: '<p class="p-5 text-center">Completing sign-in…</p>' })
export class OAuthCallbackPageComponent implements OnInit {
  constructor(private readonly route: ActivatedRoute, private readonly auth: AuthService, private readonly notifications: NotificationService, private readonly router: Router) {}
  ngOnInit() {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (!code) { void this.router.navigateByUrl('/login'); return; }
    this.auth.exchangeExternalCode(code).subscribe({
      next: () => void this.router.navigateByUrl('/dashboard'),
      error: () => { this.notifications.error('Sign-in failed', 'The external login code is invalid or expired.'); void this.router.navigateByUrl('/login'); }
    });
  }
}
