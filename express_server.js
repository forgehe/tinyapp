const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const methodOverride = require("method-override");
const { secretKey, salt } = require("./secret.js");
const { generateRandomString, checkEmail, renderError, addAnalytic } = require("./helpers.js");
const { urlDatabase, userDatabase } = require("./database.js");
const urlsRoutes = require("./routes/urls");

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

app.use("/urls", urlsRoutes());

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
  req.session = null;
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

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    renderError(res, 404, "Redirect not found. Check your address's spelling and try again.");
  } else {
    addAnalytic(urlDatabase, req, req.params.shortURL);
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

// 404 error if accessing any other page
app.use("/", (req, res, next) => {
  renderError(res, 404, "Page Does Not Exist");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
