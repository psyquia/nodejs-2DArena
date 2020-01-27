const Entity = require('./entity.js');

module.exports = class Pickup extends Entity{
	constructor(GLOBALS, x,y,radius,effect,color){
		super(x,y);
		this.radius = radius;
		this.color = color;
		this.effect = effect;
		this.hitbox = {px: this.x-this.radius, py: this.y - this.radius, 
			width: this.radius*2, height: this.radius*2};
		GLOBALS.pickups.push(this);
	}
	cone(player){
		player.gun = 'cone';
	}
	wallbang(player){
		player.gun = 'wallbang';
	}

}