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
      return this.getHttpErrorMessage(error);
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Something went wrong while contacting the FitJournal API.';
  }

  private getHttpErrorMessage(error: HttpErrorResponse) {
    if (typeof error.error === 'string' && error.error.trim()) {
      return this.normalizeServerMessage(error.error, error.status) ?? error.error.trim();
    }

    const payload = this.asApiErrorResponse(error.error);
    const validationMessage = this.getValidationMessage(payload);

    if (validationMessage) {
      return validationMessage;
    }

    const rawMessage = this.getRawPayloadMessage(payload);
    const normalizedMessage = this.normalizeServerMessage(rawMessage, error.status);

    if (normalizedMessage) {
      return normalizedMessage;
    }

    if (error.status === 0) {
      return 'Server is unreachable. Please check your internet connection and try again.';
    }

    if (error.status >= 500) {
      return 'Something unexpected happened on the server. Please try again in a moment.';
    }

    if (error.status === 409) {
      return 'This request conflicts with the current data. Review the submitted values and try again.';
    }

    return error.message || 'Something went wrong while contacting the server';
  }

  private asApiErrorResponse(payload: unknown) {
    return payload && typeof payload === 'object' ? (payload as ApiErrorResponse) : null;
  }

  private getRawPayloadMessage(payload: ApiErrorResponse | null) {
    if (!payload) {
      return null;
    }

    return this.firstNonEmpty(payload.detail, payload.title, payload.message);
  }

  private getValidationMessage(payload: ApiErrorResponse | null) {
    if (!payload?.errors) {
      return null;
    }

    const messages = Object.values(payload.errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map((value) => `${value ?? ''}`.trim())
      .filter((value) => !!value);

    return messages.length ? messages.join(' ') : null;
  }

  private normalizeServerMessage(message: string | null, status: number) {
    if (!message) {
      return null;
    }

    const normalizedMessage = message.trim();
    const lowerMessage = normalizedMessage.toLowerCase();

    if (
      lowerMessage.includes('duplicate') ||
      lowerMessage.includes('unique constraint') ||
      lowerMessage.includes('unique index')
    ) {
      return 'This change would create a duplicate record. Adjust the conflicting value and try again.';
    }

    if (
      lowerMessage.includes('reference constraint') ||
      lowerMessage.includes('foreign key') ||
      lowerMessage.includes('conflicted with the reference constraint')
    ) {
      return 'This change depends on related data that is missing or still in use. Update the related records first and try again.';
    }

    if (lowerMessage.includes('check constraint')) {
      return 'One or more submitted values break the database rules. Review the form values and try again.';
    }

    if (status === 409 || lowerMessage.includes('constraint')) {
      return 'This request conflicts with the current data. Review the submitted values and try again.';
    }

    if (
      status >= 500 ||
      lowerMessage.includes('internal server error') ||
      lowerMessage.includes('exception') ||
      lowerMessage.includes('stack trace')
    ) {
      return 'Something unexpected happened on the server. Please try again in a moment.';
    }

    return normalizedMessage;
  }

  private firstNonEmpty(...values: Array<string | null | undefined>) {
    return values.find((value) => !!value?.trim())?.trim() ?? null;
  }
}
