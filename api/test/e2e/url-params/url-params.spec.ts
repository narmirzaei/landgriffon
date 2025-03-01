import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { setupTestUser } from '../../utils/userAuth';
import ApplicationManager, {
  TestApplication,
} from '../../utils/application-manager';
import { UrlParamRepository } from 'modules/url-params/url-param.repository';
import { clearTestDataFromDatabase } from '../../utils/database-test-helper';
import { DataSource } from 'typeorm';

/**
 * Tests for the BusinessUnitsModule.
 */

describe('UrlParamsModule (e2e)', () => {
  let testApplication: TestApplication;
  let dataSource: DataSource;
  let urlParamRepository: UrlParamRepository;
  let jwtToken: string;

  beforeAll(async () => {
    testApplication = await ApplicationManager.init();

    dataSource = testApplication.get<DataSource>(DataSource);

    urlParamRepository =
      testApplication.get<UrlParamRepository>(UrlParamRepository);

    ({ jwtToken } = await setupTestUser(testApplication));
  });

  afterEach(async () => {
    await urlParamRepository.delete({});
  });

  afterAll(async () => {
    await clearTestDataFromDatabase(dataSource);
    await testApplication.close();
  });

  describe('Url Params - Create', () => {
    test('When I send POST request with url params in json format, Then those params should be saved in the database and uuid should be returned', async () => {
      const response = await request(testApplication.getHttpServer())
        .post('/api/v1/url-params')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          param: 'test param',
        })
        .expect(HttpStatus.CREATED);

      const savedParam = await urlParamRepository.findOne({
        where: { id: response.body.data.id },
      });

      if (!savedParam) {
        throw new Error('Error loading saved URL Param');
      }

      expect(savedParam.id).toEqual(response.body.data.id);
    });

    test('Given url params in json format have been previously saved in the database, When I try to save same params again, Then the uuid of initially saved params should be returned', async () => {
      const testPayload: Record<string, any> = {
        param1: 'test param 1',
        param2: 4,
        'param-3': 'Test param 4',
        param4: ['test1', 'test2'],
      };
      const initialResponse = await request(testApplication.getHttpServer())
        .post('/api/v1/url-params')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(testPayload)
        .expect(HttpStatus.CREATED);

      const secondResponse = await request(testApplication.getHttpServer())
        .post('/api/v1/url-params')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(testPayload)
        .expect(HttpStatus.CREATED);

      expect(secondResponse.body.data.id).toEqual(initialResponse.body.data.id);
    });
  });

  describe('Url Params - Get by id', () => {
    test('Given url params in json format have been previously saved in the database, when I request them by the id, Then those params in json format should be returned', async () => {
      const saveResponse = await request(testApplication.getHttpServer())
        .post('/api/v1/url-params')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          'save-param': 'test param 2',
        })
        .expect(HttpStatus.CREATED);

      const findResponse = await request(testApplication.getHttpServer())
        .get(`/api/v1/url-params/${saveResponse.body.data.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send();

      expect(findResponse.body.data.attributes.params).toEqual({
        'save-param': 'test param 2',
      });
    });
  });

  describe('Url Params - Delete', () => {
    test('Given url params in json format have been previously saved in the database, when I request to delete them by the id, Then those params should be removed from database', async () => {
      const saveResponse = await request(testApplication.getHttpServer())
        .post('/api/v1/url-params')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          'save-param': 'test param 2',
        })
        .expect(HttpStatus.CREATED);

      await request(testApplication.getHttpServer())
        .delete(`/api/v1/url-params/${saveResponse.body.data.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send()
        .expect(HttpStatus.OK);

      expect(
        await urlParamRepository.findOne({
          where: { id: saveResponse.body.data.id },
        }),
      ).toBeNull();
    });
  });
});
