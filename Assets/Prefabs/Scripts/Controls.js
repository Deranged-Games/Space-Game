#pragma downcast

static var controlStyle : String = "simulator"; //arcade, simulator, joystick,
static var mouseStyle : String = "simulator"; //arcade, simulator, joystick,
static var mouseSensitivity : float = 6; //mouse multiplier, from 1 to 10.
static var mouseDeadSpace : float = 4;
//----Hidden variables that change as game plays----
static var currentRotlvl : Vector2 = Vector2(0, 0);
static var mouseSensArea : float = 400;


static function PlayerShipControlHandler(ship : Transform, handler : ShipHandler, datablock : ShipDatablock){
   switch (controlStyle){
      case "arcade":
         if(Input.GetButton("Forward"))
            handler.thrusterLevel = 1;
         else
            handler.thrusterLevel = 0;
         break;
      case "simulator":
         if(Input.GetButton("Forward") && handler.thrusterLevel < 1)
            handler.thrusterLevel += Time.deltaTime / datablock.thrusterEngageTime;
         else if(Input.GetButton("Backward") && handler.thrusterLevel > 0)
            handler.thrusterLevel -= Time.deltaTime / datablock.thrusterEngageTime;
         break;
      /*case "joystick":
         thrusterLevel = joystick thrust axis;
         break;    
      */
   }
   var rotIntensity : Vector3 = Vector3.zero;
   switch (mouseStyle){
      case "arcade":
         rotIntensity.x = -Input.GetAxis("Mouse Y") * (3 + mouseSensitivity);
         rotIntensity.y = Input.GetAxis("Mouse X") * (3 + mouseSensitivity);
         if(Input.GetButton("Left"))
            rotIntensity.z = 1;
         else if(Input.GetButton("Right"))
            rotIntensity.z = -1;
         break;
      case "simulator":
         currentRotlvl += Vector2(Input.GetAxis("Mouse X") * (3 + mouseSensitivity), Input.GetAxis("Mouse Y") * (3 + mouseSensitivity));
         
         if(currentRotlvl.magnitude > mouseSensArea) 
            currentRotlvl = currentRotlvl.normalized * mouseSensArea;
            
         var mouseNullSpace = mouseDeadSpace * 6;
            
         if(currentRotlvl.x > mouseNullSpace){		rotIntensity.z = -(currentRotlvl.x - mouseNullSpace) / (mouseSensArea - mouseNullSpace);}
         else if(currentRotlvl.x < -mouseNullSpace){	rotIntensity.z = -(currentRotlvl.x + mouseNullSpace) / (mouseSensArea - mouseNullSpace);}
         if(currentRotlvl.y > mouseNullSpace){		rotIntensity.x = -(currentRotlvl.y - mouseNullSpace) / (mouseSensArea - mouseNullSpace);}
         else if(currentRotlvl.y < -mouseNullSpace){	rotIntensity.x = -(currentRotlvl.y + mouseNullSpace) / (mouseSensArea - mouseNullSpace);}
         
         if(Input.GetButton("Left"))
            rotIntensity.y = -1;
         else if(Input.GetButton("Right"))
            rotIntensity.y = 1;
         break;
   }
   handler.rotation = rotIntensity;
   if(Input.GetButton("Afterburner") && handler.afterburnerUse < 1 && handler.afterburnerWait <= 0){
      handler.afterburnerActive = true;
   } else if(handler.afterburnerActive) {
      handler.afterburnerActive = false;
      handler.afterburnerWait = 1.0;
   }
}