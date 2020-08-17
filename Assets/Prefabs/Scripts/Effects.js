#pragma strict

static function calcCameraDrift(camera : Transform, accel : Vector3){
   var handler : CameraController = camera.GetComponent(CameraController);
   if(accel.magnitude > handler.driftTolerance * Time.deltaTime){
      var modifier : double = accel.magnitude / (handler.driftMaxAccelPull - handler.driftTolerance) / Time.deltaTime;
      if(modifier > 1 || modifier < 1)
         modifier *= 1 / modifier;
      var driftChange : Vector3 = accel.normalized * (modifier * -handler.driftPerSecond * Time.deltaTime);
      handler.driftPos += driftChange;
      if(handler.driftPos.magnitude > handler.maxDrift)
         handler.driftPos = handler.driftPos.normalized * handler.maxDrift;
   } else {
      if(handler.driftPos.magnitude > handler.driftPerSecond * Time.deltaTime)
         handler.driftPos -= handler.driftPos.normalized * handler.driftPerSecond * Time.deltaTime;
      else
         handler.driftPos = Vector3(0, 0, 0);
   }
}

static function calcCameraShake(camera : Transform){
   var handler : CameraController = camera.GetComponent(CameraController);
   if(handler.currentShake > 1)
      handler.currentShake = 1;
      
   var modifier : float = handler.currentShake / handler.maxShake;
   if(handler.shakeToPos != handler.shakePos){
      var sps : float = (1 - modifier) * (handler.shakeRange.y - handler.shakeRange.x) + handler.shakeRange.x;
      var speed : float = (handler.shakeDistance * modifier * 2) / (1 / sps);
      
      var shakeVec : Vector3 = handler.shakeToPos - handler.shakePos;
      if(shakeVec.magnitude > speed * Time.deltaTime)
         handler.shakePos += shakeVec.normalized * speed * Time.deltaTime;
      else
         handler.shakePos = handler.shakeToPos;
   } else {
      if(handler.shakeToPos.magnitude <= 0){
         var dist : float = handler.shakeDistance * modifier;
         handler.shakeToPos = Vector3(Random.value - 0.5, Random.value - 0.5, Random.value - 0.5).normalized * dist;
      } else {
         handler.shakeToPos = Vector3.zero;
      }
   }
}

static function addCameraShake(camera : Transform, shakeMod : float){
   var handler : CameraController = camera.GetComponent(CameraController);
   if(handler.currentShake < shakeMod)
      handler.currentShake = shakeMod;
}