const Route = require('./route');

class Bundler {
  constructor () {
    this.matchers = [];
  }

  set (uri, bundle) {
    this.matchers.push(new BundlerMatcher(uri, bundle));
  }

  match (ctx) {
    return this.matchers.find(matcher => matcher.match(ctx));
  }

  async delegate (ctx) {
    const matches = this.match(ctx);
    if (!matches) {
      return false;
    }

    await matches.bundle.dispatch(matches, ctx);

    return true;
  }
}

class BundlerMatcher {
  constructor (uri, bundle) {
    this.uri = uri;
    this.bundle = bundle;

    this.isStatic = Route.isStatic(uri);
    if (!this.isStatic) {
      [ this.pattern, this.args ] = Route.parse(`(${this.uri})[(.+)]`);
    }
  }

  match (ctx) {
    if (this.isStatic) {
      return ctx.path.indexOf(this.uri) !== -1;
    }

    let result = ctx.path.match(this.pattern);
    if (result) {
      ctx.parameters = Object.assign(ctx.parameters, Route.fetchParams(result, this.args));
      return true;
    }

    return false;
  }

  shiftPath (ctx) {
    if (this.isStatic) {
      return ctx.path.substr(this.uri.length) || '/';
    }

    let matches = ctx.path.match(this.pattern);
    return ctx.path.substr(matches[1].length) || '/';
  }
}

module.exports = Bundler;
