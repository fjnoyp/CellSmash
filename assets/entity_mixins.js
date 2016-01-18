

Game.CellMoveEnum = {
    CIRCLE_AROUND : 'circle around targetEntity position'
}

Game.CellMoveStrategies = {
    "CircleAround" : {
        getMoveDeltas: function(){
            var targetPos = this.targetEntity.getPos(); 
            var moveDeltas = {x:0, y:0}; 

            var difX = targetPos.x - this.getX(); 
            var difY = targetPos.y - this.getY();

            var sqrDist = Math.pow(difX,2) + Math.pow(difY,2); 
            
            if( sqrDist > 120 || sqrDist < 80){
                if(Math.abs(difX) > Math.abs(difY)){ moveDeltas.x = Game.util.clamp(difX, -2, 2); }
                else{ moveDeltas.y = Game.util.clamp(difY, -2, 2); }

                if(sqrDist < 80){
                    moveDeltas.x = moveDeltas.x * -1;
                    moveDeltas.y = moveDeltas.y * -1; 
                }
            }
            else{
                moveDeltas = this.getMoveDeltas();
            }
            return moveDeltas; 
        }
    },

    "ClusterAround" : {
        getMoveDeltas: function(){
            var targetPos = this.targetEntity.getPos();
            var difX = targetPos.x - this.getX(); 
            var difY = targetPos.y - this.getY();

            if(difX == 0){difX = Math.round( 2 * Math.random() - 1 );}
            if(difY == 0){difY = Math.round( 2 * Math.random() - 1 );}
            return {x: Game.util.clamp(difX, -2, 2),
                    y: Game.util.clamp(difY, -2, 2)}; 
        }
    },

    "WanderAround" : {
        getMoveDeltas: function(){
            return this.getMoveDeltas(); 
        }
    }, 

    "ClumpTogether" : {
        moves : [ {x:1,y:0}, {x:0,y:1}, {x:-1,y:0}, {x:0,y:-1} ], 
        getMoveDeltas: function(){
            if( !this.hasOwnProperty("count") ){
                this.count = 0; 
            }
            this.count ++; 
            this.count %= 4; 
            return Game.CellMoveStrategies["ClumpTogether"].moves[this.count]; 
        }
    }
}


Game.EntityMixin = {};

// Mixins have a META property is is info about/for the mixin itself and then all other properties. The META property is NOT copied into objects for which this mixin is used - all other properies ARE copied in.

Game.EntityMixin.WalkerCorporeal = {
  META: {
    mixinName: 'WalkerCorporeal',
    mixinGroup: 'Walker'
  },
  tryWalk: function (map,dx,dy) {
    var targetX = Math.min(Math.max(0,this.getX() + dx),map.getWidth()-1);
    var targetY = Math.min(Math.max(0,this.getY() + dy),map.getHeight()-1);
      if (map.getEntity(targetX,targetY)) { // can't walk into spaces occupied by other entities
          
      this.raiseEntityEvent('bumpEntity',{actor:this,recipient:map.getEntity(targetX,targetY)});
      // NOTE: should bumping an entity always take a turn? might have to get some return data from the event (once event return data is implemented)
      return true;
    }
    var targetTile = map.getTile(targetX,targetY);
    if (targetTile.isWalkable()) {
      // console.log('tryWalk - walkable: '+this.getName());
      this.setPos(targetX,targetY);
      var myMap = this.getMap();
      if (myMap) {
        myMap.updateEntityLocation(this);
      }
      return true;
    } else {
      this.raiseEntityEvent('walkForbidden',{target:targetTile});
    }
    return false;
  }
};

Game.EntityMixin.HitPoints = {
  META: {
    mixinName: 'HitPoints',
    mixinGroup: 'HitPoints',
    stateNamespace: '_HitPoints_attr',
    stateModel:  {
      maxHp: 1,
      curHp: 1
    },
    init: function (template) {
      this.attr._HitPoints_attr.maxHp = template.maxHp || 1;
      this.attr._HitPoints_attr.curHp = template.curHp || this.attr._HitPoints_attr.maxHp;
    },
    listeners: {
      'attacked': function(evtData) {
        // console.log('HitPoints attacked');

        this.takeHits(evtData.attackPower);
        this.raiseEntityEvent('damagedBy',{damager:evtData.attacker,damageAmount:evtData.attackPower});
        evtData.attacker.raiseEntityEvent('dealtDamage',{damagee:this,damageAmount:evtData.attackPower});
        if (this.getCurHp() <= 0) {
          this.raiseEntityEvent('killed',{entKilled: this, killedBy: evtData.attacker});
          evtData.attacker.raiseEntityEvent('madeKill',{entKilled: this, killedBy: evtData.attacker});
        }
      },
      'killed': function(evtData) {
        // console.log('HitPoints killed');
        this.destroy();
      }
    }
  },
  getMaxHp: function () {
    return this.attr._HitPoints_attr.maxHp;
  },
  setMaxHp: function (n) {
    this.attr._HitPoints_attr.maxHp = n;
  },
  getCurHp: function () {
    return this.attr._HitPoints_attr.curHp;
  },
  setCurHp: function (n) {
    this.attr._HitPoints_attr.curHp = n;
  },
  takeHits: function (amt) {
    this.attr._HitPoints_attr.curHp -= amt;
  },
  recoverHits: function (amt) {
    this.attr._HitPoints_attr.curHp = Math.min(this.attr._HitPoints_attr.curHp+amt,this.attr._HitPoints_attr.maxHp);
  }
};

//#############################################################################
// ENTITY ACTORS / AI

Game.EntityMixin.CellMove = {
  META: {
    mixinName: 'CellMove',
    mixinGroup: 'Cell',
      init: function (template) {
          Game.Actors.push(this);
          this.targetEntity = Game.UIMode.gamePlay.getAvatar(); 
      }, 
      listeners: {
          'cellChange': function(evtData) {
              console.log("unimplemented cell change listener"); 
          }
      }
  },
  getMoveDeltas: function () {
    return Game.util.positionsAdjacentTo({x:0,y:0}).random();
  },
    doTurn: function () {
        
        //Move strategies , note MoveStrategy called from calling cell's scope
        moveDeltas = (this.moveStrategy.getMoveDeltas).call(this); 

        //DO WALK 
        if (this.hasMixin('Walker')) { 
            this.tryWalk(this.getMap(), moveDeltas.x, moveDeltas.y);
        }
        this.raiseEntityEvent('actionDone');
    }
};

//Manages children cells of cell conglomerates 
Game.EntityMixin.CellController = {
    META: {
        mixinName: 'CellController',
        mixinGroup: 'Cell',
        listeners: {
            //pass cell change event to all children cells 
            'cellChange': function(evtData) {

                this.childrenCells.forEach(
                    function(value1, value2, set){
                        console.log("parent here"); 
                        value1.raiseEntityEvent('cellChange',evtData);
                    }

                );

            },
            'destroyed': function(evtData){
                this.childrenCells.delete( evtData.actor ); 
            }
        }
    },
    childrenCells: new Set(), 

    //WARNING NOTE EXTRA REFERENCE, POSSIBLE MEMORY LEAK WITHOUT EXPLICIT REMOVAL 
    addChildrenCell: function(cellEntity){
        this.childrenCells.add(cellEntity); 
    }
};

/*
//More complex logic pending 
Game.EntityMixin.Infectable = {
    META: {
        mixinName: 'Infectable', 
        mixinGroup: 'Cell',
        listeners: {
            'infect': function(evtData) {
                this.destroy();
                this.getMap().addEntity(
                    Game.EntityGenerator.create(evtData.infectorName),
                    this.getPos() );
                this.raiseEntityEvent('destroyed'); 
            }
        }
    }
};
*/

//More complex logic pending 
Game.EntityMixin.Killable = {
    META: {
        mixinName: 'Killable', 
        mixinGroup: 'Cell',
        listeners: {
            'destroy': function(evtData) {
                this.destroy();
                this.raiseEntityEvent('destroyed'); 
            }
        }
    }
};

Game.EntityMixin.CellInfect = {
    META: {
        mixinName: 'CellInfect', 
        mixinGroup: 'Cell',
        listeners: {
            'bumpEntity': function(evtData){

                console.log("infect"); 
                //infect can mean changing behavior and/or appearance of other cell, other cell can also have resistances, cellInformation will probably expose all relevant information about cell, method set to allow for this 
                //evtData.receipient.raiseEntityEvent('infect',);
                if(evtData.recipient.hasOwnProperty("setAppearance")){
                    evtData.recipient.setAppearance(this.getFg(), this.getChar());
                    evtData.recipient.setMoveStrategy(this.getMoveStrategy()); 
                }

            }
        }
    }
    
};

//Individual cell memory and identification
// !!! Should be attached to all cells !!! 
Game.EntityMixin.CellStateInformation = {
    META: {
        mixinName: 'CellStateInformation',
        mixinGroup: 'Cell',
        listeners: {
            'destroyed': function(evtData) {
                parentCell.raiseEntityEvent("destroyed", {actor:this}); 
            }, 
            'cellChange': function(evtData){
                console.log("child here"); 
                  if(this.moveStrategy == Game.CellMoveStrategies["CircleAround"]){
                    this.moveStrategy = Game.CellMoveStrategies["ClusterAround"];
                }
                else{
                    this.moveStrategy = Game.CellMoveStrategies["CircleAround"];
                }
            }
        },
        init: function(template){
        }
    },
    
    moveStrategy: Game.CellMoveStrategies["WanderAround"],
    parentCell: null,

    setMoveStrategy: function(moveStrategy){
        if(typeof moveStrategy === 'string'){
            this.moveStrategy = Game.CellMoveStrategies[moveStrategy];
        }
        else{
            this.moveStrategy = moveStrategy; 
        }
    },

    getMoveStrategy: function(){
        return this.moveStrategy; 
    }, 

    setParentCell: function(parentCell){
        this.parentCell = parentCell; 
    },

    setAppearance: function(fg, chr){
        this.setChar(chr);
        this.setFg(fg); 
    }, 

    isSameCellType: function(otherCell){
        return otherCell.getFg() == this.getFg(); 
    }

    

};
