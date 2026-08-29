import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TextareaModule } from 'primeng/textarea';
import { API_BASE_URL } from '../../core/constants/app.constants';

@Component({
  imports: [FormsModule, ButtonModule, CardModule, TextareaModule],
  template: `<h2 class="page-title">Athlete advice</h2><p class="page-subtitle">Ask for general training or nutrition guidance. This is not medical advice.</p><p-card><textarea pTextarea [(ngModel)]="question" rows="5" class="w-full" placeholder="How can I structure three strength sessions this week?"></textarea><button pButton class="mt-3" label="Ask coach" [loading]="loading" (click)="ask()"></button>@if(answer){<div class="mt-4 white-space-pre-line">{{answer}}</div>}</p-card>`
})
export class AthleteAdvicePageComponent {
  question = ''; answer = ''; loading = false;
  constructor(private readonly http: HttpClient) {}
  ask() { if (!this.question.trim()) return; this.loading = true; this.http.post<{answer:string}>(`${API_BASE_URL}/athlete-advice`, { question: this.question }).subscribe({ next: r => { this.answer = r.answer; this.loading = false; }, error: () => { this.answer = 'Advice is temporarily unavailable.'; this.loading = false; } }); }
}
