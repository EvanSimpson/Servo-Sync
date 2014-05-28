var tessel = require('tessel');
var accel = require('accel-mma84').use(tessel.port['A']);
var servo = require('servo-pca9685').use(tessel.port['D']);