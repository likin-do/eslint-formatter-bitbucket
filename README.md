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

## License

See [LICENSE](./LICENSE)
