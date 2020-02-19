const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const { secretKey, salt } = require("./secret.js");
const { generateRandomString, checkEmail, urlsForUser, renderError, encodeURL } = require("./helpers.js");

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

const urlDatabase = {};

const userDatabase = {};

// index page
app.get("/", function(req, res) {
  let templateVars = {
    username: null,
    headTitle: "Title"
  };
  res.render("pages/index", templateVars);
});

// about page
app.get("/about", function(req, res) {
  let templateVars = {
    username: null,
    headTitle: "About"
  };
  res.render("pages/about", templateVars);
});

app.post("/login", (req, res) => {
  const user = checkEmail(userDatabase, req.body);
  if (!user) {
    renderError(res, 403, "Invalid Username or Password");
  } else {
    const pwCheck = bcrypt.compareSync(req.body.password, user.password);
    if (user && user.email === req.body.email && pwCheck) {
      req.session.userID = user.id;
      res.redirect("/urls");
    } else {
      renderError(res, 403, "Invalid Username or Password");
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
  if (!user) {
    const ranString = generateRandomString();
    userDatabase[ranString] = {
      id: ranString,
      email: req.body.email,
      password: password
    };
    req.session.userID = ranString;
    res.redirect("/urls");
  } else {
    renderError(res, 400, "User Already Taken");
  }
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let input = encodeURL(req.body.longURL);
  while (urlDatabase[shortURL]) {
    shortURL = generateRandomString();
  }
  if (input === false) {
    renderError(res, 400, "Invalid Link. Try Again.");
  } else {
    const userID = req.session.userID;
    urlDatabase[shortURL] = {
      longURL: input,
      userID: userID
    };
    res.redirect(`urls/${shortURL}`);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.userID;
  if (urlDatabase[req.params.shortURL].userID !== userID) {
    renderError(res, 403, "Invalid Operation");
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const userID = req.session.userID;
  if (urlDatabase[req.params.shortURL].userID !== userID) {
    renderError(res, 403, "You do not have access to this URL");
  } else {
    let input = encodeURL(req.body.editURL);
    if (input === false) {
      renderError(res, 400, "Invalid Link. Try Again.");
    } else {
      urlDatabase[req.params.shortURL].longURL = input;
      res.redirect("/urls");
    }
  }
});

app.get("/register", (req, res) => {
  const userID = req.session.userID;
  let templateVars = {
    username: userDatabase[userID],
    headTitle: "Register New User"
  };
  res.render("pages/register", templateVars);
});

app.get("/login", (req, res) => {
  const userID = req.session.userID;
  let templateVars = {
    username: userDatabase[userID],
    headTitle: "Login Page"
  };
  res.render("pages/login", templateVars);
});

app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  const userURLS = urlsForUser(urlDatabase, userID);

  let templateVars = {
    username: userDatabase[userID],
    headTitle: "URL Index",
    urls: userURLS
  };
  res.render("pages/urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.userID;
  if (userDatabase[userID]) {
    let templateVars = {
      username: userDatabase[userID],
      headTitle: "Add New URL"
    };
    res.render("pages/urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.userID;
  if (urlDatabase[req.params.shortURL] !== undefined) {
    let templateVars = {
      username: userDatabase[userID],
      headTitle: `TinyURL of ${urlDatabase[req.params.shortURL].longURL}`,
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL
    };
    res.render("pages/urls_show", templateVars);
  } else {
    renderError(res, 404, "TinyURL not found. Check your address's spelling and try again.");
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] !== undefined) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    renderError(res, 404, "Redirect not found. Check your address's spelling and try again.");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/users.json", (req, res) => {
  res.json(userDatabase);
});

app.get("/hello", (req, res) => {
  let templateVars = {
    greeting: "Hello World!"
  };
  res.render("pages/hello_world", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
