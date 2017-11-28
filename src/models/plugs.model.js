/* eslint-disable no-console */

// plugs-model.js - A KnexJS
// 
// See http://knexjs.org/
// for more of what you can do here.
const GithubWatcher = require('./plugs.github');
STATE_COLORS = {
  success: 'Green',
  pending: 'Yellow',
  failure: 'Red'
};

module.exports = function (app) {
  const db = app.get('knexClient');
  const tableName = 'plugs';
  db.schema.hasTable(tableName).then(exists => {
    if(!exists) {
      db.schema.createTable(tableName, table => {
        table.increments('id');
        table.string('text');
      })
        .then(() => console.log(`Created ${tableName} table`))
        .catch(e => console.error(`Error creating ${tableName} table`, e));
    }
  });

  let githubWatcher = new GithubWatcher('callrail', 'callrail');
  githubWatcher.watch((newState) => {
    app.service('lights').patch(1, {color: STATE_COLORS[newState]})
      .catch(err => console.error("Error:", err.message || err))
  });

  return db;
};
