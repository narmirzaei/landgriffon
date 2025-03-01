/**
 * Get Supplier with options:
 */
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LOCATION_TYPES } from 'modules/sourcing-locations/sourcing-location.entity';
import { replaceStringWhiteSpacesWithDash } from 'utils/transform-location-type.util';

export class GetBusinessUnitTreeWithOptionsDto {
  @ApiPropertyOptional({
    description:
      'Return Business Units with related Sourcing Locations. Setting this to true will override depth param',
  })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  withSourcingLocations?: boolean;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  depth?: number;

  // Below fields for smart filtering
  @IsUUID('4', { each: true })
  @ApiPropertyOptional()
  @IsOptional()
  supplierIds?: string[];

  @IsUUID('4', { each: true })
  @ApiPropertyOptional()
  @IsOptional()
  materialIds?: string[];

  @IsUUID('4', { each: true })
  @ApiPropertyOptional()
  @IsOptional()
  originIds?: string[];

  @ApiPropertyOptional({
    description: 'Types of Sourcing Locations, written with hyphens',
    enum: Object.values(LOCATION_TYPES),
    name: 'locationTypes[]',
  })
  @IsOptional()
  @IsEnum(LOCATION_TYPES, {
    each: true,
    message:
      'Available options: ' +
      replaceStringWhiteSpacesWithDash(
        Object.values(LOCATION_TYPES).toString().toLowerCase(),
      ),
  })
  @Type(() => String)
  locationTypes?: LOCATION_TYPES[];

  @ApiPropertyOptional({
    description: 'Array of Scenario Ids to include in the business unit search',
  })
  @IsOptional()
  @IsUUID('4')
  scenarioId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { each: true })
  scenarioIds?: string[];
}
