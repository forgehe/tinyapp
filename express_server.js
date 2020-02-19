const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const { secretKey, salt } = require("./secret.js");

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

const errorDatabase = {
  400: {
    name: "Bad Request",
    desc: "The server cannot process the request."
  },
  401: {
    name: "Unauthorized",
    desc: "authentication is required."
  },
  403: {
    name: "Forbidden",
    desc: "You do not have the necessary permissions."
  },
  404: {
    name: "Not Found",
    desc: "The requested resource could not be found."
  },
  405: {
    name: "Method Not Allowed",
    desc: "A requested method is not supported for the requested resource."
  },
  410: {
    name: "Gone",
    desc: "The resource requested is no longer available and will not be available again."
  },
  418: {
    name: "I'm a teapot",
    desc: "I am a teapot."
  },
  500: {
    name: "Internal Server Error",
    desc: "Internal Server Error. Please wait, and try again."
  },
  501: {
    name: "Not Implemented",
    desc: "The server does not recognize the request."
  }
};

// From: https://stackoverflow.com/a/8084248/6024104
const generateRandomString = () => {
  let output = Math.random()
    .toString(36)
    .substring(7);
  return output;
};

const checkEmail = (database, obj) => {
  const databaseArray = Object.values(database);
  const found = databaseArray.find(object => object.email === obj.email);
  return found;
};

const urlsForUser = (database, userID) => {
  let output = {};
  for (const objID in database) {
    // eslint-disable-next-line no-prototype-builtins
    if (database.hasOwnProperty(objID)) {
      if (database[objID].userID === userID) {
        output[objID] = database[objID];
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
  // eslint-disable-next-line no-useless-escape
  if (!newString.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)) {
    return false;
  }
  return newString;
};

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
  const user = checkEmail(userDatabase, req.body);
  if (!user) {
    let templateErrors = renderError(403);
    res.statusCode = 403;
    res.render("pages/error_page", templateErrors);
  } else {
    const pwCheck = bcrypt.compareSync(req.body.password, user.password);
    if (user && user.email === req.body.email && pwCheck) {
      req.session.userID = user.id;
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
    let templateErrors = renderError(400);
    res.statusCode = 400;
    res.render("pages/error_page", templateErrors);
  }
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let input = encodeURL(req.body.longURL);
  while (urlDatabase[shortURL]) {
    shortURL = generateRandomString();
  }
  if (input === false) {
    let templateErrors = renderError(400);
    res.statusCode = 400;
    res.render("pages/error_page", templateErrors);
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
    let templateErrors = renderError(403);
    res.statusCode = 403;
    res.render("/error_page", templateErrors);
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const userID = req.session.userID;
  if (urlDatabase[req.params.shortURL].userID !== userID) {
    let templateErrors = renderError(403);
    res.statusCode = 403;
    res.render("/error_page", templateErrors);
  } else {
    let input = encodeURL(req.body.editURL);
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
