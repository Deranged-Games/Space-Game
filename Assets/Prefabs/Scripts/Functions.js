#pragma strict

static function VelocityPredict(relVel : Vector3, relPos : Vector3, acceleration : Vector3, distance : float, projectileSpeed : float) : Vector3{
  var aimVec : Vector3 = Vector3.zero;

  //Get relative target speed
  var trgRelSpeed : float = Vector3.Dot(relVel, relPos.normalized);

  //Get relative target acceleration
  var accelRelSpeed : float = Vector3.Dot(acceleration, relPos.normalized);

  //Done to account for tangent speed. This is pre-acceleration calc (as needed for accel calc) so it is not 100%.
  var aimTangSpeed : float = Mathf.Sqrt((relVel.length * relVel.length) - (trgRelSpeed * trgRelSpeed));
  projectileSpeed = Mathf.Sqrt((projectileSpeed * projectileSpeed) - (aimTangSpeed * aimTangSpeed));

  //Get closure speed of projectile to target
  projectileSpeed -= trgRelSpeed

  var seconds : float = 0;
  if(projectileSpeed <= 0){
    seconds = 0;
  } else if(accelRelSpeed == 0){
    seconds = distance / projectileSpeed;
  } else {
    seconds = Functions.SolveQuadratic("Best", accelRelSpeed/2, -1 * projectileSpeed, distance);
    if(seconds < 0) seconds = distance / projectileSpeed;
  }
  aimVec = relVel * seconds + (0.5 * acceleration * seconds * seconds);
   
  return aimVec;
}

static function SolveQuadratic(solveType : String, a : float, b : float, c : float) : float{
   if(a == 0)
      return 0;
   var topRight : float = Mathf.Sqrt(b*b - 4 * a * c);
   var bottom : float = 2 * a;
   var x : float = 0;
   if(solveType == "plus") //Specified responses requested
      x = (-b + topRight) / bottom;
   else if(solveType == "minus")
      x = (-b - topRight) / bottom;
   else { //No specified request, respond with lowest positive
      var plus : float = (-b + topRight) / bottom;
      var minus : float = (-b - topRight) / bottom;
      if(plus > 0){
         if(minus > 0){
            if(plus < minus)
               x = plus;
            else
               x = minus;
         } else 
            x = plus;
      } else if(minus > 0)
         x = minus;
   }
   
   return x;
}