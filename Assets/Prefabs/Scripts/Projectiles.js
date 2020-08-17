#pragma strict

static function ProjectileDmgShip(projectile : GameObject, ship : GameObject, pDatablock : ProjectileDatablock, pHandler : ProjectileHandler){
   var sHandler : ShipHandler = ship.GetComponent(ShipHandler);
   
   if(sHandler.armor < pDatablock.armorPenetration){ //If full penetration, do full damage
      Ships.TakeDamage(ship, pHandler.ship, pDatablock.damage);
   } else if(sHandler.armor < pDatablock.armorPenetration * 2){ //can we get partial penetration
      var armPen : float = pDatablock.armorPenetration;
      var modifier : float = (armPen - (sHandler.armor - armPen)) / armPen;
      Ships.TakeDamage(ship, pHandler.ship, pDatablock.damage * modifier);
   }
   Ships.DegradeArmor(ship, pHandler.ship, pDatablock.armorDegrade);
   
   Destroy(projectile);
}