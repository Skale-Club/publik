import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(connectionString, {
  prepare: false,
  idle_timeout: 5,
  max: 1,
  connect_timeout: 15,
});

try {
  const startedAt = Date.now();
  const result = await sql`select now() as server_time, 1 as ok`;
  const elapsedMs = Date.now() - startedAt;
  const [{ server_time: serverTime }] = result;

  console.log(
    `Supabase keepalive succeeded in ${elapsedMs}ms at ${new Date(serverTime).toISOString()}.`,
  );
} catch (error) {
  console.error("Supabase keepalive failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
