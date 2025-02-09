const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
let bodyParser = require('body-parser');

mongoose.connect(process.env.MONGO_URI);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Define URL schema for MongoDB
const Schema = mongoose.Schema;

const ExerciseSchema = new Schema({
	username: { type: String, required: true },
	_id: { type: String, required: true },
	count: Number,
	log: [{description: String, duration: Number, date: Date}]
});

// Create a Model
let Exercise = mongoose.model("Exercise", ExerciseSchema);

// Mount bodyParse middleware for POST requests
app.use(bodyParser.urlencoded({extended: false}));

// (2) You can POST to /api/users with form data username to create a new user.
// (3) Returned response from POST /api/users with form data username will be an object with username and _id properties.
app.post('/api/users', async (req, res) => {
	var user = req.body.username;
	var count = await Exercise.countDocuments({});

	const userEntry = new Exercise({
		username: user,
		_id: makeid(24)
	})
	await userEntry.save();
	res.json({ username: userEntry.username, _id: userEntry._id });
})

// (4) GET request to /api/users returns a list of all users.
// (5) GET request to /api/users returns an array
// (6) Each element in the array returned from GET /api/users is an object literal containing a user's username and _id.
app.get('/api/users', async (req, res) => {
	var allDocs = await Exercise.find({});
	res.send(allDocs);
})

// (7) You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date.
// If no date is supplied, the current date will be used.
// (8) The response returned from POST /api/users/:_id/exercises will be the user object with the exercise
// fields added.
app.post('/api/users/:_id/exercises', async (req, res) => {
	// console.log('the request id is: ' + req.body[':_id']);
	// console.log('the request description is: ' + req.body.description);
	// console.log('the request duration is: ' + req.body.duration);
	// console.log('the request body payload is: ')
	// console.log(req.body);
	// console.log('the request parameters are: ')
	// console.log(req.params);

	const update = {
		date: req.body.date ? 
		(new Date(req.body.date)).toDateString() :
		(new Date()).toDateString(),
		duration: parseInt(req.body.duration),
		description: req.body.description
	};
	var Docs = await Exercise.findOne({_id: req.params._id}); // req.body[':_id'] does not pass FCC test 8 b/c the user id is in the params, not the body payload?
															 // I think this might have something to do with :_id vs _id on the body and params payloads respectively.
	if (Docs != null) {
		Docs.log.push(update);
		await Docs.save();
		res.json({ 
			_id: req.params._id,
			username: Docs.username,
			date: update.date,
			duration: update.duration,
			description: update.description
		});
	} else {
		console.log(Docs);
		res.json({error: "No ID found"});
	}
})

// (9) GET request to /api/users/:_id/logs retrieves a full exercise log of any user.
// (10) Request to /api/users/:_id/logs returns a user object with a count property representing the number of exercises for that user.
// (11) GET request to /api/users/:_id/logs will return the user object with a log array of all the exercises added.
// (12) Each item in the log array that is returned from GET /api/users/:_id/logs is an object that should have a description, duration, and date properties.
// (13) The description property of any object in the log array that is returned from GET /api/users/:_id/logs should be a string.
// (14) The duration property of any object in the log array that is returned from GET /api/users/:_id/logs should be a number.
// (15) The date property of any object in the log array that is returned from GET /api/users/:_id/logs should be a string. Use the dateString format of the Date API.
app.get('/api/users/:_id/logs', async (req, res) => {
	var Logs = await Exercise.findOne({_id: req.params._id});
	var count = Logs.log.length;
	var result = {
		username: Logs.username,
		count: count,
		_id: req.params._id,
		log: []
	};
	
	Logs.log.forEach(element => {
		result.log.push({
			description: element.description,
			duration: element.duration,
			date: element.date.toDateString()
		})
	});
	// console.log(result)

	// (16) You can add from, to and limit parameters to a GET /api/users/:_id/logs request to retrieve part of the log of any user. from and to are
	// dates in yyyy-mm-dd format. limit is an integer of how many logs to send back.
	var from = req.query.from;
	var to = req.query.to;
	var limit = req.query.limit;
	var filterResults = result;

	if(from != undefined & to != undefined) {
		var from_dateArray = from.split('-');
		var from_year = from_dateArray[0];
		var from_month = parseInt(from_dateArray[1]) - 1;
		var from_day = from_dateArray[2];
		var fromDate = new Date(from_year, from_month, from_day);

		var to_dateArray = to.split('-');
		var to_year = to_dateArray[0];
		var to_month = parseInt(to_dateArray[1]) - 1;
		var to_day = to_dateArray[2];
		var toDate = new Date(to_year, to_month, to_day);

		filterResults.log = result.log.filter(x => {
			return (new Date(x.date) >= fromDate) & (new Date(x.date) <= toDate);
		})

	}
	
	if(limit != undefined) {
		var logRemove = filterResults.log.length - limit;
		filterResults.log.splice(0, logRemove);
	}

	res.send(filterResults);
})

// Delete all records in the DB
app.get('/api/delete', async (req, res) => {
	var count = await Exercise.countDocuments({});
	console.log('deleting ' + count + ' documents...');
	await Exercise.deleteMany({});
	res.redirect('/');
})


app.get('/api/palindrome', (req, res) => {
	const result = 'textxet';
	res.send(palindrome(result));
	// res.send('hello');
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

// fcc test id for username jerfisc: 6762fdaf535b190013dd4aaf

// Generate random id for users
function makeid(length) {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;
	let counter = 0;
	while (counter < length) {
		result += characters.charAt(Math.random() * charactersLength);
		counter += 1;
	}
	return result;
}

// Test for palindrome
function palindrome(text) {
	const charlength = text.length;
	let newtext = '';
	for (i = charlength - 1; i >= 0; i--) {
		newtext += text[i];
	}
	const ispalindrome = newtext == text;
	let result = {
		'checking for palindrome': text,
		'text length': charlength,
		'new text': newtext,
		'is this a palindrome?': ispalindrome
	}

	return result;
}