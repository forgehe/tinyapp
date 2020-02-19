const bcrypt = require("bcrypt");

const salt = 5;
const secretKey = bcrypt.hashSync("secretsauce", salt);
module.exports = { secretKey, salt };
