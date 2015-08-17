var swig  = require('swig')
var mysql = require('mysql')

/**
 * Monkey patch the createConnection method
 * to always use named placeholders.
 */
var createConnection = mysql.createConnection;

mysql.createConnection = function(){
  var connection = createConnection.apply(this, arguments)

  connection.config.queryFormat = function (query, values) {
    if (!values) return query;
    return query.replace(/\:(\w+)/g, function (txt, key) {
      if (values.hasOwnProperty(key)) {
        return this.escape(values[key]);
      }
      return txt;
    }.bind(this));
  };

  var query = connection.query

  connection.query = function(sqlFile, tplParams, sqlParams, cb){
    var sql = swig.renderFile(sqlFile, tplParams);

    return query(sql, sqlParams, cb);
  }

  return connection
}

module.exports = mysql
