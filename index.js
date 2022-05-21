const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();
const crypto = require("crypto");

//middleware
app.use(cors());
app.use(express.json());
//  verify jwt

function verifyJWT(req, res, next) {
  const authHeadrs = req.headers.authorization;
  if (!authHeadrs) {
    return res.status(401).send({
      message: "unauthorized access",
    });
  }
  jwt.verify(authHeadrs, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(403).send({
        message: "FORBIDDED",
      });
    }
    req.decoded = decoded;
    next();
  });
}
// database connection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yit7l.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// datebase integration

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("gunParts").collection("services");
    const userColleciton = client.db("gunParts").collection("users")

    
    // Token generate
    app.post("/gettoken", (req, res) => {
      // let jwtoken = crypto.randomBytes(64).toString('hex')
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "30d",
      });
      res.send({ accessToken });
    });
    // users
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollecition.findOne(query);
      res.send(user);
    });

    app.put("/user", async (req, res) => {
      const newUser = req.body;
      const query = { email: newUser.email };
      const user = await userCollecition.updateOne(
        query,
        { $set: newUser }, // Update
        { upsert: true } // add document with req.body._id if not exists
      );
      const cursor = userCollecition.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // products

    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const updateProduct = req.body;
      const query = { _id: ObjectId(id) };
      const updated = await productCollection.updateOne(
        query,
        { $set: updateProduct }, // Update
        { upsert: true } // add document with req.body._id if not exists
      );
      const cursor = await productCollection.findOne(query);
      res.send(cursor);
    });

    app.post("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { email: req.body.email };
      const deleteProduct = await productCollection.deleteOne(query);
      if (deleteProduct.acknowledged) {
        const products = await productCollection.find(query);
        const userProduct = await products.toArray();
        res.send(userProduct);
      }
    });

    app.post("/products", async (req, res) => {
      const product = req.body;

      const user = await productCollection.insertOne(product);
      if (user.acknowledged) {
        const result = await productCollection.findOne({
          _id: user.insertedId,
        });

        res.send(result);
      } else {
        res.send("404 error");
      }
    });

    app.get("/products/:email", verifyJWT, async (req, res) => {
      const authHeadrs = req.headers.authorization;
      const decodedEmail = req.decoded.email;
      const email = req.params.email;
      if (decodedEmail === email) {
        const query = { email: email };
        const cursor = await productCollection.find(query);
        const userProduct = await cursor.toArray();
        res.send(userProduct);
      } else {
        res.status("401").send({
          message: "token expired",
        });
      }
    });

    app.get("/products", async (req, res) => {
      const cursor = await productCollection.find();
      const userProduct = await cursor.toArray();
      res.send(userProduct);
    });

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const cursor = await productCollection.findOne(query);
      res.send(cursor);
    });
  } finally {
    // client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running server");
});

app.listen(port, () => {
  console.log("lisening form ", port);
});
