const { assert } = require("chai");

const { generateRandomString, checkEmail, urlsForUser, renderError, encodeURL } = require("../helpers.js");

const testUsers = {
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

const testURLS = {
  sohmgx: {
    longURL: "https://forgehe.com",
    userID: "tuulm"
  },
  mddmp: {
    longURL: "https://kaka.moe",
    userID: "tuulm"
  },
  brz7rb: {
    longURL: "https://radfa.com",
    userID: "tuulm"
  },
  bb6hvr: {
    longURL: "https://rrr.com",
    userID: "b8l6k9"
  },
  "83j6tk": {
    longURL: "https://acdas.httm",
    userID: "b8l6k9"
  }
};

const testUsers2 = {
  tuulm: {
    id: "tuulm",
    email: "rrr",
    password: "$2b$05$1JdIDOfrsqCdjLTl68qbWenSsoFPylL3udZlfs1cyH3iQUFwinxCi"
  },
  b8l6k9: {
    id: "b8l6k9",
    email: "rr@r.com",
    password: "$2b$05$hQb7.1z/C1TY8eXmLqSGP.N6IXACeo8MIsv1POxbs.wCr8thG6tPa"
  }
};

describe("getUserByEmail", function() {
  it("should return a user with valid email", function() {
    const user = checkEmail(testUsers, { email: "user@example.com", password: "purple-monkey-dinosaur" });
    const expectedOutput = {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur"
    };
    assert.deepEqual(expectedOutput, user);
  });
  it("should return undefined if user with email is not found", function() {
    const user = checkEmail(testUsers, "user1@example.com");
    assert.strictEqual(undefined, user);
  });
  it("should return a user if the email matches,\n\tbut password is different", function() {
    const user = checkEmail(testUsers, { email: "user@example.com", password: "neat" });
    const expectedOutput = {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur"
    };
    assert.deepEqual(expectedOutput, user);
  });
});

describe("generateRandomString", function() {
  it("should generate a typeof String", function() {
    assert.typeOf(generateRandomString(), "string", "we have a string");
  });
});

describe("urlsForUser", function() {
  it("should return an object with url values for the specified user", function() {
    const expectedOutput = {
      bb6hvr: {
        longURL: "https://rrr.com",
        userID: "b8l6k9"
      },
      "83j6tk": {
        longURL: "https://acdas.httm",
        userID: "b8l6k9"
      }
    };
    const user = urlsForUser(testURLS, "b8l6k9");
    assert.deepEqual(expectedOutput, user);
  });
  it("should return an empty object for user that doesn't exist", function() {
    const expectedOutput = {};
    const user = urlsForUser(testURLS, "neat");
    assert.deepEqual(expectedOutput, user);
  });
});

describe("encodeURL", function() {
  it("should return the same string if http://, or https://\n\t is in the beginning of the string", function() {
    const input1 = "http://forgehe.com";
    const input1T = encodeURL("http://forgehe.com");
    assert.strictEqual(input1, input1T);

    const input2 = "https://forgehe.com";
    const input2T = encodeURL("https://forgehe.com");
    assert.strictEqual(input2, input2T);
  });
  it("should return the same string w/o whitespace if http/https\n\t is in the beginning of the string", function() {
    const input1 = encodeURL(" http://forgehe.com ");
    assert.strictEqual("http://forgehe.com", input1);

    const input2 = encodeURL("                  https://forgehe.com   ");
    assert.strictEqual("https://forgehe.com", input2);
  });
  it("should it should remove whitespace and append https:// if the string does not have it in the beginning", function() {
    const input1 = encodeURL("                  forgehe.com ");
    assert.strictEqual("https://forgehe.com", input1);
  });
  it("should return false if the link is not in valid url syntax", function() {
    const input1 = encodeURL("                  forgehe.com ");
    assert.strictEqual("https://forgehe.com", input1);

    const input8 = encodeURL("http://mail.forgehe.com");
    assert.strictEqual("http://mail.forgehe.com", input8);

    const input2 = encodeURL("                  forgehecom ");
    assert.strictEqual(false, input2);

    const input3 = encodeURL("                  forgehecom.commmmmmmmmmmm ");
    assert.strictEqual(false, input3);

    const input5 = encodeURL("blarf");
    assert.strictEqual(false, input5);

    const input7 = encodeURL("ftp://forgehe.com");
    assert.strictEqual(false, input7);
  });
});

// describe("renderError", function() {
// });
