import Head from 'next/head';
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, Hydrate } from '@tanstack/react-query';
import { OverlayProvider } from '@react-aria/overlays';
import { SSRProvider } from '@react-aria/ssr';
import { SessionProvider } from 'next-auth/react';
import { Provider as JotaiProvider } from 'jotai';

import TitleTemplate from 'utils/titleTemplate';

import type { ReactElement, ReactNode } from 'react';
import type { AppProps } from 'next/app';
import type { NextPage } from 'next';
import type { DehydratedState } from '@tanstack/react-query';
import type { Session } from 'next-auth';
import type { ParsedUrlQuery } from 'querystring';

import 'styles/globals.css';

// eslint-disable-next-line @typescript-eslint/ban-types
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  Layout?: (page: ReactElement) => ReactNode;
};

type PageProps = {
  dehydratedState?: DehydratedState;
  session?: Session;
  query?: ParsedUrlQuery;
};

type AppPropsWithLayout = AppProps<PageProps> & {
  Component: NextPageWithLayout<PageProps>;
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const [queryClient] = useState(() => new QueryClient());
  const getLayout = Component.Layout ?? ((page) => page);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=1024" />
      </Head>
      <TitleTemplate titleTemplate="%s - LandGriffon" />
      <JotaiProvider>
        <QueryClientProvider client={queryClient}>
          <Hydrate state={pageProps.dehydratedState}>
            <SessionProvider session={pageProps.session}>
              <OverlayProvider>
                <SSRProvider>{getLayout(<Component {...pageProps} />)}</SSRProvider>
              </OverlayProvider>
            </SessionProvider>
          </Hydrate>
        </QueryClientProvider>
      </JotaiProvider>
    </>
  );
}

export default MyApp;
