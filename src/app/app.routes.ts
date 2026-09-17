import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'oauth-callback',
    loadComponent: () =>
      import('./features/auth/oauth-callback-page.component').then(
        (m) => m.OAuthCallbackPageComponent,
      ),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register-page.component').then((m) => m.RegisterPageComponent),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password-page.component').then(
        (m) => m.ForgotPasswordPageComponent,
      ),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/reset-password-page.component').then(
        (m) => m.ResetPasswordPageComponent,
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/layout/app-layout.component').then((m) => m.AppLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        path: 'workouts',
        loadComponent: () =>
          import('./features/workouts/workouts-page.component').then(
            (m) => m.WorkoutsPageComponent,
          ),
      },
      {
        path: 'goals',
        loadComponent: () =>
          import('./features/goals/goals-page.component').then((m) => m.GoalsPageComponent),
      },
      {
        path: 'progress',
        loadComponent: () =>
          import('./features/progress/progress-page.component').then(
            (m) => m.ProgressPageComponent,
          ),
      },
      {
        path: 'nutrition',
        loadComponent: () =>
          import('./features/nutrition/nutrition-page.component').then(
            (m) => m.NutritionPageComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile-page.component').then((m) => m.ProfilePageComponent),
      },
      {
        path: 'athlete-advice',
        loadComponent: () =>
          import('./features/advice/athlete-advice-page.component').then(
            (m) => m.AthleteAdvicePageComponent,
          ),
      },
      {
        path: 'admin/users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/admin-users-page.component').then(
            (m) => m.AdminUsersPageComponent,
          ),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
