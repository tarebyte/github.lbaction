class Account {
  constructor(login) {
    this.login = login;
    //this._repositories = [];
  }

  get handle() {
    return '@' + this.login;
  }

  get profileURL() {
    return 'https://github.com/' + this.login;
  }

  get repositoriesURL() {
    return 'https://github.com/' + this.login + '?tab=repositories';
  }

  get issuesURL() {
    return 'https://github.com/search?utf8=%E2%9C%93&q=author%3A' + this.login + '+is%3Aissue&ref=simplesearch';
  }

  get pullRequestsURL() {
    return 'https://github.com/search?utf8=%E2%9C%93&q=author%3A' + this.login + '+is%3Apr&ref=simplesearch';
  }

  get gistsURL() {
    return 'https://gist.github.com/' + this.login;
  }

  repositories() {
    LaunchBar.alert('foo');
    const repositoriesQuery = `
      query($login: String!, $cursor: String) {
        repositoryOwner(login: $login) {
          repositories(first: 30, after: $cursor, orderBy: {field: CREATED_AT, direction: DESC}) {
            edges {
              cursor
              node {
                name
                description
                url
              }
            }
          }
        }
      }
    `;

    var variables = {
      login: account.login,
      cursor: cursor || null
    };

    result = executeQuery(query, variables);

    if (result.data.repositoryOwner) {
      var repositoryEdges = result.data.repositoryOwner.repositories.edges;

      var repos = repositoryEdges.map(function (edge) {
        name = edge.node.name;
        url = edge.node.url;
        description = edge.node.description;

        new Repository(this, name, url, description);
      });

      LaunchBar.alert(JSON.stringify(repositories));

      //menuItems = repositoryEdges.map(repositoryMenuItemFromEdge);
      //repositoryMenuItems = repositoryMenuItems.concat(menuItems);

      //while (repositoryEdges.length == 30) {
      //  lastCusor = repositoryEdges[repositoryEdges.length - 1].cursor;
      //  fetchRepositories(account, lastCusor);
      //}

      //return repositoryMenuItems
    } else {
      return [];
    }
  }
}
include('account.js');

// FIXME: Instead of having global state, it'd be better to maintain a cache
var repositoryMenuItems = [];

const SET_TOKEN_FORMAT = /^!set-token (.*)$/;
const ISSUE_OR_PR_FORMAT = /^([^\/]+\/[^\/#]+)(?:\/pull\/|\/issues\/|#)(\d+)$/;
const REPOSITORY_FORMAT = /^([^\/]+)\/([^\/#]+)$/;
const ACCOUNT_FORMAT = /^(\w+)$/;

function run(argument) {
  runWithString(argument);
}

function runWithString(string) {
  // Matching:
  // set-token <token>
  if (match = string.match(SET_TOKEN_FORMAT)) {
    return setToken(match[1]);
  }

  // Matching:
  // rails/rails#123
  // rails/rails/issues/123
  // rails/rails/pull/123
  else if (match = string.match(ISSUE_OR_PR_FORMAT)) {
      return openIssue(match[1], match[2]);
    }

    // Matching:
    // rails/rails
    else if (match = string.match(REPOSITORY_FORMAT)) {
        return openRepository(match[2], match[1]);
      }

      // Matching:
      // rails
      else if (match = string.match(ACCOUNT_FORMAT)) {
          var account = new Account(match[1]);
          return openAccount(account);
        }

        // Matching everything else:
        // rails/rails/tree/master/Gemfile
        else {
            LaunchBar.openURL('https://github.com/' + string);
          }
}

function setToken(token) {
  Action.preferences.token = token;
  LaunchBar.displayNotification({
    title: 'GitHub access token set successfully'
  });
}

function openIssue(nameWithOwner, number) {
  LaunchBar.openURL('https://github.com/' + nameWithOwner + '/issues/' + number);
}

function openRepository(name, owner) {
  var url = 'https://github.com/' + owner + '/' + name;

  if (LaunchBar.options.commandKey == 1) {
    LaunchBar.openURL(url);
  } else {
    return [{
      title: 'View Repository',
      subtitle: '@' + owner + '/' + name,
      alwaysShowsSubtitle: true,
      icon: 'repo.png',
      url: url
    }, {
      title: 'View Issues',
      icon: 'issue.png',
      url: url + '/issues/'
    }, {
      title: 'View Pull Requests',
      icon: 'pull-request.png',
      url: url + '/pulls/'
    }];
  }
}

function openAccount(account) {
  if (LaunchBar.options.commandKey == 1) {
    LaunchBar.openURL(account.profileURL);
  } else {
    return [{
      title: 'View Profile',
      subtitle: account.handle,
      alwaysShowsSubtitle: true,
      icon: 'person.png',
      url: account.profileURL
    }, {
      title: 'View Repositories',
      icon: 'repo.png',
      action: 'openAccountRepositories',
      actionArgument: account,
      actionReturnsItems: true
    }, {
      title: 'View Issues',
      icon: 'issue.png',
      url: account.issuesURL
    }, {
      title: 'View Pull Requests',
      icon: 'pull-request.png',
      url: account.pullRequestsURL
    }, {
      title: 'View Gists',
      icon: 'gist.png',
      url: account.gistsURL
    }];
  }
}

function openAccountRepositories(resultObject) {
  //TODO: add comment
  var account = resultObject.actionArgument;
  account.repositories();

  if (LaunchBar.options.commandKey == 1) {
    LaunchBar.openURL(account.repositoriesURL);
  } else {
    return [{
      title: 'View All Repositories',
      icon: 'repos.png',
      url: account.repositoriesURL
    }].concat(account.repositories());
  }
}

function fetchRepositories(account, cursor) {
  var query, variables, result, lastCursor, menuItems;

  query = `
    query($login: String!, $cursor: String) {
      repositoryOwner(login: $login) {
        repositories(first: 30, after: $cursor, orderBy: {field: CREATED_AT, direction: DESC}) {
          edges {
            cursor
            node {
              owner { login }
              name
              description
              url
            }
          }
        }
      }
    }
  `;

  variables = {
    login: account.login,
    cursor: cursor || null
  };

  result = executeQuery(query, variables);

  if (result.data.repositoryOwner) {
    repositoryEdges = result.data.repositoryOwner.repositories.edges;

    menuItems = repositoryEdges.map(repositoryMenuItemFromEdge);
    repositoryMenuItems = repositoryMenuItems.concat(menuItems);

    while (repositoryEdges.length == 30) {
      lastCusor = repositoryEdges[repositoryEdges.length - 1].cursor;
      fetchRepositories(account, lastCusor);
    }

    return repositoryMenuItems;
  } else {
    return [];
  }
}

function repositoryMenuItemFromEdge(edge) {
  var menuItem = {
    title: edge.node.owner.login + '/' + edge.node.name,
    url: edge.node.url,
    icon: 'repo.png'
  };

  if (edge.node.description) {
    menuItem.subtitle = edge.node.description;
    menuItem.alwaysShowsSubtitle = true;
  }

  return menuItem;
}

function executeQuery(query, variables) {
  if (!Action.preferences.token) {
    LaunchBar.openURL('https://github.com/prerelease/agreement');
    LaunchBar.openURL('https://github.com/settings/tokens');
    LaunchBar.alert("It looks like this is the first time you're using this " + "action.\n\nPlease go to https://github.com/prerelease/agreement and " + "accept the agreement.\n\nOnce signed, go to " + "https://github.com/settings/tokens and create token with 'repo' scope " + "and set it by invoking this action and typing !set-token <token>");
    return;
  }

  result = HTTP.post('https://api.github.com/graphql', {
    headerFields: { authorization: 'token ' + Action.preferences.token },
    body: JSON.stringify({ query: query, variables: variables })
  });

  if (result.data) {
    return JSON.parse(result.data);
  } else {
    LaunchBar.debugLog(result.error);
  }
}
class Repository {
  constructor(owner, name, url, description) {
    this.owner = owner, this.name = name, this.description = description, this.url = url;
  }

  get nameWithOwner() {
    return this.owner.login + '/' + this.name;
  }

  toMenuItem() {
    return {
      title: this.nameWithOwner,
      url: this.url,
      icon: 'repo.png'
    };
  }
}