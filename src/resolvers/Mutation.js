const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { APP_SECRET, getUserId } = require("../utils");

const signup = async (parent, args, context, info) => {
  // encrypt users password
  const password = await bcrypt.hash(args.password, 10);
  // use the prisma client instance to store the new user in the database
  const user = await context.prisma.createUser({ ...args, password });

  // generate JWT
  const token = jwt.sign({ userId: user.id }, APP_SECRET);

  // return the token and the user in an object that adheres to the shape of the Authpayload object from the GraphQL schema.
  return {
    token,
    user
  };
};

const login = async (parent, args, context, info) => {
  // use the prisma client instance to retrieve the existing user record by the email that was sent as an argument to the login mutation. Throws an error if no user found.
  const user = await context.prisma.user({ email: args.email });
  if (!user) {
    throw new Error("No such user found");
  }

  // compare the provided password with the one stored in the database. No match returns an error.
  const valid = await bcrypt.compare(args.password, user.password);
  if (!valid) {
    throw new Error("Invalid password");
  }

  const token = jwt.sign({ userId: user.id }, APP_SECRET);

  // return token and user again (like signup)
  return {
    token,
    user
  };
};

const post = (parent, args, context, info) => {
  const userId = getUserId(context);
  return context.prisma.createLink({
    url: args.url,
    description: args.description,
    postedBy: { connect: { id: userId } }
  });
};

const vote = async (parent, args, context, info) => {
  // first we validate the incoming jwt with the getUserId helper function. If it's valid an id will be returned.
  const userId = getUserId(context);

  // THe prisma client generates one $exists function per model. This takes a where filter object so you can specify certain conditions about elements of that type. Only if the condition applies to at least one element in the database, the $exists function will return true. In this case we need it to verify the current user has not voted for this link.
  const linkExists = await context.prisma.$exists.vote({
    user: { id: userId },
    link: { id: args.linkId }
  });
  if (linkExists) {
    throw new Error(`Already voted for link: ${args.linkId}`);
  }

  // if exists returns false, then a new vote wil be created, which is connected to the User and the Link
  return context.prisma.createVote({
    user: { connect: { id: userId } },
    link: { connect: { id: args.linkId } }
  });
};

module.exports = {
  signup,
  login,
  post,
  vote
};
