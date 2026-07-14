import { SupabaseController } from './supabase.controller';

describe('SupabaseController', () => {
  it('createClient delegates to supabaseService.create', () => {
    const supabaseService = { create: jest.fn() };
    const controller = new SupabaseController(supabaseService as never);
    const dto = {
      supabase_url: 'https://x.supabase.co',
      secret_key: 'k',
    } as never;

    controller.createClient(dto);

    expect(supabaseService.create).toHaveBeenCalledWith(dto);
  });
});
