import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SCENARIO_STATUS } from 'modules/scenarios/scenario.entity';

export class CreateScenarioDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @ApiProperty()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsEnum(SCENARIO_STATUS)
  @ApiPropertyOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  isPublic: boolean;

  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsString()
  @IsOptional()
  @IsJSON()
  @ApiPropertyOptional()
  metadata?: string;
}
