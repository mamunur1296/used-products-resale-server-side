const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwttoken = require("jsonwebtoken");
const { query } = require("express");
const app = express();
require("dotenv").config();
//meselWoore
app.use(cors());
app.use(express.json());
//mongo de conector

const uri = process.env.URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const users = client.db("assainment12").collection("users");
    const produckt = client.db("assainment12").collection("produckt");
    app.post("/users", async (req, res) => {
      const user = req.body;
      const email = req.query.email;
      const token = jwttoken.sign({ email }, process.env.ACCESS_TOKEN, {
        expiresIn: "2h",
      });
      const rejult = await users.insertOne(user);
      res.send({
        data: rejult,
        token: token,
      });
    });
    //produckt post
    app.post("/produckt", async (req, res) => {
      const rejult = await produckt.insertOne(req.body);
      res.send(rejult);
    });
  } finally {
  }
};
run().catch((err) => console.log(err));
app.get("/", (req, res) => {
  client.connect((err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("connect to mongodb");
    }
  });
  res.send("hall server");
});
app.listen(process.env.PORT || 5000, () => {
  console.log("this server is reantin PORT ", process.env.PORT);
});
