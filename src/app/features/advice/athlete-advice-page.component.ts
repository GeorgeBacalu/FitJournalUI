import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TextareaModule } from 'primeng/textarea';
import { API_BASE_URL } from '../../core/constants/app.constants';
import { NotificationService } from '../../core/services/notification.service';

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

@Component({
  imports: [FormsModule, ButtonModule, CardModule, TextareaModule],
  template: `
    <h2 class="page-title">Athlete advice</h2>
    <p class="page-subtitle">Advice uses your recent progress, goals, workouts and nutrition journal. It does not replace medical care.</p>
    <p-card>
      <div class="flex flex-column gap-3 mb-4" aria-live="polite">
        @for (message of messages; track $index) {
          <div class="border-round-xl p-3" [class.surface-100]="message.role === 'assistant'" [class.bg-primary-50]="message.role === 'user'">
            <div class="font-semibold mb-2">{{ message.role === 'assistant' ? 'FitJournal coach' : 'You' }}</div>
            <div class="white-space-pre-line line-height-3">{{ message.content }}</div>
          </div>
        } @empty { <p class="section-empty">Ask about planning, consistency, recovery, goals, or nutrition patterns.</p> }
      </div>
      <textarea pTextarea [(ngModel)]="question" rows="4" maxlength="2000" class="w-full" [disabled]="loading" placeholder="How should I adjust this week based on my journal?"></textarea>
      <div class="flex justify-content-between align-items-center gap-3 mt-3">
        <small class="text-color-secondary">{{ question.length }}/2000</small>
        <button pButton label="Ask coach" icon="pi pi-send" [loading]="loading" [disabled]="!question.trim()" (click)="ask()"></button>
      </div>
      @if (contextSummary) { <small class="text-color-secondary block mt-3">Context used: {{ contextSummary }}</small> }
    </p-card>`
})
export class AthleteAdvicePageComponent {
  question = '';
  loading = false;
  messages: ChatMessage[] = [];
  contextSummary = '';
  constructor(private readonly http: HttpClient, private readonly notifications: NotificationService) {}
  ask() {
    const question = this.question.trim();
    if (!question || this.loading) return;
    const history = [...this.messages];
    this.messages.push({ role: 'user', content: question });
    this.question = '';
    this.loading = true;
    this.http.post<{answer:string; context: {hasProgress:boolean; activeGoals:number; recentWorkouts:number; nutritionEntries:number}}>(`${API_BASE_URL}/athlete-advice`, { question, history }).subscribe({
      next: ({ answer, context }) => { this.messages.push({ role: 'assistant', content: answer }); this.contextSummary = `${context.recentWorkouts} workouts, ${context.activeGoals} active goals, ${context.nutritionEntries} nutrition entries${context.hasProgress ? ', latest progress' : ''}`; this.loading = false; },
      error: (error) => { this.messages.pop(); this.question = question; this.loading = false; this.notifications.fromHttpError(error, 'Coach unavailable'); }
    });
  }
}
