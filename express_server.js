const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const userDatabase = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const errorDatabase = {
  400: { name: "Bad Request", desc: "The server cannot process the request." },
  401: { name: "Unauthorized", desc: "authentication is required." },
  403: { name: "Forbidden", desc: "You do not have the necessary permissions." },
  404: { name: "Not Found", desc: "The requested resource could not be found." },
  405: {
    name: "Method Not Allowed",
    desc: "A requested method is not supported for the requested resource."
  },
  410: {
    name: "Gone",
    desc: "The resource requested is no longer available and will not be available again."
  },
  418: { name: "I'm a teapot", desc: "I am a teapot." },
  500: {
    name: "Internal Server Error",
    desc: "Internal Server Error. Please wait, and try again."
  },
  501: { name: "Not Implemented", desc: "The server does not recognize the request." }
};

// From: https://stackoverflow.com/a/8084248/6024104
const generateRandomString = () => {
  let output = Math.random()
    .toString(36)
    .substring(7);
  return output;
};

const checkEmail = obj => {
  const userDatabaseArray = Object.values(userDatabase);
  const found = userDatabaseArray.find(object => object.email === obj.email);
  return found;
};

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

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

app.post("/login", (req, res) => {
  const user = checkEmail(req.body);
  console.log(req.body);
  if (user && user.email === req.body.email && user.password === req.body.password) {
    console.log("Pass Login!", user.id);
    res.cookie("user_id", user.id);
  }
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const user = checkEmail(req.body);
  if (!user) {
    const ranString = generateRandomString();
    userDatabase[ranString] = {
      id: ranString,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie("user_id", ranString);
    console.log(ranString, userDatabase[ranString]);
    res.redirect("/urls");
  } else {
    res.statusCode = 400;
    let templateVars = {
      username: null,
      errorCode: 400,
      errorDatabase: errorDatabase
    };
    res.render("pages/error_page", templateVars);
  }
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let input = encodeURI(req.body.longURL);
  while (urlDatabase[shortURL]) {
    shortURL = generateRandomString();
  }
  if (!(input.startsWith("http://") || input.startsWith("https://"))) {
    input = "https://" + input;
  }
  if (
    !input.match(
      /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
    )
  ) {
    res.send("Not a valid URL, try again");
  }
  urlDatabase[shortURL] = input;
  // console.log(shortURL, input);
  res.redirect(`urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  // console.log(req.params.shortURL);
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  // console.log(req.params);
  let input = encodeURI(req.body.editURL);
  if (!(input.startsWith("http://") || input.startsWith("https://"))) {
    input = "https://" + input;
  }
  urlDatabase[req.params.shortURL] = input;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  let templateVars = {
    username: userDatabase[req.cookies.user_id],
    headTitle: "Register New User"
  };
  res.render("pages/register", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = {
    username: userDatabase[req.cookies.user_id],
    headTitle: "Login Page"
  };
  res.render("pages/login", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    username: userDatabase[req.cookies.user_id],
    headTitle: "URL Index",
    urls: urlDatabase
  };
  // console.log(templateVars);
  res.render("pages/urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: userDatabase[req.cookies.user_id],
    headTitle: "Add New URL"
  };
  res.render("pages/urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] !== undefined) {
    let templateVars = {
      username: userDatabase[req.cookies.user_id],
      headTitle: `TinyURL of ${urlDatabase[req.params.shortURL]}`,
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]
    };
    // console.log(templateVars.longURL);
    res.render("pages/urls_show", templateVars);
  } else {
    res.statusCode = 404;
    let templateVars = {
      username: null,
      errorCode: 404,
      errorDatabase: errorDatabase
    };
    res.render("pages/error_page", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] !== undefined) {
    res.redirect(urlDatabase[req.params.shortURL]);
  } else {
    res.statusCode = 404;
    let templateVars = {
      username: null,
      errorCode: 404,
      errorDatabase: errorDatabase
    };
    res.render("pages/error_page", templateVars);
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
