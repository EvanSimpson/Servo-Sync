// Include Tessel and module libraries
// Accelerometer is attached to Port B
// Servo is attached to Port D
var tessel = require('tessel');
var Accel = require('accel-mma84');
var Servo = require('servo-pca9685');

var accel1 = Accel.use(tessel.port['B']);
// var accel2 = Accel.use(tessel.port['C']);
var servo_module = Servo.use(tessel.port['D']);


function Bridge (servo, servo_ind, accel) {
  // Accelerometer Z value in resting position
  // Your may need to change this value
  this.Z_REST = 0.97;

  // Constant used for Low Pass Filter
  this.ALPHA = 0.35;

  // Flag for whether or not to use the LPF
  this.filter = false;

  // Servo port, starting position, and historical position
  this.servo_ind = servo_ind;
  this.position = 0.5;
  this.last_position = 0.5;

  // Accelerometer value holders
  this.y_last = 0;
  this.z_last = 0;
  this.y_filtered = 0;
  this.z_filtered = 0;

  // Toggle LPF with the 'Config' button on Tessel
  tessel.button.on('press', function(time) {
    this.filter = !this.filter;
    if (this.filter){
      console.log('Low pass filter on');
    }
  });

  servo.on('ready', function() {

    // Put the servo in the starting position
    servo.move(this.servo_ind, this.position);

    accel.on('data', function accelData(xyz) {      

      if (this.filter) {
        // Run the data through a low pass filter before storing
        this.y_filtered = lpf(xyz[1], this.y_last)
        this.z_filtered = lpf(xyz[2], this.z_last)
      } else {
        this.y_filtered = xyz[1];
        this.z_filtered = xyz[2];  
      }

      // Stash the current values for the next data event
      this.y_last = this.y_filtered;
      this.z_last = this.z_filtered;

      // Calculate position for servo relative to angle of accelerometer
      this.position = .5*(1+((-this.y_last/(Math.abs(this.y_last))) *(this.Z_REST-this.z_last)));
      // LPF on the position as well, possibly overkill but it can't hurt
      if (this.filter) { this.position = lpf(this.position, this.last_position) };
      this.last_position = this.position;

      // Keep the servo from going out of bounds
      this.position > 1 ? this.position = 1 : this.position < 0 ? this.position = 0 : null;

      // Set the servo to the new position
      servo.move(this.servo_ind, this.position);

    }.bind(this));
  }.bind(this));
}



// Low Pass Filter - smooth out the data coming 
// in from the accelerometer. Makes for less 
// violent movement from the servo
Bridge.prototype.lpf = function(current, last) {
  return (last + (this.ALPHA*(current-last)));
};

var bridge1 = new Bridge(servo_module, 1, accel1);
// var bridge2 = new Bridge(servo_module, 2, accel2);
