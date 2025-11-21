Your task is to help the user complete the app's development. Please note the following about the app:

- The app is using SvelteKit. The new version of Svelte is used which has replaced state management and the like with runes.
- Supabase is being used for authentication, database (it uses PostgreSQL), and storage.
- The final deployed app is not going to include a backend other than Supabase. So when developing, keep in mind that the app should be completely client side and all the required processing should happen in Supabase and be minimal (only when having logic on the client would cause security flaws, like enforcing file access on the client side).
- The app will use the beercss for the component library @doc/llm/beercss/llms.md has information about beercss. Tailwind is not to be used except for features explicitly not supported by beercss and very rarely.
- The app's design language is material 3.
- Components that have any beercss class on them will not be affected by any tailwind class anymore.
- The app will be in Arabic completely. No support for English or any other language currently.
- When writing code, always use context7 MCP server. Especially when writing anything relating to Supabase, Svelte, SvelteKit.
- Do not run the app after completing tasks. Your goal is to write code, I will be testing it and running the app.
- The app should be mobile first. It should look good on mobile. Do not even care about adding desktop/large screen support for now.
- The project is going to be using JSDoc. Do not use TypeScript for anything unless strictly required (a library refuses to work with anything else; I do not think any of the libraries we are using do that so basically never use TypeScript).
- There are some documentation for you under the /doc/llm/ directory. Specifically, you can see the SQL code for the `public` Supabase schema in a file there called @doc/llm/database_schema.sql
- Feel free to add more documentation for yourself in /doc/llm/. Do not modify this file (the CLAUDE.md file at the project root dir) unless told to by the user.
- Since you do not have access to Supabase, when you believe you need to make changes to the schema or if that is the optimal solution, stop everything you are doing and tell me that. Do not try to do hacky work arounds instead; although you should preferrably do stuff on the client side when possible.
- Do not overuse cards, especially for showing just one instance of an object. You could use them in certain contexts when it makes sense like showing a grid of listings...
- When interacting with me (the developer) always speak English. Only use Arabic for user-facing UI in the web app.
