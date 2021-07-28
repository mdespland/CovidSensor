var wpi = require('node-wiring-pi');

wpi.setup('wpi');

var pin = 1;

wpi.pinMode(pin, wpi.INPUT);

var value = 1;

setInterval(function() {
  value=wpi.analogRead(pin);
  console.log("Value : "+value)
}, 500);
