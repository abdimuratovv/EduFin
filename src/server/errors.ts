/** Ma'lum xato kodlari; API qatlami ularni foydalanuvchiga tushunarli matn bilan qaytaradi. */
export type ErrorCode =
  | "INVALID_AMOUNT"
  | "INSUFFICIENT_FUND"
  | "IDEMPOTENCY_CONFLICT"
  | "NOT_FOUND"
  | "LESSON_NOT_STARTED"
  | "LESSON_INCOMPLETE"
  | "INVALID_TASK"
  | "INVALID_OPTION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "WRONG_PIN"
  | "LOCKED"
  | "BAD_ORIGIN"
  | "BAD_REQUEST"
  | "BUSY";

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
