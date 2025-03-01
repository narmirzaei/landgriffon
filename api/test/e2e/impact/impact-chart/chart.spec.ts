import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import ApplicationManager, {
  TestApplication,
} from '../../../utils/application-manager';
import { setupTestUser } from '../../../utils/userAuth';
import {
  clearEntityTables,
  clearTestDataFromDatabase,
} from '../../../utils/database-test-helper';
import { IndicatorRecord } from 'modules/indicator-records/indicator-record.entity';
import { MaterialToH3 } from 'modules/materials/material-to-h3.entity';
import { H3Data } from 'modules/h3-data/h3-data.entity';
import { Material } from 'modules/materials/material.entity';
import {
  Indicator,
  INDICATOR_TYPES,
} from 'modules/indicators/indicator.entity';
import { Unit } from 'modules/units/unit.entity';
import { BusinessUnit } from 'modules/business-units/business-unit.entity';
import { AdminRegion } from 'modules/admin-regions/admin-region.entity';
import { GeoRegion } from 'modules/geo-regions/geo-region.entity';
import { Supplier } from 'modules/suppliers/supplier.entity';
import { SourcingRecord } from 'modules/sourcing-records/sourcing-record.entity';
import { SourcingLocation } from 'modules/sourcing-locations/sourcing-location.entity';
import { SourcingLocationGroup } from 'modules/sourcing-location-groups/sourcing-location-group.entity';
import {
  ImpactTableDataAggregatedValue,
  ImpactTableDataAggregationInfo,
  ImpactTableDataByIndicator,
  ImpactTableRowsValues,
} from 'modules/impact/dto/response-impact-table.dto';
import {
  createAdminRegion,
  createBusinessUnit,
  createIndicator,
  createIndicatorRecordV2,
  createMaterial,
  createScenario,
  createSourcingLocation,
  createSourcingRecord,
  createSupplier,
  createUnit,
} from '../../../entity-mocks';
import { range } from 'lodash';

import { createNewMaterialInterventionPreconditions } from '../mocks/actual-vs-scenario-preconditions/new-material-intervention.preconditions';
import { Scenario } from 'modules/scenarios/scenario.entity';
import { rankingTableWithScenario } from '../mocks/response-mocks.impact';
import { DataSource } from 'typeorm';

describe('Impact Chart (Ranking) Test Suite (e2e)', () => {
  let testApplication: TestApplication;
  let jwtToken: string;
  let dataSource: DataSource;

  beforeAll(async () => {
    testApplication = await ApplicationManager.init();

    dataSource = testApplication.get<DataSource>(DataSource);

    ({ jwtToken } = await setupTestUser(testApplication));
  });

  afterEach(async () => {
    await clearEntityTables(dataSource, [
      IndicatorRecord,
      MaterialToH3,
      H3Data,
      Material,
      Indicator,
      Unit,
      BusinessUnit,
      AdminRegion,
      GeoRegion,
      Supplier,
      SourcingRecord,
      SourcingLocation,
      SourcingLocationGroup,
    ]);
  });

  afterAll(async () => {
    await clearTestDataFromDatabase(dataSource);
    await testApplication.close();
  });

  test('When I query the API for an Impact Table Ranking with an invalid sort order, a proper validation error should be returned', async () => {
    const invalidResponse = await request(testApplication.getHttpServer())
      .get('/api/v1/impact/ranking')
      .set('Authorization', `Bearer ${jwtToken}`)
      .query({
        'indicatorIds[]': [uuidv4()],
        startYear: 2010,
        endYear: 2012,
        groupBy: 'material',
        maxRankingEntities: 420,
        sort: 'Condescending',
      })
      //ASSERT
      .expect(HttpStatus.BAD_REQUEST);

    //ASSERT
    expect(
      invalidResponse.body.errors[0].meta.rawError.response.message,
    ).toContain(
      `sort property must be either 'ASC' (Ascendant) or 'DES' (Descendent)`,
    );
  });

  test('When I query the API for an Impact Table Ranking with an invalid maxRankingEntities (missing or non positive), a proper validation error should be returned', async () => {
    // ARRANGE / ACT
    const missingResponse = await request(testApplication.getHttpServer())
      .get('/api/v1/impact/ranking')
      .set('Authorization', `Bearer ${jwtToken}`)
      .query({
        'indicatorIds[]': [uuidv4()],
        startYear: 2010,
        groupBy: 'material',
      })
      //ASSERT
      .expect(HttpStatus.BAD_REQUEST);

    const nonPositiveResponse = await request(testApplication.getHttpServer())
      .get('/api/v1/impact/ranking')
      .set('Authorization', `Bearer ${jwtToken}`)
      .query({
        'indicatorIds[]': [uuidv4()],
        startYear: 2010,
        groupBy: 'material',
        maxRankingEntities: 0,
      })
      //ASSERT
      .expect(HttpStatus.BAD_REQUEST);

    //ASSERT
    expect(
      missingResponse.body.errors[0].meta.rawError.response.message,
    ).toContain('maxRankingEntities should not be empty');
    expect(
      nonPositiveResponse.body.errors[0].meta.rawError.response.message,
    ).toContain('maxRankingEntities must be a positive number');
  });

  test('When I query the API for a Impact Table Ranking, then I should see all the data grouped by the requested entity and properly ordered, up to a MAX amount, with the rest being aggregated per year', async () => {
    //////////// ARRANGE
    const adminRegion: AdminRegion = await createAdminRegion({
      name: 'Fake AdminRegion',
    });
    const unit: Unit = await createUnit({ shortName: 'fakeUnit' });
    const indicator: Indicator = await createIndicator({
      name: 'Fake Indicator',
      unit,
      nameCode: INDICATOR_TYPES.DEFORESTATION,
    });

    const indicator2: Indicator = await createIndicator({
      name: 'Fake Indicator 2',
      unit,
      nameCode: INDICATOR_TYPES.CARBON_EMISSIONS,
    });

    const businessUnit: BusinessUnit = await createBusinessUnit({
      name: 'Fake Business Unit',
    });

    const supplier: Supplier = await createSupplier({
      name: 'Fake Supplier',
    });
    const supplierDescendant: Supplier = await createSupplier({
      name: 'Fake Supplier Descendant',
      parent: supplier,
    });

    // Create a small tree of Materials and their childs
    const numberOfTopMaterials = 4;
    const materialParents = await Promise.all(
      range(numberOfTopMaterials).map(
        async (index: number) =>
          await createMaterial({ name: `Fake Material ${index}` }),
      ),
    );
    for (const materialParent of materialParents) {
      materialParent.children = await Promise.all(
        range(2).map(
          async (index: number) =>
            await createMaterial({
              name: `${materialParent.name} - Child ${index}`,
              parent: materialParent,
            }),
        ),
      );
    }

    //Helper function to create sourcing location and related entities (indicator and sourcing records)
    //with behaviour specific to this test
    const buildSourcingLocation = async (
      material: Material,
      baseImpactValue: number,
      baseImpactValue2: number,
    ): Promise<SourcingLocation> => {
      const sourcingRecords: SourcingRecord[] = await Promise.all(
        range(2010, 2013).map(async (year: number) => {
          const sourcingRecord = await createSourcingRecord({
            year,
            tonnage: 100 + 10 * (year - 2010),
          });

          await createIndicatorRecordV2({
            indicator,
            value: baseImpactValue + 50 * (year - 2010),
            sourcingRecord,
          });

          await createIndicatorRecordV2({
            indicator: indicator2,
            value: baseImpactValue2 + 20 * (year - 2010),
            sourcingRecord,
          });

          return sourcingRecord;
        }),
      );

      return await createSourcingLocation({
        material: material,
        businessUnit,
        t1Supplier: supplierDescendant,
        adminRegion,
        sourcingRecords,
      });
    };

    await buildSourcingLocation(materialParents[0], 100, 90);
    await buildSourcingLocation(materialParents[0].children[0], 30, 80);
    await buildSourcingLocation(materialParents[1].children[0], 100, 45);
    await buildSourcingLocation(materialParents[1].children[1], 70, 90);
    await buildSourcingLocation(materialParents[2].children[0], 1000, 200);
    await buildSourcingLocation(materialParents[3], 40, 500);

    const maxRankingEntities = 2;

    //////////// ACT
    const response = await request(testApplication.getHttpServer())
      .get('/api/v1/impact/ranking')
      .set('Authorization', `Bearer ${jwtToken}`)
      .query({
        'indicatorIds[]': [indicator.id, indicator2.id],
        endYear: 2012,
        startYear: 2010,
        groupBy: 'material',
        maxRankingEntities: maxRankingEntities,
        sort: 'DES',
      })
      .expect(HttpStatus.OK);

    //////////// ASSERT
    // Check aggregation for each indicator
    //Number of aggregated entities should be 2 because it's the top level entities, not counting children
    const impactTableIndicatorData1: ImpactTableDataByIndicator =
      response.body.impactTable.find(
        (element: ImpactTableDataByIndicator) =>
          element.indicatorId === indicator.id,
      );
    const impactTableIndicatorData2: ImpactTableDataByIndicator =
      response.body.impactTable.find(
        (element: ImpactTableDataByIndicator) =>
          element.indicatorId === indicator2.id,
      );
    checkAggregatedInformation(
      impactTableIndicatorData1.others as ImpactTableDataAggregationInfo,
      numberOfTopMaterials - maxRankingEntities,
      [
        {
          value: 170,
          year: 2010,
        },
        {
          value: 320,
          year: 2011,
        },
        {
          value: 470,
          year: 2012,
        },
      ],
      'DES',
    );

    checkAggregatedInformation(
      impactTableIndicatorData2.others as ImpactTableDataAggregationInfo,
      numberOfTopMaterials - maxRankingEntities,
      [
        {
          value: 305,
          year: 2010,
        },
        {
          value: 385,
          year: 2011,
        },
        {
          value: 465,
          year: 2012,
        },
      ],
      'DES',
    );

    // Check that each indicator only has the expected number of maxRankingEntities and sorted appropriately
    expect(impactTableIndicatorData1.rows).toHaveLength(maxRankingEntities);
    expect(impactTableIndicatorData2.rows).toHaveLength(maxRankingEntities);

    //Check order and values of ranked entities  for each indicator
    //Inidicator1
    expect(impactTableIndicatorData1.rows[0].name).toEqual(
      materialParents[2].name,
    );
    expect(impactTableIndicatorData1.rows[1].name).toEqual(
      materialParents[1].name,
    );
    expect(impactTableIndicatorData1.rows[0].values[0]).toEqual({
      year: 2010,
      value: 1000,
      isProjected: false,
    });
    expect(impactTableIndicatorData1.rows[1].values[0]).toEqual({
      year: 2010,
      value: 170,
      isProjected: false,
    });

    //Inidicator2
    expect(impactTableIndicatorData2.rows[0].name).toEqual(
      materialParents[3].name,
    );
    expect(impactTableIndicatorData2.rows[1].name).toEqual(
      materialParents[2].name,
    );
    expect(impactTableIndicatorData2.rows[0].values[0]).toEqual({
      year: 2010,
      value: 500,
      isProjected: false,
    });
    expect(impactTableIndicatorData2.rows[1].values[0]).toEqual({
      year: 2010,
      value: 200,
      isProjected: false,
    });
  });

  test('When I query the API for a Impact Table Ranking, and there is not enough entities to exceed the maxRankingEntities, then the aggregated value and number of entities should be 0', async () => {
    //ARRANGE
    const adminRegion: AdminRegion = await createAdminRegion({
      name: 'Fake AdminRegion',
    });
    const unit: Unit = await createUnit({ shortName: 'fakeUnit' });
    const indicator: Indicator = await createIndicator({
      name: 'Fake Indicator',
      unit,
      nameCode: INDICATOR_TYPES.DEFORESTATION,
    });

    const businessUnit: BusinessUnit = await createBusinessUnit({
      name: 'Fake Business Unit',
    });

    const supplier: Supplier = await createSupplier({
      name: 'Fake Supplier',
    });
    const supplierDescendant: Supplier = await createSupplier({
      name: 'Fake Supplier Descendant',
      parent: supplier,
    });

    const material = await createMaterial({ name: `Fake Material ` });

    const sourcingRecord = await createSourcingRecord({
      year: 2010,
      tonnage: 100,
    });

    await createIndicatorRecordV2({
      indicator,
      value: 50,
      sourcingRecord,
    });

    await createSourcingLocation({
      material: material,
      businessUnit,
      t1Supplier: supplierDescendant,
      adminRegion,
      sourcingRecords: [sourcingRecord],
    });

    const maxRankingEntities = 5;

    //ACT
    const response1 = await request(testApplication.getHttpServer())
      .get('/api/v1/impact/ranking')
      .set('Authorization', `Bearer ${jwtToken}`)
      .query({
        'indicatorIds[]': [indicator.id],
        endYear: 2012,
        startYear: 2010,
        groupBy: 'material',
        maxRankingEntities: maxRankingEntities,
        sort: 'DES',
      })
      .expect(HttpStatus.OK);

    //ASSERT
    // Number of aggregated entities and aggregated value should be 0 because there's not enough entities
    // that result the current data/criteria that go over the maxRankingEntities
    checkAggregatedInformation(
      response1.body.impactTable[0].others,
      0,
      [
        {
          value: 0,
          year: 2010,
        },
        {
          value: 0,
          year: 2011,
        },
        {
          value: 0,
          year: 2012,
        },
      ],
      'DES',
    );

    // Check that each indicator has the expected number of entities
    expect(response1.body.impactTable[0].rows).toHaveLength(1);
  });

  function checkAggregatedInformation(
    others: ImpactTableDataAggregationInfo,
    numberAggregatedEntities: number,
    aggregatedValues: ImpactTableDataAggregatedValue[],
    sort: string,
  ): void {
    expect(others).toBeTruthy();
    expect(others.numberOfAggregatedEntities).toEqual(numberAggregatedEntities);
    expect(others.aggregatedValues).toEqual(aggregatedValues);
    expect(others.sort).toEqual(sort);
  }

  describe('Chart Table including Scenario Tests', () => {
    test(
      'When I query a Impact Chart ' +
        'And I include a Scenario Id ' +
        'Then I should see the elements included in that Scenario among the actual data ' +
        'ignoring INACTIVE interventions. ' +
        'Past years with 0 values should have property isProjected false',
      async () => {
        const newScenario: Scenario = await createScenario({
          title: 'RankWithInactive',
        });

        const { replacedMaterials, replacingMaterials, indicator } =
          await createNewMaterialInterventionPreconditions(newScenario);

        const response = await request(testApplication.getHttpServer())
          .get('/api/v1/impact/ranking')
          .set('Authorization', `Bearer ${jwtToken}`)
          .query({
            'indicatorIds[]': [indicator.id],
            endYear: 2022,
            startYear: 2018,
            groupBy: 'material',
            scenarioId: newScenario.id,
            maxRankingEntities: 5,
          });

        expect(
          response.body.impactTable[0].rows[0].children.some(
            (child: Material) =>
              child.name === replacedMaterials['cotton'].name,
          ),
        ).toBeTruthy();

        expect(
          response.body.impactTable[0].rows[0].children.some(
            (child: Material) => child.name === replacedMaterials['wool'].name,
          ),
        ).toBeTruthy();

        expect(
          response.body.impactTable[0].rows[0].children.some(
            (child: Material) =>
              child.name === replacingMaterials['linen'].name,
          ),
        ).toBeTruthy();

        expect(
          response.body.impactTable[0].rows[0].values.some(
            (value: ImpactTableRowsValues) =>
              value.value === 1650 && !value.isProjected && value.year === 2020,
          ),
        ).toBeTruthy();

        expect(response.body.impactTable[0].rows).toEqual(
          rankingTableWithScenario.impactTable[0].rows,
        );
      },
    );
  });
});
