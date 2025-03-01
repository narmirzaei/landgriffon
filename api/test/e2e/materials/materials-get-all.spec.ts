import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { Material, MATERIALS_STATUS } from 'modules/materials/material.entity';
import { MaterialRepository } from 'modules/materials/material.repository';
import { createMaterial } from '../../entity-mocks';
import { expectedJSONAPIAttributes } from './config';
import { setupTestUser } from '../../utils/userAuth';
import ApplicationManager, {
  TestApplication,
} from '../../utils/application-manager';
import { clearTestDataFromDatabase } from '../../utils/database-test-helper';
import { DataSource } from 'typeorm';

describe('Materials - Get all', () => {
  let testApplication: TestApplication;
  let dataSource: DataSource;
  let materialRepository: MaterialRepository;
  let jwtToken: string;

  beforeAll(async () => {
    testApplication = await ApplicationManager.init();

    dataSource = testApplication.get<DataSource>(DataSource);

    materialRepository =
      testApplication.get<MaterialRepository>(MaterialRepository);

    ({ jwtToken } = await setupTestUser(testApplication));
  });

  afterEach(async () => {
    await materialRepository.delete({});
  });

  afterAll(async () => {
    await clearTestDataFromDatabase(dataSource);
    await testApplication.close();
  });

  test('Get all materials should be successful (happy case)', async () => {
    const material: Material = await createMaterial();

    const response = await request(testApplication.getHttpServer())
      .get(`/api/v1/materials`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send()
      .expect(HttpStatus.OK);

    expect(response.body.data[0].id).toEqual(material.id);
    expect(response).toHaveJSONAPIAttributes(expectedJSONAPIAttributes);
  });

  test('Get materials filtered by some criteria should only return the materials that match said criteria', async () => {
    const materialOne: Material = await createMaterial({
      name: 'material one',
      status: MATERIALS_STATUS.ACTIVE,
    });
    const materialTwo: Material = await createMaterial({
      name: 'material two',
      status: MATERIALS_STATUS.ACTIVE,
    });
    await createMaterial({
      name: 'material three',
      status: MATERIALS_STATUS.DELETED,
    });

    const response = await request(testApplication.getHttpServer())
      .get(`/api/v1/materials`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .query({
        filter: {
          status: MATERIALS_STATUS.ACTIVE,
        },
      })
      .send()
      .expect(HttpStatus.OK);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.map((e: any) => e.id)).toEqual([
      materialOne.id,
      materialTwo.id,
    ]);

    expect(response).toHaveJSONAPIAttributes(expectedJSONAPIAttributes);
  });

  test('Get materials in pages should return a partial list of materials', async () => {
    await Promise.all(Array.from(Array(10).keys()).map(() => createMaterial()));

    const responseOne = await request(testApplication.getHttpServer())
      .get(`/api/v1/materials`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .query({
        page: {
          size: 3,
        },
      })
      .send()
      .expect(HttpStatus.OK);

    expect(responseOne.body.data).toHaveLength(3);
    expect(responseOne).toHaveJSONAPIAttributes(expectedJSONAPIAttributes);

    const responseTwo = await request(testApplication.getHttpServer())
      .get(`/api/v1/materials`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .query({
        page: {
          size: 3,
          number: 4,
        },
      })
      .send()
      .expect(HttpStatus.OK);

    expect(responseTwo.body.data).toHaveLength(1);
    expect(responseTwo).toHaveJSONAPIAttributes(expectedJSONAPIAttributes);
  });

  test('Get materials and include children should return a list of materials and their nested children', async () => {
    const rootMaterial: Material = await createMaterial();
    const childOneMaterial: Material = await createMaterial({
      parent: rootMaterial,
    });
    const childTwoMaterial: Material = await createMaterial({
      parent: rootMaterial,
    });

    const response = await request(testApplication.getHttpServer())
      .get(`/api/v1/materials`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .query({
        include: 'children',
      })
      .send()
      .expect(HttpStatus.OK);

    expect(response.body.data).toHaveLength(3);
    expect(
      response.body.data.map((elem: Record<string, any>) => elem.id).sort(),
    ).toEqual(
      [rootMaterial.id, childTwoMaterial.id, childOneMaterial.id].sort(),
    );
    expect(response).toHaveJSONAPIAttributes([
      ...expectedJSONAPIAttributes,
      'children',
    ]);

    const rootMaterialFromResponse: Record<string, any> =
      response.body.data.find(
        (elem: Record<string, any>) => elem.id === rootMaterial.id,
      );

    expect(rootMaterialFromResponse.attributes.children).toHaveLength(2);
    expect(
      rootMaterialFromResponse.attributes.children
        .map((elem: Record<string, any>) => elem.id)
        .sort(),
    ).toEqual([childTwoMaterial.id, childOneMaterial.id].sort());
  });
});
