const express = require("express");
const router = express.Router();

require("./heartbeat")(router);
require("./auth")(router);
require("./user")(router);
require("./game")(router);
module.exports = router;
