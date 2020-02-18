const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// From: https://stackoverflow.com/a/8084248/6024104
const generateRandomString = () => {
  let output = Math.random()
    .toString(36)
    .substring(7);
  return output;
};

app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// index page
app.get("/", function(req, res) {
  let templateVars = {
    //headTitle: "Title"
  };
  res.render("pages/index", templateVars);
});

// about page
app.get("/about", function(req, res) {
  res.render("pages/about");
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let input = encodeURI(req.body.longURL);
  if (!(input.startsWith("http://") || input.startsWith("https://"))) {
    input = "https://" + input;
  }
  urlDatabase[shortURL] = input;
  console.log(shortURL, input);
  res.redirect(`urls/${shortURL}`);
  // res.redirect("pages/urls_show", templateVars);
  // res.send("Ok"); // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  // delete urlDatabase[:shortURL];
  console.log(req.params.shortURL);
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
  // res.redirect("pages/urls_show", templateVars);
  // res.send("Ok"); // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:shortURL", (req, res) => {
  // delete urlDatabase[:shortURL];
  console.log(req.params.shortURL, req.body);
  urlDatabase[req.params.shortURL] = req.body.editURL;
  res.redirect("/urls");
  // res.redirect("pages/urls_show", templateVars);
  // res.send("Ok"); // Respond with 'Ok' (we will replace this)
});

app.get("/urls", (req, res) => {
  let templateVars = {
    headTitle: "URL's Index",
    urls: urlDatabase
  };
  res.render("pages/urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("pages/urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  // console.log(templateVars.longURL);
  res.render("pages/urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] !== undefined) {
    res.redirect(urlDatabase[req.params.shortURL]);
  } else {
    res.statusCode = 404;
    res.send("404, shortURL not found.");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  let templateVars = { greeting: "Hello World!" };
  res.render("pages/hello_world", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
