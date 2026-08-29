import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';

@Component({ template: '<p class="p-5 text-center">Completing sign-in…</p>' })
export class OAuthCallbackPageComponent implements OnInit {
  constructor(private readonly route: ActivatedRoute, private readonly session: SessionService, private readonly router: Router) {}
  ngOnInit() {
    const accessToken = this.route.snapshot.queryParamMap.get('accessToken');
    const refreshToken = this.route.snapshot.queryParamMap.get('refreshToken');
    if (accessToken && refreshToken) this.session.setTokens({ accessToken, refreshToken });
    void this.router.navigateByUrl(accessToken ? '/dashboard' : '/login');
  }
}
