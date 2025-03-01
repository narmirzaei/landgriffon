import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { Scenario, SCENARIO_STATUS } from 'modules/scenarios/scenario.entity';
import { ScenarioRepository } from 'modules/scenarios/scenario.repository';
import {
  createAdminRegion,
  createBusinessUnit,
  createMaterial,
  createScenario,
  createScenarioIntervention,
  createSourcingLocation,
  createSourcingRecord,
} from '../../entity-mocks';
import { setupTestUser } from '../../utils/userAuth';
import ApplicationManager, {
  TestApplication,
} from '../../utils/application-manager';
import { ScenarioInterventionRepository } from 'modules/scenario-interventions/scenario-intervention.repository';
import { SourcingLocationRepository } from 'modules/sourcing-locations/sourcing-location.repository';
import { SourcingRecordRepository } from 'modules/sourcing-records/sourcing-record.repository';
import {
  SCENARIO_INTERVENTION_STATUS,
  ScenarioIntervention,
} from 'modules/scenario-interventions/scenario-intervention.entity';
import {
  SOURCING_LOCATION_TYPE_BY_INTERVENTION,
  SourcingLocation,
} from 'modules/sourcing-locations/sourcing-location.entity';
import { SourcingRecord } from 'modules/sourcing-records/sourcing-record.entity';
import { JSONAPIEntityData } from 'utils/app-base.service';
import { clearTestDataFromDatabase } from '../../utils/database-test-helper';
import { DataSource } from 'typeorm';
import { ROLES } from '../../../src/modules/authorization/roles/roles.enum';

const expectedJSONAPIAttributes: string[] = [
  'title',
  'description',
  'status',
  'metadata',
  'createdAt',
  'updatedAt',
  'isPublic',
];

describe('ScenariosModule (e2e)', () => {
  let testApplication: TestApplication;
  let dataSource: DataSource;
  let scenarioRepository: ScenarioRepository;
  let scenarioInterventionRepository: ScenarioInterventionRepository;
  let sourcingLocationRepository: SourcingLocationRepository;
  let sourcingRecordRepository: SourcingRecordRepository;
  let adminToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    testApplication = await ApplicationManager.init();

    dataSource = testApplication.get<DataSource>(DataSource);

    scenarioRepository =
      testApplication.get<ScenarioRepository>(ScenarioRepository);
    scenarioInterventionRepository =
      testApplication.get<ScenarioInterventionRepository>(
        ScenarioInterventionRepository,
      );
    sourcingLocationRepository =
      testApplication.get<SourcingLocationRepository>(
        SourcingLocationRepository,
      );
    sourcingRecordRepository = testApplication.get<SourcingRecordRepository>(
      SourcingRecordRepository,
    );

    const tokenWithId = await setupTestUser(testApplication);
    adminToken = tokenWithId.jwtToken;
    adminUserId = tokenWithId.user.id;
  });

  afterEach(async () => {
    await scenarioRepository.delete({});
    await sourcingRecordRepository.delete({});
    await scenarioInterventionRepository.delete({});
  });

  afterAll(async () => {
    await clearTestDataFromDatabase(dataSource);
    await testApplication.close();
  });

  describe('Scenarios - Create', () => {
    test('Create a scenario should be successful (happy case)', async () => {
      const response = await request(testApplication.getHttpServer())
        .post('/api/v1/scenarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'test scenario',
        })
        .expect(HttpStatus.CREATED);

      const createdScenario: Scenario | null = await scenarioRepository.findOne(
        {
          where: { id: response.body.data.id },
        },
      );

      if (createdScenario === null) {
        throw new Error('Error loading created Scenario');
      }

      expect(createdScenario.title).toEqual('test scenario');
      expect(createdScenario.userId).toEqual(adminUserId);

      expect(response).toHaveJSONAPIAttributes(expectedJSONAPIAttributes);
    });

    test('Create a scenario without the required fields should fail with a 400 error', async () => {
      const response = await request(testApplication.getHttpServer())
        .post('/api/v1/scenarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send()
        .expect(HttpStatus.BAD_REQUEST);

      expect(response).toHaveErrorMessage(
        HttpStatus.BAD_REQUEST,
        'Bad Request Exception',
        [
          'title should not be empty',
          'title must be shorter than or equal to 40 characters',
          'title must be longer than or equal to 2 characters',
          'title must be a string',
        ],
      );
    });
    test('When I create a scenario And I dont specify if its published or not Then it should be private by default', async () => {
      const response = await request(testApplication.getHttpServer())
        .post('/api/v1/scenarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'test scenario',
        })
        .expect(HttpStatus.CREATED);

      const createdScenario: Scenario = await scenarioRepository.findOneOrFail({
        where: { id: response.body.data.id },
      });

      expect(createdScenario?.isPublic).toBe(false);
    });
  });

  describe('Scenarios - Update', () => {
    test('Update a scenario should be successful (happy case)', async () => {
      const scenario: Scenario = await createScenario();

      const response = await request(testApplication.getHttpServer())
        .patch(`/api/v1/scenarios/${scenario.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'updated test scenario',
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.attributes.title).toEqual(
        'updated test scenario',
      );
      const updatedScenario: Scenario = await scenarioRepository.findOneOrFail({
        where: { id: scenario.id },
      });
      expect(updatedScenario.updatedById).toEqual(adminUserId);

      expect(response).toHaveJSONAPIAttributes(expectedJSONAPIAttributes);
    });

    test('When I want to publish a Scenario, But I dont use a correct value to do so, Then I should get a proper error message', async () => {
      const scenario: Scenario = await createScenario();

      const response = await request(testApplication.getHttpServer())
        .patch(`/api/v1/scenarios/${scenario.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'updated test scenario',
          isPublic: 'Make it public please',
        });

      expect(response).toHaveErrorMessage(
        HttpStatus.BAD_REQUEST,
        'Bad Request Exception',
        ['isPublic must be a boolean value'],
      );
    });

    test('When I want to make a scenario public, Then I said scenario should me marked as so', async () => {
      const scenario: Scenario = await createScenario();

      await request(testApplication.getHttpServer())
        .patch(`/api/v1/scenarios/${scenario.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'updated test scenario',
          isPublic: true,
        })
        .expect(HttpStatus.OK);

      const updatedScenario: Scenario = await scenarioRepository.findOneOrFail({
        where: { id: scenario.id },
      });
      expect(updatedScenario.isPublic).toEqual(true);
    });

    test(
      'When I filter Interventions by Scenario Id + ' +
        'Then I should receive said Interventions in the response' +
        'And they should be ordered by creation date in a DESC order',
      async () => {
        const interventions: ScenarioIntervention[] = [];

        const scenario: Scenario = await createScenario();

        for (const n of [1, 2, 3, 4, 5]) {
          const intervention = await createScenarioIntervention({
            scenario,
            title: `inter ${n}`,
          });
          interventions.push(intervention);
        }
        const response = await request(testApplication.getHttpServer())
          .get(`/api/v1/scenarios/${scenario.id}/interventions`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send();

        expect(
          interventions.map((i: ScenarioIntervention) => i.id).reverse(),
        ).toEqual(response.body.data.map((i: ScenarioIntervention) => i.id));
      },
    );
  });

  describe('Scenarios - Delete', () => {
    test('Delete a scenario should be successful (happy case)', async () => {
      const scenario: Scenario = await createScenario();

      await request(testApplication.getHttpServer())
        .delete(`/api/v1/scenarios/${scenario.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send()
        .expect(HttpStatus.OK);

      expect(
        await scenarioRepository.findOne({ where: { id: scenario.id } }),
      ).toBeNull();
    });
  });

  describe('Cascade delete os Scenario', () => {
    test('When Scenario is deleted, related interventions must be deleted as well', async () => {
      const scenario: Scenario = await createScenario();
      const scenarioIntervention: ScenarioIntervention =
        await createScenarioIntervention({ scenario });

      const sourcingLocation: SourcingLocation = await createSourcingLocation({
        scenarioInterventionId: scenarioIntervention.id,
        interventionType: SOURCING_LOCATION_TYPE_BY_INTERVENTION.REPLACING,
      });

      await createSourcingRecord({ sourcingLocationId: sourcingLocation.id });

      const interventions: ScenarioIntervention[] =
        await scenarioInterventionRepository.find();
      const sourcingLocations: SourcingLocation[] =
        await sourcingLocationRepository.find();
      const sourcingRecords: SourcingRecord[] =
        await sourcingRecordRepository.find();

      expect(interventions.length).toBe(1);
      expect(sourcingLocations.length).toBe(1);
      expect(sourcingRecords.length).toBe(1);

      await scenarioRepository.delete(scenario.id);

      const interventionsAfterDelete: ScenarioIntervention[] =
        await scenarioInterventionRepository.find();
      const sourcingLocationsAfterDelete: SourcingLocation[] =
        await sourcingLocationRepository.find();
      const sourcingRecordsAfterDelete: SourcingRecord[] =
        await sourcingRecordRepository.find();

      expect(interventionsAfterDelete.length).toBe(0);
      expect(sourcingLocationsAfterDelete.length).toBe(0);
      expect(sourcingRecordsAfterDelete.length).toBe(0);
    });
  });

  describe('Scenarios - Get all', () => {
    test('Get all scenarios should be successful (happy case)', async () => {
      const scenario: Scenario = await createScenario();

      const response = await request(testApplication.getHttpServer())
        .get(`/api/v1/scenarios`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send()
        .expect(HttpStatus.OK);

      expect(response.body.data[0].id).toEqual(scenario.id);

      expect(response).toHaveJSONAPIAttributes(expectedJSONAPIAttributes);
    });

    test('When I filter scenarios by hasActiveInterventions, I should only get scenarios with at least one active intervention', async () => {
      const scenarioOne: Scenario = await createScenario({
        title: 'scenario one',
        status: SCENARIO_STATUS.ACTIVE,
        description: 'ignored',
      });
      await createScenarioIntervention({
        scenario: scenarioOne,
        title: 'intervention 1-1',
        status: SCENARIO_INTERVENTION_STATUS.INACTIVE,
      });

      const scenarioTwo: Scenario = await createScenario({
        title: 'scenario two',
        status: SCENARIO_STATUS.ACTIVE,
        description: 'ignored 2',
      });

      await createScenarioIntervention({
        scenario: scenarioTwo,
        title: 'intervention 2-1',
        status: SCENARIO_INTERVENTION_STATUS.INACTIVE,
      });

      await createScenarioIntervention({
        scenario: scenarioTwo,
        title: 'intervention 2-2',
        status: SCENARIO_INTERVENTION_STATUS.INACTIVE,
      });

      const scenarioThree: Scenario = await createScenario({
        title: 'scenario three',
        status: SCENARIO_STATUS.ACTIVE,
        description: 'selected',
      });
      await createScenarioIntervention({
        scenario: scenarioThree,
        title: 'intervention 2-1',
        status: SCENARIO_INTERVENTION_STATUS.ACTIVE,
      });
      await createScenarioIntervention({
        scenario: scenarioThree,
        title: 'intervention 2-2',
        status: SCENARIO_INTERVENTION_STATUS.ACTIVE,
      });

      const scenarioFour: Scenario = await createScenario({
        title: 'scenario four',
        status: SCENARIO_STATUS.ACTIVE,
        description: 'selected 2',
      });

      await createScenarioIntervention({
        scenario: scenarioFour,
        title: 'intervention 4-1',
        status: SCENARIO_INTERVENTION_STATUS.ACTIVE,
      });
      await createScenarioIntervention({
        scenario: scenarioFour,
        title: 'intervention 4-2',
        status: SCENARIO_INTERVENTION_STATUS.INACTIVE,
      });

      const response = await request(testApplication.getHttpServer())
        .get(`/api/v1/scenarios`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          hasActiveInterventions: true,
        })
        .send()
        .expect(HttpStatus.OK);

      expect(response.body.data.length).toEqual(2);
      expect(
        response.body.data.some(
          (scenario: JSONAPIEntityData) =>
            scenario.attributes.title === scenarioThree.title,
        ),
      ).toBeTruthy();
      expect(
        response.body.data.some(
          (scenario: JSONAPIEntityData) =>
            scenario.attributes.title === scenarioFour.title,
        ),
      ).toBeTruthy();

      expect(
        response.body.data.some(
          (scenario: JSONAPIEntityData) =>
            scenario.attributes.title === scenarioOne.title,
        ),
      ).toBeFalsy();
      expect(
        response.body.data.some(
          (scenario: JSONAPIEntityData) =>
            scenario.attributes.title === scenarioTwo.title,
        ),
      ).toBeFalsy();

      expect(response).toHaveJSONAPIAttributes(expectedJSONAPIAttributes);
    });

    test('When I search for scenarios via title partial matching, I get correct results', async () => {
      //ARRANGE
      const scenarioOne: Scenario = await createScenario({
        title: 'Scenario Jedi Training',
        status: SCENARIO_STATUS.ACTIVE,
      });
      const scenarioTwo: Scenario = await createScenario({
        title: 'Scenario Jedi Deployment',
        status: SCENARIO_STATUS.ACTIVE,
      });

      await createScenario({
        title: 'Scenario Order 66',
        status: SCENARIO_STATUS.ACTIVE,
      });

      //ACT
      const response = await request(testApplication.getHttpServer())
        .get(`/api/v1/scenarios`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          search: {
            title: 'JEDI',
          },
        })
        .send()
        .expect(HttpStatus.OK);

      //ASSERT
      expect(response.body.data.length).toEqual(2);
      expect(response.body.data[0].attributes.title).toEqual(scenarioOne.title);
      expect(response.body.data[1].attributes.title).toEqual(scenarioTwo.title);

      expect(response).toHaveJSONAPIAttributes(expectedJSONAPIAttributes);
    });

    test('Get scenarios filtered by some criteria should only return the scenarios that match said criteria', async () => {
      const scenarioOne: Scenario = await createScenario({
        title: 'scenario one',
        status: SCENARIO_STATUS.ACTIVE,
      });
      const scenarioTwo: Scenario = await createScenario({
        title: 'scenario two',
        status: SCENARIO_STATUS.ACTIVE,
      });
      await createScenario({
        title: 'scenario three',
        status: SCENARIO_STATUS.DELETED,
      });

      const response = await request(testApplication.getHttpServer())
        .get(`/api/v1/scenarios`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          filter: {
            status: SCENARIO_STATUS.ACTIVE,
          },
        })
        .send()
        .expect(HttpStatus.OK);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((e: any) => e.id)).toEqual([
        scenarioOne.id,
        scenarioTwo.id,
      ]);

      expect(response).toHaveJSONAPIAttributes(expectedJSONAPIAttributes);
    });

    test('Get scenarios in pages should return a partial list of scenarios', async () => {
      await Promise.all(
        Array.from(Array(10).keys()).map(() => createScenario()),
      );

      const responseOne = await request(testApplication.getHttpServer())
        .get(`/api/v1/scenarios`)
        .set('Authorization', `Bearer ${adminToken}`)
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
        .get(`/api/v1/scenarios`)
        .set('Authorization', `Bearer ${adminToken}`)
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
  });

  describe('Scenarios - Get by id', () => {
    test('Get a scenario by id should be successful (happy case)', async () => {
      const scenario: Scenario = await createScenario();

      const response = await request(testApplication.getHttpServer())
        .get(`/api/v1/scenarios/${scenario.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send()
        .expect(HttpStatus.OK);

      expect(response.body.data.id).toEqual(scenario.id);

      expect(response).toHaveJSONAPIAttributes(expectedJSONAPIAttributes);
    });
    test(
      'When I filter Interventions by Scenario Id + ' +
        'Then I should receive said Interventions in the response' +
        'And they should include the replaced entity information',
      async () => {
        const replacedMaterial = await createMaterial({
          name: ' replaced material',
        });

        const replacedBusinessUnit = await createBusinessUnit({
          name: ' replaced business unit',
        });

        const replacedAdminRegion = await createAdminRegion({
          name: ' replaced admin region',
        });

        const newMaterial = await createMaterial({
          name: ' new material',
        });

        const newBusinessUnit = await createBusinessUnit({
          name: ' new business unit',
        });

        const newAdminRegion = await createAdminRegion({
          name: ' new admin region',
        });

        const scenarioIntervention = await createScenarioIntervention({
          replacedMaterials: [replacedMaterial],
          replacedBusinessUnits: [replacedBusinessUnit],
          replacedAdminRegions: [replacedAdminRegion],
          newMaterial,
          newBusinessUnit,
          newAdminRegion,
          startYear: 2020,
        });

        const scenario = await createScenario({
          scenarioInterventions: [scenarioIntervention],
        });

        const response = await request(testApplication.getHttpServer())
          .get(`/api/v1/scenarios/${scenario.id}/interventions`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send();

        expect(
          response.body.data[0].attributes.replacedMaterials[0].id,
        ).toEqual(replacedMaterial.id);
        expect(
          response.body.data[0].attributes.replacedAdminRegions[0].id,
        ).toEqual(replacedAdminRegion.id);
        expect(
          response.body.data[0].attributes.replacedBusinessUnits[0].id,
        ).toEqual(replacedBusinessUnit.id);
        expect(response.body.data[0].attributes.newMaterial.id).toEqual(
          newMaterial.id,
        );
        expect(response.body.data[0].attributes.newBusinessUnit.id).toEqual(
          newBusinessUnit.id,
        );
        expect(response.body.data[0].attributes.newAdminRegion.id).toEqual(
          newAdminRegion.id,
        );
        expect(response.body.data[0].attributes.startYear).toEqual(2020);
      },
    );
  });

  describe('Role based', () => {
    test('When I request scenarios using my token, Then I should receive only my scenarios, And I should receive all scenarios for the admin token', async () => {
      const user1 = await setupTestUser(testApplication, ROLES.USER, {
        email: 'user1@email.com',
      });

      const user2 = await setupTestUser(testApplication, ROLES.USER, {
        email: 'user2@email.com',
      });

      await createScenario({
        id: adminUserId,
        userId: adminUserId,
        title: adminUserId,
      });

      await createScenario({
        id: user1.user.id,
        userId: user1.user.id,
        title: user1.user.id,
      });
      await createScenario({
        id: user2.user.id,
        userId: user2.user.id,
        title: user2.user.id,
      });
      const requests = [];

      for (const token of [adminToken, user1.jwtToken, user2.jwtToken]) {
        requests.push(
          request(testApplication.getHttpServer())
            .get(`/api/v1/scenarios`)
            .set('Authorization', `Bearer ${token}`)
            .send(),
        );
      }
      const response: any = await Promise.all(requests);

      const adminRequest = response.find((res: any) =>
        res.request.header.Authorization.includes(adminToken),
      );
      expect(adminRequest.body.data).toHaveLength(3);

      const user1Request = response.find((res: any) =>
        res.request.header.Authorization.includes(user1.jwtToken),
      );
      expect(user1Request.body.data).toHaveLength(1);
      expect(user1Request.body.data[0].id).toEqual(user1.user.id);

      const user2Request = response.find((res: any) =>
        res.request.header.Authorization.includes(user2.jwtToken),
      );
      expect(user2Request.body.data).toHaveLength(1);
      expect(user2Request.body.data[0].id).toEqual(user2.user.id);
    });
    test('When I request scenarios as a normal user, Then I should get the ones that are mine and the ones that are public', async () => {
      const user1 = await setupTestUser(testApplication, ROLES.USER, {
        email: 'testuser1@email.com',
      });
      const user2 = await setupTestUser(testApplication, ROLES.USER, {
        email: 'testuser2@email.com',
      });

      await createScenario({
        userId: user1.user.id,
        title: 'user private scenario',
      });

      await createScenario({
        userId: user1.user.id,
        title: 'user public scenario',
        isPublic: true,
      });
      const user2PrivateScenario = await createScenario({
        userId: user2.user.id,
        title: 'private scenario',
      });

      await createScenario({
        userId: user2.user.id,
        title: 'public scenario 1',
        isPublic: true,
      });
      await createScenario({
        userId: user2.user.id,
        title: 'public scenario 2',
        isPublic: true,
      });

      const response = await request(testApplication.getHttpServer())
        .get(`/api/v1/scenarios`)
        .set('Authorization', `Bearer ${user1.jwtToken}`)
        .send();

      const scenarios = response.body.data.map(
        (scenario: JSONAPIEntityData) => ({
          id: scenario.id,
          ...scenario.attributes,
        }),
      );

      expect(scenarios).toHaveLength(4);
      expect(
        scenarios.find(
          (scenario: Scenario) => scenario.title === user2PrivateScenario.title,
        ),
      ).toBe(undefined);
    });
    test('Given I am a user, When I want to GET/PATCH/DELETE a Scenario, But its not mine, Then I should get an error', async () => {
      const { user } = await setupTestUser(testApplication, ROLES.USER, {
        email: 'scenariouser@email.com',
      });
      const scenario = await createScenario({ user });
      const requestingUser = await setupTestUser(testApplication, ROLES.USER, {
        email: 'requestinguser@email.com',
      });

      await request(testApplication.getHttpServer())
        .get(`/api/v1/scenarios/${scenario.id}`)
        .set('Authorization', `Bearer ${requestingUser.jwtToken}`)
        .send()
        .expect(HttpStatus.FORBIDDEN);

      await request(testApplication.getHttpServer())
        .patch(`/api/v1/scenarios/${scenario.id}`)
        .set('Authorization', `Bearer ${requestingUser.jwtToken}`)
        .send({ title: 'another name' })
        .expect(HttpStatus.FORBIDDEN);

      await request(testApplication.getHttpServer())
        .delete(`/api/v1/scenarios/${scenario.id}`)
        .set('Authorization', `Bearer ${requestingUser.jwtToken}`)
        .send()
        .expect(HttpStatus.FORBIDDEN);
    });

    test('Given I am a user, When I want to GET other users Scenario, And its public, Then I should be allowed', async () => {
      const { user } = await setupTestUser(testApplication, ROLES.USER, {
        email: 'publicscenariouser@email.com',
      });
      const scenario = await createScenario({ user, isPublic: true });
      const requestingUser = await setupTestUser(testApplication, ROLES.USER, {
        email: 'requestinpublicscenariouser@email.com',
      });

      await request(testApplication.getHttpServer())
        .get(`/api/v1/scenarios/${scenario.id}`)
        .set('Authorization', `Bearer ${requestingUser.jwtToken}`)
        .send()
        .expect(HttpStatus.OK);
    });
  });
  test('Given I am a user, When I want to GET/PATCH/DELETE a Scenario, And its mine, Then I should be allowed', async () => {
    const myUser = await setupTestUser(testApplication, ROLES.USER, {
      email: 'myUser@email.com',
    });
    const scenario = await createScenario({
      user: myUser.user,
      title: 'Best scenario',
    });

    await request(testApplication.getHttpServer())
      .get(`/api/v1/scenarios/${scenario.id}`)
      .set('Authorization', `Bearer ${myUser.jwtToken}`)
      .send()
      .expect(HttpStatus.OK);

    await request(testApplication.getHttpServer())
      .patch(`/api/v1/scenarios/${scenario.id}`)
      .set('Authorization', `Bearer ${myUser.jwtToken}`)
      .send({ title: 'another name' })
      .expect(HttpStatus.OK);

    await request(testApplication.getHttpServer())
      .delete(`/api/v1/scenarios/${scenario.id}`)
      .set('Authorization', `Bearer ${myUser.jwtToken}`)
      .send()
      .expect(HttpStatus.OK);
  });

  test('Given I am a Admin, When I want to GET/PATCH/DELETE a Scenario, And its not mine, Then I should be allowed', async () => {
    const scenario = await createScenario({
      userId: adminUserId,
      title: 'Admin scenario',
    });

    await request(testApplication.getHttpServer())
      .get(`/api/v1/scenarios/${scenario.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send()
      .expect(HttpStatus.OK);

    await request(testApplication.getHttpServer())
      .patch(`/api/v1/scenarios/${scenario.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'another name' })
      .expect(HttpStatus.OK);

    await request(testApplication.getHttpServer())
      .delete(`/api/v1/scenarios/${scenario.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send()
      .expect(HttpStatus.OK);
  });
});
