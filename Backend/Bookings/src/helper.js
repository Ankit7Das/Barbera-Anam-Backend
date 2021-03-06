function deg2rad(deg) {
  return deg * (Math.PI/180)
}

module.exports.getDistance = (alat, along, blat, blong) => {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(blat-alat);  // deg2rad below
  var dLon = deg2rad(blong-along); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(alat)) * Math.cos(deg2rad(blat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d; 
};
