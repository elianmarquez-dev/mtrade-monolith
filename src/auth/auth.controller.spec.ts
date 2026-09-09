import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    validateToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call authService.register on register request', async () => {
    const expected = {
      accessToken: 'token',
      user: { id: 'user-1', email: 'test@mtrade.dev' },
    };
    authServiceMock.register.mockResolvedValue(expected);

    await expect(
      controller.register({
        email: 'test@mtrade.dev',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      }),
    ).resolves.toEqual(expected);

    expect(authServiceMock.register).toHaveBeenCalledWith({
      email: 'test@mtrade.dev',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    });
  });

  it('should call authService.login on login request', async () => {
    const expected = {
      accessToken: 'token',
      user: { id: 'user-1', email: 'test@mtrade.dev' },
    };
    authServiceMock.login.mockResolvedValue(expected);

    await expect(
      controller.login({
        email: 'test@mtrade.dev',
        password: 'Password123!',
      }),
    ).resolves.toEqual(expected);

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'test@mtrade.dev',
      password: 'Password123!',
    });
  });

  it('should call authService.logout on logout request', async () => {
    const expected = { success: true, userId: 'user-1' };
    authServiceMock.logout.mockResolvedValue(expected);

    await expect(
      controller.logout({
        user: { sub: 'user-1', email: 'test@mtrade.dev' },
        headers: { authorization: 'Bearer token' },
      } as any),
    ).resolves.toEqual(expected);

    expect(authServiceMock.logout).toHaveBeenCalledWith('user-1', 'token');
  });

  it('should call authService.validateToken on validate request', async () => {
    const expected = { sub: 'user-1', email: 'test@mtrade.dev' };
    authServiceMock.validateToken.mockResolvedValue(expected);

    await expect(controller.validateToken('token')).resolves.toEqual(expected);
    expect(authServiceMock.validateToken).toHaveBeenCalledWith('token');
  });
});
