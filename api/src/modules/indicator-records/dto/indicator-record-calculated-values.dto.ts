/**
 * @description: Interface for typing the properties to calculate the values per indicator of a indicator record
 * on the fly
 * @note: This could be probably done within the DB in the future
 */
import {
  INDICATOR_TYPES,
  INDICATOR_TYPES_NEW,
} from 'modules/indicators/indicator.entity';

export class IndicatorRecordCalculatedValuesDto {
  sourcingRecordId: string;
  production: number;
  materialH3DataId: string;

  landPerTon: number;
  landUse: number;
  values: Map<INDICATOR_TYPES, number>;
}

export class IndicatorRecordCalculatedValuesDtoV2 {
  sourcingRecordId: string;
  production: number;
  materialH3DataId: string;

  landPerTon: number;
  landUse: number;
  values: Map<INDICATOR_TYPES_NEW, number>;
}
