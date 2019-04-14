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

const Event = require('./models/event');

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
                #ID is a special data type, ! makes id non-nullable / required
            title: String!
            description: String!
            price: Float!
            date: String!
                # there is no data type in graphQL
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
        return Event.find().then(events => {
            return events.map(event => {
                return {...event._doc};  // accessing ._doc will leave out all the unnecessary meta data
            })
        }).catch(err => {
            throw err;
        })
      }, // this function will be called when an incoming request requests the events.
      createEvent: args => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price, //+ to convert arg to number if it wasnt already
          date: new Date(args.eventInput.date)
        });
        return event
          .save()
          .then(result => {
            // add 'return' keyword because createEvent resolver executes an async operation and otherwise it would jump onto saving instantly
            console.log(result);
            return { ...result._doc }; // _doc is a property provided by Mongoose which give
            // all the core properties that make up the event object in this case
            // (result itself, also contains a lot of meta data which we don't need to return).
          })
          .catch(err => {
            console.log(err);
            throw err;
          }); // save method is provided by Mongoose
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
