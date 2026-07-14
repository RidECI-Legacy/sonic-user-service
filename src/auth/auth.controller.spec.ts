import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    refresh: jest.Mock;
    verifyDriver: jest.Mock;
    forgotPassword: jest.Mock;
    resetPassword: jest.Mock;
  };

  beforeEach(() => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      verifyDriver: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    };
    controller = new AuthController(authService as never);
  });

  it('register delegates to authService.register with dto and photo', () => {
    const dto = { email: 'a@b.com' } as never;
    const photo = { originalname: 'x.png' } as never;
    void controller.register(dto, photo);
    expect(authService.register).toHaveBeenCalledWith(dto, photo);
  });

  it('confirmed returns a static confirmation message', () => {
    expect(controller.confirmed()).toEqual({
      message: 'Email verificado exitosamente. Ya puedes iniciar sesión.',
    });
  });

  it('login delegates to authService.login', () => {
    const dto = { email: 'a@b.com', password: 'x' } as never;
    void controller.login(dto);
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('refresh delegates to authService.refresh', () => {
    const dto = { refresh_token: 'rt' } as never;
    void controller.refresh(dto);
    expect(authService.refresh).toHaveBeenCalledWith(dto);
  });

  it('verifyDriver throws UnauthorizedException when there is no user on the request', () => {
    expect(() => controller.verifyDriver({ user: undefined } as never)).toThrow(
      UnauthorizedException,
    );
  });

  it('verifyDriver delegates to authService.verifyDriver with the user id', () => {
    void controller.verifyDriver({ user: { id: 'user-1' } } as never);
    expect(authService.verifyDriver).toHaveBeenCalledWith('user-1');
  });

  it('forgotPassword delegates to authService.forgotPassword', () => {
    const dto = { email: 'a@b.com' } as never;
    void controller.forgotPassword(dto);
    expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
  });

  it('resetPassword delegates to authService.resetPassword', () => {
    const dto = {
      access_token: 'at',
      refresh_token: 'rt',
      newPassword: 'x',
    } as never;
    void controller.resetPassword(dto);
    expect(authService.resetPassword).toHaveBeenCalledWith(dto);
  });
});
