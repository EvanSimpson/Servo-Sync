var tessel = require('tessel');
var accel = require('accel-mma84').use(tessel.port['B']);
var servo = require('servo-pca9685').use(tessel.port['D']);

var ALPHA = 0.35;
var Z_REST = 0.97;

var y_last = 0;
var z_last = 0;
var y_filtered = 0;
var z_filtered = 0;

var position = 0.5;
var last_position = 0.5;
var servo1 = 1;

var filter = true;

tessel.button.on('press', function(time) {
  filter = !filter;
  if (filter){
    console.log('Low pass filter on');
  }
});

servo.on('ready', function() {
  servo.move(servo1, position);
  accel.on('ready', function () {



    accel.on('data', function (xyz) {      

      // Run the data through a low pass filter before storing
      if (filter) {
        y_filtered = (y_last+(ALPHA*(xyz[1]-y_last)))
        z_filtered = (z_last+(ALPHA*(xyz[2]-z_last)))
      } else {
        y_filtered = xyz[1];
        z_filtered = xyz[2];  
      }

      y_last = y_filtered;
      z_last = z_filtered;

      position = .5*(1+((-y_last/(Math.abs(y_last))) *(Z_REST-z_last)));
      if (filter) { position = (last_position+(ALPHA*(position-last_position))) };
      last_position = position;

      if (position > 1) { position = 1};
      if (position < 0) { position = 0};
      servo.move(servo1, position);

    });
  });
});
