const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const MONGO_URL = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'pos_db';
const PORT = 4000;
const COLLECTIONS = ['products','categories','customers','sales','suppliers','purchases','productHistory','settings','users','income','expenses','transactions','cart','heldSales','translations','sync','stores','currencies','storeCurrencies','saleItems','syncQueue'];

let db;

async function connect() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db(DB_NAME);
  console.log('Connected to MongoDB');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

function prepDoc(doc) {
  const d = { ...doc };
  if (d.id === undefined && d._id) d.id = d._id.toString();
  delete d._id;
  return d;
}

app.get('/api/:collection', async (req, res) => {
  try {
    if (!COLLECTIONS.includes(req.params.collection)) return res.status(400).json({ error: 'bad collection' });
    const docs = await db.collection(req.params.collection).find({}).toArray();
    res.json(docs.map(prepDoc));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/:collection', async (req, res) => {
  try {
    if (!COLLECTIONS.includes(req.params.collection)) return res.status(400).json({ error: 'bad collection' });
    const body = req.body;
    if (Array.isArray(body)) {
      await db.collection(req.params.collection).insertMany(body);
      return res.json({ ok: true, count: body.length });
    }
    await db.collection(req.params.collection).insertOne(body);
    res.json({ ok: true, id: body.id || null });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/:collection/:id', async (req, res) => {
  try {
    if (!COLLECTIONS.includes(req.params.collection)) return res.status(400).json({ error: 'bad collection' });
    const col = db.collection(req.params.collection);
    const body = { ...req.body };
    delete body._id;
    body.id = req.params.id;
    await col.replaceOne({ id: req.params.id }, body, { upsert: true });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/:collection/:id', async (req, res) => {
  try {
    if (!COLLECTIONS.includes(req.params.collection)) return res.status(400).json({ error: 'bad collection' });
    await db.collection(req.params.collection).deleteOne({ id: req.params.id });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/:collection/clear', async (req, res) => {
  try {
    if (!COLLECTIONS.includes(req.params.collection)) return res.status(400).json({ error: 'bad collection' });
    await db.collection(req.params.collection).deleteMany({});
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

connect().then(() => {
  app.listen(PORT, '127.0.0.1', () => console.log(`pos-api on 127.0.0.1:${PORT}`));
}).catch(e => { console.error(e); process.exit(1); });
