import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(40)
  @ApiProperty()
  name!: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(40)
  @ApiProperty()
  shortName?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  symbol?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  description?: string;
}
