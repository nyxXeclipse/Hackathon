const { MongoClient, ServerApiVersion } = require("mongodb");

const uri =
  "mongodb+srv://nyx:nyxeclipse@cluster0.tarffmt.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const adminDb = client.db("admin");
    const conf = await adminDb.command({ replSetGetConfig: 1 });
    console.log("Replica Set ID:", conf.config._id);
    console.log(
      "Members:",
      conf.config.members.map((m) => m.host),
    );
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.close();
  }
}

run();
