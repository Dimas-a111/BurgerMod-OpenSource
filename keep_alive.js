const express = require('express');
const app = express();
const port = 3000;

// This endpoint answers any incoming pings
app.get('/', (req, res) => {
  res.send('Bot is alive!');
});

function keepAlive() {
  app.listen(port, () => {
    console.log(`Keep-alive server is running on port ${port}`);
  });
}

module.exports = keepAlive;
