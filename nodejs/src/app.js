const express = require("express");
const app = express();
const port = 4000;


app.get('/', (req, res) => {
  res.send('Transcendence is live!');
});

app.listen(port, () => {
  console.log(`Nodejs listening at http://localhost:${port}`);
});
