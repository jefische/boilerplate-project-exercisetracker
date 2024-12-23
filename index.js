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
app.get('/api/users', async (req, res) => {
	var allDocs = await Exercise.find({});
	res.send(allDocs);
})

// Delete all records in the DB
app.get('/api/delete', async (req, res) => {
	var count = await Exercise.countDocuments({});
	console.log('deleting ' + count + ' documents...');
	await Exercise.deleteMany({});
	res.redirect('/');
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