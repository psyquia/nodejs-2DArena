const Entity = require('./entity.js');
const Player = require('./player.js');

//----------------------------------------------------------------------//

var game = {start: 0, running: 1, paused:2, over:3};
var GLOBALS = {};

module.exports = class Button extends Entity{
	constructor(globals_p, x, y, width, height, color, action){
		super(x,y);
		this.id = Math.random();
		this.hitbox = {px:this.x, py:this.y, width:width, height:height}
		this.action = action;
		this.clickedBy = {};
		this.color = color;
		this.newColor = 'rgb(120,120,120)';
		GLOBALS = globals_p;
		GLOBALS.buttons[this.id] = this;
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
		if(!GLOBALS.ready_players.id[ID] && GLOBALS.onReady(GLOBALS.SOCKET_LIST[ID],0)){
			GLOBALS.ready_players.id[ID] = true;
			if(Object.size(GLOBALS.ready_players.id)>=GLOBALS.NO_OF_PLAYERS){
				GLOBALS.state = game.running;
				GLOBALS.stage_1();
				delete GLOBALS.buttons[this.id];
			}
			return true;
		}
		return false;
	}
	ready_1(ID){
		if(!GLOBALS.ready_players.id[ID] && GLOBALS.onReady(GLOBALS.SOCKET_LIST[ID],1)){
			GLOBALS.ready_players.id[ID] = true;
			if(Object.size(GLOBALS.ready_players.id)>=GLOBALS.NO_OF_PLAYERS){
				GLOBALS.state = game.running;
				GLOBALS.stage_1();
				delete GLOBALS.buttons[this.id];
			}
			return true;
		} 
		return false;
	}
}