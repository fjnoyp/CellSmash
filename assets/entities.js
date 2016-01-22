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

