import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Unit } from 'modules/units/unit.entity';

export class CreateUnitConversionDto {
  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  unit1?: string;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  unit2?: string;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  factor?: number;

  unit?: Unit;
}
