// Include Tessel and module libraries
// Accelerometer is attached to Port B
// Servo is attached to Port D
var tessel = require('tessel');
var Accel = require('accel-mma84');
var Servo = require('servo-pca9685');

var accel = Accel.use(tessel.port['B']);
var servo = Servo.use(tessel.port['D']);

// Accelerometer Z value in resting position
// Your may need to change this value
var Z_REST = 0.97;

// Constant used for LPF
var ALPHA = 0.35;

// Servo port, starting position, and historical position
var servo1 = 1;
var position = 0.5;
var last_position = 0.5;

// Accelerometer value holders
var y_last = 0;
var z_last = 0;
var y_filtered = 0;
var z_filtered = 0;

// Flag for whether or not to use the LPF
var filter = false;

// Toggle LPF with the 'Config' button on Tessel
tessel.button.on('press', function(time) {
  filter = !filter;
  if (filter){
    console.log('Low pass filter on');
  }
});

servo.on('ready', function() {

  // Put the servo in the starting position
  servo.move(servo1, position);

  accel.on('data', function (xyz) {      

    if (filter) {
      // Run the data through a low pass filter before storing
      y_filtered = (y_last+(ALPHA*(xyz[1]-y_last)))
      z_filtered = (z_last+(ALPHA*(xyz[2]-z_last)))
    } else {
      y_filtered = xyz[1];
      z_filtered = xyz[2];  
    }

    // Stash the current values for the next data event
    y_last = y_filtered;
    z_last = z_filtered;

    // Calculate position for servo relative to angle of accelerometer
    position = .5*(1+((-y_last/(Math.abs(y_last))) *(Z_REST-z_last)));
    // LPF on the position as well, possibly overkill but it can't hurt
    if (filter) { position = (last_position+(ALPHA*(position-last_position))) };
    last_position = position;

    // Keep the servo from going out of bounds
    if (position > 1) { position = 1};
    if (position < 0) { position = 0};

    // Set the servo to the new position
    servo.move(servo1, position);

  });
});
