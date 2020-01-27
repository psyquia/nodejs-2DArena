const Entity = require('./entity.js');

module.exports = class Platform extends Entity{
	constructor(GLOBAL, x, y, width, height, color){
		super(x,y);
		this.id = Math.random();
		this.width = width;
		this.height = height;
		this.hitbox = {px:this.x, py:this.y, width:this.width, height:this.height}
		this.color = color;
		GLOBALS.platforms[this.id] = this;
	}

}