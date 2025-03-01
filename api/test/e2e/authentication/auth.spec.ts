import { Test } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { E2E_CONFIG } from '../../e2e.config';
import { User } from 'modules/users/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRepository } from 'modules/users/user.repository';
import { ApiEventByTopicAndKind } from 'modules/api-events/api-event.topic+kind.entity';
import { API_EVENT_KINDS } from 'modules/api-events/api-event.entity';
import { ApiEventsService } from 'modules/api-events/api-events.service';
import { Response } from 'supertest';
import ApplicationManager, {
  TestApplication,
} from '../../utils/application-manager';
import { DataSource } from 'typeorm';
import { clearTestDataFromDatabase } from '../../utils/database-test-helper';
import { AppModule } from 'app.module';
import { ROLES } from 'modules/authorization/roles/roles.enum';

describe('AppController (e2e)', () => {
  let testApplication: TestApplication;
  let dataSource: DataSource;
  let userRepository: UserRepository;
  let apiEventsService: ApiEventsService;

  beforeAll(async () => {
    testApplication = await ApplicationManager.init(
      Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider('PASSWORD_INCLUDE_UPPER_CASE')
        .useValue(true)
        .overrideProvider('PASSWORD_INCLUDE_NUMERICS')
        .useValue(true)
        .overrideProvider('PASSWORD_INCLUDE_SPECIAL_CHARACTERS')
        .useValue(true)
        .overrideProvider('PASSWORD_MIN_LENGTH')
        .useValue(8),
    );

    dataSource = testApplication.get<DataSource>(DataSource);

    userRepository = testApplication.get<UserRepository>(UserRepository);
    apiEventsService = testApplication.get<ApiEventsService>(ApiEventsService);
  });

  afterAll(async () => {
    await clearTestDataFromDatabase(dataSource);
    await testApplication.close();
  });

  describe('Authentication', () => {
    beforeAll(async (): Promise<User> => {
      const user: User = new User();
      user.email = E2E_CONFIG.users.basic.aa.username;
      user.fname = 'a';
      user.lname = 'a';
      user.displayName = 'User A A';
      user.salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(
        E2E_CONFIG.users.basic.aa.password,
        user.salt,
      );
      user.isActive = true;
      return user.save();
    });

    describe('Creating new account', () => {
      test('Fails to sign up user with password without upper case character', async () => {
        const response = await request(testApplication.getHttpServer())
          .post('/auth/sign-up')
          .send({
            email: E2E_CONFIG.users.signUp.email,
            password: 'no1uppercase1!',
          })
          .expect(HttpStatus.BAD_REQUEST);
        expect(response).toHaveErrorMessage(
          HttpStatus.BAD_REQUEST,
          'Bad Request Exception',
          ['Password must contain at least 1 upper case letter'],
        );
      });

      test('Fails to sign up user with password without numeric', async () => {
        const response = await request(testApplication.getHttpServer())
          .post('/auth/sign-up')
          .send({
            email: E2E_CONFIG.users.signUp.email,
            password: 'noNumeric!',
          })
          .expect(HttpStatus.BAD_REQUEST);
        expect(response).toHaveErrorMessage(
          HttpStatus.BAD_REQUEST,
          'Bad Request Exception',
          ['Password must contain at least 1 numeric character'],
        );
      });

      test('Fails to sign up user with password without special character', async () => {
        const response = await request(testApplication.getHttpServer())
          .post('/auth/sign-up')
          .send({
            email: E2E_CONFIG.users.signUp.email,
            password: 'noSpecial123',
          })
          .expect(HttpStatus.BAD_REQUEST);
        expect(response).toHaveErrorMessage(
          HttpStatus.BAD_REQUEST,
          'Bad Request Exception',
          ['Password must contain at least 1 special character (!@#$%^&*)'],
        );
      });

      test('Fails to sign up user with short password', async () => {
        const response = await request(testApplication.getHttpServer())
          .post('/auth/sign-up')
          .send({
            email: E2E_CONFIG.users.signUp.email,
            password: 'Short1!',
          })
          .expect(HttpStatus.BAD_REQUEST);
        expect(response).toHaveErrorMessage(
          HttpStatus.BAD_REQUEST,
          'Bad Request Exception',
          ['Password too short, minimal length is 8'],
        );
      });

      test('Fails to sign up user with invalid password', async () => {
        const response = await request(testApplication.getHttpServer())
          .post('/auth/sign-up')
          .send({
            email: E2E_CONFIG.users.signUp.email,
            password: 'bad',
          })
          .expect(HttpStatus.BAD_REQUEST);
        expect(response).toHaveErrorMessage(
          HttpStatus.BAD_REQUEST,
          'Bad Request Exception',
          [
            'Password too short, minimal length is 8. ' +
              'Password must contain at least 1 upper case letter. ' +
              'Password must contain at least 1 numeric character. ' +
              'Password must contain at least 1 special character (!@#$%^&*)',
          ],
        );
      });

      test('Signs up user with valid password', async () => {
        await request(testApplication.getHttpServer())
          .post('/auth/sign-up')
          .send({
            email: E2E_CONFIG.users.signUp.email,
            password: E2E_CONFIG.users.signUp.password,
          })
          .expect(HttpStatus.CREATED);

        const users: User[] = await userRepository.find({
          where: { email: E2E_CONFIG.users.signUp.email },
        });

        expect(users).toHaveLength(1);
        expect(users[0].email).toEqual(E2E_CONFIG.users.signUp.email);
        expect(users[0].roles).toHaveLength(1);
        expect(users[0].roles[0].name).toEqual(ROLES.USER);
      });

      test('Signing up a user with a role should throw an error', async () => {
        const response = await request(testApplication.getHttpServer())
          .post('/auth/sign-up')
          .send({
            email: E2E_CONFIG.users.signUp.email,
            password: E2E_CONFIG.users.signUp.password,
            roles: [ROLES.ADMIN],
          })
          .expect(HttpStatus.BAD_REQUEST);

        expect(
          response.body.errors[0].meta.rawError.response.message[0],
        ).toEqual('property roles should not exist');
      });

      test('A user should not be able to create an account using an email address already in use', async () => {
        await request(testApplication.getHttpServer())
          .post('/auth/sign-up')
          .send({
            email: E2E_CONFIG.users.signUp.email,
            password: E2E_CONFIG.users.signUp.password,
          })
          .expect(HttpStatus.CONFLICT);
      });
    });

    describe('Signing in', () => {
      test('A user should not be able to log in until their account has been validated', async () => {
        const user: User | null = await userRepository.findByEmail(
          E2E_CONFIG.users.signUp.email,
        );
        if (!user) {
          throw new Error('Could not find user to validate');
        }
        user.isActive = false;
        await user.save();

        await request(testApplication.getHttpServer())
          .post('/auth/sign-in')
          .send({
            email: E2E_CONFIG.users.signUp.email,
            password: E2E_CONFIG.users.signUp.password,
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      test('Retrieves a JWT token when authenticating with valid credentials', async () => {
        await request(testApplication.getHttpServer())
          .post('/auth/sign-in')
          .send({
            username: E2E_CONFIG.users.basic.aa.username,
            password: E2E_CONFIG.users.basic.aa.password,
          })
          .expect(HttpStatus.CREATED);
      });

      test('Fails to authenticate a user with an incorrect password', async () => {
        const response = await request(testApplication.getHttpServer())
          .post('/auth/sign-in')
          .send({
            email: E2E_CONFIG.users.basic.aa.username,
            password: 'wrong',
          })
          .expect(401);

        expect(response.body.accessToken).not.toBeDefined();
      });

      test('Fails to authenticate a non-existing user', async () => {
        const response = await request(testApplication.getHttpServer())
          .post('/auth/sign-in')
          .send({ email: 'test@example.com', password: 'wrong' })
          .expect(401);

        expect(response.body.accessToken).not.toBeDefined();
      });
    });

    describe('Account Validations', () => {
      let newUser: User | null;
      let validationTokenEvent: ApiEventByTopicAndKind | undefined;

      test('A user should be able to validate their account (within the validity timeframe of the validationToken)', async () => {
        /**
         * Here we need to dig into the actual database to retrieve both the id
         * assigned to the user when their account is created, and the one-time
         * token that they would normally receive via email as part of the account
         * validation/email confirmation workflow.
         */
        newUser = await userRepository.findByEmail(
          E2E_CONFIG.users.signUp.email,
        );
        expect(newUser).toBeDefined();

        if (newUser === null) {
          throw new Error('Cannot retrieve data for newly created user.');
        }

        validationTokenEvent = await apiEventsService.getLatestEventForTopic({
          topic: newUser.id,
          kind: API_EVENT_KINDS.user__accountActivationTokenGenerated__v1alpha1,
        });

        await request(testApplication.getHttpServer())
          .get(
            `/auth/validate-account/${newUser.id}/${validationTokenEvent?.data?.validationToken}`,
          )
          .expect(HttpStatus.OK);
      });

      test('A user account validation token should not be allowed to be spent more than once', async () => {
        if (!newUser) {
          throw new Error('Cannot retrieve data for newly created user.');
        }

        await request(testApplication.getHttpServer())
          .get(
            `/auth/validate-account/${newUser.id}/${validationTokenEvent?.data?.validationToken}`,
          )
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('Sign-in and sign-up with the same email, after account was deleted', () => {
      let jwtToken: string;
      let newUser: User | null;
      let validationTokenEvent: ApiEventByTopicAndKind | undefined;

      beforeAll(async () => {
        jwtToken = await request(testApplication.getHttpServer())
          .post('/auth/sign-in')
          .send({
            username: E2E_CONFIG.users.signUp.email,
            password: E2E_CONFIG.users.signUp.password,
          })
          .expect(HttpStatus.CREATED)
          .then((response: Response) => response.body.accessToken);

        await request(testApplication.getHttpServer())
          .delete('/api/v1/users/me')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(HttpStatus.OK);
      });

      test('Once a user account is marked as deleted, the user should be logged out', async () => {
        await request(testApplication.getHttpServer())
          .get('/api/v1/users/me')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(HttpStatus.UNAUTHORIZED);
      });

      test('Once a user account is marked as deleted, the user should not be able to log back in', async () => {
        await request(testApplication.getHttpServer())
          .post('/auth/sign-in')
          .send({
            username: E2E_CONFIG.users.signUp.email,
            password: E2E_CONFIG.users.signUp.password,
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      test('A user should be able to sign up using the same email address as that of an account that has been deleted', async () => {
        await request(testApplication.getHttpServer())
          .post('/auth/sign-up')
          .send({
            email: E2E_CONFIG.users.signUp.email,
            password: E2E_CONFIG.users.signUp.password,
          })
          .expect(HttpStatus.CREATED);
      });

      test('A user should be able to validate their account (within the validity timeframe of the validationToken)', async () => {
        /**
         * Here we need to dig into the actual database to retrieve both the id
         * assigned to the user when their account is created, and the one-time
         * token that they would normally receive via email as part of the account
         * validation/email confirmation workflow.
         */
        newUser = await userRepository.findByEmail(
          E2E_CONFIG.users.signUp.email,
        );
        expect(newUser).toBeDefined();

        if (newUser === null) {
          throw new Error('Cannot retrieve data for newly created user.');
        }

        validationTokenEvent = await apiEventsService.getLatestEventForTopic({
          topic: newUser.id,
          kind: API_EVENT_KINDS.user__accountActivationTokenGenerated__v1alpha1,
        });

        await request(testApplication.getHttpServer())
          .get(
            `/auth/validate-account/${newUser.id}/${validationTokenEvent?.data?.validationToken}`,
          )
          .expect(HttpStatus.OK);
      });

      test('A user should be able to log in once their account has been validated', async () => {
        await request(testApplication.getHttpServer())
          .post('/auth/sign-in')
          .send({
            username: E2E_CONFIG.users.signUp.email,
            password: E2E_CONFIG.users.signUp.password,
          })
          .expect(HttpStatus.CREATED);
      });
    });

    afterAll(async () => {
      return userRepository.delete({});
    });
  });
});
