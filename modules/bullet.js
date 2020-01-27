const Entity = require('./entity.js');

var GLOBALS = {};

module.exports = class Bullet extends Entity{
	constructor(global_p, parent, angle, vel){
		if(!arguments[3]){
			var vel = 1;
		}
		super();
		this.id = Math.random();
		this.spdX = Math.cos(angle/180*Math.PI)*10 * vel;
		this.spdY = Math.sin(angle/180*Math.PI)*10 * vel;
		this.parent = parent;
		this.team = parent.armorKey;
		this.timer = 0;
		this.toRemove = false;
		this.type = '';
		this.hitbox = {px:this.x+4, py:this.y, width:7, height:5};
		this.dmg = {normal:5, cone:2, wallbang:2.3};
		GLOBALS = global_p;
		GLOBALS.bullets[this.id] = this;
	}
	p_update(){
		if(this.timer++>100)
			this.toRemove = true;
		for(var i in GLOBALS.platforms){
			var platform = GLOBALS.platforms[i];
			if(this.collision(platform)){
				delete GLOBALS.bullets[this.id];
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