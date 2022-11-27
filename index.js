const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwttoken = require("jsonwebtoken");
const { query } = require("express");
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIP_KEY_TOKEN);
console.log(process.env.STRIP_KEY_TOKEN);
//meselWoore
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

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
    const paymentitem = client.db("assainment12").collection("payment");
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
    app.get("/allCatagory", async (req, res) => {
      const catagory = await allcatagori.find({}).toArray();
      res.send(catagory);
    });
    app.get("/addItems", async (req, res) => {
      const catagory = await produckt.find({ advertised: true }).toArray();
      res.send(catagory);
    });
    app.get("/allPayment", async (req, res) => {
      const payment = await paymentitem.find({}).toArray();
      res.send(payment);
    });
    app.get("/alluerts", jwtVarifi, varifyAdmin, async (req, res) => {
      const user = await users.find({}).toArray();
      res.send(user);
    });
    app.get("/loginUser", async (req, res) => {
      const loginguser = await users.findOne({ email: req.query.email });
      res.send(loginguser);
    });
    app.get("/payment/:id", async (req, res) => {
      const pay = await customars.findOne({
        _id: ObjectId(req.params.id),
      });
      res.send(pay);
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
    app.put("/users", async (req, res) => {
      const user = req.body;
      const email = req.query.email;
      const filter = { email: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: user,
      };
      const token = jwttoken.sign({ email }, process.env.ACCESS_TOKEN, {
        expiresIn: "2d",
      });
      const rejult = await users.updateOne(filter, updatedDoc, options);
      res.send({
        data: rejult,
        token: token,
      });
    });
    app.post("/advertised/:id", jwtVarifi, varifysalar, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          advertised: true,
        },
      };
      const rejult = await produckt.updateOne(filter, updatedDoc);
      res.send(rejult);
    });
    app.post("/paymentitem", jwtVarifi, async (req, res) => {
      const payment = req.body;
      const rejult = await paymentitem.insertOne(payment);
      const id = payment.bookingId;
      const producktId = payment.producktId;
      const producktFilter = { _id: ObjectId(producktId) };
      const producktUpdatedDoc = {
        $set: {
          payment: true,
          tranjuctionId: payment.tranjuctionId,
        },
      };
      const producktupdated = await produckt.updateOne(
        producktFilter,
        producktUpdatedDoc
      );
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          payment: true,
          tranjuctionId: payment.tranjuctionId,
        },
      };
      const updateRajult = await customars.updateOne(filter, updatedDoc);
      res.send(rejult);
    });
    app.post("/create-payment-intent", jwtVarifi, async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    //produckt post
    app.post("/produckt", jwtVarifi, varifysalar, async (req, res) => {
      const rejult = await produckt.insertOne(req.body);
      res.send(rejult);
    });
    app.post("/customardetails", async (req, res) => {
      const rejultcustomar = await customars.insertOne(req.body);
      res.send(rejultcustomar);
    });
    app.put("/salarVarify/:id", jwtVarifi, varifysalar, async (req, res) => {
      const id = req.params.id;

      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          varify: true,
        },
      };
      const rejult = await users.updateOne(filter, updatedDoc, option);
      res.send(rejult);
    });
    app.delete("/userDeleit/:id", jwtVarifi, varifyAdmin, async (req, res) => {
      const rejult = await users.deleteOne({ _id: ObjectId(req.params.id) });
      res.send(rejult);
    });
    app.delete("/myproduckt/:id", jwtVarifi, varifysalar, async (req, res) => {
      const rejult = await produckt.deleteOne({ _id: ObjectId(req.params.id) });
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
