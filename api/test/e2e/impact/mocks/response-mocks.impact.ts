import { LOCATION_TYPES } from 'modules/sourcing-locations/sourcing-location.entity';

export const groupByMaterialResponseData = {
  rows: [
    {
      name: 'Fake Material 1',
      values: [
        {
          year: 2010,
          value: 1000,
          isProjected: false,
        },
        {
          year: 2011,
          value: 1050,
          isProjected: false,
        },
        {
          year: 2012,
          value: 1100,
          isProjected: false,
        },
        {
          year: 2013,
          value: 1116.5,
          isProjected: true,
        },
      ],
      children: [],
    },
    {
      name: 'Fake Material 2',
      values: [
        {
          year: 2010,
          value: 2000,
          isProjected: false,
        },
        {
          year: 2011,
          value: 2050,
          isProjected: false,
        },
        {
          year: 2012,
          value: 2100,
          isProjected: false,
        },
        {
          year: 2013,
          value: 2131.5,
          isProjected: true,
        },
      ],
      children: [],
    },
  ],
  yearSum: [
    {
      year: 2010,
      value: 3000,
    },
    {
      year: 2011,
      value: 3100,
    },
    {
      year: 2012,
      value: 3200,
    },
    {
      year: 2013,
      value: 3248,
    },
  ],
};

export const groupByMaterialNestedResponseData = {
  rows: [
    {
      name: 'Fake Material Parent',
      values: [
        {
          year: 2010,
          value: 3000,
          isProjected: false,
        },
        {
          year: 2011,
          value: 3100,
          isProjected: false,
        },
        {
          year: 2012,
          value: 3200,
          isProjected: false,
        },
        {
          year: 2013,
          value: 3248,
          isProjected: true,
        },
      ],
      children: [
        {
          name: 'Fake Material Child',
          values: [
            {
              year: 2010,
              value: 3000,
              isProjected: false,
            },
            {
              year: 2011,
              value: 3100,
              isProjected: false,
            },
            {
              year: 2012,
              value: 3200,
              isProjected: false,
            },
            {
              year: 2013,
              value: 3248,
              isProjected: true,
            },
          ],
          children: [
            {
              name: 'Fake Material Grandchild',
              values: [
                {
                  year: 2010,
                  value: 1000,
                  isProjected: false,
                },
                {
                  year: 2011,
                  value: 1050,
                  isProjected: false,
                },
                {
                  year: 2012,
                  value: 1100,
                  isProjected: false,
                },
                {
                  year: 2013,
                  value: 1116.5,
                  isProjected: true,
                },
              ],
              children: [],
            },
          ],
        },
      ],
    },
  ],
  yearSum: [
    {
      year: 2010,
      value: 3000,
    },
    {
      year: 2011,
      value: 3100,
    },
    {
      year: 2012,
      value: 3200,
    },
    {
      year: 2013,
      value: 3248,
    },
  ],
};

export const groupByMaterialNestedResponseDataForGrandchild = {
  rows: [
    {
      name: 'Fake Material Parent',
      values: [
        {
          year: 2010,
          value: 1000,
          isProjected: false,
        },
        {
          year: 2011,
          value: 1050,
          isProjected: false,
        },
        {
          year: 2012,
          value: 1100,
          isProjected: false,
        },
        {
          year: 2013,
          value: 1116.5,
          isProjected: true,
        },
      ],
      children: [
        {
          name: 'Fake Material Child',
          values: [
            {
              year: 2010,
              value: 1000,
              isProjected: false,
            },
            {
              year: 2011,
              value: 1050,
              isProjected: false,
            },
            {
              year: 2012,
              value: 1100,
              isProjected: false,
            },
            {
              year: 2013,
              value: 1116.5,
              isProjected: true,
            },
          ],
          children: [
            {
              name: 'Fake Material Grandchild',
              values: [
                {
                  year: 2010,
                  value: 1000,
                  isProjected: false,
                },
                {
                  year: 2011,
                  value: 1050,
                  isProjected: false,
                },
                {
                  year: 2012,
                  value: 1100,
                  isProjected: false,
                },
                {
                  year: 2013,
                  value: 1116.5,
                  isProjected: true,
                },
              ],
              children: [],
            },
          ],
        },
      ],
    },
  ],
  yearSum: [
    {
      year: 2010,
      value: 1000,
    },
    {
      year: 2011,
      value: 1050,
    },
    {
      year: 2012,
      value: 1100,
    },
    {
      year: 2013,
      value: 1116.5,
    },
  ],
};

export const groupByOriginResponseData = {
  rows: [
    {
      name: 'Fake AdminRegion 1',
      values: [
        { isProjected: false, value: 600, year: 2010 },
        { isProjected: false, value: 650, year: 2011 },
        { isProjected: false, value: 700, year: 2012 },
        { isProjected: true, value: 710.5, year: 2013 },
      ],
      children: [],
    },
    {
      name: 'Fake AdminRegion 2',
      values: [
        { isProjected: false, value: 500, year: 2010 },
        { isProjected: false, value: 550, year: 2011 },
        { isProjected: false, value: 600, year: 2012 },
        { isProjected: true, value: 609, year: 2013 },
      ],
      children: [],
    },
  ],
  yearSum: [
    {
      year: 2010,
      value: 1100,
    },
    {
      year: 2011,
      value: 1200,
    },
    {
      year: 2012,
      value: 1300,
    },
    {
      year: 2013,
      value: 1319.5,
    },
  ],
};

export const groupBySupplierResponseData = {
  rows: [
    {
      name: 'Fake Supplier 1',
      values: [
        { isProjected: false, value: 100, year: 2010 },
        { isProjected: false, value: 150, year: 2011 },
        { isProjected: false, value: 200, year: 2012 },
        { isProjected: true, value: 203, year: 2013 },
      ],
      children: [],
    },
    {
      name: 'Fake Supplier 2',
      values: [
        { isProjected: false, value: 300, year: 2010 },
        { isProjected: false, value: 350, year: 2011 },
        { isProjected: false, value: 400, year: 2012 },
        { isProjected: true, value: 406, year: 2013 },
      ],
      children: [],
    },
  ],
  yearSum: [
    { value: 400, year: 2010 },
    { value: 500, year: 2011 },
    { value: 600, year: 2012 },
    { value: 609, year: 2013 },
  ],
};

export const groupByBusinessUnitResponseData = {
  rows: [
    {
      name: 'Fake BusinessUnit 1',
      values: [
        { isProjected: false, value: 100, year: 2010 },
        { isProjected: false, value: 150, year: 2011 },
        { isProjected: false, value: 200, year: 2012 },
        { isProjected: true, value: 203, year: 2013 },
      ],
      children: [],
    },
    {
      name: 'Fake BusinessUnit 2',
      values: [
        { isProjected: false, value: 300, year: 2010 },
        { isProjected: false, value: 350, year: 2011 },
        { isProjected: false, value: 400, year: 2012 },
        { isProjected: true, value: 406, year: 2013 },
      ],
      children: [],
    },
  ],
  yearSum: [
    { value: 400, year: 2010 },
    { value: 500, year: 2011 },
    { value: 600, year: 2012 },
    { value: 609, year: 2013 },
  ],
};

export const groupByLocationTypeResponseData = {
  rows: [
    {
      name: `${LOCATION_TYPES.PRODUCTION_AGGREGATION_POINT}`,
      children: [],
      values: [
        {
          year: 2010,
          value: 300,
          isProjected: false,
        },
        {
          year: 2011,
          value: 350,
          isProjected: false,
        },
        {
          year: 2012,
          value: 400,
          isProjected: false,
        },
        {
          year: 2013,
          value: 406,
          isProjected: true,
        },
      ],
    },
    {
      name: `${LOCATION_TYPES.COUNTRY_OF_PRODUCTION}`,
      children: [],
      values: [
        {
          year: 2010,
          value: 100,
          isProjected: false,
        },
        {
          year: 2011,
          value: 150,
          isProjected: false,
        },
        {
          year: 2012,
          value: 200,
          isProjected: false,
        },
        {
          year: 2013,
          value: 203,
          isProjected: true,
        },
      ],
    },
  ],
  yearSum: [
    { value: 400, year: 2010 },
    { value: 500, year: 2011 },
    { value: 600, year: 2012 },
    { value: 609, year: 2013 },
  ],
};

export const filteredByLocationTypeResponseData = {
  rows: [
    {
      name: 'Fake Material',
      children: [],
      values: [
        {
          year: 2010,
          value: 300,
          isProjected: false,
        },
        {
          year: 2011,
          value: 350,
          isProjected: false,
        },
        {
          year: 2012,
          value: 400,
          isProjected: false,
        },
        {
          year: 2013,
          value: 406,
          isProjected: true,
        },
      ],
    },
  ],
  yearSum: [
    { value: 300, year: 2010 },
    { value: 350, year: 2011 },
    { value: 400, year: 2012 },
    { value: 406, year: 2013 },
  ],
};

export const filteredByLocationTypeResponseData2 = {
  rows: [
    {
      name: LOCATION_TYPES.PRODUCTION_AGGREGATION_POINT,
      children: [],
      values: [
        {
          year: 2010,
          value: 300,
          isProjected: false,
        },
        {
          year: 2011,
          value: 350,
          isProjected: false,
        },
        {
          year: 2012,
          value: 400,
          isProjected: false,
        },
        {
          year: 2013,
          value: 406,
          isProjected: true,
        },
      ],
    },
  ],
  yearSum: [
    { value: 300, year: 2010 },
    { value: 350, year: 2011 },
    { value: 400, year: 2012 },
    { value: 406, year: 2013 },
  ],
};

export const impactTableWithScenario = {
  impactTable: [
    {
      indicatorShortName: null,
      indicatorId: '09dd65d9-dac0-481f-b5f5-7c099b005ce1',
      groupBy: 'material',
      rows: [
        {
          name: 'Textile',
          children: [
            {
              name: 'Cotton',
              children: [],
              values: [
                {
                  year: 2017,
                  value: 0,
                  isProjected: false,
                },
                {
                  year: 2018,
                  value: 0,
                  isProjected: false,
                },
                {
                  year: 2019,
                  value: 0,
                  isProjected: false,
                },
                {
                  year: 2020,
                  value: 400,
                  isProjected: false,
                },
                {
                  year: 2021,
                  value: 406,
                  isProjected: true,
                },
                {
                  year: 2022,
                  value: 412.09,
                  isProjected: true,
                },
              ],
            },
            {
              name: 'Linen',
              children: [],
              values: [
                {
                  year: 2017,
                  value: 0,
                  isProjected: false,
                },
                {
                  year: 2018,
                  value: 0,
                  isProjected: false,
                },
                {
                  year: 2019,
                  value: 0,
                  isProjected: false,
                },
                {
                  year: 2020,
                  value: 750,
                  isProjected: false,
                },
                {
                  year: 2021,
                  value: 761.25,
                  isProjected: true,
                },
                {
                  year: 2022,
                  value: 772.66875,
                  isProjected: true,
                },
              ],
            },
            {
              name: 'Wool',
              children: [],
              values: [
                {
                  year: 2017,
                  value: 0,
                  isProjected: false,
                },
                {
                  year: 2018,
                  value: 0,
                  isProjected: false,
                },
                {
                  year: 2019,
                  value: 0,
                  isProjected: false,
                },
                {
                  year: 2020,
                  value: 500,
                  isProjected: false,
                },
                {
                  year: 2021,
                  value: 507.5,
                  isProjected: true,
                },
                {
                  year: 2022,
                  value: 515.1125,
                  isProjected: true,
                },
              ],
            },
          ],
          values: [
            {
              year: 2017,
              value: 0,
              isProjected: false,
            },
            {
              year: 2018,
              value: 0,
              isProjected: false,
            },
            {
              year: 2019,
              value: 0,
              isProjected: false,
            },
            {
              year: 2020,
              value: 1650,
              isProjected: false,
            },
            {
              year: 2021,
              value: 1674.75,
              isProjected: true,
            },
            {
              year: 2022,
              value: 1699.87125,
              isProjected: true,
            },
          ],
        },
      ],
      yearSum: [
        {
          year: 2017,
          value: 0,
        },
        {
          year: 2018,
          value: 0,
        },
        {
          year: 2019,
          value: 0,
        },
        {
          year: 2020,
          value: 1650,
        },
        {
          year: 2021,
          value: 1674.75,
        },
        {
          year: 2022,
          value: 1699.87125,
        },
      ],
      metadata: {
        unit: 'm3/year',
      },
    },
  ],
  purchasedTonnes: [],
};

export const rankingTableWithScenario = {
  impactTable: [
    {
      indicatorShortName: null,
      indicatorId: '1b111521-5904-4e09-a7b1-7beeef3e0d2f',
      groupBy: 'material',
      rows: [
        {
          name: 'Textile',
          children: [
            {
              name: 'Cotton',
              children: [],
              values: [
                {
                  year: 2018,
                  value: 0,
                  isProjected: false,
                },
                {
                  year: 2019,
                  value: 0,
                  isProjected: false,
                },
                {
                  year: 2020,
                  value: 400,
                  isProjected: false,
                },
                {
                  year: 2021,
                  value: 406,
                  isProjected: true,
                },
                {
                  year: 2022,
                  value: 412.09,
                  isProjected: true,
                },
              ],
            },
            {
              name: 'Linen',
              children: [],
              values: [
                {
                  year: 2018,
                  value: 0,
                  isProjected: false,
                },
                {
                  year: 2019,
                  value: 0,
                  isProjected: false,
                },
                {
                  year: 2020,
                  value: 750,
                  isProjected: false,
                },
                {
                  year: 2021,
                  value: 761.25,
                  isProjected: true,
                },
                {
                  year: 2022,
                  value: 772.66875,
                  isProjected: true,
                },
              ],
            },
            {
              name: 'Wool',
              children: [],
              values: [
                {
                  year: 2018,
                  value: 0,
                  isProjected: false,
                },
                {
                  year: 2019,
                  value: 0,
                  isProjected: false,
                },
                {
                  year: 2020,
                  value: 500,
                  isProjected: false,
                },
                {
                  year: 2021,
                  value: 507.5,
                  isProjected: true,
                },
                {
                  year: 2022,
                  value: 515.1125,
                  isProjected: true,
                },
              ],
            },
          ],
          values: [
            {
              year: 2018,
              value: 0,
              isProjected: false,
            },
            {
              year: 2019,
              value: 0,
              isProjected: false,
            },
            {
              year: 2020,
              value: 1650,
              isProjected: false,
            },
            {
              year: 2021,
              value: 1674.75,
              isProjected: true,
            },
            {
              year: 2022,
              value: 1699.87125,
              isProjected: true,
            },
          ],
        },
      ],
      yearSum: [
        {
          year: 2019,
          value: 0,
        },
        {
          year: 2019,
          value: 0,
        },
        {
          year: 2020,
          value: 1650,
        },
        {
          year: 2021,
          value: 1674.75,
        },
        {
          year: 2022,
          value: 1699.87125,
        },
      ],
      metadata: {
        unit: 'm3/year',
      },
      others: {
        aggregatedValues: [
          {
            year: 2019,
            value: 0,
          },
          {
            year: 2019,
            value: 0,
          },
          {
            year: 2020,
            value: 0,
          },
          {
            year: 2021,
            value: 0,
          },
          {
            year: 2022,
            value: 0,
          },
        ],
        numberOfAggregatedEntities: 0,
        sort: 'DES',
      },
    },
  ],
  purchasedTonnes: [
    {
      year: 2018,
      value: 0,
      isProjected: false,
    },
    {
      year: 2019,
      value: 0,
      isProjected: false,
    },
    {
      year: 2020,
      value: 3007.68,
      isProjected: false,
    },
    {
      year: 2021,
      value: 3052.7952,
      isProjected: true,
    },
    {
      year: 2022,
      value: 3098.587128,
      isProjected: true,
    },
  ],
};
