'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GitHubLB = function () {
  function GitHubLB() {
    _classCallCheck(this, GitHubLB);
  }

  _createClass(GitHubLB, [{
    key: 'run',
    value: function run(input, options) {
      var GITHUB_LINK_FORMAT = /^https?:\/\/((www|gist|raw)\.)?github\.(io|com)/;
      var SET_TOKEN_FORMAT = /^!set-token (.*)$/;
      var ISSUE_OR_PR_FORMAT = /^([^\/]+)\/([^\/#]+)(?:\/pull\/|\/issues\/|#)(\d+)$/;
      var REPOSITORY_FORMAT = /^([^\/]+)\/([^\/#]+)$/;
      var COMMIT_SHA_FORMAT = /^\b[0-9a-f]{5,40}\b$/;
      var ACCOUNT_FORMAT = /^(\w+)$/;

      var match = void 0;

      // Matching:
      // https://github.com/bswinnerton/dotfiles/blob/master/ack/ackrc.symlink#L6
      if (input.match(GITHUB_LINK_FORMAT)) {
        return this.openLinkShortnerMenu(input);
      }

      // Matching:
      // set-token <token>
      if (match = input.match(SET_TOKEN_FORMAT)) {
        return this.setToken(match[1]);
      }

      // Matching:
      // rails/rails#123
      // rails/rails/issues/123
      // rails/rails/pull/123
      else if (match = input.match(ISSUE_OR_PR_FORMAT)) {
          var owner = new Account(match[1]);
          var repository = new Repository(owner, match[2]);
          var issue = new Issue(repository, match[3]);
          return LaunchBar.openURL(issue.url);
        }

        // Matching:
        // rails/rails
        else if (match = input.match(REPOSITORY_FORMAT)) {
            var _owner = new Account(match[1]);
            var _repository = new Repository(_owner, match[2]);
            return this.openRepositoryMenu(_repository);
          }

          // Matching:
          // 911a93ac
          // 911a93ac26c4f5919d1ebdf67a9e3db31c5b9dce
          else if (match = input.match(COMMIT_SHA_FORMAT)) {
              var commit = new Commit(match[0]);
              return this.openCommitPullRequestsMenu(commit);
            }

            // Matching:
            // rails
            else if (match = input.match(ACCOUNT_FORMAT)) {
                var account = new Account(match[1]);
                return this.openAccountMenu(account);
              }

              // Matching everything else:
              // rails/rails/tree/master/Gemfile
              else {
                  return LaunchBar.openURL('https://github.com/' + input);
                }
    }
  }, {
    key: 'openLinkShortnerMenu',
    value: function openLinkShortnerMenu(link, options) {
      if (LaunchBar.options.commandKey == 1) {
        this.shortenLink(link);
      } else {
        return [{
          title: 'Shorten link',
          icon: 'linkTemplate.png',
          action: 'shortenLink',
          actionArgument: link
        }];
      }
    }
  }, {
    key: 'openRepositoryMenu',
    value: function openRepositoryMenu(repository) {
      if (LaunchBar.options.commandKey == 1) {
        LaunchBar.openURL(repository.url);
      } else {
        return [{
          title: 'View Repository',
          subtitle: repository.nameWithOwner,
          alwaysShowsSubtitle: true,
          icon: 'repoTemplate.png',
          url: repository.url
        }, {
          title: 'View Issues',
          icon: 'issueTemplate.png',
          url: repository.issuesURL
        }, {
          title: 'View Pull Requests',
          icon: 'pullRequestTemplate.png',
          url: repository.pullRequestsURL
        }];
      }
    }
  }, {
    key: 'openCommitPullRequestsMenu',
    value: function openCommitPullRequestsMenu(commit) {
      if (commit.pullRequests().length > 1) {
        return commit.pullRequests().map(function (pr) {
          return pr.toMenuItem();
        });
      } else {
        LaunchBar.openURL(commit.pullRequests()[0].url);
      }
    }
  }, {
    key: 'openAccountMenu',
    value: function openAccountMenu(account) {
      if (LaunchBar.options.commandKey == 1) {
        LaunchBar.openURL(account.profileURL);
      } else {
        return [{
          title: 'View Profile',
          subtitle: account.handle,
          alwaysShowsSubtitle: true,
          icon: 'personTemplate.png',
          url: account.profileURL
        }, {
          title: 'View Repositories',
          icon: 'repoTemplate.png',
          action: 'openAccountRepositories',
          actionArgument: account.login,
          actionReturnsItems: true
        }, {
          title: 'View Issues',
          icon: 'issueTemplate.png',
          url: account.issuesURL
        }, {
          title: 'View Pull Requests',
          icon: 'pullRequestTemplate.png',
          url: account.pullRequestsURL
        }, {
          title: 'View Gists',
          icon: 'gistTemplate.png',
          url: account.gistsURL
        }];
      }
    }
  }, {
    key: 'openAccountRepositoriesMenu',
    value: function openAccountRepositoriesMenu(login) {
      var account = new Account(login);

      if (LaunchBar.options.commandKey == 1) {
        LaunchBar.openURL(account.repositoriesURL);
      } else {
        return [{
          title: 'View All Repositories',
          icon: 'reposTemplate.png',
          url: account.repositoriesURL
        }].concat(account.repositories().map(function (repository) {
          return repository.toMenuItem();
        }));
      }
    }
  }, {
    key: 'shortenLink',
    value: function shortenLink(link) {
      var linkShortener = new LinkShortener(link);
      var shortLink = linkShortener.run();

      LaunchBar.setClipboardString(shortLink);
      LaunchBar.displayNotification({
        title: 'Copied ' + shortLink + ' to your clipboard'
      });

      LaunchBar.executeAppleScript('tell application "LaunchBar" to hide');
    }
  }, {
    key: 'setToken',
    value: function setToken(token) {
      Action.preferences.token = token;
      LaunchBar.displayNotification({
        title: 'GitHub access token set successfully'
      });

      LaunchBar.executeAppleScript('tell application "LaunchBar" to hide');
    }
  }]);

  return GitHubLB;
}();

var app = new GitHubLB();

function run(argument) {
  return app.run(argument);
}

function runWithString(string) {
  return app.run(string);
}

function runWithURL(url, details) {
  return app.run(url, details);
}

// Unfortunately when the script output uses an action argument (like
// openAccount does), it needs to be able to find the function from the global
// scope. The following functions are workarounds to the appropriate actions.
//
// https://developer.obdev.at/launchbar-developer-documentation/#/script-output.
function openAccountRepositories(string) {
  return app.openAccountRepositoriesMenu(string);
}

function shortenLink(link, details) {
  return app.shortenLink(link);
}
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Account = function () {
  function Account(login) {
    _classCallCheck(this, Account);

    this.login = login;
  }

  _createClass(Account, [{
    key: 'repositories',
    value: function repositories() {
      var _this = this;

      var cacheKey = 'account-repositories-for-' + this.login;

      var repositoryEdges = Cache.fetch(cacheKey, 3600, function () {
        return _this._fetchRepositories();
      });

      return repositoryEdges.map(function (edge) {
        var repo = edge.node;
        return new Repository(this, repo.name, repo.description);
      }, this);
    }
  }, {
    key: '_fetchRepositories',
    value: function _fetchRepositories(cursor, allEdges) {
      allEdges = allEdges || [];

      var query = '\n      query($login: String!, $cursor: String) {\n        repositoryOwner(login: $login) {\n          repositories(first: 30, after: $cursor, orderBy: {field: CREATED_AT, direction: DESC}) {\n            edges {\n              cursor\n              node {\n                name\n                description\n                url\n              }\n            }\n          }\n        }\n      }\n    ';

      var variables = {
        login: this.login,
        cursor: cursor
      };

      var result = GraphQL.execute(query, variables);
      var repositoryEdges = result.data.repositoryOwner.repositories.edges;

      if (repositoryEdges.length > 0) {
        allEdges = allEdges.concat(repositoryEdges);

        var lastEdge = repositoryEdges[repositoryEdges.length - 1];
        return this._fetchRepositories(lastEdge.cursor, allEdges);
      }

      return allEdges;
    }
  }, {
    key: 'handle',
    get: function get() {
      return '@' + this.login;
    }
  }, {
    key: 'profileURL',
    get: function get() {
      return 'https://github.com/' + this.login;
    }
  }, {
    key: 'repositoriesURL',
    get: function get() {
      return 'https://github.com/' + this.login + '?tab=repositories';
    }
  }, {
    key: 'issuesURL',
    get: function get() {
      return 'https://github.com/search?utf8=%E2%9C%93&q=author%3A' + this.login + '+is%3Aissue&ref=simplesearch';
    }
  }, {
    key: 'pullRequestsURL',
    get: function get() {
      return 'https://github.com/search?utf8=%E2%9C%93&q=author%3A' + this.login + '+is%3Apr&ref=simplesearch';
    }
  }, {
    key: 'gistsURL',
    get: function get() {
      return 'https://gist.github.com/' + this.login;
    }
  }]);

  return Account;
}();

if (typeof module !== 'undefined') {
  module.exports.Account = Account;
}
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Cache = function Cache() {
  _classCallCheck(this, Cache);
};

Cache.fetch = function (key, ttl, func) {
  var results = Cache.read(key);

  if (results) {
    return results;
  } else {
    return Cache.write(key, ttl, func);
  }
};

Cache.read = function (key) {
  var path = Cache.filePath(key);

  if (File.exists(path)) {
    var cacheData = File.readJSON(path);
    var currentTime = Math.floor(new Date() / 1000);

    if (currentTime < cacheData.expiresAt) {
      LaunchBar.debugLog('Cache hit: ' + path);
      return cacheData.results;
    } else {
      LaunchBar.debugLog('Cache stale: expiresAt=' + cacheData.expiresAt + ' currentTime=' + currentTime);
      return false;
    }
  } else {
    LaunchBar.debugLog('Cache miss');
    return false;
  }
};

Cache.write = function (key, ttl, func) {
  var path = Cache.filePath(key);
  var currentTime = Math.floor(new Date() / 1000);
  var expiresAt = currentTime + ttl;
  var results = func();
  var cacheData = { expiresAt: expiresAt, results: results };

  File.writeJSON(cacheData, path, { 'prettyPrint': Action.debugLogEnabled });

  return results;
};

Cache.filePath = function (key) {
  return Action.cachePath + '/' + 'v1-' + key + '.json';
};

if (typeof module !== 'undefined') {
  module.exports.Cache = Cache;
}
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Commit = function () {
  function Commit(sha) {
    _classCallCheck(this, Commit);

    this.sha = sha;
  }

  _createClass(Commit, [{
    key: 'pullRequests',
    value: function pullRequests() {
      var _this = this;

      var cacheKey = 'commit-pull-requests-for-' + this.sha;

      var pullRequestEdges = Cache.fetch(cacheKey, 604800, function () {
        return _this._fetchPullRequests();
      });

      return pullRequestEdges.map(function (edge) {
        var pr = edge.node;

        var owner = new Account(pr.repository.owner.login);
        var repository = new Repository(owner, pr.repository.name);

        return new PullRequest(pr.number, repository, pr.title);
      }, this);
    }
  }, {
    key: '_fetchPullRequests',
    value: function _fetchPullRequests() {
      var query = '\n      query($sha: String!) {\n        search(query:$sha, type:ISSUE, last:30) {\n          edges {\n            node {\n              ... on PullRequest {\n                title\n                number\n                repository {\n                  name\n                  owner {\n                    login\n                  }\n                }\n              }\n            }\n          }\n        }\n      }\n    ';

      var variables = {
        sha: this.sha
      };

      var result = GraphQL.execute(query, variables);

      return result.data.search.edges;
    }
  }]);

  return Commit;
}();

if (typeof module !== 'undefined') {
  module.exports.Commit = Commit;
}
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GitHubLB = function () {
  function GitHubLB() {
    _classCallCheck(this, GitHubLB);
  }

  _createClass(GitHubLB, [{
    key: 'run',
    value: function run(input, options) {
      var GITHUB_LINK_FORMAT = /^https?:\/\/((www|gist|raw)\.)?github\.(io|com)/;
      var SET_TOKEN_FORMAT = /^!set-token (.*)$/;
      var ISSUE_OR_PR_FORMAT = /^([^\/]+)\/([^\/#]+)(?:\/pull\/|\/issues\/|#)(\d+)$/;
      var REPOSITORY_FORMAT = /^([^\/]+)\/([^\/#]+)$/;
      var COMMIT_SHA_FORMAT = /^\b[0-9a-f]{5,40}\b$/;
      var ACCOUNT_FORMAT = /^(\w+)$/;

      var match = void 0;

      // Matching:
      // https://github.com/bswinnerton/dotfiles/blob/master/ack/ackrc.symlink#L6
      if (input.match(GITHUB_LINK_FORMAT)) {
        return this.openLinkShortnerMenu(input);
      }

      // Matching:
      // set-token <token>
      if (match = input.match(SET_TOKEN_FORMAT)) {
        return this.setToken(match[1]);
      }

      // Matching:
      // rails/rails#123
      // rails/rails/issues/123
      // rails/rails/pull/123
      else if (match = input.match(ISSUE_OR_PR_FORMAT)) {
          var owner = new Account(match[1]);
          var repository = new Repository(owner, match[2]);
          var issue = new Issue(repository, match[3]);
          return LaunchBar.openURL(issue.url);
        }

        // Matching:
        // rails/rails
        else if (match = input.match(REPOSITORY_FORMAT)) {
            var _owner = new Account(match[1]);
            var _repository = new Repository(_owner, match[2]);
            return this.openRepositoryMenu(_repository);
          }

          // Matching:
          // 911a93ac
          // 911a93ac26c4f5919d1ebdf67a9e3db31c5b9dce
          else if (match = input.match(COMMIT_SHA_FORMAT)) {
              var commit = new Commit(match[0]);
              return this.openCommitPullRequestsMenu(commit);
            }

            // Matching:
            // rails
            else if (match = input.match(ACCOUNT_FORMAT)) {
                var account = new Account(match[1]);
                return this.openAccountMenu(account);
              }

              // Matching everything else:
              // rails/rails/tree/master/Gemfile
              else {
                  return LaunchBar.openURL('https://github.com/' + input);
                }
    }
  }, {
    key: 'openLinkShortnerMenu',
    value: function openLinkShortnerMenu(link, options) {
      if (LaunchBar.options.commandKey == 1) {
        this.shortenLink(link);
      } else {
        return [{
          title: 'Shorten link',
          icon: 'linkTemplate.png',
          action: 'shortenLink',
          actionArgument: link
        }];
      }
    }
  }, {
    key: 'openRepositoryMenu',
    value: function openRepositoryMenu(repository) {
      if (LaunchBar.options.commandKey == 1) {
        LaunchBar.openURL(repository.url);
      } else {
        return [{
          title: 'View Repository',
          subtitle: repository.nameWithOwner,
          alwaysShowsSubtitle: true,
          icon: 'repoTemplate.png',
          url: repository.url
        }, {
          title: 'View Issues',
          icon: 'issueTemplate.png',
          url: repository.issuesURL
        }, {
          title: 'View Pull Requests',
          icon: 'pullRequestTemplate.png',
          url: repository.pullRequestsURL
        }];
      }
    }
  }, {
    key: 'openCommitPullRequestsMenu',
    value: function openCommitPullRequestsMenu(commit) {
      if (commit.pullRequests().length > 1) {
        return commit.pullRequests().map(function (pr) {
          return pr.toMenuItem();
        });
      } else {
        LaunchBar.openURL(commit.pullRequests()[0].url);
      }
    }
  }, {
    key: 'openAccountMenu',
    value: function openAccountMenu(account) {
      if (LaunchBar.options.commandKey == 1) {
        LaunchBar.openURL(account.profileURL);
      } else {
        return [{
          title: 'View Profile',
          subtitle: account.handle,
          alwaysShowsSubtitle: true,
          icon: 'personTemplate.png',
          url: account.profileURL
        }, {
          title: 'View Repositories',
          icon: 'repoTemplate.png',
          action: 'openAccountRepositories',
          actionArgument: account.login,
          actionReturnsItems: true
        }, {
          title: 'View Issues',
          icon: 'issueTemplate.png',
          url: account.issuesURL
        }, {
          title: 'View Pull Requests',
          icon: 'pullRequestTemplate.png',
          url: account.pullRequestsURL
        }, {
          title: 'View Gists',
          icon: 'gistTemplate.png',
          url: account.gistsURL
        }];
      }
    }
  }, {
    key: 'openAccountRepositoriesMenu',
    value: function openAccountRepositoriesMenu(login) {
      var account = new Account(login);

      if (LaunchBar.options.commandKey == 1) {
        LaunchBar.openURL(account.repositoriesURL);
      } else {
        return [{
          title: 'View All Repositories',
          icon: 'reposTemplate.png',
          url: account.repositoriesURL
        }].concat(account.repositories().map(function (repository) {
          return repository.toMenuItem();
        }));
      }
    }
  }, {
    key: 'shortenLink',
    value: function shortenLink(link) {
      var linkShortener = new LinkShortener(link);
      var shortLink = linkShortener.run();

      LaunchBar.setClipboardString(shortLink);
      LaunchBar.displayNotification({
        title: 'Copied ' + shortLink + ' to your clipboard'
      });

      LaunchBar.executeAppleScript('tell application "LaunchBar" to hide');
    }
  }, {
    key: 'setToken',
    value: function setToken(token) {
      Action.preferences.token = token;
      LaunchBar.displayNotification({
        title: 'GitHub access token set successfully'
      });

      LaunchBar.executeAppleScript('tell application "LaunchBar" to hide');
    }
  }]);

  return GitHubLB;
}();

var app = new GitHubLB();

function run(argument) {
  return app.run(argument);
}

function runWithString(string) {
  return app.run(string);
}

function runWithURL(url, details) {
  return app.run(url, details);
}

// Unfortunately when the script output uses an action argument (like
// openAccount does), it needs to be able to find the function from the global
// scope. The following functions are workarounds to the appropriate actions.
//
// https://developer.obdev.at/launchbar-developer-documentation/#/script-output.
function openAccountRepositories(string) {
  return app.openAccountRepositoriesMenu(string);
}

function shortenLink(link, details) {
  return app.shortenLink(link);
}
"use strict";

var GraphQL = {};

GraphQL.execute = function (query, variables) {
  if (!Action.preferences.token) {
    LaunchBar.openURL('https://github.com/settings/tokens');
    LaunchBar.alert("It looks like this is the first time you're using " + "this action.\n\nPlease go to https://github.com/settings/tokens " + "and create token with 'repo' scope and set it by invoking the " + "github action and typing !set-token <token>");
    return;
  }

  var result = HTTP.post('https://api.github.com/graphql', {
    headerFields: { authorization: 'token ' + Action.preferences.token },
    body: JSON.stringify({ query: query, variables: variables })
  });

  LaunchBar.debugLog(JSON.stringify(result));

  if (result.data) {
    return JSON.parse(result.data);
  }
};

if (typeof module !== 'undefined') {
  module.exports.GraphQL = GraphQL;
}
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Issue = function () {
  function Issue(repository, number) {
    _classCallCheck(this, Issue);

    this.repository = repository;
    this.number = number;
  }

  _createClass(Issue, [{
    key: 'url',
    get: function get() {
      return 'https://github.com/' + this.repository.nameWithOwner + '/issues/' + this.number;
    }
  }]);

  return Issue;
}();

if (typeof module !== 'undefined') {
  module.exports.Issue = Issue;
}
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LinkShortener = function () {
  function LinkShortener(link) {
    _classCallCheck(this, LinkShortener);

    this.link = link;
  }

  _createClass(LinkShortener, [{
    key: 'run',
    value: function run() {
      var baseURL = 'https://git.io/create';
      var contentType = 'application/x-www-form-urlencoded;charset=UTF-8';

      var result = HTTP.post(baseURL, {
        headerFields: { 'Content-Type': contentType },
        body: "url=" + encodeURIComponent(this.link)
      });

      return 'https://git.io/' + result.data;
    }
  }]);

  return LinkShortener;
}();

if (typeof module !== 'undefined') {
  module.exports.LinkShortener = LinkShortener;
}
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PullRequest = function () {
  function PullRequest(number, repository, title) {
    _classCallCheck(this, PullRequest);

    this.number = number;
    this.repository = repository;
    this.title = title;
  }

  _createClass(PullRequest, [{
    key: 'toMenuItem',
    value: function toMenuItem() {
      return {
        title: this.title,
        subtitle: this.shortURL,
        alwaysShowsSubtitle: true,
        icon: 'pull-request.png',
        url: this.url
      };
    }
  }, {
    key: 'url',
    get: function get() {
      return this.repository.url + '/pull/' + this.number;
    }
  }, {
    key: 'shortURL',
    get: function get() {
      return this.repository.nameWithOwner + '#' + this.number;
    }
  }]);

  return PullRequest;
}();

if (typeof module !== 'undefined') {
  module.exports.PullRequest = PullRequest;
}
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Repository = function () {
  function Repository(owner, name, description) {
    _classCallCheck(this, Repository);

    this.owner = owner;
    this.name = name;
    this.description = description;
  }

  _createClass(Repository, [{
    key: 'toMenuItem',
    value: function toMenuItem() {
      var menuItem = {
        title: this.nameWithOwner,
        url: this.url,
        icon: 'repoTemplate.png'
      };

      if (this.description) {
        menuItem.subtitle = this.description;
        menuItem.alwaysShowsSubtitle = true;
      }

      return menuItem;
    }
  }, {
    key: 'nameWithOwner',
    get: function get() {
      return this.owner.login + '/' + this.name;
    }
  }, {
    key: 'url',
    get: function get() {
      return 'https://github.com/' + this.nameWithOwner;
    }
  }, {
    key: 'issuesURL',
    get: function get() {
      return this.url + '/issues';
    }
  }, {
    key: 'pullRequestsURL',
    get: function get() {
      return this.url + '/pulls';
    }
  }]);

  return Repository;
}();

if (typeof module !== 'undefined') {
  module.exports.Repository = Repository;
}
