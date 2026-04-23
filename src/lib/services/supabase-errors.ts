type SupabaseErrorLike = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

type SupabaseLogContext = {
  operation: string;
  table: string;
  payload?: Record<string, unknown>;
};

export function logSupabaseError(context: SupabaseLogContext, error: SupabaseErrorLike): void {
  console.error('[supabase-error]', {
    operation: context.operation,
    table: context.table,
    payload: context.payload,
    error: {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    }
  });
}