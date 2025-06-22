import { Client, Pool } from "postgres";
import { Pool as PgPool } from "pg";

export interface DatabaseConfig {
  hostname: string;
  port: number;
  user: string;
  password: string;
  database: string;
  tls?: {
    enabled: boolean;
    enforce: boolean;
    caCertificates: string[];
  };
}

export function parseConnectionString(connectionString: string): DatabaseConfig {
  const parsed = new URL(connectionString);
  const searchParams = parsed.searchParams;
  
  return {
    hostname: parsed.hostname,
    port: parseInt(parsed.port) || 5432,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.slice(1),
    tls: searchParams.get('sslmode') === 'require' ? {
      enabled: true,
      enforce: true,
      caCertificates: []
    } : undefined
  };
}

export async function createDatabaseConfig(): Promise<DatabaseConfig> {
  const connectionString = Deno.env.get("DATABASE_URL");
  if (!connectionString) throw new Error("DATABASE_URL not set");
  
  const config = parseConnectionString(connectionString);
  
  // If SSL is required, try to read CA certificate
  if (config.tls?.enabled) {
    try {
      const caCert = await Deno.readTextFile("./certs/ca-certificate.crt");
      config.tls.caCertificates = [caCert];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn("Could not read CA certificate, SSL may fail:", errorMessage);
      // Keep SSL enabled but without custom CA
    }
  }
  
  return config;
}

export async function createClient(): Promise<Client> {
  const config = await createDatabaseConfig();
  return new Client(config);
}

export async function createPool(maxConnections: number = 10): Promise<Pool> {
  const config = await createDatabaseConfig();
  return new Pool(config, maxConnections, true);
}

// Create a pg Pool for Better Auth
export async function createPgPool(): Promise<PgPool> {
  const connectionString = Deno.env.get("DATABASE_URL");
  if (!connectionString) throw new Error("DATABASE_URL not set");
  
  const config = parseConnectionString(connectionString);
  
  let sslConfig: boolean | { rejectUnauthorized: boolean; ca?: string } = false;
  
  // Check if SSL is required from connection string
  if (config.tls?.enabled) {
    try {
      // Try to read CA certificate if it exists
      const caCert = await Deno.readTextFile("./certs/ca-certificate.crt");
      sslConfig = {
        rejectUnauthorized: true,
        ca: caCert
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn("Could not read CA certificate for auth pool, using SSL without custom CA:", errorMessage);
      // Still use SSL but let the system handle certificate validation
      sslConfig = {
        rejectUnauthorized: true
      };
    }
  }
  
  return new PgPool({
    host: config.hostname,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: sslConfig,
  });
}
