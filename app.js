const PORT = process.env.PORT || 5000,
express = require('express');
path = require('path')
app = express();

app.use('/',express.static(path.join(__dirname, 'build')))
app.locals.blockchainurl = process.env.BLOCKCHAIN_URL;

app.get('/urltouse', function(req, res) {
    res.send(req.app.locals.blockchainurl);
});
app.listen(PORT)
