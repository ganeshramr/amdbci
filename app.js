const PORT = process.env.PORT || 5000,
    express = require('express');
    path = require('path')
    app = express();

app.use(express.static(path.join(__dirname, 'build')))

app.listen(PORT)
