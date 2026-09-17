import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ScrollTopModule } from 'primeng/scrolltop';
import { TagModule } from 'primeng/tag';
import { NAVIGATION_ITEMS } from '../../core/constants/options';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
  imports: [CommonModule, RouterOutlet, CardModule, ButtonModule, ScrollTopModule, TagModule],
  templateUrl: './app-layout.component.html',
})
export class AppLayoutComponent implements OnInit {
  private readonly userService = inject(UserService);
  readonly user$ = this.userService.currentUser$;

  get navigationItems() {
    return NAVIGATION_ITEMS.filter((item) => !item.adminOnly || this.authService.isAdmin());
  }

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.userService.loadCurrentUser().subscribe({
      error: () => undefined,
    });
  }

  go(route: string) {
    void this.router.navigateByUrl(route);
  }

  isActive(route: string) {
    return this.router.url === route;
  }

  initials(name: string | null | undefined) {
    return (
      (name ?? '')
        .split(' ')
        .filter((chunk) => !!chunk)
        .slice(0, 2)
        .map((chunk) => chunk[0]?.toUpperCase() ?? '')
        .join('') || 'FJ'
    );
  }

  logout() {
    this.authService.logout();
  }
}
