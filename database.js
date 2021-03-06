var mysql = require('mysql');

var connection = mysql.createConnection({
	host: process.env.HOST,
	user: process.env.USER,
	password: process.env.PASSWORD,
	database: process.env.DB
});


connection.connect(function(err) {
	if(err) throw err;
	console.log("Connected!");
	
});


var getHash = async function(user){
	return new Promise(function(resolve, reject){
		var sql = "SELECT hashed_pass FROM users WHERE username = ?";
		connection.query(sql, [user.username], function(err,result,fields){
			if (err){
				console.log(err);
				reject('SQL Query Error');
			} 
			else if(result.length>0){
				user.hash = result[0].hashed_pass;
			}else{
				reject("User was not found");
			}
			resolve('working');
		});
	});
}

var setUser = async function(user){
	return new Promise(function(resolve, reject){
		var sql = "INSERT INTO users (username, hashed_pass) VALUES (?, ?)";
		connection.query(sql, [user.username, user.hash], function(err,result,fields){
			if (err){
				reject('SQL Query Error');
			} 
			resolve('User added');
		});
	});
}

var userExists = async function(user){
	return new Promise(function(resolve, reject){
		var sql = "SELECT username FROM users WHERE username = ?";
		connection.query(sql, [user.username], function(err,result,fields){
			if (err){
				reject('SQL Query Error');
			}
			else if(result.length>0){
				resolve('user found');
			}
			reject('user does not exit');
		});
	});
}

var endConnection = function(){
	connection.end();
}

module.exports = {getHash: getHash, setUser: setUser, userExists:userExists, end:endConnection};
