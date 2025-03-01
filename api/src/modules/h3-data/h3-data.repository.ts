import {
  Brackets,
  DataSource,
  Repository,
  SelectQueryBuilder,
  WhereExpressionBuilder,
} from 'typeorm';
import {
  H3Data,
  H3IndexValueData,
  LAYER_TYPES,
} from 'modules/h3-data/h3-data.entity';
import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { INDICATOR_TYPES } from 'modules/indicators/indicator.entity';
import { MATERIAL_TO_H3_TYPE } from 'modules/materials/material-to-h3.entity';
import {
  GetActualVsScenarioImpactMapDto,
  GetImpactMapDto,
  GetScenarioVsScenarioImpactMapDto,
} from 'modules/h3-data/dto/get-impact-map.dto';
import {
  SCENARIO_INTERVENTION_STATUS,
  ScenarioIntervention,
} from 'modules/scenario-interventions/scenario-intervention.entity';
import {
  LOCATION_TYPES,
  SourcingLocation,
} from 'modules/sourcing-locations/sourcing-location.entity';
import { SourcingRecord } from 'modules/sourcing-records/sourcing-record.entity';
import { IndicatorRecord } from 'modules/indicator-records/indicator-record.entity';
import { ImpactMaterializedView } from 'modules/impact/views/impact.materialized-view.entity';

/**
 * @note: Column aliases are marked as 'h' and 'v' so that DB returns data in the format the consumer needs to be
 * So we avoid doing transformations within the API and let the DB handle the heavy job
 */

// TODO: Check this thread for percentile calc: 3612905210000,https://stackoverflow.com/questions/39683330/percentile-calculation-with-a-window-function
@Injectable()
export class H3DataRepository extends Repository<H3Data> {
  constructor(private dataSource: DataSource) {
    super(H3Data, dataSource.createEntityManager());
  }

  logger: Logger = new Logger(H3DataRepository.name);

  static generateRandomTableName(): string {
    return (Math.random() + 1).toString(36).substring(2);
  }

  /** Retrieves data from dynamically generated H3 data
   *
   * @param h3ColumnName: Name of the column inside the dynamically generated table
   * @param h3TableName: Name of the dynamically generated table
   *
   */
  async getH3ByName(
    h3TableName: string,
    h3ColumnName: string,
  ): Promise<H3IndexValueData[]> {
    try {
      const result: H3IndexValueData[] | undefined = await this.dataSource
        .createQueryBuilder()
        .select('h3index', 'h')
        .addSelect(`"${h3ColumnName}"`, 'v')
        .from(`${h3TableName}`, 'h3')
        .getRawMany();

      if (!result) {
        throw new Error();
      }
      return result;
    } catch (err) {
      throw new NotFoundException(
        `H3 ${h3ColumnName} data in ${h3TableName} could not been found`,
      );
    }
  }

  /** Retrieves data from dynamically generated H3 data summing by H3 index for the given resolution
   * if no resolution is given, the h3 index of the max resolution available is served as found
   *
   * @param h3ColumnName: Name of the column inside the dynamically generated table
   * @param h3TableName: Name of the dynamically generated table
   * @param resolution: resolution of the h3 data
   *
   */
  async getSumH3ByNameAndResolution(
    h3TableName: string,
    h3ColumnName: string,
    resolution?: number,
  ): Promise<H3IndexValueData[]> {
    try {
      let selectStatement: string = 'h3index';
      if (resolution) {
        selectStatement = `h3_to_parent(h3index, ${resolution})`;
      }
      const query: SelectQueryBuilder<any> = this.dataSource
        .createQueryBuilder()
        .select(selectStatement, 'h')
        .addSelect(`sum("${h3ColumnName}")`, 'v')
        .from(`${h3TableName}`, 'h3')
        .groupBy('h');

      const result: H3IndexValueData[] | undefined = await query.getRawMany();

      if (result === undefined) {
        throw new Error();
      }
      return result;
    } catch (err) {
      throw new NotFoundException(
        `H3 ${h3ColumnName} data in ${h3TableName} could not been found`,
      );
    }
  }

  /** Retrieves single crop data by a given resolution
   *
   * Resolution validation done at route handler
   *
   * @param yearsRequestParams
   */

  async getAvailableYearsForContextualLayer(yearsRequestParams: {
    layerType: LAYER_TYPES;
    h3DataIds?: string[] | null;
    indicatorId?: string;
  }): Promise<number[]> {
    const queryBuilder: SelectQueryBuilder<H3Data> = this.createQueryBuilder(
      'h3data',
    )
      .select('year')
      .distinct(true)
      .where('year is not null')
      .orderBy('year', 'ASC');

    // If a indicatorId is provided, filter results by it
    if (yearsRequestParams.indicatorId) {
      queryBuilder.where('"indicatorId" = :indicatorId', {
        indicatorId: yearsRequestParams.indicatorId,
      });
    }

    if (
      yearsRequestParams.h3DataIds &&
      yearsRequestParams.h3DataIds.length > 0
    ) {
      queryBuilder.where(`h3data.id  IN (:...h3DataIds)`, {
        h3DataIds: yearsRequestParams.h3DataIds,
      });
    }

    // Filter by data type
    if (yearsRequestParams.layerType !== LAYER_TYPES.RISK) {
      queryBuilder.andWhere(`"indicatorId" is null`);
    } else {
      queryBuilder.andWhere(`"indicatorId" is not null`);
    }
    const availableYears: any[] = await queryBuilder.getRawMany();
    return availableYears.map((elem: { year: number }) => elem.year);
  }

  async getAvailableYearsForH3MaterialData(
    materialId: string,
    materialType: MATERIAL_TO_H3_TYPE,
  ): Promise<number[]> {
    const years: { year: number }[] = await this.createQueryBuilder('h3data')
      .select('year')
      .leftJoin('material_to_h3', 'mth', 'h3data.id = mth.h3DataId')
      .where('mth.materialId = :materialId', { materialId })
      .andWhere('mth.type = :materialType', { materialType })
      .orderBy('year', 'DESC')
      .getRawMany();
    return years.map((elem: { year: number }) => elem.year);
  }

  async getAvailableYearsForH3IndicatorData(
    indicatorId: string,
  ): Promise<number[]> {
    const years: { year: number }[] = await this.createQueryBuilder('h3data')
      .select('year')
      .leftJoin('indicator', 'i', 'h3data.indicatorId = i.id')
      .where('h3data.indicatorId = :indicatorId', { indicatorId })
      .orderBy('year', 'DESC')
      .getRawMany();
    return years.map((elem: { year: number }) => elem.year);
  }

  /**
   * Gets the closest Material H3 by absolute year, p.e. having and h3 for 2005 and 2010, the closest to 2006 will be 2005,
   * and the closest to 2008 will be 2010
   * @param materialId
   * @param year
   * @param type
   */
  async getMaterialH3ByTypeAndClosestYear(
    materialId: string,
    type: MATERIAL_TO_H3_TYPE,
    year: number,
  ): Promise<H3Data | undefined> {
    const queryBuilder: SelectQueryBuilder<H3Data> = this.dataSource
      .createQueryBuilder()
      .select('h3data.*')
      .from(H3Data, 'h3data')
      .leftJoin(
        'material_to_h3',
        'materialsToH3s',
        'materialsToH3s.h3DataId = h3data.id',
      )
      .where('materialsToH3s.materialId = :materialId', {
        materialId,
      })
      .andWhere('materialsToH3s.type = :type', { type })
      .orderBy(`ABS(h3data.year - ${year})`, 'ASC')
      .cache(1000)
      .limit(1);
    return queryBuilder.getRawOne();
  }

  /**
   * Gets the closest Indicator H3 by absolute year, p.e. having and h3 for 2005 and 2010, the closest to 2006 will be 2005,
   * and the closest to 2008 will be 2010
   * @param type
   * @param year
   */
  async getIndicatorH3ByTypeAndClosestYear(
    type: INDICATOR_TYPES,
    year: number,
  ): Promise<H3Data | undefined> {
    const queryBuilder: SelectQueryBuilder<H3Data> = this.dataSource
      .createQueryBuilder()
      .select(' h3data.*')
      .from(H3Data, 'h3data')
      .leftJoin('indicator', 'indicator', 'h3data.indicatorId = indicator.id')
      .where('indicator.nameCode = :type', { type })
      .orderBy(`ABS(h3data.year - ${year})`, 'ASC')
      .limit(1);
    return queryBuilder.getRawOne();
  }

  /**
   * Gets the closest ContextualLayer H3 by absolute year, p.e. having and h3 for 2005 and 2010, the closest to 2006 will be 2005,
   * and the closest to 2008 will be 2010
   * @param contextualLayerId
   * @param year
   */
  async getContextualLayerH3DataByClosestYear(
    contextualLayerId: string,
    year?: number,
  ): Promise<H3Data | undefined> {
    //TODO for the sake of simplicity in regards to the incoming Demo on July, this function
    // for now, just returns the first most recent result that it finds, since there won't be multiple year data yet

    const queryBuilder: SelectQueryBuilder<H3Data> = this.dataSource
      .createQueryBuilder()
      .select(' h3data.*')
      .from(H3Data, 'h3data')
      .where(`h3data."contextualLayerId" = '${contextualLayerId}'`)
      .orderBy(`h3data.year`, 'DESC')
      .limit(1);
    return queryBuilder.getRawOne();
  }

  async getYears(yearsRequestParams: {
    layerType: LAYER_TYPES;
    h3DataIds?: string[] | null;
    indicatorId?: string;
  }): Promise<number[]> {
    const queryBuilder: SelectQueryBuilder<H3Data> = this.createQueryBuilder(
      'h3data',
    )
      .select('year')
      .distinct(true)
      .where('year is not null')
      .orderBy('year', 'ASC');

    // If a indicatorId is provided, filter results by it
    if (yearsRequestParams.indicatorId) {
      queryBuilder.where('"indicatorId" = :indicatorId', {
        indicatorId: yearsRequestParams.indicatorId,
      });
    }

    if (
      yearsRequestParams.h3DataIds &&
      yearsRequestParams.h3DataIds.length > 0
    ) {
      queryBuilder.where(`h3data.id  IN (:...h3DataIds)`, {
        h3DataIds: yearsRequestParams.h3DataIds,
      });
    }

    // Filter by data type
    if (yearsRequestParams.layerType !== LAYER_TYPES.RISK) {
      queryBuilder.andWhere(`"indicatorId" is null`);
    } else {
      queryBuilder.andWhere(`"indicatorId" is not null`);
    }
    const availableYears: any[] = await queryBuilder.getRawMany();
    return availableYears.map((elem: { year: number }) => elem.year);
  }

  /** Retrieves single crop data by a given resolution
   *
   * @param materialH3Data: H3 Data table and column name for a specific material
   * @param resolution: An integer between 1 (min resolution) and 6 (max resolution).
   * Resolution validation done at route handler
   *
   */
  async getMaterialMapByResolution(
    materialH3Data: H3Data,
    resolution: number,
  ): Promise<{ materialMap: H3IndexValueData[]; quantiles: number[] }> {
    const tmpTableName: string = H3DataRepository.generateRandomTableName();
    try {
      const query: string = this.dataSource
        .createQueryBuilder()
        .select(`h3_to_parent(h3index, ${resolution})`, 'h')
        .addSelect(`round(sum("${materialH3Data.h3columnName}"))`, 'v')
        .from(materialH3Data.h3tableName, 'h3table')
        .where(`"h3table"."${materialH3Data.h3columnName}" is not null`)
        .andWhere(`"${materialH3Data.h3columnName}" <> 0`)
        .groupBy('h')
        .getSql();

      await this.dataSource.query(
        `CREATE TEMPORARY TABLE "${tmpTableName}" AS (${query});`,
      );
      const materialMap: any = await this.dataSource.query(
        `SELECT *
         FROM "${tmpTableName}"
         WHERE "${tmpTableName}".v > 0;`,
      );
      const quantiles: number[] = await this.calculateQuantiles(tmpTableName);

      await this.dataSource.query(`DROP TABLE "${tmpTableName}"`);

      this.logger.log('Material Map generated');
      return { materialMap, quantiles };
    } catch (err) {
      this.logger.error(err);
      throw new ServiceUnavailableException(
        'Material Map could not been generated',
      );
    }
  }

  async getImpactMap(
    dto: GetImpactMapDto,
  ): Promise<{ impactMap: H3IndexValueData[]; quantiles: number[] }> {
    const baseQueryExtend = (baseQuery: SelectQueryBuilder<any>): void => {
      //Having a scenarioId present as an argument, will change the query to include
      // *all* indicator records of the interventions pertaining to that scenario (both
      // the CANCELLED and REPLACING records)
      if (dto.scenarioId) {
        baseQuery
          .leftJoin(
            ScenarioIntervention,
            'si',
            'si.id = sl.scenarioInterventionId',
          )
          .andWhere(
            new Brackets((qb: WhereExpressionBuilder) => {
              qb.where('sl.scenarioInterventionId IS NULL').orWhere(
                new Brackets((qbInterv: WhereExpressionBuilder) => {
                  qbInterv
                    .where('si.scenarioId = :scenarioId', {
                      scenarioId: dto.scenarioId,
                    })
                    .andWhere(`si.status = :status`, {
                      status: SCENARIO_INTERVENTION_STATUS.ACTIVE,
                    });
                }),
              );
            }),
          );
      } else {
        baseQuery.andWhere('sl.scenarioInterventionId IS NULL');
      }

      baseQuery.addSelect('sum(ir.value/ir.scaler)', 'scaled_value');
    };

    return await this.baseGetImpactMap(
      dto.indicatorId,
      dto.resolution,
      dto.year,
      dto.materialIds,
      dto.originIds,
      dto.supplierIds,
      dto.locationTypes,
      baseQueryExtend,
      false,
    );
  }

  async getActualVsScenarioImpactMap(
    dto: GetActualVsScenarioImpactMapDto,
  ): Promise<{ impactMap: H3IndexValueData[]; quantiles: number[] }> {
    const baseQueryExtend = (baseQuery: SelectQueryBuilder<any>): void => {
      //Add selection criteria to also select both comparedScenario in the select statement
      baseQuery
        .leftJoin(
          ScenarioIntervention,
          'si',
          'si.id = sl.scenarioInterventionId',
        )
        .andWhere(
          new Brackets((qb: WhereExpressionBuilder) => {
            qb.where('sl.scenarioInterventionId IS NULL').orWhere(
              new Brackets((qbInterv: WhereExpressionBuilder) => {
                qbInterv
                  .where('si.scenarioId = :scenarioId', {
                    scenarioId: dto.comparedScenarioId,
                  })
                  .andWhere(`si.status = :status`, {
                    status: SCENARIO_INTERVENTION_STATUS.ACTIVE,
                  });
              }),
            );
          }),
        );

      // Add the aggregation formula
      // Absolute: ((compared - actual)  / scaler
      // Relative: 100 * ((compared - actual) / ((compared + actual) / 2 ) / scaler
      const sumDataWithScenario: string = 'sum(ir.value)';
      const sumDataWithoutScenario: string =
        'sum(case when si."scenarioId" is null then ir.value else 0 end)';
      let aggregateExpression: string;

      if (dto.relative) {
        // TODO "edge" case when sumDataWithoutScenario is 0, the result will always be 200%, pending to search for a more accurate formula by Elena
        aggregateExpression = `100 * ( ABS(${sumDataWithScenario}) - ABS(${sumDataWithoutScenario}) ) / ( ( ABS(${sumDataWithScenario}) + ABS(${sumDataWithoutScenario}) ) / 2 ) / ir.scaler `;
      } else {
        aggregateExpression = `( ${sumDataWithScenario} - ${sumDataWithoutScenario} ) / ir.scaler `;
      }

      baseQuery.addSelect(aggregateExpression, 'scaled_value');
    };

    return await this.baseGetImpactMap(
      dto.indicatorId,
      dto.resolution,
      dto.year,
      dto.materialIds,
      dto.originIds,
      dto.supplierIds,
      dto.locationTypes,
      baseQueryExtend,
      true,
    );
  }

  async getScenarioVsScenarioImpactMap(
    dto: GetScenarioVsScenarioImpactMapDto,
  ): Promise<{ impactMap: H3IndexValueData[]; quantiles: number[] }> {
    const baseQueryExtend = (baseQuery: SelectQueryBuilder<any>): void => {
      //Add selection criteria to also select both baseScenario and comparedScenario in the select statement
      baseQuery
        .leftJoin(
          ScenarioIntervention,
          'si',
          'si.id = sl.scenarioInterventionId',
        )
        .andWhere(
          new Brackets((qb: WhereExpressionBuilder) => {
            qb.where('sl.scenarioInterventionId IS NULL').orWhere(
              new Brackets((qbInterv: WhereExpressionBuilder) => {
                qbInterv
                  .where('si.scenarioId IN (:...scenarioIds)', {
                    scenarioIds: [dto.baseScenarioId, dto.comparedScenarioId],
                  })
                  .andWhere(`si.status = :status`, {
                    status: SCENARIO_INTERVENTION_STATUS.ACTIVE,
                  });
              }),
            );
          }),
        );

      // Add the aggregation formula
      // Absolute: ((compared - base)  / scaler
      // Relative: 100 * ((compared - base) / ((compared + base) / 2 ) / scaler
      const sumDataWithBaseScenario: string = `sum(case when si."scenarioId" = '${dto.baseScenarioId}' or si."scenarioId" is null then ir.value else 0 end)`;
      const sumDataWitComparedScenario: string = `sum(case when si."scenarioId" = '${dto.comparedScenarioId}' or si."scenarioId" is null then ir.value else 0 end)`;
      let aggregateExpression: string;

      if (dto.relative) {
        // TODO "edge" case when sumDataWithoutScenario is 0, the result will always be 200%, pending to search for a more accurate formula by Elena
        aggregateExpression = `100 * ( ABS(${sumDataWitComparedScenario}) - ABS(${sumDataWithBaseScenario}) ) / ( ( ABS(${sumDataWitComparedScenario}) + ABS(${sumDataWithBaseScenario}) ) / 2 ) / ir.scaler `;
      } else {
        aggregateExpression = `( ${sumDataWithBaseScenario} - ${sumDataWitComparedScenario} ) / ir.scaler `;
      }

      baseQuery.addSelect(aggregateExpression, 'scaled_value');
    };

    return await this.baseGetImpactMap(
      dto.indicatorId,
      dto.resolution,
      dto.year,
      dto.materialIds,
      dto.originIds,
      dto.supplierIds,
      dto.locationTypes,
      baseQueryExtend,
      true,
    );
  }

  /**
   * This functions is used as a basis for all Impact functions. It builds a query with different levels of nesting
   * to generate the map values. The base query will be "extended" by the incoming baseQueryExtend parameter, which is
   * a function that will receive baseMapQuery so that the appropriate aggregation formulas and further selection criteria
   * can be added.
   * ATTENTION: This baseQueryExtend function must add a select statement with an aggregation formula and alias "scaled_value"
   * @param indicatorId Indicator data of a Indicator
   * @param resolution Integer value that represent the resolution which the h3 response should be calculated
   * @param year
   * @param materialIds
   * @param originIds
   * @param supplierIds
   * @param locationTypes
   * @param baseQueryExtend
   * @param scenarioComparisonQuantiles
   */
  //TODO Pending refactoring of Quantiles temp table, and aggregation formulas
  private async baseGetImpactMap(
    indicatorId: string,
    resolution: number,
    year: number,
    materialIds?: string[],
    originIds?: string[],
    supplierIds?: string[],
    locationTypes?: LOCATION_TYPES[],
    baseQueryExtend?: (baseQuery: SelectQueryBuilder<any>) => void,
    scenarioComparisonQuantiles?: boolean,
  ): Promise<{ impactMap: H3IndexValueData[]; quantiles: number[] }> {
    let baseMapQuery: SelectQueryBuilder<any> = this.generateBaseMapSubQuery(
      indicatorId,
      year,
    );

    baseMapQuery = this.addSmartFilters(
      baseMapQuery,
      materialIds,
      supplierIds,
      originIds,
      locationTypes,
    );

    if (baseQueryExtend) {
      baseQueryExtend(baseMapQuery);
    }

    const aggregatedResultQuery: SelectQueryBuilder<any> =
      this.generateAggregatedQuery(baseMapQuery);

    const withDynamicResolution: SelectQueryBuilder<any> =
      this.generateWithDynamicResolutionQuery(
        aggregatedResultQuery,
        resolution,
      );

    // NOTE the query structure is like this: withDynamicResolution FROM (aggregatedResult FROM (baseMapQuery))
    // the base query, which has the most parameters, is nested as a subquery 2 levels
    // the statement below is made with the assumption that none of the queries above baseMapQuery have any query params
    const [queryString, params] = baseMapQuery.getQueryAndParameters();

    return this.executeQueryAndQuantiles(
      withDynamicResolution,
      params,
      scenarioComparisonQuantiles,
    );
  }

  private async executeQueryAndQuantiles(
    query: SelectQueryBuilder<any>,
    params: any[],
    scenarioComparisonQuantiles?: boolean,
  ): Promise<{ impactMap: H3IndexValueData[]; quantiles: number[] }> {
    try {
      const tmpTableName: string = H3DataRepository.generateRandomTableName();
      await this.dataSource.query(
        `CREATE TEMPORARY TABLE "${tmpTableName}" AS (${query.getSql()})`,
        params,
      );
      const impactMap: any = await this.dataSource.query(
        `SELECT * FROM "${tmpTableName}"
      WHERE ABS("${tmpTableName}".v) > 0;`,
      );
      const quantiles: number[] = await (scenarioComparisonQuantiles
        ? this.calculateScenarioComparisonQuantiles(tmpTableName)
        : this.calculateQuantiles(tmpTableName));
      await this.dataSource.query(`DROP TABLE "${tmpTableName}";`);

      this.logger.log('Impact Map generated');

      return { impactMap, quantiles };
    } catch (e: any) {
      this.logger.error(`Error querying Impact Map: ${e}`);
      // TODO: provisional guard to avoid a 500 in the consumer for when comparing scenario / actual values
      //       end up on a division by 0, which is now a not likely but uncovered case
      return {
        impactMap: [],
        quantiles: [0, 0, 0, 0, 0, 0, 0],
      };
    }
  }

  private generateBaseMapSubQuery(
    indicatorId: string,
    year: number,
  ): SelectQueryBuilder<any> {
    return (
      this.dataSource
        .createQueryBuilder()
        .select('sl.geoRegionId', 'geoRegionId')
        .addSelect('ir.materialH3DataId', 'materialH3DataId')
        // ATTENTION: a suitable aggregation formula must be added via baseQueryExtend received by baseGetImpactMap
        .from(SourcingLocation, 'sl')
        .leftJoin(SourcingRecord, 'sr', 'sl.id = sr.sourcingLocationId')
        .leftJoin(IndicatorRecord, 'ir', 'sr.id = ir.sourcingRecordId')
        .where('ABS(ir.value) > 0')
        .andWhere('ir.scaler >= 1')
        .andWhere(`ir.indicatorId = '${indicatorId}'`)
        .andWhere(`sr.year = ${year}`)
        .groupBy('sl.geoRegionId')
        .addGroupBy('ir.materialH3DataId')
        .addGroupBy('ir.scaler')
    );
  }

  private addSmartFilters(
    subqueryBuilder: SelectQueryBuilder<any>,
    materialIds?: string[],
    supplierIds?: string[],
    originIds?: string[],
    locationTypes?: string[],
  ): SelectQueryBuilder<any> {
    if (materialIds) {
      subqueryBuilder.andWhere('sl.material IN (:...materialIds)', {
        materialIds,
      });
    }
    if (supplierIds) {
      subqueryBuilder.andWhere(
        new Brackets((qb: WhereExpressionBuilder) => {
          qb.where('sl.t1SupplierId IN (:...supplierIds)', {
            supplierIds,
          }).orWhere('sl.producerId IN (:...supplierIds)', { supplierIds });
        }),
      );
    }
    if (originIds) {
      subqueryBuilder.andWhere('sl.adminRegionId IN (:...originIds)', {
        originIds,
      });
    }
    if (locationTypes) {
      subqueryBuilder.andWhere('sl.locationType IN (:...locationTypes)', {
        locationTypes,
      });
    }
    return subqueryBuilder;
  }

  private generateAggregatedQuery(
    baseMapQuery: SelectQueryBuilder<any>,
  ): SelectQueryBuilder<any> {
    return this.dataSource
      .createQueryBuilder()
      .select(`impactview.h3index`, `h3index`)
      .addSelect(`sum(impactview.value * reduced.scaled_value)`, `sum`)
      .from('(' + baseMapQuery.getSql() + ')', 'reduced')
      .leftJoin(
        ImpactMaterializedView,
        'impactview',
        '(impactview."geoRegionId" = reduced."geoRegionId" AND impactview."h3DataId" = reduced."materialH3DataId")',
      )
      .groupBy('impactview.h3index');
  }

  private generateWithDynamicResolutionQuery(
    aggregatedResultQuery: SelectQueryBuilder<any>,
    resolution: number,
  ): SelectQueryBuilder<any> {
    return this.dataSource
      .createQueryBuilder()
      .addSelect(`h3_to_parent(q.h3index, ${resolution})`, `h`)
      .addSelect(`round(sum(sum)::numeric, 2)`, `v`)
      .from(`( ${aggregatedResultQuery.getSql()} )`, `q`)
      .groupBy('h');
  }

  /**
   * @debt: Refactor this to use queryBuilder. Even tho all values are previously validated, this isn't right, but
   * has been don't for the time being to unblock FE. Check with Data if calculus is accurate
   */
  private async calculateQuantiles(tmpTableName: string): Promise<number[]> {
    try {
      const resultArray: number[] = await this.dataSource.query(
        `select 0                                    as min,
                percentile_cont(0.1667) within group (order by v) as per16,
                percentile_cont(0.3337) within group (order by v) as per33,
                percentile_cont(0.50) within group (order by v)   as per50,
                percentile_cont(0.6667) within group (order by v) as per66,
                percentile_cont(0.8337) within group (order by v) as per83,
                percentile_cont(1) within group (order by v)      as max
         from "${tmpTableName}"
         where v>0
         `,
      );
      return Object.values(resultArray[0]);
    } catch (err) {
      this.logger.error(err);
      throw new Error(`Quantiles could not been calculated`);
    }
  }

  /**
   * This quantile calculation is meant to be used only for comparison maps
   */
  private async calculateScenarioComparisonQuantiles(
    tmpTableName: string,
  ): Promise<number[]> {
    try {
      // due to the inner workings of the pg driver and the way it parses different number types
      // this is explicitly cast to a double precision float, so the returning type is a JS number
      const resultArrayMax: any[] = await this.dataSource.query(
        `select
         CAST(max(v) AS DOUBLE PRECISION) max_val,
         CAST(percentile_cont(0.66667) within group (order by v) AS DOUBLE PRECISION) perc66max,
         CAST(percentile_cont(0.33333) within group (order by v) AS DOUBLE PRECISION) perc33max
         from "${tmpTableName}"
         where v > 0;
         `,
      );
      const resultArrayMin: any[] = await this.dataSource.query(
        `select
         CAST(min(v) AS DOUBLE PRECISION) min_val,
         CAST(percentile_cont(0.33333) within group (order by v) AS DOUBLE PRECISION) perc33min,
         CAST(percentile_cont(0.66667) within group (order by v) AS DOUBLE PRECISION) perc66min
         from "${tmpTableName}"
         where v < 0;
         `,
      );

      return [
        resultArrayMin[0].min_val || 0,
        resultArrayMin[0].perc33min || 0,
        resultArrayMin[0].perc66min || 0,
        0,
        resultArrayMax[0].perc33max || 0,
        resultArrayMax[0].perc66max || 0,
        resultArrayMax[0].max_val || 0,
      ];
    } catch (err) {
      this.logger.error(err);
      throw new Error(`Comparison Quantiles could not be calculated`);
    }
  }
}
