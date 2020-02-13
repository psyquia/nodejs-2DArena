const Entity = require('./modules/entity.js');
const Player = require('./modules/player.js');
const Bullet = require('./modules/bullet.js');
const Button = require('./modules/button.js');
const Pickup = require('./modules/pickup.js');
const Platform = require('./modules/platform.js');


///*******************************************************///
/// CHOOSE THE NUMBER OF PLAYERS IN A MATCH

var NO_OF_PLAYERS = 2;	/// 2 OR 4 (1 vs 1 OR 2 vs 2)

///*******************************************************///

var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname+'/client'));

serv.listen(2000);
console.log("server started");

SOCKET_LIST = {};

DEBUG = true;

GLOBALS = {};

colors = {orange: 'rgb(255,110,0)', cyan: 'rgb(0,255,255)', green:'rgb(0,255,0)',
			iron: 'rgb(255,0,0)', purple: 'rgb(103,38,255)', rescue: 'rgb(73,38,106)'};

var game = {start: 0, running: 1, paused:2, over:3};

/// CHOOSE TEAM COLORS: 0 => TEAM 1; 1 => TEAM 2
var teams = {2:'cyan', 3:'orange', 0:'iron', 5:'green', 4:'purple', 1:'rescue'};


var prev_game = {winner: '', color: 'rgba(0,0,0,0)'};

GLOBALS.state = game.start;

GLOBALS.NO_OF_PLAYERS = NO_OF_PLAYERS;

GLOBALS.ready_players = {};

GLOBALS.SOCKET_LIST = SOCKET_LIST;

GLOBALS.spawn = {};

GLOBALS.spawn.points = {};

GLOBALS.spawnSlots = {};

GLOBALS.kills = {};

var scores = {};

var timer_max = 5;

var round = {no:0, timer:timer_max, checkTimer: false, seconds:0};

Object.size = function(obj) { 
	var size = 0, key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) 
			size++; 
	} 
	return size; 
};

var init = function(){
	round.no = 0;

	scores = {0:0, 1:0};

	GLOBALS.ready_players = {};

	GLOBALS.ready_players.id = {}

	GLOBALS.ready_players.count = {0:0, 1:0}

	GLOBALS.players = {};

	GLOBALS.bullets = {};

	GLOBALS.platforms = {};

	GLOBALS.pickups = [];

	GLOBALS.buttons = {};
		var butt = new Button(GLOBALS, 475,253,150,75, colors[teams[1]], 'ready_1');
		var butt = new Button(GLOBALS, 275,253,150,75, colors[teams[0]], 'ready_0');

	//GLOBALS.stage_1();

	GLOBALS.spawn.slots = {0: false, 1: false, 2: false, 3: false};
	GLOBALS.spawn.points = {0:{x:50,y:370}, 1:{x:150,y:370}, 2:{x:840,y:370}, 3:{x:740,y:370}, 4:{x:-100,y:-100}, 5:{x:-100,y:-100}};
	
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		Player.onConnect(socket);
	}
	
}

GLOBALS.stage_1 = function(){
	round.timer = timer_max + 1;
	round.checkTimer = true;
	var time = new Date();
	round.seconds = time.getSeconds(); 

	GLOBALS.kills = {0:0, 1:0};

	GLOBALS.spawn.points = {0:{x:50,y:370}, 1:{x:150,y:370}, 2:{x:840,y:370}, 3:{x:740,y:370}, 4:{x:-100,y:-100}, 5:{x:-100,y:-100}};

	GLOBALS.platforms = {};
		var plat = new Platform(GLOBALS, 0,400,900,150,'rgb(30,30,30)');
		var plat = new Platform(GLOBALS, 445-50,330,100,70,'rgb(50,50,50)');

		var plat = new Platform(GLOBALS, 150-45,300,90,20,'rgb(255,0,0)');
		var plat = new Platform(GLOBALS, (890-150)-45,300,90,20,'rgb(0,0,255)');

		var plat = new Platform(GLOBALS, 280-35,230,70,20,'rgb(200,0,55)');
		var plat = new Platform(GLOBALS, (890-280)-35,230,70,20,'rgb(55,0,200)');

		var plat = new Platform(GLOBALS, 445-40,125,80,25,'rgb(255,0,255)');

	GLOBALS.pickups = [];
		var pick = new Pickup(GLOBALS, 445,319,8,'cone','rgb(255,50,50');
		var pick = new Pickup(GLOBALS, 445,115,8,'wallbang','rgb(255,50,50)');
}

GLOBALS.onReady = function(socket,team){
	if(GLOBALS.ready_players.count[team]>=NO_OF_PLAYERS/2){
		return false;
	}
	GLOBALS.ready_players.count[team]++;
	var player = Player.addPlayer(socket,team);

	if(player){
		socket.on('keyPress', function(data){
			if(data.inputId === 'left'){
				player.key.left = data.state;
			}
			else if(data.inputId === 'right')
				player.key.right = data.state;
			else if(data.inputId === 'up')
				player.key.up = data.state;
			else if(data.inputId === 'down')
				player.keyDown = data.state;
			else if(data.inputId === 'attack')
				player.key.shoot = data.state;
			else if(data.inputId === 'mouseAngle')
				player.mouseAngle = data.state;
		});
	}

	return true;
}

var round_end = function(){
	if(GLOBALS.kills[0] == GLOBALS.ready_players.count[1]){
		scores[0]++;
		round.no++;
		GLOBALS.stage_1();
	}
	else if(GLOBALS.kills[1] == GLOBALS.ready_players.count[0]){
		scores[1]++;
		round.no++;
		GLOBALS.stage_1();
	}

	if(scores[0] == 3 || scores[1] == 3){
		prev_game.winner = (scores[0] ==3) ? teams[0] : teams[1];
		prev_game.color = (scores[0] ==3) ? colors[teams[0]] : colors[teams[1]];
		GLOBALS.state = game.over;
		init();
		return;
	}
	for(var i in GLOBALS.spawnSlots){
		GLOBALS.spawnSlots[i] = false;
	}
	for(var i in GLOBALS.bullets){
		delete GLOBALS.bullets[i];
	}
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		if(GLOBALS.players[socket.id].in){
			GLOBALS.players[socket.id].respawn(GLOBALS);
		}
	}
}

var game_end = function(){
	GLOBALS.buttons = {};
		var butt = new Button(GLOBALS, 400,253,100,75,'rgb(0,200,0)');
}
//----------------------------------------------------------------------//



Player.addPlayer = function(socket,team){
	var i = Player.chooseSpawn(team);

	var player = GLOBALS.players[socket.id];
	player.in = true;
	player.alive = true;
	player.x = GLOBALS.spawn.points[i].x - player.hitbox.xoff - Math.ceil(player.hitbox.width/2);
	player.y = GLOBALS.spawn.points[i].y;

	player.slot = i;
	player.armorKey = Math.floor(i/2);
	player.facingRight = (i<2) ? true : false; 
	GLOBALS.spawnSlots[i] = true;

	return player;
}

Player.chooseSpawn = function(team){
	var j = 0;
	if(team == 0){
		if(GLOBALS.spawnSlots[0])
			j = 1;
		else if(GLOBALS.spawnSlots[1])
			j = 0;
		else if(NO_OF_PLAYERS>2)
			j = Math.floor(Math.random() * 10)%2;
		else
			j = 0;
	}else if(team == 1){
		if(GLOBALS.spawnSlots[2])
			j = 3;
		else if(GLOBALS.spawnSlots[3])
			j = 2;
		else if(NO_OF_PLAYERS>2)
			j = Math.floor(Math.random() * 10)%2 + 2;
		else
			j = 2;
	}
	return j;
}




Player.onConnect = function(socket){
	var player = new Player(GLOBALS,socket.id);
}

Player.onDisconnect = function(socket){
	var dcPlayer = GLOBALS.players[socket.id];
	if(GLOBALS.ready_players.id[socket.id]){
		GLOBALS.ready_players.id[socket.it] = false;
		GLOBALS.ready_players.count[dcPlayer.armorKey]--;
		GLOBALS.spawnSlots[dcPlayer.slot] = false;
	}

	delete GLOBALS.players[socket.id];
}

Player.update = function(){
	var pack = [];
	for(var i in GLOBALS.players){
		var player = GLOBALS.players[i];
		if(round.timer==0 && player.alive)
			player.p_update(GLOBALS);
		pack.push(player);
	}
	return pack;
}

Player.living = function(){
	var x = 0;
	for(var i in GLOBALS.players){
		if(GLOBALS.players[i].alive === true)
			++x;
	}
	return x;
}


Bullet.update = function(){
	var pack = [];
	for(var i in GLOBALS.bullets){
		var bullet = GLOBALS.bullets[i];
		bullet.p_update(GLOBALS);
		if(bullet.toRemove)
			delete GLOBALS.bullets[i];
		else{
			pack.push(bullet);
		}
	}
	return pack;

}

//----------------------------------------------------------------------//


Platform.update = function(){
	var pack = [];
	for(i in GLOBALS.platforms){
		pack.push(GLOBALS.platforms[i]);
	}
	return pack;
}

//----------------------------------------------------------------------//


Pickup.update = function(){
	var pack = [];
	for(i in GLOBALS.pickups){
		pack.push(GLOBALS.pickups[i]);
	}
	return pack;
}


//----------------------------------------------------------------------//



Button.update = function(){
	var pack = [];
	for(i in GLOBALS.buttons){
		button = GLOBALS.buttons[i];
		pack.push(button);
	}
	return pack;
}
Button.updateColor = function(pack,ID){
	for(var i in pack){
		if(GLOBALS.buttons[pack[i].id].clickedBy[ID]){
			pack[i].color = 'rgb(170,170,170)';
		}else{
			pack[i].color = GLOBALS.buttons[pack[i].id].color;
		}
	}	
}

//----------------------------------------------------------------------//
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	if(!Object.size(SOCKET_LIST)){
		init();	
	}

	socket.emit('init',{
		team_names: teams,
		NO_OF_PLAYERS 
	});

	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	Player.onConnect(socket);

	socket.on('disconnect', function(){
		delete SOCKET_LIST[socket.id];
		Player.onDisconnect(socket);
	});

	socket.on('sendMsgToServer', function(data){
		var playerName = ("" + socket.id).slice(2,7);
		for(var i in SOCKET_LIST){
			SOCKET_LIST[i].emit('addToChat',playerName + ": " + data);
		}
	});

	socket.on('evalServer',function(data){
		if(!DEBUG) return;
		var res = eval(data);
		socket.emit('evalAnswer',res);
	});
	socket.on('mouseClick', function(data){
		for(var i in GLOBALS.buttons){
			var button = GLOBALS.buttons[i];
			button.collision(GLOBALS,data,socket.id);
		}
	});
	
});


var loop = {};

loop.running = function(){
	if(round.checkTimer){
		var nowD = new Date();
		var now = nowD.getSeconds();
		if(round.timer < 0){
			round.timer = 0;
			round.checkTimer = false;
		}else if(now == (round.seconds+(timer_max+1-round.timer))%60){
			round.timer--;
		}
	}
	if(GLOBALS.kills[0] == GLOBALS.ready_players.count[1] || GLOBALS.kills[1] == GLOBALS.ready_players.count[0]){
		round_end();
	}

	var pack = {
		player:Player.update(),
		bullet:Bullet.update(),
		platform:Platform.update(),
		pickup:Pickup.update(),
		score:scores,
		round:round,
	}
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		pack.myID = socket.id;
		socket.emit('newPosition', pack);
	}	
}

loop.start = function(lastGame){
	if(arguments.length)
		prev_game = lastGame;
	
	var pack = {
		button:Button.update(),
		players:Object.size(GLOBALS.ready_players.id),
		prev: prev_game,
		ready_players:GLOBALS.ready_players,

	};
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		pack.myID = socket.id;
		socket.emit('menuPos', pack);
	}
}

loop.over = function(){
	GLOBALS.state = game.start;
	loop.start(prev_game);
}


setInterval(function(){
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('gameState', GLOBALS.state);
	}


	if(GLOBALS.state == game.start){
		loop.start();
	}else if(GLOBALS.state == game.running){
		loop.running();
	}else if(GLOBALS.state == game.over){
		loop.over();
	}
	
},1000/65);

