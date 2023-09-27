import { JwtService } from 'src/jwt/jwt.service';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

const mockRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findOneOrFail: jest.fn(),
});
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const mockJwtService = () => ({
  sign: jest.fn(() => 'signed-token'),
});

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: MockRepository<User>;
  let jwtService: JwtService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository() },
        { provide: JwtService, useValue: mockJwtService() },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: 'siwan@email.com',
      password: '12345',
      role: UserRole.Host,
    };

    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: '',
      });
      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already',
      });
    });

    it('should create a new user', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      usersRepository.create.mockReturnValue(createAccountArgs);
      usersRepository.save.mockResolvedValue(createAccountArgs);
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({ ok: true, error: null });
      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({
        ok: false,
        error: 'Could not create account',
      });
    });
  });
  describe('login', () => {
    const loginArgs = {
      email: 'siwan@email.com',
      password: '12345',
    };
    it('should fail if user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.login(loginArgs);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({ ok: false, error: 'User not found' });
    });

    it('should fail if the password is wrong', async () => {
      const mockedUser = {
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error: 'Wrong password' });
    });
  });
  it.todo('findById');
  it.todo('editProfile');
});
