const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
/*
buildSchema: function that takes a JS template literal string
(which we can then use to define our schema) as a 
parameter and then converts it to graphql schema object 
*/
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Event = require('./models/event');
const User = require('./models/user');

const app = express();

// Middleware
app.use(bodyParser.json());
//express-graphql: Used as  a middleware.
// Takes incoming requests and funnels
// them through the graphql query parser, and then
// handles them according to the schema and then
// forwards them to the right resolver
app.use(
  '/graphql',
  graphqlHttp({
    schema: buildSchema(`
        type Event {
            _id: ID!
                # ID is a special data type, ! makes id non-nullable / required
            title: String!
            description: String!
            price: Float!
            date: String!
                # there is no data type in graphQL
        }

        type User {
            _id: ID!
            email: String!
            password: String
                # Password is nullable bc we don't want to return it
        }

        input UserInput {
            email: String!
            password: String!
        }

        input EventInput {
            # input is a special type that is similar to args in JS. 
            # It will be an array of arguments to create an Event in this case
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type RootQuery {
            events: [Event!]! 
                # 1st ! means it will always return an array containing Event objects and no nulls, or strings etc
                # & 2nd ! means it will always return an array. It may be an empty array but not null
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
                # takes a string as parameter and will return or echo the Event that was created
            createUser(userInput: UserInput): User
        }

            schema {
                query: RootQuery
                mutation: RootMutation
            }
        `), // backticks allow writing multy-lined strings
    rootValue: {
      // bundle of all resolvers
      // Resolver names have to match up to the queries / mutation names created above
      events: () => {
        return Event.find()
          .then(events => {
            return events.map(event => {
              return { ...event._doc }; // accessing ._doc will leave out all the unnecessary meta data
            });
          })
          .catch(err => {
            throw err;
          });
      }, // this function will be called when an incoming request requests the events.
      createEvent: args => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price, //+ to convert arg to number if it wasnt already
          date: new Date(args.eventInput.date),
          creator: '5cb3833a93962b91644efe4b' // temporarily hard coded
        });
        let createdEvent;
        return event // add 'return' keyword because createEvent resolver executes an async operation and otherwise it would jump onto saving instantly
          .save()
          .then(result => {
              createdEvent = { ...result._doc }; // _doc is a property provided by Mongoose which give
              // all the core properties that make up the event object in this case
              // (result itself, also contains a lot of meta data which we don't need to return).
            return User.findById('5cb3833a93962b91644efe4b')
          })
          .then(user => {
              if (!user) {
                  throw new Error('User not found.')
              }
              user.createdEvents.push(event); // push is provided by Mongoose
              return user.save(); // update existing user
          }).then(result => {
            return createdEvent;
          })
          .catch(err => {
            console.log(err);
            throw err;
          }); // save method is provided by Mongoose
      },
      createUser: args => {
        return User.findOne({ email: args.userInput.email })
          .then(user => {
            if (user) {
              throw new Error('User exists already.');
            }
            return bcrypt.hash(args.userInput.password, 12);
          })
          .then(hashedPassword => {
            const user = new User({
              email: args.userInput.email,
              password: hashedPassword
            });
            return user.save();
          })
          .then(result => {
            return { ...result._doc, password: null }; // set password to null in retrieved user for security. This will NOT set password in db to null.
          })

          .catch(err => {
            throw err;
          });
      }
    },
    graphiql: true
  })
);

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${
      process.env.MONGO_PASSWORD
    }@cluster0-i90yd.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`
  ) // connect method returns a promise
  .then(() => {
    app.listen(4000);
  })
  .catch(err => {
    console.log(err);
  });
