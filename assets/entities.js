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
    fg:'#f98'
}); 

Game.EntityGenerator.learn({
  name: 'cell',
  chr:'#',
  fg:'#f98',
    mixins: ["CellMove", "WalkerCorporeal", "CellStateInformation", "CellInfect"]
});

