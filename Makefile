# Phyloid Makefile
# Convenience targets for common development tasks.
# Requires Node 20+ and npm.

.PHONY: test lint lint-fix security clean build format install help

## Install all dependencies (including dev)
install:
	npm install --include=dev

## Run all unit + property-based tests (102 tests)
test:
	npm test

## Run ESLint on src/
lint:
	npm run lint

## Auto-fix ESLint issues
lint-fix:
	npm run lint:fix

## Run secret + injection security scanner on src/
security:
	node scripts/security-scan.mjs

## Build production bundle (TypeScript + Vite → dist/)
build:
	npm run build

## Format source files with Prettier (if installed)
format:
	npm run format

## Remove dist/, coverage/, .cache/
clean:
	rm -rf dist coverage node_modules/.cache

## Run all checks: test + lint + security
check: test lint security

help:
	@echo ""
	@echo "  Phyloid — available make targets:"
	@echo ""
	@echo "  make install    Install all dependencies (including dev)"
	@echo "  make test       Run 102 Vitest tests"
	@echo "  make lint       ESLint on src/"
	@echo "  make lint-fix   Auto-fix lint issues"
	@echo "  make security   Secret scanner on src/"
	@echo "  make build      TypeScript + Vite production build"
	@echo "  make format     Prettier format (if installed)"
	@echo "  make clean      Remove dist/, coverage/"
	@echo "  make check      Run test + lint + security"
	@echo ""
