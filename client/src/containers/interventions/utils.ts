import { InterventionTypes, LocationTypes } from './enums';

import type { InterventionDto, InterventionFormData } from './types';
import type { Option } from 'components/forms/select';

function emptyStringIsNull(value: string): string | null {
  return value === '' ? null : value;
}

function getValue<T>(option: Option<T>): Option<T>['value'] {
  return option?.value;
}

export function parseInterventionFormDataToDto(
  interventionFormData: InterventionFormData,
): InterventionDto {
  // removing some fields which API doesn't support
  delete interventionFormData.cityAddressCoordinates;

  const {
    interventionType,
    startYear,
    endYear,
    materialIds,
    businessUnitIds,
    supplierIds,
    adminRegionIds,
    newMaterialId,
    newT1SupplierId,
    newProducerId,
    newLocationType,
    newLocationAdminRegionInput,
    newLocationCountryInput,
    newLocationAddressInput,
    coefficients,
    ...rest
  } = interventionFormData;

  const areCoefficientsSet = Object.values(coefficients).some((v) => +v !== 0 && v);

  const result: InterventionDto = {
    ...rest,
    type: interventionType,
    startYear: getValue(startYear),
    endYear: getValue(endYear),

    materialIds: materialIds?.map(getValue).map(emptyStringIsNull) as string[],
    businessUnitIds: businessUnitIds?.map(getValue).map(emptyStringIsNull) as string[],
    supplierIds: supplierIds?.map(getValue).map(emptyStringIsNull) as string[],
    adminRegionIds: adminRegionIds?.map(getValue).map(emptyStringIsNull) as string[],

    newMaterialId: newMaterialId?.length ? newMaterialId[0].value : null,

    // * location-related fields are not sent when the intervention type is "Change production efficiency"
    ...(interventionType !== InterventionTypes.Efficiency && {
      newLocationType: emptyStringIsNull(getValue(newLocationType) as string),
      newLocationCountryInput: newLocationCountryInput?.label,
    }),

    // * country region is only sent when the location type is "Administrative Region of Product"
    ...([LocationTypes.administrativeRegionOfProduction].includes(
      newLocationType?.value as LocationTypes,
    ) && {
      newLocationAdminRegionInput: emptyStringIsNull(getValue(newLocationAdminRegionInput)),
    }),

    // * if an address is provided for certain location types, latitude and longitudes are nullified
    ...([LocationTypes.aggregationPoint, LocationTypes.pointOfProduction].includes(
      newLocationType?.value as LocationTypes,
    ) &&
      newLocationAddressInput && {
        newLocationAddressInput,
        newLocationLatitude: null,
        newLocationLongitude: null,
      }),

    newT1SupplierId: emptyStringIsNull(getValue(newT1SupplierId) as string),
    newProducerId: emptyStringIsNull(getValue(newProducerId) as string),

    // * for "Change production efficiency" intervention type, coeficients are always sent even if the user hasn't filled them (default to 0).
    // * for other intervention types, coeficients are sent only if the user has filled any of them.
    ...(interventionType === InterventionTypes.Efficiency
      ? {
          newIndicatorCoefficients: coefficients,
        }
      : {
          ...(areCoefficientsSet && {
            newIndicatorCoefficients: coefficients,
          }),
        }),
  };

  return result;
}
