import express from "express";
import ViteExpress from "vite-express";

import { MongoClient, ServerApiVersion, ObjectId} from 'mongodb';

const app = express();

const uri = `mongodb+srv://${process.env.USR}:${process.env.PASS}@${process.env.HOST}/?retryWrites=true&w=majority&appName=a3-OwenHart`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get('/hello', (req, res) => res.send('Hi from backend!'));

async function connectExample() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect(err => {
            console.log(err);
            client.close();
        });
        // Send a ping to confirm a successful connection
        await client.db("final-project-octurdle").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");


    } finally {
        await client.close();
    }
}

connectExample();

ViteExpress.listen(app, process.env.PORT || 3000, () =>
  console.log("Server is listening on port 3000..."),
);