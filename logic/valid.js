var Validator = require('validatorjs');

Validator.register('minVal', function (value, requirement) {
  if (undefined === value) {
    return true;
  }

  return (parseFloat(value) >= parseFloat(requirement));
}, 'The :attribute must be at least :minVal.');

Validator.register('maxVal', function (value, requirement) {
  if (undefined === value) {
    return true;
  }
  
  return (parseFloat(value) <= parseFloat(requirement));
}, 'The :attribute must be at most :maxVal.');


Validator.register('domain', function (value) {
  if (undefined === value) {
    return true;
  }

  if ('string' != (typeof value)) {
    return false;
  }

  if (value.length > 253) {
    return false;
  }

  return !value.split('.').some(function (sub) {
    if (!sub) {
      return true;
    }

    if (sub.length > 63) {
      return true;
    }

    if (!(/^[a-z\d](-*[a-z\d])*$/i.test(sub))) {
      return true; 
    }

    return false;
  });
}, 'The :attribute is not valid.');

Validator.Error = function () {
  this.prototype.constructor.apply(this, Array.slice.apply(arguments));
};

Validator.Error.prototype   = new Error('Validation failed');
Validator.Error.constructor = Validator.Error;

module.exports = function (data, rules, context, errorClass) {
  errorClass = errorClass || Validator.Error;
  var validation = new Validator(data, rules);

  if (validation.fails()) {
    throw _.extend(new errorClass('Validation failed'), { errors: validation.errors, context: context });
  }

  return data;
};

module.exports.Error = Validator.Error;
