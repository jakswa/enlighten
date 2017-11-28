const GitHub = require('github');

const POLL_INTERVAL = 30000;
const DEFAULT_REF = 'master';

module.exports = class GithubWatcher {
  constructor(owner, repo, opts={}) {
    this.owner = owner;
    this.repo = repo;
    this.ref = opts.ref || DEFAULT_REF;
    if (!this.repo || !this.owner) {
      throw new Error("github owner and repo required");
    }
    this.github = new GitHub();
    this.github.authenticate({
      type: 'token',
      token: process.env.GITHUB_TOKEN
    });
  }

  teardown() {
    clearInterval(this.intervalID);
  }

  fetchState() {
    return this.github.getReposApi().getCombinedStatusForRef({
      owner: this.owner,
      repo: this.repo,
      ref: this.ref
    }).then(resp => resp.data.state)
  }

  watch(changeCallback, interval) {
    interval = interval || POLL_INTERVAL;

    clearInterval(this.intervalID);
    this.intervalID = setInterval(() => {
      this.fetchState().then(state => {
        if (state !== this.lastState) {
          this.lastState = state;
          changeCallback(state);
        }
      });
    }, interval);
  }
}
