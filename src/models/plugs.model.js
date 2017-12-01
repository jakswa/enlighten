/* eslint-disable no-console */

// plugs-model.js - A KnexJS
// 
// See http://knexjs.org/
// for more of what you can do here.
const GithubWatcher = require('./plugs.github');
const STATE_COLORS = {
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

  // TODO: this is a hack until we get configuration into the plugs table
  let githubWatcher = new GithubWatcher('callrail', 'callrail');
  // github watcher sends us success/pending/failure status changes
  githubWatcher.watch((newState) => {
    let colorChange = {color: STATE_COLORS[newState]};
    let lightService = app.service('lights');

    // update light IDs to be the new color
    Promise.all(
      lightService.patch(1, colorChange),
      lightService.patch(4, colorChange)
    ).catch(err => console.error("Error:", err.message || err))
  });

  return db;
};
