import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { ApiErrorResponse } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private readonly messageService: MessageService) {}

  success(summary: string, detail: string) {
    this.messageService.add({ severity: 'success', summary, detail });
  }

  info(summary: string, detail: string) {
    this.messageService.add({ severity: 'info', summary, detail });
  }

  warn(summary: string, detail: string) {
    this.messageService.add({ severity: 'warn', summary, detail });
  }

  error(summary: string, detail: string) {
    this.messageService.add({ severity: 'error', summary, detail, life: 5000 });
  }

  fromHttpError(error: unknown, fallbackSummary = 'Request failed') {
    this.error(fallbackSummary, this.getErrorMessage(error));
  }

  getErrorMessage(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error as ApiErrorResponse | string | null;

      if (typeof payload === 'string' && payload.trim()) {
        return payload;
      }

      if (payload && typeof payload !== 'string' && payload.detail) {
        return payload.detail;
      }

      if (payload && typeof payload !== 'string' && payload.title) {
        return payload.title;
      }

      if (payload && typeof payload !== 'string' && payload.message) {
        return payload.message;
      }

      if (error.message) {
        return error.message;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Something went wrong while contacting the FitJournal API.';
  }
}
