const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

async function migrate() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not found in .env");
    process.exit(1);
  }

  console.log("Connecting to databases...");
  // Create two separate connections
  const connTest = await mongoose.createConnection(uri, { dbName: 'test' }).asPromise();
  const connProd = await mongoose.createConnection(uri, { dbName: 'phasetracker' }).asPromise();

  console.log("Connected successfully.\n");

  // Get all collections from the test database
  const collections = await connTest.db.listCollections().toArray();
  
  for (const collInfo of collections) {
    const collName = collInfo.name;
    
    // Skip system collections or views
    if (collName.startsWith('system.') || collInfo.type === 'view') continue;
    
    console.log(`Migrating collection: ${collName}`);
    const testColl = connTest.db.collection(collName);
    const prodColl = connProd.db.collection(collName);

    // Drop the collection in the target DB to avoid duplicate key errors
    try {
      await prodColl.drop();
      console.log(`  -> Dropped existing collection in phasetracker DB.`);
    } catch(e) {
      // It's fine if the collection doesn't exist yet
    }

    // Fetch all documents
    const docs = await testColl.find({}).toArray();
    
    // Insert into the new database
    if (docs.length > 0) {
      await prodColl.insertMany(docs);
      console.log(`  -> Successfully copied ${docs.length} documents.`);
    } else {
      console.log(`  -> Collection is empty, skipping.`);
    }
  }

  console.log("\nMigration complete! All data is now in the 'phasetracker' database.");
  await connTest.close();
  await connProd.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
