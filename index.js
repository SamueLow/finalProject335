const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.MONGO_CONNECTION_STRING;
const databaseAndCollection = {
  db: process.env.MONGO_DB_NAME,
  collection: process.env.MONGO_COLLECTION,
};

let port;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(bodyParser.json());

if (process.argv.length != 3) {
  process.stdout.write(`Usage index.js port`);
  process.exit(1);
} else {
  port = process.argv[2];
  process.stdout.write("Stop to shut down the server:");
}

let client;
let collection;

process.stdin.setEncoding("utf8");
process.stdin.on("readable", async () => {
  /* on equivalent to addEventListener */
  while ((dataInput = process.stdin.read()) !== null) {
    if (dataInput !== null) {
      const command = dataInput.trim();
      if (command === "stop") {
        console.log("Shutting down the server");
        await client.close();
        process.exit(0);
      }
    }
  }
});

async function main() {
  client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  });
  try {
    await client.connect();
    collection = client
      .db(databaseAndCollection.db)
      .collection(databaseAndCollection.collection);
  } catch (e) {
    console.error(e);
  }
}

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/jokesProfile", (req, res) => {
  res.render("jokesProfile");
});

app.post("/jokesProfile", async (req, res) => {
  console.log(
    req.body,
    req.body.name,
    req.body.programming,
    req.body.pun,
    req.body.dark,
    req.body.misc,
    req.body.spooky
  );
  const newJokesProfile = {
    name: req.body.name,
    programming: req.body.programming,
    puns: req.body.pun,
    dark: req.body.dark,
    miscellaneous: req.body.misc,
    spooky: req.body.spooky,
  };

  const result = await collection.insertOne(newJokesProfile);
  res.render("home");
});

app.get("/profileList", async (req, res) => {
  const profiles = await collection.find({}).toArray();
  let table = '<table border="1">';
  let jokeTypes = "";
  table +=
    "<tr><th>Names of joke profiles </th><th> Types of jokes they like</th></tr>";
  profiles.forEach((profile) => {
    jokeTypes = "";
    if (profile.programming) {
      jokeTypes += "Programming, ";
    }
    if (profile.puns) {
      jokeTypes += "Puns, ";
    }
    if (profile.dark) {
      jokeTypes += "Dark, ";
    }
    if (profile.miscellaneous) {
      jokeTypes += "Miscellaneous, ";
    }
    if (profile.spooky) {
      jokeTypes += "Spooky, ";
    }
    if (jokeTypes === "") {
      jokeTypes += "Any, ";
    }
    jokeTypes = jokeTypes.slice(0, -2);
    table += `<tr><td>${profile.name}</td><td>${jokeTypes}</td></tr>`;
  });
  res.render("profileList", { table });
});

app.post("/joke", async (req, res) => {
  const profile = await collection.findOne({ name: req.body.name });
  if (profile.length === 0) {
    res.render("home");
  }
  let requestString = "https://v2.jokeapi.dev/joke/";
  if (profile.programming) {
    requestString += "Programming,";
  } else if (profile.puns) {
    requestString += "Pun,";
  } else if (profile.dark) {
    requestString += "Dark,";
  } else if (profile.miscellaneous) {
    requestString += "Miscellaneous,";
  } else if (profile.spooky) {
    requestString += "Spooky,";
  } else if (requestString === "https://v2.jokeapi.dev/joke/") {
    requestString += "Any,";
  }

  requestString = requestString.slice(0, -1) + "?format=txt";
  const joke = await fetch(requestString).then((response) => response.text());

  res.render("joke", { joke });
});

app.post("/removeAll", async (req, res) => {
  await collection.deleteMany({});
  res.render("home");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

main().catch(console.error);
