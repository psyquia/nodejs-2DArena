const Entity = require('./entity.js')

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

var SOCKET_LIST = {};

DEBUG = true;

colors = {orange: 'rgb(255,110,0)', cyan: 'rgb(0,255,255)', green:'rgb(0,255,0)',
			iron: 'rgb(255,0,0)', purple: 'rgb(103,38,255)', rescue: 'rgb(73,38,106)'};

var game = {start: 0, running: 1, paused:2, over:3};

/// CHOOSE TEAM COLORS: 0 => TEAM 1; 1 => TEAM 2
var teams = {2:'cyan', 3:'orange', 0:'iron', 5:'green', 4:'purple', 1:'rescue'};

var state = game.start;

var prev_game = {winner: '', color: 'rgba(0,0,0,0)'};

var ready_players = {};

var spawn = {};
spawn.points = {};
spawn.slots = {};

var scores = {};
var kills = {};

var round = {no:0, timer:5, checkTimer: false, seconds:0};

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

	ready_players = {};
	ready_players.id = {}
	ready_players.count = {0:0, 1:0}

	scores = {0:0, 1:0};
	
	Player.list = {};

	Bullet.list = {};

	Button.list = {};
		var butt = new Button(475,253,150,75, colors[teams[1]], 'ready_1');
		var butt = new Button(275,253,150,75, colors[teams[0]], 'ready_0');

	//stage_1();

	spawn.slots = {0: false, 1: false, 2: false, 3: false};
	spawn.points = {0:{x:50,y:370}, 1:{x:150,y:370}, 2:{x:840,y:370}, 3:{x:740,y:370}, 4:{x:-100,y:-100}, 5:{x:-100,y:-100}};
	
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		Player.onConnect(socket);
	}
	
}

var stage_1 = function(){
	round.timer = 6;
	round.checkTimer = true;
	var time = new Date();
	round.seconds = time.getSeconds(); 

	kills = {0:0, 1:0};

	spawn.points = {0:{x:50,y:370}, 1:{x:150,y:370}, 2:{x:840,y:370}, 3:{x:740,y:370}, 4:{x:-100,y:-100}, 5:{x:-100,y:-100}};

	Platform.list = {};
		var plat = new Platform(0,400,900,150,'rgb(30,30,30)');
		var plat = new Platform(445-50,330,100,70,'rgb(50,50,50)');

		var plat = new Platform(150-45,300,90,20,'rgb(255,0,0)');
		var plat = new Platform((890-150)-45,300,90,20,'rgb(0,0,255)');

		var plat = new Platform(280-35,230,70,20,'rgb(200,0,55)');
		var plat = new Platform((890-280)-35,230,70,20,'rgb(55,0,200)');

		var plat = new Platform(445-40,125,80,25,'rgb(255,0,255)');

	Pickup.list = [];
		var pick = new Pickup(445,319,8,'cone','rgb(255,50,50');
		var pick = new Pickup(445,115,8,'wallbang','rgb(255,50,50)');
}

var round_end = function(){
	if(kills[0] == ready_players.count[1]){
		scores[0]++;
		round.no++;
		stage_1();
	}
	else if(kills[1] == ready_players.count[0]){
		scores[1]++;
		round.no++;
		stage_1();
	}

	if(scores[0] == 3 || scores[1] == 3){
		prev_game.winner = (scores[0] ==3) ? teams[0] : teams[1];
		prev_game.color = (scores[0] ==3) ? colors[teams[0]] : colors[teams[1]];
		state = game.over;
		init();
		return;
	}
	for(var i in spawn.slots){
		spawn.slots[i] = false;
	}
	for(var i in Bullet.list){
		delete Bullet.list[i];
	}
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		if(Player.list[socket.id].in){
			Player.list[socket.id].respawn();
		}
	}
}

var game_end = function(){
	Button.list = {};
		var butt = new Button(400,253,100,75,'rgb(0,200,0)');
}
//----------------------------------------------------------------------//

class Player extends Entity{
	constructor(id,x,y){
		if(arguments.length>1){
			super(x,y);
			this.alive = true;
			this.in = true;
		}else{
			super();
			this.alive = false;
			this.in = false
		}
		this.id = id;
		this.number = "" + Math.floor(10 * Math.random());
		this.key = {right: false, left: false, up: false, 
			down: false, shoot: false};
		this.mouseAngle = 0;
		this.maxSpd = 5;
		this.acc = 0.7;
		this.walk = {count:10, frame:1};
		this.walking = false;
		this.jump = {count:10, frame:1};
		this.jumping = false;
		this.state = 'walk';
		this.facingRight = true;
		this.shootCd = 0;
		this.gun = 'normal';
		this.slot = -1;
		this.armorKey = 0;
		this.armors = teams;
		this.hitbox = {px:this.x-5, py:this.y-19, width:27, height:49, 
			xoff: -5, yoff: -19};
		this.maxHp = 100;
		this.hp = this.maxHp;
		this.canJump = true;
		Player.list[id] = this
	}

	respawn(){
		var j = Player.chooseSpawn(this.armorKey);

		spawn.slots[j] = true;
		this.hp = this.maxHp;
		this.state = 'walk';
		this.walk = {count:10, frame:1};
		this.jump = {count:10, frame:1};
		this.alive = true;
		this.gun = 'normal';
		this.x = spawn.points[j].x - this.hitbox.xoff - Math.ceil(this.hitbox.width/2);
		this.y = spawn.points[j].y;
		this.armorKey = Math.floor(j/2);
		this.facingRight = (j<2) ? true : false;
		
	}

	p_update(){
		for(var i in Player.list){
			var inc_player = Player.list[i];
			if(this.collision(inc_player)){
			}
		}
		for(var i in Bullet.list){
			var inc_bullet = Bullet.list[i];
			if(inc_bullet.team != this.armorKey &&
			this.collision(inc_bullet)){
				inc_bullet.toRemove = true;
				if(this.hp>0)
					this.hp -= inc_bullet.dmg[inc_bullet.type];
			}
		}
		if(this.hp<=0){
			this.alive = false;
			this.x = -1000;
			this.y = 1000;
			this.hp = 100;
			this.hitboxUpdate();
			kills[(this.armorKey+1)%2]++;
		}
		for(var i in Pickup.list){
			var pickup = Pickup.list[i];
			if(this.collision(pickup)){
				pickup[pickup.effect](this);
				delete Pickup.list[i];
			}
		}
		this.updateSpd()
		if(this.walking){
			if(this.walk.count < 45){
				this.walk.count++;
			}else{
				this.walk.count = 1;
			}
			this.walk.frame = Math.ceil(this.walk.count/5);
		}else{
			this.walk.count = 1;
			this.walk.frame = 1;
		}
		if(this.jumping){
			if(this.jump.count < 15){
				this.jump.count++;
			}else{
				this.jump.frame = 3;
			}
			this.jump.frame = Math.ceil(this.jump.count/5);
		}else{
			this.jump.count = 1;
			this.jump.frame = 1;
		}
		super.update();

		if(this.shootCd == 0){
			if(this.key.shoot)
				this.shootGun();
		}else this.shootCd--;
	} 

	updatePosition(){
		var xMax = this.x + this.spdX;
		var yMax = this.y + this.spdY + 0.5 * this.acc; //this.y+this.spdY;
		var newY, newX;
		var colX = false; var colY = false;
		for(var i in Platform.list){
			var inc_platform = Platform.list[i];

			// Y collision
			this.y += this.spdY;
			if(this.collision(inc_platform)){
				colY = true;
				if(this.spdY>0){
					this.jumping = false;
					this.canJump = true;
					this.state = 'walk';
					newY = inc_platform.hitbox.py - this.hitbox.height 
					- this.hitbox.yoff;
				}else{
					newY = inc_platform.hitbox.py + inc_platform.hitbox.height
					- this.hitbox.yoff;
				}
				this.spdY = 0;
			}
			this.y -= this.spdY;
			
			if(colY)
				break;
		}
		this.y = !colY ? yMax : newY;

		for(var a in Platform.list){
			var inc_platform = Platform.list[a];
			// X collision
			this.x += this.spdX;
			if(this.collision(inc_platform)){
				colX = true;
				if(this.spdX > 0){
					newX = inc_platform.hitbox.px - this.hitbox.width
					- this.hitbox.xoff;
				}else{
					newX = inc_platform.hitbox.px+inc_platform.hitbox.width
					- this.hitbox.xoff;
				}
			}else if(this.hitbox.px <= 0){
				colX = true;
				this.x  = -this.hitbox.xoff;
			}else if(this.hitbox.px + this.hitbox.width >= 890){
				colX = true;
				this.x = 890 - this.hitbox.xoff - this.hitbox.width;
			}
			this.x -= this.spdX;

			if(colX)
				return;
		}
		this.x = !colX ? xMax : newX;

	}

	shootGun(){
		var dir = this.facingRight ? 0 : 180;
		switch(this.gun){
			case 'normal':
				this.shootBullet(dir,10,3,'rgb(0,180,255)',1,0);
				this.shootCd = 5;
				break;
			case 'cone':
				for(var i = -2; i < 3; i++) this.shootBullet(dir+i*3,8,5,'rgb(255,50,50)',1,0);
				this.shootCd = 5;
				break;
			case 'wallbang':
				this.shootBullet(dir,40,4,'rgb(255,0,255)',3,-15);
				this.shootCd = 10;
		}
		
	}

	shootBullet(angle,width,height,color,vel,off){
		var b = new Bullet(this.id, angle, vel);
		b.x = this.facingRight ? this.x + 10 + off : this.x - width/2-5;
		b.y = this.y+10;
		b.hitbox.width = width;
		b.hitbox.height = height;
		b.color = color;
		b.type = this.gun; 
	}

	collision(object){
		if(object==this) return false;

		//Update hitboxes
		this.hitboxUpdate();
		object.hitboxUpdate();

		//p.Left < o.Right && o.Lelf < p.Right
		if(this.hitbox.px < object.hitbox.px+object.hitbox.width
			&& object.hitbox.px < this.hitbox.px + this.hitbox.width){
			//p.Top < o.Bottom && o.Top < p.Bottom
			if(this.hitbox.py < object.hitbox.py + object.hitbox.height
				&& object.hitbox.py < this.hitbox.py + this.hitbox.height){
				return true;
			}
		}
		return false;
	}
	hitboxUpdate(){
		this.hitbox.px = this.x-5;
		this.hitbox.py = this.y-19;
	}

	updateSpd(){
		if(this.key.right){
			this.spdX = this.maxSpd;
			this.facingRight = true;
		}else if(this.key.left){
			this.spdX = -this.maxSpd;
			this.facingRight = false;
		}else 
			this.spdX = 0;

		if(this.key.up && this.canJump){
			this.spdY = -13;
			this.jumping = true;
			this.canJump = false;
			this.state = 'jump';
		}
		this.spdY += this.acc;

		if(this.spdX != 0){
			this.walking = true;
		}
		else
			this.walking = false;
	}
}

Player.addPlayer = function(socket,team){
	var i = Player.chooseSpawn(team);

	var player = Player.list[socket.id];
	player.in = true;
	player.alive = true;
	player.x = spawn.points[i].x - player.hitbox.xoff - Math.ceil(player.hitbox.width/2);
	player.y = spawn.points[i].y;
	player.slot = i;
	player.armorKey = Math.floor(i/2);
	player.facingRight = (i<2) ? true : false; 
	spawn.slots[i] = true;

	return player;
}

Player.chooseSpawn = function(team){
	var j = 0;
	if(team == 0){
		if(spawn.slots[0])
			j = 1;
		else if(spawn.slots[1])
			j = 0;
		else if(NO_OF_PLAYERS>2)
			j = Math.floor(Math.random() * 10)%2;
		else
			j = 0;
	}else if(team == 1){
		if(spawn.slots[2])
			j = 3;
		else if(spawn.slots[3])
			j = 2;
		else if(NO_OF_PLAYERS>2)
			j = Math.floor(Math.random() * 10)%2 + 2;
		else
			j = 2;
	}
	return j;
}


Player.onReady = function(socket,team){
	if(ready_players.count[team]>=NO_OF_PLAYERS/2){
		return false;
	}
	ready_players.count[team]++;
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

Player.onConnect = function(socket){
	var player = new Player(socket.id);
}

Player.onDisconnect = function(socket){
	var dcPlayer = Player.list[socket.id];
	if(ready_players.id[socket.id]){
		ready_players.id[socket.it] = false;
		ready_players.count[dcPlayer.armorKey]--;
		spawn.slots[dcPlayer.slot] = false;
	}

	delete Player.list[socket.id];
}

Player.update = function(){
	var pack = [];
	for(var i in Player.list){
		var player = Player.list[i];
		if(round.timer==0 && player.alive)
			player.p_update();
		pack.push(player);
	}
	return pack;
}

Player.living = function(){
	var x = 0;
	for(var i in Player.list){
		if(Player.list[i].alive === true)
			++x;
	}
	return x;
}

//----------------------------------------------------------------------//
class Bullet extends Entity{
	constructor(parent, angle, vel){
		if(!arguments[2]){
			var vel = 1;
		}
		super();
		this.id = Math.random();
		this.spdX = Math.cos(angle/180*Math.PI)*10 * vel;
		this.spdY = Math.sin(angle/180*Math.PI)*10 * vel;
		this.parent = parent;
		this.team = Player.list[parent].armorKey;
		this.timer = 0;
		this.toRemove = false;
		this.type = 'wallbang';
		this.hitbox = {px:this.x+4, py:this.y, width:7, height:5};
		this.dmg = {normal:5, cone:2, wallbang:15};
		Bullet.list[this.id] = this;
	}
	p_update(){
		if(this.timer++>100)
			this.toRemove = true;
		for(var i in Platform.list){
			var platform = Platform.list[i];
			if(this.collision(platform)){
				delete Bullet.list[this.id];
			}
		}
		super.update();
		this.hitboxUpdate();
	}

	hitboxUpdate(){
		this.hitbox.px = this.x+4;
		this.hitbox.py = this.y;
	}
	collision(object){
		if(object==this) return false;
		if(this.type === 'wallbang') return false;

		//Update hitboxes
		this.hitboxUpdate();
		object.hitboxUpdate();

		//p.Left < o.Right && o.Lelf < p.Right
		if(this.hitbox.px < object.hitbox.px+object.hitbox.width
			&& object.hitbox.px < this.hitbox.px + this.hitbox.width){
			//p.Top < o.Bottom && o.Top < p.Bottom
			if(this.hitbox.py < object.hitbox.py + object.hitbox.height
				&& object.hitbox.py < this.hitbox.py + this.hitbox.height){
				return true;
			}
		}
		return false;
	}
}

Bullet.update = function(){
	var pack = [];
	for(var i in Bullet.list){
		var bullet = Bullet.list[i];
		bullet.p_update();
		if(bullet.toRemove)
			delete Bullet.list[i];
		else{
			pack.push(bullet);
		}
	}
	return pack;

}

//----------------------------------------------------------------------//
class Platform extends Entity{
	constructor(x,y,width,height,color){
		super(x,y);
		this.id = Math.random();
		this.width = width;
		this.height = height;
		this.hitbox = {px:this.x, py:this.y, width:this.width, height:this.height}
		this.color = color;
		Platform.list[this.id] = this;
	}

}

Platform.update = function(){
	var pack = [];
	for(i in Platform.list){
		pack.push(Platform.list[i]);
	}
	return pack;
}

//----------------------------------------------------------------------//
class Pickup extends Entity{
	constructor(x,y,radius,effect,color){
		super(x,y);
		this.radius = radius;
		this.color = color;
		this.effect = effect;
		this.hitbox = {px: this.x-this.radius, py: this.y - this.radius, 
			width: this.radius*2, height: this.radius*2};
		Pickup.list.push(this);
	}
	cone(player){
		player.gun = 'cone';
	}
	wallbang(player){
		player.gun = 'wallbang';
	}

}

Pickup.update = function(){
	var pack = [];
	for(i in Pickup.list){
		pack.push(Pickup.list[i]);
	}
	return pack;
}


//----------------------------------------------------------------------//
class Button extends Entity{
	constructor(x,y,width,height,color,action){
		super(x,y);
		this.id = Math.random();
		this.hitbox = {px:this.x, py:this.y, width:width, height:height}
		this.action = action;
		this.clickedBy = {};
		this.color = color;
		this.newColor = 'rgb(120,120,120)';
		Button.list[this.id] = this;
	}

	collision(coor, ID){
		if(coor.x > this.hitbox.px && coor.x < this.hitbox.px + this.hitbox.width)
			if(coor.y > this.hitbox.py && coor.y < this.hitbox.py + this.hitbox.height){
				if(this[this.action](ID)) 
					this.clickedBy[ID] = true;
				
				return true;
			}
		return false;
	}
	ready_0(ID){
		if(!ready_players.id[ID] && Player.onReady(SOCKET_LIST[ID],0)){
			ready_players.id[ID] = true;
			if(Object.size(ready_players.id)>=NO_OF_PLAYERS){
				state = game.running;
				stage_1();
				delete Button.list[this.id];
			}
			return true;
		}
		return false;
	}
	ready_1(ID){
		if(!ready_players.id[ID] && Player.onReady(SOCKET_LIST[ID],1)){
			ready_players.id[ID] = true;
			if(Object.size(ready_players.id)>=NO_OF_PLAYERS){
				state = game.running;
				stage_1();
				delete Button.list[this.id];
			}
			return true;
		} 
		return false;
	}
}

Button.update = function(){
	var pack = [];
	for(i in Button.list){
		button = Button.list[i];
		pack.push(button);
	}
	return pack;
}
Button.updateColor = function(pack,ID){
	for(var i in pack){
		if(Button.list[pack[i].id].clickedBy[ID]){
			pack[i].color = 'rgb(170,170,170)';
		}else{
			pack[i].color = Button.list[pack[i].id].color;
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
		for(var i in Button.list){
			var button = Button.list[i];
			button.collision(data,socket.id);
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
		}else if(now == (round.seconds+(6-round.timer))%60){
			round.timer--;
		}
	}
	if(kills[0] == ready_players.count[1] || kills[1] == ready_players.count[0]){
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
		players:Object.size(ready_players.id),
		prev: prev_game,
		ready_players,
	};
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		pack.myID = socket.id;
		socket.emit('menuPos', pack);
	}
}

loop.over = function(){
	state = game.start;
	loop.start(prev_game);
}


setInterval(function(){
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('gameState', state);
	}


	if(state == game.start){
		loop.start();
	}else if(state == game.running){
		loop.running();
	}else if(state == game.over){
		loop.over();
	}
	
},1000/65);

