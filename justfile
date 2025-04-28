set quiet

# make installed binaries available at the top level
export PATH := "./node_modules/.bin:" + env_var('PATH')

_default:
    just --list

# run the dev server
dev: _install
    node esbuild.config.mjs

# run syle checks
[no-exit-message]
lint: _install
    eslint src --fix
    prettier --write src

[no-exit-message]
lint-check: _install
    eslint src
    prettier --check src

[no-exit-message]
test: _install
    jest

# do both style and structural checks
[no-exit-message]
ci: test lint-check

# do a production build
[no-exit-message]
build: clean _install
    tsc -noEmit -skipLibCheck
    node esbuild.config.mjs production

# increment the version in the manifest file & package.json
bump level:
    {{ assert(level =~ "(major)|(minor)|(patch)", "specify one of: [`major`, `minor`, `patch`]") }}
    # use yarn to to the bumping, since it handles setting the version in the environment
    yarn version --{{ level }}

# generate a GH release and add the required files
release level: clean ci build (bump level)
    git push
    git push --tags
    gh release create $(git describe --tags --abbrev=0) main.js manifest.json

# remove the build artifact
clean:
    rm -rf main.js

_install:
    yarn {{ if is_dependency() == "true" { "--silent" } else { "" } }}
