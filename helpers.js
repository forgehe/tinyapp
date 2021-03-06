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

const encodeURL = string => {
  let newString = string.trim();
  if (!(newString.startsWith("http://") || newString.startsWith("https://"))) {
    newString = "https://" + newString;
  }
  newString = encodeURI(newString);
  // from: https://stackoverflow.com/a/3809435/6024104 (restrictive version)
  // eslint-disable-next-line no-useless-escape
  if (!newString.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)) {
    return;
  }
  return newString;
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

const addAnalytic = (database, req, shortURL) => {
  const time = new Date();
  if (!req.session.visitorID) {
    req.session.visitorID = generateRandomString();
  }
  const visitor = {
    id: req.session.visitorID,
    time: time.toUTCString()
  };
  const newVisitor = database[shortURL].visitors.find(obj => obj.id === visitor.id);
  database[shortURL].count += 1;
  if (!newVisitor) {
    database[shortURL].uniqueCount += 1;
  }
  database[shortURL].visitors.push(visitor);
};

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

const renderError = (res, errorCode, extraText) => {
  let templateErrors = {
    username: null,
    errorCode: errorCode,
    errorDatabase: errorDatabase,
    extraText: extraText
  };
  res.statusCode = errorCode;
  res.render("pages/error_page", templateErrors);
};

module.exports = { generateRandomString, checkEmail, urlsForUser, renderError, encodeURL, addAnalytic };
