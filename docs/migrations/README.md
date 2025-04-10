# Database Migrations

This folder contains SQL migration files that need to be applied to the Supabase database.

## Expanded Concepts Table Migration

The `create_expanded_concepts_table.sql` file creates the necessary table structure and security policies for storing expanded concept data, enabling persistence of expanded concepts across sessions.

### How to Apply the Migration

1. **Log in to your Supabase Dashboard**
   - Navigate to your project dashboard at https://app.supabase.com

2. **Open the SQL Editor**
   - In the left navigation, click on "SQL Editor"
   - Click "New Query"

3. **Run the Migration**
   - Copy the entire contents of `create_expanded_concepts_table.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the SQL commands

4. **Verify the Table Creation**
   - In the left navigation, click on "Table Editor"
   - You should see the new `expanded_concepts` table in the list
   - Verify the table structure matches what's defined in the migration
   - Check that RLS policies have been correctly applied using the "Authentication" > "Policies" section

### What This Migration Does

1. **Creates the `expanded_concepts` table with the following structure:**
   - `id`: UUID (Primary Key)
   - `session_id`: UUID (Foreign Key to sessions table, with cascade delete)
   - `node_id`: Text (ID of the node in the knowledge graph)
   - `title`: Text (Title of the concept)
   - `content`: Text (Detailed content/explanation of the concept)
   - `related_concepts`: JSONB (Array of related concepts with relationships)
   - `graph_hash`: Text (Hash of the graph structure for versioning)
   - `created_at`: Timestamp

2. **Adds appropriate indexes** for performance optimization.

3. **Enables Row Level Security (RLS)** and creates policies to ensure:
   - Users can only access expanded concepts from their own sessions
   - Users can only insert expanded concepts for sessions they own
   - Users can only update or delete expanded concepts they own

### Troubleshooting

If you encounter any errors during the migration:

1. **Foreign Key Constraints**: Make sure the `sessions` table exists and has an `id` column of type UUID.
2. **RLS Policy Errors**: If you get errors about existing policies, you can remove the CREATE POLICY statements or add IF NOT EXISTS to them.
3. **Permission Issues**: Ensure you're running the SQL as a user with sufficient privileges. 