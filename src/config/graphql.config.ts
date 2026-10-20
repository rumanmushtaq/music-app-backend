import type { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo';
import type { Request } from 'express';

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
  };
}
