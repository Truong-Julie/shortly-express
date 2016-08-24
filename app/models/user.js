var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  // hasTimestamps: true,
  initialize: function () {
    this.on('creating', function(model, attrs, options) {
      // var hash = bcrypt.hash(model.attributes.password, 30, null, function(err, hash) {
      //   console.log('in hash!!!');
      //   this.save({password: hash}).then(function(err, complete) {
      //     if (err) {
      //       console.log('Save hash did not work');
      //     } else {
      //       console.log('this is: ', complete);
      //     }
      //   });
      // });

      console.log(model.attributes.password, 'danipassword');
      // bcrypt.hash(model.attributes.password, 30, function (err, hash) {
       //  this.save({password: hash}).then(function(err, complete) {
       //    if (err){
       //      console.log('Save hash did not work');
       //    } else {
       //      console.log('this is: ', complete);
       //    }
       //  });
      // });
    });  
  }
});

module.exports = User;