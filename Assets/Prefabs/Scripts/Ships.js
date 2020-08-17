#pragma downcast

static function ApplyManuver(ship : Transform, handler : ShipHandler, datablock : ShipDatablock){
   var rigidbody : Rigidbody = ship.GetComponent(Rigidbody);

   var forceChange : Vector3 = Vector3(0, 0, 0);
   if(handler.thrusterLevel > 1) handler.thrusterLevel = 1;
   if(handler.thrusterLevel < 0) handler.thrusterLevel = 0;
   
   var targetVelocity : double = datablock.maxForwardVelocity * handler.thrusterLevel;
   var thrust : double = datablock.thrust;
   if(handler.state != "deathroll"){
      for(var i : int = 0; i < handler.glow.length; i++){
         var curGlow : Transform = handler.glow[i];
         var engineLight : Light = curGlow.GetComponent(Light);
         if(handler.afterburnerActive){
            engineLight.color = datablock.afterburnerColor;
            engineLight.intensity = 0.5 + (handler.thrusterLevel * 4);
         } else {
            engineLight.color = datablock.engineColor;
            engineLight.intensity = 0.5 + (handler.thrusterLevel * 2);
         }
      }
      if(handler.afterburnerActive){
         targetVelocity = datablock.afterburnerMaxVelocity;
         thrust *= datablock.afterburnerScaler;
      
         if(handler.playerControlled)
            Effects.addCameraShake(handler.pcCamera, 0.1);
      }
   
      var relativeVelocity : double = ship.InverseTransformDirection(rigidbody.velocity).z;
      var forceNeeded : double = (targetVelocity - relativeVelocity) * rigidbody.mass;
      if(forceNeeded > thrust * Time.fixedDeltaTime){
         forceChange += ship.forward * thrust * Time.fixedDeltaTime;
         if(handler.playerControlled)
            Effects.addCameraShake(handler.pcCamera, 0.03);
      }else if(forceNeeded < -datablock.breakingThrust * Time.fixedDeltaTime)
         forceChange -= ship.forward *  datablock.breakingThrust * Time.fixedDeltaTime;
      else 
         forceChange += ship.forward * forceNeeded;
   
      //First Inertial Dampner bit
      if(handler.inrDmpOn){
         var dmpVec : Vector3 = (ship.forward * rigidbody.velocity.magnitude) - rigidbody.velocity;
         if(dmpVec.magnitude > (datablock.inertiaDampenerThrust / rigidbody.mass) * Time.fixedDeltaTime)
            forceChange += dmpVec.normalized * (datablock.inertiaDampenerThrust * Time.fixedDeltaTime);
         else
            rigidbody.velocity = ship.forward * rigidbody.velocity.magnitude;
      }
   }
   
   //Cap Intensities for crazy sensitive mouse movements
   if(handler.rotation.x > 1)handler.rotation.x = 1; if(handler.rotation.x < -1)handler.rotation.x = -1;
   if(handler.rotation.y > 1)handler.rotation.y = 1; if(handler.rotation.y < -1)handler.rotation.y = -1;
   if(handler.rotation.z > 1)handler.rotation.z = 1; if(handler.rotation.z < -1)handler.rotation.z = -1;
   
   //Make our uniform max rotation force
   var rotForceChange : Vector3 = Vector3(0, 0, 0);
   var locRot : Vector3 = ship.InverseTransformDirection(rigidbody.angularVelocity);
   
   //Determine our rotation speed
   rotForceChange.x = DetermineRotationSpeed(rigidbody, datablock.maxPitchSpeed, handler.rotation.x, locRot.x * 57.3, datablock.pitchForce * Time.fixedDeltaTime);
   rotForceChange.y = DetermineRotationSpeed(rigidbody, datablock.maxRudderSpeed, handler.rotation.y, locRot.y * 57.3, datablock.rudderForce * Time.fixedDeltaTime);
   rotForceChange.z = DetermineRotationSpeed(rigidbody, datablock.maxBankingSpeed, handler.rotation.z, locRot.z * 57.3, datablock.bankingForce * Time.fixedDeltaTime);
   
   //apply all
   rigidbody.AddForce(forceChange * (1 / Time.fixedDeltaTime), ForceMode.Force);
   rigidbody.AddRelativeTorque(rotForceChange * (1 / Time.fixedDeltaTime), ForceMode.Force);
   if(handler.playerControlled){
      Effects.calcCameraDrift(handler.pcCamera, forceChange / rigidbody.mass);
   }
}

static function DetermineRotationSpeed(ship : Rigidbody, maxRotation : float, intensity : float, axisSpeed : float, force : float) : float{
   var axisChange : float = 0;
   var forceNeeded : float = (maxRotation * intensity - axisSpeed) * ship.mass * Time.fixedDeltaTime;
   
   if (forceNeeded > force)
      axisChange = force;
   else if(forceNeeded < -force)
      axisChange = -force;
    else
      axisChange = forceNeeded;
   
   return axisChange;
}

static function TakeDamage(ship : GameObject, attacker : GameObject, damage : float){ //optimized for event calls
   var handler : ShipHandler = ship.GetComponent(ShipHandler);
   handler.damage += damage;
   if(handler.playerControlled)
      Effects.addCameraShake(handler.pcCamera, 0.5);

   if(handler.state == "active")
      handler.lastDamage = attacker;
   CheckState(ship, handler);
}

static function DegradeArmor(ship : GameObject, attacker : GameObject, damage : float){ //optimized for event calls
   var handler : ShipHandler = ship.GetComponent(ShipHandler);
   if(handler.armor > 0)
      handler.armor -= damage;
   else
      handler.armor = 0;
   
   handler.lastDamage = attacker;
   if(handler.playerControlled)
      Effects.addCameraShake(handler.pcCamera, 0.35);
}

static function CheckState(ship : GameObject, handler : ShipHandler){	//optimized for event calls
   var datablock : ShipDatablock = ship.GetComponent(ShipDatablock);
   if(handler.damage >= datablock.hitpoints){
      if(handler.target)
         BaseAI.RemoveTargeter(handler.target,ship);

      if(handler.state == "active"){
         SetDeathRoll(ship, handler, datablock);
         handler.state = "deathroll";
      }

      if(handler.damage >= (datablock.hitpoints + datablock.expThreshold))
         DestroyShip(ship, handler);
   }
}

static function SetDeathRoll(ship : GameObject, handler : ShipHandler, datablock : ShipDatablock){
   //Lets make the handler stop doing EVERYTHING. Once thats done, lets give it a random roll.

   handler.deathTime = datablock.deathTime + Random.Range(datablock.deathTimeVariance * -1, datablock.deathTimeVariance);
   handler.inrDmpOn = false;
   handler.thrusterLevel = 0;
   handler.afterburnerActive = false;
   handler.afterburnerUse = 1;
   handler.energy = 0;
   handler.triggerDown = false;
   handler.rotation = Vector3(Random.Range(-0.5,0.5), Random.Range(-0.5,0.5), Random.Range(-0.5,0.5));

   //Lets kill the trails.
   for(var i : int = 0; i < handler.glow.length; i++){
      var curGlow : Transform = handler.glow[i];
      Destroy(curGlow.GetComponent(TrailRenderer));
   }

   //Create smoke trail effects.
}

static function DestroyShip(ship : GameObject, handler : ShipHandler){
   if(handler.playerControlled && ship.tag == "Fighter"){
      var fAIH : FighterAIHandler = ship.GetComponent(FighterAIHandler);
      if(fAIH.wing.length > 1){
         for(var i : int = 0; i < fAIH.wing.length; i++){
            var object : GameObject = fAIH.wing[i];
            if(object != ship && object){
               var sHandler : ShipHandler = object.GetComponent(ShipHandler);
               sHandler.pcCamera = handler.pcCamera;
               sHandler.playerControlled = true;
               var cc : CameraController = sHandler.pcCamera.GetComponent(CameraController);
               cc.target = object.transform;
               cc.updateTargetPosition();
               break;
            }
         }
      }
   }

   //Explosion

   for(var weapon : GameObject in handler.weapons)
      Destroy(weapon);
   Destroy(ship);
}