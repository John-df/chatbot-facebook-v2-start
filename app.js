
'use strict';

const express = require('express');
const app = express();

app.set('port', (process.env.PORT || 5000))

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})

// Spin up the server
app.listen(app.get('port'), function () {
	console.log('running on port', app.get('port'))
})
