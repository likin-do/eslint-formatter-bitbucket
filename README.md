# eslint-formatter-bitbucket

An ESLint formatter that uploads results as a report to Bitbucket.

[ ![npm version](https://img.shields.io/npm/v/eslint-formatter-bitbucket.svg?style=flat) ](https://npmjs.org/package/eslint-formatter-bitbucket "View this project on npm") [ ![Issues](https://img.shields.io/github/issues/Sleavely/eslint-formatter-bitbucket.svg) ](https://github.com/Sleavely/eslint-formatter-bitbucket/issues)

Bitbucket Reports are useful especially in the context of pullrequests, because any linting errors will appear as annotations in the code diffs.

This package was originally forked from [a7madgamal's fork](https://github.com/a7madgamal/eslint-formatter-bitbucket-reports) of [eslint-formatter-bitbucket-reports](https://github.com/spartez/eslint-formatter-bitbucket-reports).

## Usage

Assuming you have already installed and configured ESLint in your project you only have to install the formatter and use it in your Bitbucket Pipeline.

```sh
npm install --save-dev eslint-formatter-bitbucket
```

Add a linting step `bitbucket-pipelines.yml`:

```yaml
pipelines:
  pull-requests:
    '**':
      - step:
          name: PR linting
          script:
            - npx eslint -f bitbucket .
```

### Outside of Bitbucket Pipelines

If you are running the formatter in a context outside of Bitbucket Pipelines, for example from a local environment or in a custom CI provider, you'll need to set some environment variables manually:

* `BITBUCKET_API_AUTH` - the value for the "Authorization" header when communicating with the [Bitbucket API](https://developer.atlassian.com/cloud/bitbucket/rest/intro/#authentication), e.g. `Bearer my_access_token`
* `BITBUCKET_COMMIT` - commit SHA for the current run, e.g. `a624d1419b98`
* `BITBUCKET_WORKSPACE` - e.g. `Sleavely`
* `BITBUCKET_REPO_SLUG` - URL-friendly repo name, e.g. `eslint-formatter-bitbucket`

## License

See [LICENSE](./LICENSE)
