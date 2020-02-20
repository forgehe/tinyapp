const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const methodOverride = require("method-override");
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
app.use(methodOverride("_method"));

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
      const userID = req.session.userID;
      urlDatabase[shortURL] = {
        longURL: input,
        userID: userID
      };
      res.redirect(`urls/${shortURL}`);
    }
  }
});

app.delete("/urls/:shortURL", (req, res) => {
  const userID = req.session.userID;
  if (urlDatabase[req.params.shortURL].userID !== userID) {
    renderError(res, 403, "Invalid Operation");
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

app.put("/urls/:shortURL", (req, res) => {
  const userID = req.session.userID;
  if (urlDatabase[req.params.shortURL].userID !== userID) {
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
    const userID = req.session.userID;
    const templateVars = {
      username: userDatabase[userID],
      headTitle: "Register New User"
    };
    res.render("pages/register", templateVars);
  }
});

app.get("/login", (req, res) => {
  if (req.session.userID) {
    res.redirect("/urls");
  } else {
    const userID = req.session.userID;
    const templateVars = {
      username: userDatabase[userID],
      headTitle: "Login Page"
    };
    res.render("pages/login", templateVars);
  }
});

app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  const userURLS = urlsForUser(urlDatabase, userID);

  const templateVars = {
    username: userDatabase[userID],
    headTitle: "My URLs",
    urls: userURLS
  };
  res.render("pages/urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.userID;
  if (!userDatabase[userID]) {
    res.redirect("/login");
  } else {
    const templateVars = {
      username: userDatabase[userID],
      headTitle: "Add New URL"
    };
    res.render("pages/urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.userID;
  if (urlDatabase[req.params.shortURL] === undefined) {
    renderError(res, 404, "TinyURL not found. Check your address's spelling and try again.");
  } else {
    const templateVars = {
      username: userDatabase[userID],
      headTitle: `TinyURL of ${urlDatabase[req.params.shortURL].longURL}`,
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL
    };
    res.render("pages/urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    renderError(res, 404, "Redirect not found. Check your address's spelling and try again.");
  } else {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  }
});

app.get("/", function(req, res) {
  if (!req.session.userID) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
