require("dotenv").config();
const express = require("express");
const app = express();
const PORT = 3000;
const bcrypt = require("bcrypt");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");

app.use(express.json());
app.use(cors());

const users = [
  {
    username: "Casey",
    password: "$2b$10$S52WiTEeR7KJGK6druf0/.k/F212ZzlbMTvz3yxg0r7KTk1gs7VEK"
  },
  {
    username: "Todd",
    password: "$2b$10$8yMkQ7kbpU9VBGmTtAsnDesVtaIQKRWSwgjPQUy7u.4DHW7LvlHxG"
  }
];

const posts = [
  {
    username: "Casey",
    title: "What to do"
  },
  {
    username: "Todd",
    title: "What not to do"
  },
  {
    username: "Todd",
    title: "What you should do"
  },
  {
    username: "Todd",
    title: "Fancy New Blogpost"
  }
];

app.get("/users", (req, res) => {
  res.json(users);
});

app.post("/users", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const user = { username: req.body.username, password: hashedPassword };
    users.push(user);
    console.log(salt);
    console.log(hashedPassword);
    res.status(201).send(users);
  } catch {
    res.sendStatus(500).send();
  }
});

app.get("/users/login", async (req, res) => {
  try {
    res.sendFile(path.join(__dirname + "/signin.html"));
  } catch (error) {
    res.status(500).send();
  }
});

app.post("/users/login", async (req, res) => {
  console.log(req.body);
  const user = users.find(user => user.username === req.body.username);
  if (user === null) {
    return res.sendStatus(400).send("cannot find user");
  } else {
    try {
      if (await bcrypt.compare(req.body.password, user.password)) {
        const username = req.body.username;
        const user = { username: username };
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
        //res.json({ accessToken: accessToken });

        res
          .status(200)
          .cookie("blogAccessToken", accessToken)
          .redirect(301, "/signedin");

        //res.status(301).redirect("/signedin");
        //res.send({ status: "success" });
      } else {
        res.status(403).send({ status: "username incorrect" });
      }
    } catch (error) {
      res.status(500).send();
    }
  }
});

app.get("/signedin", async (req, res) => {
  try {
    res.sendFile(path.join(__dirname + "/signedin.html"));
  } catch (error) {
    res.status(500).send();
  }
});

app.get("/posts", authenticateToken, async (req, res) => {
  console.log(req.user.username);
  res.json(posts.filter(post => post.username === req.user.username));
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    console.log(token, "token  is null");
    return res.sendStatus(401);
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) res.sendStatus(403);
    req.user = user;
    console.log(req.user);
    next();
  });
}

app.listen(PORT, () => {
  console.log(`APP IS RUNNING ON PORT ${PORT}`);
});
