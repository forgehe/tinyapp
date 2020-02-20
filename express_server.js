const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const methodOverride = require("method-override");
const { secretKey, salt } = require("./secret.js");
const { generateRandomString, checkEmail, urlsForUser, renderError, encodeURL, addAnalytic } = require("./helpers.js");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: [secretKey],
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  })
);
app.use(methodOverride("_method"));

app.use((req, res, next) => {
  let templateVars = {
    username: userDatabase[req.session.userID]
  };
  res.templateVars = templateVars;
  next();
});

const urlDatabase = {};

const userDatabase = {};

app.post("/login", (req, res) => {
  const user = checkEmail(userDatabase, req.body);
  if (!user) {
    renderError(res, 403, "Invalid Username or Password");
  } else {
    const pwCheck = bcrypt.compareSync(req.body.password, user.password);
    if (!user || user.email !== req.body.email || !pwCheck) {
      renderError(res, 403, "Invalid Username or Password");
    } else {
      req.session.userID = user.id;
      res.redirect("/urls");
    }
  }
});

app.post("/logout", (req, res) => {
  req.session.userID = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const user = checkEmail(userDatabase, req.body);
  const password = bcrypt.hashSync(req.body.password, salt);
  if (user || !req.body.email || !req.body.password) {
    renderError(res, 400, "User Already Taken");
  } else {
    const ranString = generateRandomString();
    userDatabase[ranString] = {
      id: ranString,
      email: req.body.email,
      password: password
    };
    req.session.userID = ranString;
    res.redirect("/urls");
  }
});

app.post("/urls", (req, res) => {
  if (!req.session.userID) {
    renderError(res, 403, "Please Login First Before Creating an URL.");
  } else {
    const input = encodeURL(req.body.longURL);
    if (input === false) {
      renderError(res, 400, "Invalid Link. Try Again.");
    } else {
      let shortURL = generateRandomString();
      while (urlDatabase[shortURL]) {
        shortURL = generateRandomString();
      }
      const time = new Date();
      urlDatabase[shortURL] = {
        id: shortURL,
        longURL: input,
        userID: req.session.userID,
        visitors: [],
        count: 0,
        uniqueCount: 0,
        timeCreated: time.toUTCString()
      };
      res.redirect(`urls/${shortURL}`);
    }
  }
});

app.delete("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID !== req.session.userID) {
    renderError(res, 403, "Invalid Operation");
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

app.put("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID !== req.session.userID) {
    renderError(res, 403, "You do not have access to edit this URL");
  } else {
    const input = encodeURL(req.body.editURL);
    if (input === false) {
      renderError(res, 400, "Invalid Link. Try Again.");
    } else {
      urlDatabase[req.params.shortURL].longURL = input;
      res.redirect("/urls");
    }
  }
});

app.get("/register", (req, res) => {
  if (req.session.userID) {
    res.redirect("/urls");
  } else {
    res.templateVars.headTitle = "Register New User";
    res.render("pages/register", res.templateVars);
  }
});

app.get("/login", (req, res) => {
  if (req.session.userID) {
    res.redirect("/urls");
  } else {
    res.templateVars.headTitle = "Login Page";
    res.render("pages/login", res.templateVars);
  }
});

app.get("/urls", (req, res) => {
  const userURLS = urlsForUser(urlDatabase, req.session.userID);
  res.templateVars.urls = userURLS;
  res.templateVars.headTitle = "My URLs";
  res.render("pages/urls_index", res.templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!userDatabase[req.session.userID]) {
    res.redirect("/login");
  } else {
    res.templateVars.headTitle = "Add New URL";
    res.render("pages/urls_new", res.templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    renderError(res, 404, "TinyURL not found. Check your address's spelling and try again.");
  } else {
    res.templateVars.shortURLObj = urlDatabase[req.params.shortURL];
    res.templateVars.headTitle = `TinyURL of ${urlDatabase[req.params.shortURL].longURL}`;
    res.render("pages/urls_show", res.templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    renderError(res, 404, "Redirect not found. Check your address's spelling and try again.");
  } else {
    addAnalytic(urlDatabase, req, req.params.shortURL);
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  }
});

app.get("/url", function(req, res) {
  res.json(urlDatabase);
});

app.get("/users", function(req, res) {
  res.json(userDatabase);
});

app.get("/", function(req, res) {
  if (!req.session.userID) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.use("/", (req, res, next) => {
  renderError(res, 404, "Page Does Not Exist");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
