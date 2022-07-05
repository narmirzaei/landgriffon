import { ApiProperty } from '@nestjs/swagger';

export class GetAvailableYearsResponseDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'number',
    },
  })
  data: number[];
}
