#pragma downcast
static function CreateProjectile(gun : Transform, handler : WeaponHandler, datablock : WeaponDatablock) : GameObject{
   //Lets setup which muzzle were using, and where this rounds coming from.
   var firePos : Vector3 = Vector3.zero;
   var curMuzzle : int = 0;
   var setMuzzle : Transform;
   if(handler.muzzle.length > 1){
      handler.currentMuzzle++;
      if(handler.currentMuzzle > handler.muzzle.length)
         handler.currentMuzzle = 0;
      setMuzzle = handler.muzzle[handler.currentMuzzle];
   } else {
      setMuzzle = handler.muzzle[0];
   }
   firePos = setMuzzle.position;
   
   //Create firing effects for this round (Make into seperate function)
   
   //Setup for round creation.
   var pdb : ProjectileDatablock = datablock.projectile.GetComponent(ProjectileDatablock);
   firePos += gun.forward * pdb.scale.z; //This should set the projectile so the end is right at the muzzle.
   
   //Create projectile
   var projectile : GameObject = Instantiate(datablock.projectile, firePos, gun.rotation);
   Physics.IgnoreCollision(projectile.GetComponent.<Collider>(), handler.ship.GetComponent.<Collider>());
   //Make sure to inherit the ships velocity.
   var prb : Rigidbody = projectile.GetComponent(Rigidbody);
   prb.velocity = handler.velocity;
   //Connect the parent call back variable
   projectile.GetComponent(ProjectileHandler).ship = handler.ship.gameObject;
   
   return projectile;
}