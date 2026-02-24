17:53:20.921 Running build in Washington, D.C., USA (East) – iad1 (Turbo Build Machine)
17:53:20.922 Build machine configuration: 30 cores, 60 GB
17:53:21.023 Cloning github.com/dopvista/dse-investors-portal (Branch: main, Commit: cfffd8e)
17:53:21.240 Cloning completed: 217.000ms
17:53:21.447 Restored build cache from previous deployment (9GhNjtyhsqoPFHmuFYEtjcqbAmTs)
17:53:22.650 Running "vercel build"
17:53:23.156 Vercel CLI 50.22.0
17:53:23.637 Installing dependencies...
17:53:25.565 
17:53:25.565 up to date in 2s
17:53:25.565 
17:53:25.566 7 packages are looking for funding
17:53:25.566   run `npm fund` for details
17:53:25.595 Running "npm run build"
17:53:25.681 
17:53:25.682 > dse-investors-portal@1.0.0 build
17:53:25.682 > vite build
17:53:25.682 
17:53:25.948 [36mvite v4.5.14 [32mbuilding for production...[36m[39m
17:53:25.978 transforming...
17:53:26.807 [32m✓[39m 41 modules transformed.
17:53:26.807 [32m✓ built in 858ms[39m
17:53:26.808 [31m"default" is not exported by "src/components/UserMenu.jsx", imported by "src/App.jsx".[39m
17:53:26.808 file: [36m/vercel/path0/src/App.jsx:9:7[39m
17:53:26.808 [33m 7: import ProfileSetupPage from "./pages/ProfileSetupPage";
17:53:26.808  8: import ProfilePage from "./pages/ProfilePage";
17:53:26.808  9: import UserMenu from "./components/UserMenu";
17:53:26.808            ^
17:53:26.808 10: import logo from "./assets/logo.jpg";[39m
17:53:26.809 [31merror during build:
17:53:26.809 RollupError: "default" is not exported by "src/components/UserMenu.jsx", imported by "src/App.jsx".
17:53:26.810     at error (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:2287:30)
17:53:26.810     at Module.error (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:13751:16)
17:53:26.810     at Module.traceVariable (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:14181:29)
17:53:26.810     at ModuleScope.findVariable (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:12621:39)
17:53:26.810     at FunctionScope.findVariable (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:7130:38)
17:53:26.810     at ChildScope.findVariable (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:7130:38)
17:53:26.810     at Identifier.bind (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:8325:40)
17:53:26.810     at CallExpression.bind (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:5894:28)
17:53:26.810     at CallExpression.bind (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:9896:15)
17:53:26.810     at ArrayExpression.bind (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:5894:28)[39m
17:53:26.831 Error: Command "npm run build" exited with 1
