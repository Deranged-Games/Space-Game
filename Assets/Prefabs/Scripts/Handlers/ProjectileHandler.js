#pragma strict
public var life : double = 0;
public var ship : GameObject;
public var activeTime : double = 0;

function Start () {
   var datablock : ProjectileDatablock = transform.GetComponent(ProjectileDatablock);
   var rigidBody : Rigidbody = transform.GetComponent(Rigidbody);
   transform.localScale = Vector3.Scale(transform.localScale, datablock.scale);
   if(datablock.projectileType != "Instant")
      GetComponent.<Rigidbody>().velocity += transform.forward * datablock.muzzleVelocity;
}

function Update () {
   var datablock : ProjectileDatablock = transform.GetComponent(ProjectileDatablock);
   life += Time.deltaTime;
   if(life > datablock.life){
      Destroy(gameObject);
      return;
   }
   if(activeTime < datablock.activationTime)
      activeTime += Time.deltaTime;
}

function OnCollisionEnter(col : Collision){
   var datablock : ProjectileDatablock = transform.GetComponent(ProjectileDatablock);
   if(activeTime >= datablock.activationTime){
      if(col.gameObject.GetComponent(ShipHandler)){
         Projectiles.ProjectileDmgShip(gameObject, col.gameObject, datablock, this);
      }
   }
}