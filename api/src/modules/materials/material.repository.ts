import {
  Brackets,
  DataSource,
  SelectQueryBuilder,
  WhereExpressionBuilder,
} from 'typeorm';
import { Material } from 'modules/materials/material.entity';
import { ExtendedTreeRepository } from 'utils/tree.repository';
import { CreateMaterialDto } from 'modules/materials/dto/create.material.dto';
import { Injectable, Logger } from '@nestjs/common';
import { SourcingLocation } from 'modules/sourcing-locations/sourcing-location.entity';
import { GetMaterialTreeWithOptionsDto } from 'modules/materials/dto/get-material-tree-with-options.dto';
import {
  SCENARIO_INTERVENTION_STATUS,
  ScenarioIntervention,
} from 'modules/scenario-interventions/scenario-intervention.entity';

@Injectable()
export class MaterialRepository extends ExtendedTreeRepository<
  Material,
  CreateMaterialDto
> {
  constructor(private dataSource: DataSource) {
    super(Material, dataSource.createEntityManager());
  }

  logger: Logger = new Logger(MaterialRepository.name);

  /**
   * @description Get all materials that are present in Sourcing Locations with given filters
   *              Additionally if withAncestry set to true (default) it will return the ancestry of each
   *              element up to the root
   */

  async getMaterialsFromSourcingLocations(
    materialTreeOptions: GetMaterialTreeWithOptionsDto,
    withAncestry: boolean = true,
  ): Promise<Material[]> {
    // Join and filters over materials present in sourcing-locations. Resultant query returns IDs of elements meeting the filters
    const queryBuilder: SelectQueryBuilder<Material> = this.createQueryBuilder(
      'm',
    )
      .innerJoin(SourcingLocation, 'sl', 'sl.materialId = m.id')
      .distinct(true);

    if (materialTreeOptions.materialIds) {
      queryBuilder.andWhere('sl.materialId IN (:...materialIds)', {
        materialIds: materialTreeOptions.materialIds,
      });
    }
    if (materialTreeOptions.supplierIds) {
      queryBuilder.andWhere(
        new Brackets((qb: WhereExpressionBuilder) => {
          qb.where('sl."t1SupplierId" IN (:...suppliers)', {
            suppliers: materialTreeOptions.supplierIds,
          }).orWhere('sl."producerId" IN (:...suppliers)', {
            suppliers: materialTreeOptions.supplierIds,
          });
        }),
      );
    }
    if (materialTreeOptions.businessUnitIds) {
      queryBuilder.andWhere('sl.businessUnitId IN (:...businessUnitIds)', {
        businessUnitIds: materialTreeOptions.businessUnitIds,
      });
    }
    if (materialTreeOptions.originIds) {
      queryBuilder.andWhere('sl.adminRegionId IN (:...originIds)', {
        originIds: materialTreeOptions.originIds,
      });
    }

    if (materialTreeOptions.locationTypes) {
      queryBuilder.andWhere('sl.locationType IN (:...locationTypes)', {
        locationTypes: materialTreeOptions.locationTypes,
      });
    }
    // TODO: we could externalise this to something generic as well
    if (materialTreeOptions.scenarioIds) {
      queryBuilder.leftJoin(
        ScenarioIntervention,
        'scenarioIntervention',
        'sl.scenarioInterventionId = scenarioIntervention.id',
      );

      queryBuilder.andWhere(
        new Brackets((qb: WhereExpressionBuilder) => {
          qb.where('sl.scenarioInterventionId is null').orWhere(
            new Brackets((qbInterv: WhereExpressionBuilder) => {
              qbInterv
                .where('scenarioIntervention.scenarioId IN (:...scenarioIds)', {
                  scenarioIds: materialTreeOptions.scenarioIds,
                })
                .andWhere(`scenarioIntervention.status = :status`, {
                  status: SCENARIO_INTERVENTION_STATUS.ACTIVE,
                });
            }),
          );
        }),
      );
    } else {
      queryBuilder.andWhere('sl.scenarioInterventionId is null');
      queryBuilder.andWhere('sl.interventionType is null');
    }

    if (!withAncestry) {
      return queryBuilder.getMany();
    }

    queryBuilder.select('m.id');

    // Recursively find elements and their ancestry given Ids of the subquery above
    return this.getEntityAncestry<Material>(queryBuilder, Material.name);
  }
}
