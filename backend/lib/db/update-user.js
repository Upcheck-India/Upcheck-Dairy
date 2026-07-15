import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.bnkztjifcljddjwmqsmm:jmFFByqFyK7uPUO7@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";
const client = new Client({ connectionString });

async function main() {
  await client.connect();
  console.log("Connected to DB.");

  const res = await client.query(
    "UPDATE farmers SET email_verified = true WHERE email = $1 RETURNING *",
    ["testfarmer_gemini_13@example.com"]
  );

  console.log("Update result:", res.rows);
  await client.end();
}

main().catch(console.error);
