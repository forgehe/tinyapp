const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const urlDatabase = {};

const userDatabase = {};

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

const urlsForUser = userID => {
  let output = {};
  for (const objID in urlDatabase) {
    // console.log(urlDatabase[objID].userID);
    // eslint-disable-next-line no-prototype-builtins
    if (urlDatabase.hasOwnProperty(objID)) {
      if (urlDatabase[objID].userID === userID) {
        output[objID] = urlDatabase[objID];
      }
    }
  }
  return output;
};

const renderError = errorCode => {
  let templateErrors = {
    username: null,
    errorCode: errorCode,
    errorDatabase: errorDatabase
  };
  return templateErrors;
};

const encodeURL = string => {
  let newString = encodeURI(string);
  if (!(newString.startsWith("http://") || newString.startsWith("https://"))) {
    newString = "https://" + newString;
  }
  if (
    !newString.match(
      // eslint-disable-next-line no-useless-escape
      /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
    )
  ) {
    return false;
  }
  return newString;
};

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

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
  res.render("pages/about");
});

app.post("/login", (req, res) => {
  const user = checkEmail(req.body);
  if (!user) {
    let templateErrors = renderError(403);
    res.statusCode = 403;
    res.render("pages/error_page", templateErrors);
  } else {
    const pwCheck = bcrypt.compareSync(req.body.password, user.password);
    if (user && user.email === req.body.email && pwCheck) {
      res.cookie("user_id", user.id);
      res.redirect("/urls");
    } else {
      let templateErrors = renderError(403);
      res.statusCode = 403;
      res.render("pages/error_page", templateErrors);
    }
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const user = checkEmail(req.body);
  const password = bcrypt.hashSync(req.body.password, 10);
  if (!user) {
    const ranString = generateRandomString();
    userDatabase[ranString] = {
      id: ranString,
      email: req.body.email,
      password: password
    };
    res.cookie("user_id", ranString);
    res.redirect("/urls");
  } else {
    let templateErrors = renderError(400);
    res.statusCode = 400;
    res.render("pages/error_page", templateErrors);
  }
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  console.log(req.body.longURL);
  let input = encodeURL(req.body.longURL);
  while (urlDatabase[shortURL]) {
    shortURL = generateRandomString();
  }

  // console.log(shortURL, input);
  if (input === false) {
    let templateErrors = renderError(400);
    res.statusCode = 400;
    res.render("pages/error_page", templateErrors);
  } else {
    urlDatabase[shortURL] = {
      longURL: input,
      userID: req.cookies.user_id
    };
    res.redirect(`urls/${shortURL}`);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  // console.log(req.params.shortURL);
  if (urlDatabase[req.params.shortURL].userID !== req.cookies.user_id) {
    let templateErrors = renderError(403);
    res.statusCode = 403;
    res.render("/error_page", templateErrors);
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID !== req.cookies.user_id) {
    let templateErrors = renderError(403);
    res.statusCode = 403;
    res.render("/error_page", templateErrors);
  } else {
    let input = encodeURL(req.body.longURL);
    if (input === false) {
      let templateErrors = renderError(400);
      res.statusCode = 400;
      res.render("pages/error_page", templateErrors);
    } else {
      urlDatabase[req.params.shortURL].longURL = input;
      res.redirect("/urls");
    }
  }
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
  const userURLS = urlsForUser(req.cookies.user_id);
  // console.log(userURLS);
  let templateVars = {
    username: userDatabase[req.cookies.user_id],
    headTitle: "URL Index",
    urls: userURLS
  };
  // console.log(templateVars);
  res.render("pages/urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (userDatabase[req.cookies.user_id]) {
    let templateVars = {
      username: userDatabase[req.cookies.user_id],
      headTitle: "Add New URL"
    };
    res.render("pages/urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] !== undefined) {
    let templateVars = {
      username: userDatabase[req.cookies.user_id],
      headTitle: `TinyURL of ${urlDatabase[req.params.shortURL].longURL}`,
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL
    };
    // console.log(templateVars.longURL);
    res.render("pages/urls_show", templateVars);
  } else {
    let templateErrors = renderError(404);
    res.statusCode = 404;
    res.render("pages/error_page", templateErrors);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] !== undefined) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    let templateErrors = renderError(404);
    res.statusCode = 404;
    res.render("pages/error_page", templateErrors);
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
