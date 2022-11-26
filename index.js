const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
const jwtVarifi = (req, res, next) => {
  const authToken = req.headers.authorization;
  if (!authToken) {
    return res.status(401).send("request forbeden");
  }
  const token = authToken.split(" ")[1];
  jwttoken.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.send({ authrijation: "forbiden" });
    }
    req.decoded = decoded;
    next();
  });
};
const run = async () => {
  try {
    const users = client.db("assainment12").collection("users");
    const produckt = client.db("assainment12").collection("produckt");
    const allcatagori = client.db("assainment12").collection("allcatagori");
    const customars = client.db("assainment12").collection("customars");
    const varifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const quary = { email: decodedEmail };
      const user = await users.findOne(quary);
      if (!user?.role === "admin") {
        return res.status(403).send({ message: "forbeden" });
      }
      next();
    };
    const varifysalar = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const quary = { email: decodedEmail };
      const user = await users.findOne(quary);
      if (!user?.role === "Seller") {
        return res.status(403).send({ message: "forbeden" });
      }
      next();
    };

    app.get("/allbuyers", jwtVarifi, varifyAdmin, async (req, res) => {
      const buyers = await users.find({ roll: "user" }).toArray();
      res.send(buyers);
    });
    app.get("/allbsaller", jwtVarifi, varifyAdmin, async (req, res) => {
      const allsaller = await users.find({ roll: "Seller" }).toArray();
      res.send(allsaller);
    });
    app.get("/allCatagory", jwtVarifi, async (req, res) => {
      const catagory = await allcatagori.find({}).toArray();
      res.send(catagory);
    });
    app.get("/alluerts", async (req, res) => {
      const user = await users.find({}).toArray();
      res.send(user);
    });
    app.get("/loginUser", async (req, res) => {
      const loginguser = await users.findOne({ email: req.query.email });
      res.send(loginguser);
    });
    app.get("/mysalespost", jwtVarifi, varifysalar, async (req, res) => {
      const myproduckt = await produckt
        .find({ selaremail: req.query.email })
        .toArray();
      res.send(myproduckt);
    });

    app.get("/usersbookings", jwtVarifi, async (req, res) => {
      const email = req.query.email;
      const userbooking = await customars
        .find({ customaremail: email })
        .toArray();
      res.send(userbooking);
    });
    app.get("/allproduckt", async (req, res) => {
      const id = req.query.id;
      const catagory = await allcatagori.findOne({ _id: ObjectId(id) });
      const data = await produckt
        .find({ catagory: catagory.catagory })
        .toArray();
      res.send(data);
    });
    app.get("/users", async (req, res) => {
      const email = req.query.email;
      const token = jwttoken.sign({ email }, process.env.ACCESS_TOKEN, {
        expiresIn: "2d",
      });

      res.send({
        data: "",
        token: token,
      });
    });
    app.post("/users", async (req, res) => {
      const user = req.body;

      const rejult = await users.insertOne(user);
      res.send({
        data: rejult,
        token: "",
      });
    });

    //produckt post
    app.post("/produckt", jwtVarifi, varifysalar, async (req, res) => {
      const rejult = await produckt.insertOne(req.body);
      res.send(rejult);
    });
    app.post("/customardetails", async (req, res) => {
      console.log(req.body);
      const rejultcustomar = await customars.insertOne(req.body);
      res.send(rejultcustomar);
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
