#!/bin/sh
# Compiles the JSX sources in src/ to the plain JavaScript files the page loads. Needs Node: npx esbuild.
for f in core ui pages p2 p3 io receipt shortcuts app; do
  npx esbuild "src/$f.jsx" --loader:.jsx=jsx --target=es2019 --charset=utf8 --outfile="$f.js" --log-level=warning
done
