const PORT = process.env.PORT || 5000,
    express = require('express');
    path = require('path')
    app = express();

app.use(express.static(path.join(__dirname, 'build')))
console.log("process.env.BLOCKCHAIN_URL"+process.env.BLOCKCHAIN_URL);
app.listen(PORT)
