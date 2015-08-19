var swig  = require('swig');
var mysql = require('mysql');
var fs = require('fs');
var Q = require('q');
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

  /**
   * Monkey patch the query method
   * to always use swig templates
   * and bound parameters.
   */
  var query = connection.query

  connection.query = function(sqlFile, tplParams, sqlParams, cb){
    var sql = fs.existsSync(sqlFile) ? swig.renderFile(sqlFile, tplParams) : swig.render(sqlFile, tplParams);

    if (cb) {
      query.apply(connection, [sql, sqlParams, cb]);
    } else {
      var p = Q.Promise(function(resolve, reject){
        query.apply(connection, [sql, sqlParams, function(err, result){
          if (err) return reject(err)
          resolve(result)
        }])
      })

      p.finally(function(){
        connection.end()
      })

      return p;
    }
  }

  return connection
}

module.exports = mysql
