const express = require("express");
const router = express.Router();
const { generateRandomString, urlsForUser, renderError, encodeURL } = require("../helpers.js");
const { urlDatabase, userDatabase } = require("../database.js");

module.exports = function() {
  // POST request to create a new shortURL
  router.post("/", (req, res) => {
    if (!req.session.userID) {
      renderError(res, 403, "Please Login First Before Creating an URL.");
    } else {
      const input = encodeURL(req.body.longURL);
      if (!input) {
        renderError(res, 400, "Invalid Link. Try Again.");
      } else {
        // checks if randomURL was already generated before, and regenerates a new one if needed
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
        res.redirect(`../urls/${shortURL}`);
      }
    }
  });

  // DELETE shortURL from /urls
  router.delete("/:shortURL", (req, res) => {
    if (urlDatabase[req.params.shortURL].userID !== req.session.userID) {
      renderError(res, 403, "Invalid Operation");
    } else {
      delete urlDatabase[req.params.shortURL];
      res.redirect("../urls");
    }
  });

  // PUT shortURL from :shortURL page
  router.put("/:shortURL", (req, res) => {
    if (urlDatabase[req.params.shortURL].userID !== req.session.userID) {
      renderError(res, 403, "You do not have access to edit this URL");
    } else {
      const input = encodeURL(req.body.editURL);
      if (input === false) {
        renderError(res, 400, "Invalid Link. Try Again.");
      } else {
        urlDatabase[req.params.shortURL].longURL = input;
        res.redirect("../urls");
      }
    }
  });

  router.get("/", (req, res) => {
    const userURLS = urlsForUser(urlDatabase, req.session.userID);
    res.templateVars.urls = userURLS;
    res.templateVars.headTitle = "My URLs";
    res.render("pages/urls_index", res.templateVars);
  });

  router.get("/new", (req, res) => {
    if (!userDatabase[req.session.userID]) {
      res.redirect("/login");
    } else {
      res.templateVars.headTitle = "Add New URL";
      res.render("pages/urls_new", res.templateVars);
    }
  });

  router.get("/:shortURL", (req, res) => {
    if (urlDatabase[req.params.shortURL] === undefined) {
      renderError(res, 404, "TinyURL not found. Check your address's spelling and try again.");
    } else {
      res.templateVars.shortURLObj = urlDatabase[req.params.shortURL];
      res.templateVars.headTitle = `TinyURL of ${urlDatabase[req.params.shortURL].longURL}`;
      res.render("pages/urls_show", res.templateVars);
    }
  });

  return router;
};
