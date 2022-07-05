import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { SCENARIO_INTERVENTION_TYPE } from 'modules/scenario-interventions/scenario-intervention.entity';
import {
  LOCATION_TYPES,
  LOCATION_TYPES_PARAMS,
} from 'modules/sourcing-locations/sourcing-location.entity';
import { IndicatorCoefficientsDto } from 'modules/indicator-coefficients/dto/indicator-coefficients.dto';
import { Transform, Type } from 'class-transformer';
import { transformSingleLocationType } from 'utils/transform-location-type.util';

export class GetAvailableYearsDto {
  @IsUUID(4, { each: true })
  @ArrayNotEmpty()
  @ArrayMaxSize(1, {
    message: 'Intervention must cover 1 existing material',
  })
  @ApiProperty({
    description: 'Ids of Materials that will be affected by intervention',
    type: [String],
    example: 'bc5e4933-cd9a-4afc-bd53-56941b816ef3',
  })
  materialIds!: string[];

  @IsUUID(4, { each: true })
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Ids of Business Units that will be affected by intervention',
    type: [String],
    example: 'bc5e4933-cd9a-4afc-bd53-56941b812345',
  })
  businessUnitIds?: string[];

  @IsUUID(4, { each: true })
  @IsOptional()
  @ApiPropertyOptional({
    description:
      'Ids of Suppliers or Producers that will be affected by intervention',
    type: [String],
    example: 'bc5e4933-cd9a-4afc-bd53-56941b865432',
  })
  supplierIds?: string[];

  @IsUUID(4, { each: true })
  @IsOptional()
  @ApiProperty({
    description: 'Ids of Admin Regions that will be affected by intervention',
    type: [String],
    example: 'bc5e4933-cd9a-4afc-bd53-56941b8adca3',
  })
  adminRegionIds?: string[];
}
