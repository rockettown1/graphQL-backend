# GraphQL server, Prisma client and a mySQL database

To check it out clone the repo.

You'll need to run npm install to pull in all the dependencies, and also follow Prisma docs to get a demo server up and running. You can use the Prisma CLI for that, and use the prisma deploy command.

from the root directory fire up the server with:
node src/index.js

open up the GraphQL playground at localhost:4000
checkout the schema.

Note: it uses jsonwebtokens for auth so remember to add the headers when using the playground environment.
