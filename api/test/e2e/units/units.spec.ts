import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { Unit } from 'modules/units/unit.entity';
import { UnitRepository } from 'modules/units/unit.repository';
import { setupTestUser } from '../../utils/userAuth';
import ApplicationManager, {
  TestApplication,
} from '../../utils/application-manager';
import { clearTestDataFromDatabase } from '../../utils/database-test-helper';
import { DataSource } from 'typeorm';

/**
 * Tests for the UnitsModule.
 */

describe('UnitsModule (e2e)', () => {
  let testApplication: TestApplication;
  let dataSource: DataSource;
  let unitRepository: UnitRepository;
  let jwtToken: string;

  beforeAll(async () => {
    testApplication = await ApplicationManager.init();

    dataSource = testApplication.get<DataSource>(DataSource);

    unitRepository = testApplication.get<UnitRepository>(UnitRepository);

    ({ jwtToken } = await setupTestUser(testApplication));
  });

  afterEach(async () => {
    await unitRepository.delete({});
  });

  afterAll(async () => {
    await clearTestDataFromDatabase(dataSource);
    await testApplication.close();
  });

  describe('Units - Create', () => {
    test('Create a unit should be successful (happy case)', async () => {
      const response = await request(testApplication.getHttpServer())
        .post('/api/v1/units')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          name: 'test unit',
        })
        .expect(HttpStatus.CREATED);

      const createdUnit = await unitRepository.findOne({
        where: { id: response.body.data.id },
      });

      if (!createdUnit) {
        throw new Error('Error loading created Unit');
      }

      expect(createdUnit.name).toEqual('test unit');
    });

    test('Create a unit without the required fields should fail with a 400 error', async () => {
      const response = await request(testApplication.getHttpServer())
        .post('/api/v1/units')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send()
        .expect(HttpStatus.BAD_REQUEST);

      expect(response).toHaveErrorMessage(
        HttpStatus.BAD_REQUEST,
        'Bad Request Exception',
        [
          'name should not be empty',
          'name must be shorter than or equal to 40 characters',
          'name must be longer than or equal to 2 characters',
          'name must be a string',
        ],
      );
    });
  });

  describe('Units - Update', () => {
    test('Update a unit should be successful (happy case)', async () => {
      const unit: Unit = new Unit();
      unit.name = 'test unit';
      await unit.save();

      const response = await request(testApplication.getHttpServer())
        .patch(`/api/v1/units/${unit.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          name: 'Updated test unit',
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.attributes.name).toEqual('Updated test unit');
    });
  });

  describe('Units - Delete', () => {
    test('Delete a unit should be successful (happy case)', async () => {
      const unit: Unit = new Unit();
      unit.name = 'test unit';
      await unit.save();

      await request(testApplication.getHttpServer())
        .delete(`/api/v1/units/${unit.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send()
        .expect(HttpStatus.OK);

      expect(
        await unitRepository.findOne({ where: { id: unit.id } }),
      ).toBeNull();
    });
  });

  describe('Units - Get all', () => {
    test('Get all units should be successful (happy case)', async () => {
      const unit: Unit = new Unit();
      unit.name = 'test unit';
      await unit.save();

      const response = await request(testApplication.getHttpServer())
        .get(`/api/v1/units`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send()
        .expect(HttpStatus.OK);

      expect(response.body.data[0].id).toEqual(unit.id);
    });
  });

  describe('Units - Get by id', () => {
    test('Get a unit by id should be successful (happy case)', async () => {
      const unit: Unit = new Unit();
      unit.name = 'test unit';
      await unit.save();

      const response = await request(testApplication.getHttpServer())
        .get(`/api/v1/units/${unit.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send()
        .expect(HttpStatus.OK);

      expect(response.body.data.id).toEqual(unit.id);
    });
  });
});
