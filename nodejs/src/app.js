const express = require("express");
const app = express();
const path = require("path");
const port = 4000;

// Serve static files from the "pages" directory
app.use(express.static(path.join(__dirname, "pages")));

// Redirect the root route to /login
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Define the /login route to serve login.html
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "pages/login/login.html"));
});

app.listen(port, () => {
  console.log(`Nodejs listening at http://localhost:${port}`);
});
