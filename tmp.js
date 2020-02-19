var CryptoJS = require("crypto-js");

// Encrypt
var ciphertext = CryptoJS.AES.encrypt("my message", "secret key 123").toString();

// Decrypt
var bytes = CryptoJS.AES.decrypt(ciphertext, "secret key 123");
var originalText = bytes.toString(CryptoJS.enc.Utf8);

console.log(originalText); // 'my message'

var hash = CryptoJS.SHA512("Message");
const secretKey = CryptoJS.SHA512("SuperSecret");

console.log(originalText); // 'my message'
console.log(bytes);
console.log(hash.toString());
console.log(secretKey);

let crypoCookie = CryptoJS.AES.encrypt(req.cookies.user_id, secretKey).toString();

let crypoCookie = CryptoJS.AES.encrypt(user.id, secretKey).toString();

let decryptoCookie = CryptoJS.AES.decrypt(req.cookies.user_id, secretKey);
let userID = decryptoCookie.toString(CryptoJS.enc.Utf8);

let userID = decryptedCookie(req.cookies.user_id, secretKey);

let cryptoCookie = encryptedCookie(user.id, secretKey);

describe("getUserByEmail", function() {
  it("should explain the test here", function() {});
});
