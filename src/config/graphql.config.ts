import type { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo';
import type { Request } from 'express';
import type { GraphQLFormattedError } from 'graphql';

// Shared by app.module.ts and the GraphQL e2e tests, so both run the same server setup.
export function buildGraphqlConfig(): ApolloDriverConfig {
  return {
    driver: ApolloDriver,
    autoSchemaFile: true,
    path: '/graphql',
    playground: false,
    introspection: process.env.NODE_ENV !== 'production',
    // Guards read the Express request from here (see auth/request-from-context.ts).
    context: ({ req }: { req: Request }) => ({ req }),
    // Clients get the message and the error code only. No stack traces and no Nest
    // `originalError` body, matching the REST rule of never exposing internals.
    includeStacktraceInErrorResponses: false,
    formatError: (error: GraphQLFormattedError): GraphQLFormattedError => ({
      message: error.message,
      locations: error.locations,
      path: error.path,
      extensions: { code: error.extensions?.code },
    }),
  };
}
