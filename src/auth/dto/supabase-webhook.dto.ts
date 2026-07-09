export class SupabaseWebhookDto {
  type!: string;
  table!: string;
  record!: {
    id: string;
    email: string;
    email_confirmed_at: string | null;
  };
}
