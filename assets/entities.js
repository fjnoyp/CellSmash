Game.EntityGenerator = new Game.Generator('entities',Game.Entity);

Game.EntityGenerator.learn({
  name: 'avatar',
  chr:'@',
  fg:'#dda',
    maxHp: 10,
    //mixins: ["PlayerActor", "PlayerMessager", "WalkerCorporeal", "HitPoints", "Chronicle", "MeleeAttacker"]
    mixins: ["WalkerCorporeal","CellController"]
});

/*
Game.EntityGenerator.learn({
  name: 'moss',
  chr:'%',
  fg:'#6b6',
  maxHp: 1,
  mixins: ["HitPoints"]
});
*/

Game.EntityGenerator.learn({
    name: 'marker',
    chr:'*',
    fg:'#ffff00'
}); 

Game.EntityGenerator.learn({
  name: 'cell',
  chr:'#',
  fg:'#ffff00',
    mixins: ["CellMove", "WalkerCorporeal", "CellStateInformation", "CellInfect"]
});

Game.EntityGenerator.learn({
  name: 'cellController',
  chr:'@',
  fg:'#ffff00',
    mixins: ["WalkerCorporeal", "CellMove", "CellStateInformation", "CellController"]
});

Game.EntityGenerator.learn({
  name: 'growable',
  chr:'^',
  fg:'#ffff00',
    mixins: ["CellStateInformation", "Growable"]
}); 



Game.creationFormats = {};
Game.creationFormats.flytrap = {entityType: 'cell', fg : '#CC3366', chr : 'B', moveStrategy : "ClumpTogether"};
Game.creationFormats.wanderer = {entityType: 'cell', fg : '#CCFFFF', chr : 'r', moveStrategy : "WanderAround"};

Game.creationFormats.localInfector = {entityType: 'cell', fg : '#CCFF33', chr : ';', moveStrategy : "OpportunisticMurder"};

Game.creationFormats.test = {entityType: 'cellController', fg : '#D8BFD8', chr : '@', moveStrategy : "WanderAround", setIsInfectable : false};

Game.creationFormats.cellFollower = {entityType: 'cell', fg : '#66FF33', chr : '#', moveStrategy : "CircleAround"};

Game.creationFormats.cellLeader = {entityType: 'cellController', fg : '#66FF33', chr : '@', moveStrategy : "WanderAround", setIsInfectable : false};
    
    
